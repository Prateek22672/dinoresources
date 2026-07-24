import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import { supabase } from "@/integrations/supabase/client";
import { tbl, IssueRow, IssueStatus, IssueSeverity } from "@/integrations/supabase/revamp";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Bug, Trash2, ChevronDown, ChevronUp, HardDrive, Loader2, RefreshCw, Database, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const CAT_LABEL: Record<string, string> = {
  bug: "Bug", payment: "Payment", content: "Content", access: "Access", suggestion: "Suggestion",
};
const STATUSES: { key: IssueStatus; label: string; cls: string }[] = [
  { key: "new", label: "New", cls: "bg-white/10 text-zinc-300" },
  { key: "confirmed", label: "Confirmed", cls: "td-accent-bg" },
  { key: "in_progress", label: "In progress", cls: "bg-amber-500/15 text-amber-300" },
  { key: "done", label: "Done", cls: "bg-emerald-500/15 text-emerald-300" },
  { key: "dismissed", label: "Closed", cls: "bg-white/8 text-zinc-500" },
  { key: "duplicate", label: "Duplicate", cls: "bg-white/8 text-zinc-500" },
];
const SEVERITIES: IssueSeverity[] = ["low", "normal", "high", "critical"];
const sevCls: Record<IssueSeverity, string> = {
  low: "text-zinc-500", normal: "text-zinc-300", high: "text-amber-400", critical: "text-red-400",
};
const RESOLVED = new Set(["done", "dismissed", "duplicate"]);

interface StorageRow { table_name: string; row_count: number; total_bytes: number; pretty_size: string; }

export default function Issues() {
  const { isAdmin } = useUserRole();
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | IssueStatus>("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageRow[]>([]);
  const [showStorage, setShowStorage] = useState(false);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await tbl("issues").select("*").order("upvotes", { ascending: false }).order("created_at", { ascending: false });
    setIssues((data ?? []) as IssueRow[]);
    setLoading(false);
  }, []);

  const loadStorage = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_storage_report");
    if (!error) setStorage((data ?? []) as StorageRow[]);
  }, []);

  useEffect(() => { load(); loadStorage(); }, [load, loadStorage]);

  const setStatus = async (it: IssueRow, status: IssueStatus) => {
    const patch: any = { status };
    if (RESOLVED.has(status) && !it.resolved_at) patch.resolved_at = new Date().toISOString();
    if (!RESOLVED.has(status)) patch.resolved_at = null;
    const { error } = await tbl("issues").update(patch).eq("id", it.id);
    if (error) return toast.error(error.message);
    setIssues((p) => p.map((x) => x.id === it.id ? { ...x, ...patch } : x));
  };

  const setSeverity = async (it: IssueRow, severity: IssueSeverity) => {
    const { error } = await tbl("issues").update({ severity }).eq("id", it.id);
    if (error) return toast.error(error.message);
    setIssues((p) => p.map((x) => x.id === it.id ? { ...x, severity } : x));
  };

  const deleteOne = async (it: IssueRow) => {
    if (!confirm(`Delete "${it.title}"? This can't be undone.`)) return;
    const { error } = await tbl("issues").delete().eq("id", it.id);
    if (error) return toast.error(error.message);
    setIssues((p) => p.filter((x) => x.id !== it.id));
    toast.success("Deleted");
    loadStorage();
  };

  const clearResolved = async () => {
    const n = issues.filter((i) => RESOLVED.has(i.status)).length;
    if (n === 0) return toast.info("No resolved issues to clear.");
    if (!confirm(`Delete all ${n} resolved issue${n === 1 ? "" : "s"} (Done / Closed / Duplicate)? This frees up space and can't be undone.`)) return;
    setClearing(true);
    const { data, error } = await supabase.rpc("clear_resolved_issues");
    setClearing(false);
    if (error) return toast.error(error.message);
    toast.success(`Cleared ${data ?? n} resolved issue${(data ?? n) === 1 ? "" : "s"}`);
    load();
    loadStorage();
  };

  const shown = issues.filter((i) =>
    filter === "all" ? true : filter === "open" ? !RESOLVED.has(i.status) : i.status === filter,
  );
  const counts = {
    all: issues.length,
    open: issues.filter((i) => !RESOLVED.has(i.status)).length,
    resolved: issues.filter((i) => RESOLVED.has(i.status)).length,
  };
  const issuesStorage = storage.filter((s) => s.table_name.startsWith("issue"));
  const issuesBytes = issuesStorage.reduce((n, s) => n + Number(s.total_bytes), 0);
  const prettyBytes = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  return (
    <AppShell>
      <PageHero
        eyebrow="Team"
        eyebrowIcon={Bug}
        book={false}
        title="Issues & bugs"
        subtitle="Anyone can report; the team triages here. Mark Done when fixed, and clear resolved ones to keep the database light."
      />

      {/* Storage readout — informs the delete decision */}
      <div className="td-surface rounded-[24px] p-4 sm:p-5 mb-5">
        <button onClick={() => setShowStorage((s) => !s)} className="w-full flex items-center gap-3 text-left">
          <span className="w-10 h-10 rounded-2xl td-accent-bg flex items-center justify-center shrink-0"><HardDrive className="w-5 h-5" /></span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Storage used by issues</p>
            <p className="text-zinc-500 text-xs">Issues + comments + votes are taking <strong className="td-accent-text">{prettyBytes(issuesBytes)}</strong> · {counts.resolved} resolved can be cleared</p>
          </div>
          {showStorage ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </button>

        {showStorage && (
          <div className="mt-4 space-y-1.5">
            <p className="text-[11px] font-bold tracking-wider uppercase text-zinc-500 mb-1 flex items-center gap-1.5"><Database className="w-3 h-3" /> All operational tables (non-subject)</p>
            {storage.map((s) => (
              <div key={s.table_name} className="flex items-center gap-3 td-surface-2 rounded-xl px-3 py-2">
                <span className="text-zinc-300 text-[13px] font-mono flex-1 truncate">{s.table_name}</span>
                <span className="text-zinc-600 text-xs">{Number(s.row_count).toLocaleString()} rows</span>
                <span className="text-white text-xs font-semibold w-16 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{s.pretty_size}</span>
              </div>
            ))}
            <button onClick={loadStorage} className="td-btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5 mt-2"><RefreshCw className="w-3 h-3" /> Refresh sizes</button>
          </div>
        )}
      </div>

      {/* Filters + bulk delete */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {([["open", `Open (${counts.open})`], ["all", `All (${counts.all})`], ["new", "New"], ["in_progress", "In progress"], ["done", "Done"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k as any)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${filter === k ? "bg-white text-black" : "td-surface-2 text-zinc-300"}`}>
            {label}
          </button>
        ))}
        {isAdmin && (
          <button onClick={clearResolved} disabled={clearing || counts.resolved === 0}
            className="ml-auto rounded-full px-3.5 py-1.5 text-[13px] font-semibold flex items-center gap-1.5 bg-red-500/15 text-red-300 hover:bg-red-500/25 disabled:opacity-40 transition-colors">
            {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Clear resolved ({counts.resolved})
          </button>
        )}
      </div>

      {/* Board */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl td-surface animate-pulse" />)}</div>
      ) : shown.length === 0 ? (
        <div className="td-surface rounded-[24px] p-10 text-center text-zinc-500">Nothing here. 🦖</div>
      ) : (
        <div className="space-y-3">
          {shown.map((it) => {
            const st = STATUSES.find((s) => s.key === it.status) ?? STATUSES[0];
            const open = openId === it.id;
            return (
              <div key={it.id} className="td-surface rounded-[22px] overflow-hidden">
                <button onClick={() => setOpenId(open ? null : it.id)} className="w-full flex items-start gap-3 p-4 text-left">
                  <span className="shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-xl td-surface-2">
                    <span className="text-white text-sm font-bold leading-none">{it.upvotes}</span>
                    <span className="text-zinc-600 text-[9px] uppercase">votes</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                      <span className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">{CAT_LABEL[it.category] ?? it.category}</span>
                      <span className={`text-[11px] font-bold uppercase ${sevCls[it.severity]}`}>{it.severity}</span>
                    </div>
                    <p className="text-white font-semibold mt-1 leading-snug">{it.title}</p>
                    <p className="text-zinc-600 text-[11px] mt-0.5">{it.reporter_name ?? "Someone"} · {new Date(it.created_at).toLocaleDateString()}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 mt-1 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {open && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-4">
                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{it.description}</p>
                    {it.page_url && <p className="text-zinc-600 text-xs">Page: <span className="font-mono text-zinc-400">{it.page_url}</span></p>}
                    {it.device && <p className="text-zinc-600 text-xs">Device: {it.device}</p>}

                    {/* status control */}
                    <div>
                      <p className="text-[11px] font-bold tracking-wider uppercase text-zinc-500 mb-1.5">Status</p>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map((s) => (
                          <button key={s.key} onClick={() => setStatus(it, s.key)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${it.status === s.key ? "bg-white text-black" : "td-surface-2 text-zinc-300"}`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* severity control */}
                    <div>
                      <p className="text-[11px] font-bold tracking-wider uppercase text-zinc-500 mb-1.5">Severity</p>
                      <div className="flex flex-wrap gap-1.5">
                        {SEVERITIES.map((s) => (
                          <button key={s} onClick={() => setSeverity(it, s)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${it.severity === s ? "bg-white text-black" : "td-surface-2 text-zinc-300"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button onClick={() => deleteOne(it)} className="flex items-center gap-1.5 text-red-400 text-xs font-semibold hover:text-red-300">
                      <Trash2 className="w-3.5 h-3.5" /> Delete this issue
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {counts.resolved > 6 && (
        <div className="mt-6 td-surface rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-zinc-400 text-sm">You have <strong className="text-white">{counts.resolved}</strong> resolved issues. Clearing them keeps the database light — they're taking {prettyBytes(issuesBytes)}.</p>
        </div>
      )}
    </AppShell>
  );
}
