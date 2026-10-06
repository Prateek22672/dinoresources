import { useCallback, useEffect, useState } from "react";
import { BookOpenCheck, RefreshCw, AlertTriangle, CheckCircle2, ScanText } from "lucide-react";
import { tbl, invokeFn } from "@/integrations/supabase/revamp";
import type { IndexResult } from "@/lib/materialIndex";

interface Row { resource_id: string; status: string; pages: number | null; chunks: number | null; error: string | null; indexed_at: string; resources?: { title: string } | null }

/**
 * Rex answers from the text of uploaded material. This shows what he can
 * read, what he can't (and why — almost always a Drive file that isn't shared
 * publicly, or a scanned PDF with no text layer), and backfills everything
 * uploaded before indexing existed, a few files per call until none remain.
 */
export default function MaterialIndexPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [missingTable, setMissingTable] = useState(false);

  const load = useCallback(async () => {
    const [idx, res] = await Promise.all([
      tbl("material_index").select("resource_id, status, pages, chunks, error, indexed_at, resources(title)").order("indexed_at", { ascending: false }),
      tbl("resources").select("id", { count: "exact", head: true }).neq("type", "youtube"),
    ]);
    if (idx.error) { setMissingTable(true); return; }
    setMissingTable(false);
    setRows((idx.data ?? []) as Row[]);
    setTotal(res.count ?? null);
  }, []);
  useEffect(() => { load(); }, [load]);

  const backfill = async () => {
    setRunning(true);
    let done = 0;
    try {
      // a few files per call keeps each call inside the function time limit
      for (let guard = 0; guard < 200; guard++) {
        const { data, error } = await invokeFn<{ results: IndexResult[]; remaining: number }>("ingest-material", { missing: true, limit: 3 });
        if (error || !data) { setProgress(`Stopped: ${error ?? "no response"}`); break; }
        done += data.results.length;
        setProgress(`Indexed ${done} · ${data.remaining} left`);
        if (data.remaining === 0 || data.results.length === 0) break;
      }
    } finally {
      setRunning(false);
      load();
    }
  };

  const ok = rows.filter((r) => r.status === "ok");
  const bad = rows.filter((r) => r.status !== "ok");
  const notYet = total === null ? null : Math.max(0, total - rows.length);

  return (
    <div className="td-surface rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <BookOpenCheck className="w-4 h-4 td-accent-text" /> Rex's reading list
        </h3>
        <button onClick={backfill} disabled={running || missingTable}
          className="td-btn-primary px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} /> {running ? "Indexing…" : "Index new material"}
        </button>
      </div>
      <p className="text-zinc-500 text-xs mb-4">
        Rex answers from the text of uploaded PDFs and Google Docs/Slides. New uploads are indexed automatically; use the button for files added before this existed.
      </p>

      {missingTable ? (
        <p className="text-amber-400 text-sm">Run the <code>20261006120000_material_rag.sql</code> migration first — the index tables don't exist yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Readable", value: ok.length, icon: CheckCircle2 },
              { label: "Can't read", value: bad.length, icon: AlertTriangle },
              { label: "Not indexed", value: notYet ?? "—", icon: ScanText },
            ].map((t) => (
              <div key={t.label} className="td-surface-2 rounded-2xl p-3">
                <t.icon className="w-4 h-4 text-zinc-400 mb-1.5" />
                <p className="text-white text-xl font-bold leading-none">{t.value}</p>
                <p className="text-zinc-500 text-[11px] mt-1">{t.label}</p>
              </div>
            ))}
          </div>
          {progress && <p className="text-zinc-400 text-xs mb-3">{progress}</p>}
          {bad.length > 0 && (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {bad.map((r) => (
                <div key={r.resource_id} className="td-surface-2 rounded-xl px-3 py-2">
                  <p className="text-white text-[13px] font-medium truncate">{r.resources?.title ?? r.resource_id}</p>
                  <p className="text-zinc-500 text-[11px]"><span className="uppercase font-bold tracking-wider">{r.status.replace("_", " ")}</span> · {r.error}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
