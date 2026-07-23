import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, HardDrive, Trash2, Sparkles, RefreshCw, Check } from "lucide-react";

const FREE_LIMIT = 500 * 1024 * 1024; // Supabase free tier: 500 MB

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

interface TableRow { table_name: string; total_bytes: number; row_estimate: number; }
interface Suggestion { key: string; label: string; hint: string; count: number; }

export default function AdminDatabase() {
  const [size, setSize] = useState(0);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, t, c] = await Promise.all([
      (supabase as any).rpc("get_db_size"),
      (supabase as any).rpc("get_db_usage"),
      (supabase as any).rpc("get_cleanup_suggestions_v2"),
    ]);
    setSize(Number(s.data ?? 0));
    setTables((t.data ?? []) as TableRow[]);
    setSuggestions(((c.data ?? []) as Suggestion[]).filter((x) => x.count > 0));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const clean = async (s: Suggestion) => {
    if (!confirm(`Delete ${s.count} rows — "${s.label}"? This cannot be undone.`)) return;
    setBusy(s.key);
    const { data, error } = await (supabase as any).rpc("run_cleanup_v2", { _key: s.key });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Removed ${data ?? 0} rows`);
    load();
  };

  const pct = Math.min(100, (size / FREE_LIMIT) * 100);
  const maxTable = Math.max(1, ...tables.map((t) => t.total_bytes));

  if (loading) return <div className="space-y-4 max-w-3xl"><div className="h-32 rounded-3xl td-surface animate-pulse" /><div className="h-64 rounded-3xl td-surface animate-pulse" /></div>;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Usage meter */}
      <section className="td-surface rounded-3xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-white font-semibold flex items-center gap-2"><HardDrive className="w-4.5 h-4.5 td-accent-text" /> Database usage</h2>
          <button onClick={load} className="td-btn-ghost w-8 h-8 rounded-full flex items-center justify-center" title="Refresh"><RefreshCw className="w-3.5 h-3.5" /></button>
        </div>
        <p className="text-3xl font-bold text-white mt-2">{fmtBytes(size)} <span className="text-zinc-500 text-lg font-medium">/ {fmtBytes(FREE_LIMIT)}</span></p>
        <div className="h-3 rounded-full bg-white/8 overflow-hidden mt-3">
          <div className={`h-full rounded-full ${pct > 85 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "td-grad-bar"}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-zinc-500 text-xs mt-2">{pct.toFixed(1)}% of the free-tier limit used · {fmtBytes(FREE_LIMIT - size)} free</p>
      </section>

      {/* Smart cleanup suggestions */}
      <section>
        <h3 className="text-white font-semibold mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 td-accent-text" /> Smart cleanup</h3>
        <p className="text-zinc-500 text-xs mb-3 leading-relaxed">
          Only disposable data is ever suggested — unpaid checkouts, old logs, expired notices, old help-bot chats.
          <span className="text-zinc-300"> Paid orders, user access, subjects, notes and coupons can never be deleted from here.</span>
        </p>
        {suggestions.length === 0 ? (
          <div className="td-surface rounded-2xl p-6 flex items-center gap-3 text-sm text-emerald-400">
            <Check className="w-5 h-5" /> Nothing to clean — no abandoned orders, stale logs or revoked rows piling up.
          </div>
        ) : (
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.key} className="td-surface rounded-2xl p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm">{s.label} <span className="text-zinc-500">· {s.count} rows</span></p>
                  <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{s.hint}</p>
                </div>
                <button disabled={busy === s.key} onClick={() => clean(s)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-red-300 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" /> Clean
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Table breakdown */}
      <section>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-zinc-400" /> Tables by size</h3>
        <div className="td-surface rounded-2xl overflow-hidden">
          {tables.map((t) => (
            <div key={t.table_name} className="px-4 py-3 border-b border-white/5 last:border-0">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-zinc-200 font-mono">{t.table_name}</span>
                <span className="text-zinc-400">{fmtBytes(t.total_bytes)} · ~{t.row_estimate} rows</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                <div className="h-full bg-white/25 rounded-full" style={{ width: `${(t.total_bytes / maxTable) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
