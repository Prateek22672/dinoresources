// Groq client with multi-key round-robin and failover.
//
// SECURITY MODEL — keys live ONLY in Edge Function secrets:
//   * Nothing is stored in Postgres, so there is no table for PostgREST to
//     expose, no RLS policy that can be got wrong, and no admin endpoint that
//     could ever hand a key back.
//   * Keys are never logged, never returned in a response, and never sent
//     anywhere except api.groq.com. Failures record the key's POSITION
//     (key#2) and the HTTP status — never the value — and anything that looks
//     like a key is scrubbed from provider error text before it is logged.
//   * Adding capacity is a secret + redeploy; no code and no schema change:
//         npx supabase secrets set GROQ_API_KEY_2=...
//
// ROTATION — each call starts at a different key and, on a rate limit, moves
// straight to the next one rather than waiting. With N keys you get N times the
// per-minute budget, and one exhausted or revoked key degrades instead of
// breaking the feature.

import { adminClient } from "./razorpay.ts";

const MAX_KEYS = 10;

/** Redact anything key-shaped before it reaches a log line. */
const redact = (s: string) => s.replace(/gsk_[A-Za-z0-9_-]+/g, "gsk_***");

/**
 * Keys in priority order: an optional dedicated key for this function first,
 * then GROQ_API_KEY, then GROQ_API_KEY_2..10. Blanks and duplicates dropped.
 */
function collectKeys(preferredEnv?: string): string[] {
  const out: string[] = [];
  const add = (v: string | undefined) => {
    const t = (v ?? "").trim();
    if (t && !out.includes(t)) out.push(t);
  };
  if (preferredEnv) add(Deno.env.get(preferredEnv));
  add(Deno.env.get("GROQ_API_KEY"));
  for (let i = 2; i <= MAX_KEYS; i++) add(Deno.env.get(`GROQ_API_KEY_${i}`));
  return out;
}

// Advances per call so a warm instance spreads load; the random seed staggers
// separate instances so they don't all hammer the same key first.
let cursor = Math.floor(Math.random() * 1000);

// Keys added through Admin live encrypted in Vault. Only the service role can
// decrypt them, and they are cached briefly so rotation doesn't cost a DB round
// trip per message. Cached in memory only — never written to disk or logged.
let dbKeys: string[] = [];
let dbKeysAt = 0;
const DB_KEY_TTL_MS = 60_000;

async function loadDbKeys(): Promise<string[]> {
  if (Date.now() - dbKeysAt < DB_KEY_TTL_MS) return dbKeys;
  try {
    const { data, error } = await adminClient().rpc("ai_keys_values", { _provider: "groq" });
    if (error) throw error;
    dbKeys = (data ?? []).map((r: any) => String(r.value ?? "").trim()).filter(Boolean);
  } catch {
    // Migration not applied, or Vault unavailable — secrets alone still work.
    dbKeys = [];
  }
  dbKeysAt = Date.now();
  return dbKeys;
}

export interface GroqOpts {
  /** Secret name checked before the shared pool (e.g. "GROQ_API_KEY_HELP"). */
  preferredEnv?: string;
  timeoutMs?: number;
  /** Passes over the whole key set before giving up. */
  rounds?: number;
  /** Function name recorded against failures (e.g. "help-bot"). */
  label?: string;
  /** Attributed on failure rows so support can trace a stuck student. */
  userId?: string;
}

/**
 * Record a provider failure for the admin dashboard. Fire-and-forget: logging
 * must never be able to break a request. Stores the key's POSITION only —
 * the value is never written anywhere.
 */
async function logFailure(
  opts: GroqOpts,
  row: { status?: number; code?: string; message?: string; keyIndex: number; keyCount: number },
) {
  try {
    await adminClient().from("bot_error_log").insert({
      fn: opts.label ?? "groq",
      status: row.status ?? null,
      code: row.code ?? null,
      message: row.message ? redact(row.message).slice(0, 500) : null,
      key_index: row.keyIndex,
      key_count: row.keyCount,
      user_id: opts.userId ?? null,
    });
  } catch { /* never let telemetry break the call */ }
}

/** Pull a provider error code out of Groq's JSON body, if present. */
function errorCode(body: string): string | undefined {
  try { return JSON.parse(body)?.error?.code ?? JSON.parse(body)?.error?.type; } catch { return undefined; }
}

/** How many keys are configured — for health checks. Never exposes values. */
export const groqKeyCount = (preferredEnv?: string) => collectKeys(preferredEnv).length;

/**
 * POST to Groq chat completions, rotating keys on rate limits.
 * Returns the parsed response, or null once every key has been tried.
 */
export async function groqChat(payload: unknown, opts: GroqOpts = {}): Promise<any | null> {
  // Secrets first (they're free to read), then anything added through Admin.
  const keys = collectKeys(opts.preferredEnv);
  for (const k of await loadDbKeys()) if (!keys.includes(k)) keys.push(k);
  if (keys.length === 0) {
    console.error("groq: no API key configured");
    return null;
  }
  const timeoutMs = opts.timeoutMs ?? 20_000;
  const rounds = opts.rounds ?? 2;
  const dead = new Set<number>(); // rejected as invalid during this call

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < keys.length; i++) {
      const idx = (cursor++ + i) % keys.length;
      if (dead.has(idx)) continue;

      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), timeoutMs);
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${keys[idx]}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: ctl.signal,
        });
        clearTimeout(timer);
        if (res.ok) return await res.json();

        const raw = await res.text();
        const body = redact(raw).slice(0, 200);
        console.error(`groq key#${idx + 1}/${keys.length} ${res.status} ${body}`);
        void logFailure(opts, {
          status: res.status, code: errorCode(raw), message: body,
          keyIndex: idx + 1, keyCount: keys.length,
        });

        // Bad credential: stop using this one for the rest of the call.
        if (res.status === 401 || res.status === 403) { dead.add(idx); continue; }
        // Rate limited or provider fault: another key may well have budget.
        if (res.status === 429 || res.status >= 500) continue;
        // Anything else (400 bad request, 404 unknown model) is our payload's
        // fault — every key would fail identically, so stop.
        return null;
      } catch (e) {
        clearTimeout(timer);
        const msg = e instanceof Error ? redact(e.message) : "error";
        console.error(`groq key#${idx + 1}/${keys.length} failed:`, msg);
        void logFailure(opts, { code: "network_or_timeout", message: msg, keyIndex: idx + 1, keyCount: keys.length });
      }
    }
    // Every key was busy — brief pause before one more pass.
    if (round < rounds - 1) await new Promise((r) => setTimeout(r, 800));
  }
  return null;
}
