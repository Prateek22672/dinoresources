// ingest-material — turns uploaded material into text Rex can read.
//
// For each resource (a Drive/Docs/PDF link): download the file, extract its
// text page by page, split it into ~1000-char chunks on sentence boundaries,
// and replace that resource's rows in material_chunks. The outcome — ok,
// no_text (a scan with no text layer), failed (usually: the Drive file is not
// shared as "Anyone with the link"), unsupported — goes to material_index so
// contributors can see why Rex doesn't know a file.
//
// Body (staff only — admin or contributor):
//   { resource_id }            index one file (called right after an upload)
//   { subject_id, offset }     (re)index a subject's files, 8 per call; pass
//                              the returned next_offset until remaining is 0
//   { missing: true, limit }   index files never indexed yet, `limit` per call;
//                              the response says how many remain so the admin
//                              screen can keep calling until it reaches 0.
//
// Downloads are capped at 25MB and calls at a handful of files, so one call
// stays well inside the edge-function time and memory limits.

import { extractText, getDocumentProxy } from "npm:unpdf@0.12.1";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient, getAuthUser, userHasRole } from "../_shared/razorpay.ts";

const MAX_BYTES = 25 * 1024 * 1024;
const CHUNK = 1000;
const MAX_CHUNKS = 800;

interface Res {
  id: string;
  subject_id: string;
  title: string;
  type: string;
  url: string;
  unit_number: number | null;
  topic_id: string | null;
  category: string | null;
}

type Outcome = { status: "ok" | "no_text" | "failed" | "unsupported"; pages?: number; chars?: number; chunks?: number; error?: string };

/** Map a share link to a URL that returns the file's bytes (or plain text). */
function downloadUrl(raw: string): { url: string; kind: "pdf" | "text" | "auto" } | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  const host = u.hostname;
  const docId = u.pathname.match(/\/d\/([\w-]{10,})/)?.[1] ?? u.searchParams.get("id");

  if (host === "docs.google.com" && docId) {
    if (u.pathname.startsWith("/document/")) return { url: `https://docs.google.com/document/d/${docId}/export?format=txt`, kind: "text" };
    if (u.pathname.startsWith("/presentation/")) return { url: `https://docs.google.com/presentation/d/${docId}/export/pdf`, kind: "pdf" };
    return null; // sheets/forms — not study text
  }
  if (host.endsWith("drive.google.com") && docId) {
    // usercontent + confirm=t skips the "can't scan for viruses" page on big files
    return { url: `https://drive.usercontent.google.com/download?id=${docId}&export=download&confirm=t`, kind: "auto" };
  }
  if (/\.pdf($|\?)/i.test(u.pathname + u.search)) return { url: u.toString(), kind: "pdf" };
  if (/\.(txt|md)($|\?)/i.test(u.pathname)) return { url: u.toString(), kind: "text" };
  return { url: u.toString(), kind: "auto" };
}

function clean(s: string): string {
  return s.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Split one page into chunks, breaking at sentence or line ends. */
function chunkPage(text: string): string[] {
  const out: string[] = [];
  let rest = text;
  while (rest.length > CHUNK) {
    const window = rest.slice(0, CHUNK + 150);
    let cut = Math.max(window.lastIndexOf(". ", CHUNK), window.lastIndexOf("\n", CHUNK));
    if (cut < CHUNK * 0.5) cut = CHUNK;
    out.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1);
  }
  if (rest.trim().length > 40) out.push(rest.trim());
  return out;
}

async function extractPages(r: Res): Promise<{ pages: string[] } | Outcome> {
  const target = downloadUrl(r.url);
  if (!target) return { status: "unsupported", error: "Not a downloadable file link (Sheets/Forms or unrecognised URL)." };

  let resp: Response;
  try {
    resp = await fetch(target.url, { redirect: "follow", headers: { "User-Agent": "TeamDino-Rex-Indexer" } });
  } catch (e) {
    return { status: "failed", error: `Download failed: ${String(e).slice(0, 200)}` };
  }
  if (!resp.ok) return { status: "failed", error: `Download returned HTTP ${resp.status}.` };

  const len = Number(resp.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) return { status: "unsupported", error: "File is larger than 25MB." };
  const buf = new Uint8Array(await resp.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) return { status: "unsupported", error: "File is larger than 25MB." };

  const ctype = (resp.headers.get("content-type") ?? "").toLowerCase();
  const isPdf = buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46; // %PDF

  if (isPdf) {
    try {
      const pdf = await getDocumentProxy(buf);
      const { text } = await extractText(pdf, { mergePages: false });
      return { pages: (text as string[]).map(clean) };
    } catch (e) {
      return { status: "failed", error: `Could not read the PDF: ${String(e).slice(0, 200)}` };
    }
  }
  if (ctype.includes("text/html")) {
    // Drive answers a private file with its sign-in page, not an error code.
    return { status: "failed", error: "Got a web page instead of the file — set the Drive file to “Anyone with the link can view”." };
  }
  if (target.kind === "text" || ctype.startsWith("text/")) {
    const t = clean(new TextDecoder().decode(buf));
    // a Doc export has no pages; ~3000 chars stands in for one
    const pages: string[] = [];
    for (let i = 0; i < t.length; i += 3000) pages.push(t.slice(i, i + 3000));
    return { pages };
  }
  return { status: "unsupported", error: `Unsupported file type (${ctype || "unknown"}). PDFs and Google Docs/Slides work.` };
}

async function indexOne(r: Res): Promise<Outcome> {
  const db = adminClient();
  const got = await extractPages(r);
  let outcome: Outcome;

  if ("status" in got) {
    outcome = got;
  } else {
    const rows: Record<string, unknown>[] = [];
    let chars = 0;
    got.pages.forEach((p, pi) => {
      chars += p.length;
      for (const c of chunkPage(p)) {
        if (rows.length >= MAX_CHUNKS) return;
        rows.push({
          resource_id: r.id, subject_id: r.subject_id, unit_number: r.unit_number, topic_id: r.topic_id,
          chunk_index: rows.length, page: pi + 1, content: c,
        });
      }
    });

    await db.from("material_chunks").delete().eq("resource_id", r.id);
    if (chars < 200 || rows.length === 0) {
      outcome = { status: "no_text", pages: got.pages.length, chars, chunks: 0, error: "No selectable text — looks like a scanned PDF." };
    } else {
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await db.from("material_chunks").insert(rows.slice(i, i + 200));
        if (error) { outcome = { status: "failed", error: `Saving text failed: ${error.message}` }; break; }
      }
      outcome ??= { status: "ok", pages: got.pages.length, chars, chunks: rows.length };
    }
  }

  await db.from("material_index").upsert({
    resource_id: r.id, subject_id: r.subject_id, status: outcome.status,
    pages: outcome.pages ?? null, chars: outcome.chars ?? null, chunks: outcome.chunks ?? null,
    error: outcome.error ?? null, indexed_at: new Date().toISOString(),
  });
  return outcome;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
    if (!(await userHasRole(user.id, "admin")) && !(await userHasRole(user.id, "contributor"))) {
      return jsonResponse({ error: "Only contributors and admins can index material." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const db = adminClient();
    // youtube rows are videos, not reading material
    const base = () => db.from("resources")
      .select("id, subject_id, title, type, url, unit_number, topic_id, category")
      .neq("type", "youtube");

    let list: Res[] = [];
    let remaining = 0;

    if (body?.resource_id) {
      const { data } = await base().eq("id", String(body.resource_id));
      list = (data ?? []) as Res[];
    } else if (body?.subject_id) {
      const { data } = await base().eq("subject_id", String(body.subject_id)).order("created_at");
      const off = Math.max(0, Number(body.offset) || 0);
      const all = (data ?? []) as Res[];
      list = all.slice(off, off + 8);
      remaining = Math.max(0, all.length - off - list.length);
    } else if (body?.missing) {
      const limit = Math.max(1, Math.min(Number(body.limit) || 3, 6));
      const [{ data: all }, { data: done }] = await Promise.all([
        base(),
        db.from("material_index").select("resource_id"),
      ]);
      const seen = new Set((done ?? []).map((d: { resource_id: string }) => d.resource_id));
      const todo = ((all ?? []) as Res[]).filter((r) => !seen.has(r.id));
      list = todo.slice(0, limit);
      remaining = todo.length - list.length;
    } else {
      return jsonResponse({ error: "Pass resource_id, subject_id or missing:true" }, 400);
    }

    // a subject can have dozens of files — cap the work done in one call
    if (list.length > 8) { remaining += list.length - 8; list = list.slice(0, 8); }

    const results = [];
    for (const r of list) {
      const o = await indexOne(r);
      results.push({ id: r.id, title: r.title, ...o });
    }
    return jsonResponse({ results, remaining, next_offset: (Number(body?.offset) || 0) + list.length });
  } catch (e) {
    console.error("ingest-material:", e);
    return jsonResponse({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
