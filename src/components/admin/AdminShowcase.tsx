import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, Eye, EyeOff, Award, Trash2, ExternalLink, Github, Heart, Power } from "lucide-react";
import { tbl } from "@/integrations/supabase/revamp";
import { type ShowcasePost, type ShowcaseStatus, sb, categoryLabel, ago } from "@/lib/showcase";
import { safeHref } from "@/lib/showcase";
import { ShowcaseCover } from "@/components/showcase/ShowcaseCard";

const TABS: { id: ShowcaseStatus; label: string }[] = [
  { id: "pending", label: "Review queue" },
  { id: "approved", label: "Live" },
  { id: "hidden", label: "Hidden" },
  { id: "rejected", label: "Rejected" },
];

/**
 * Campus Showcase moderation. New and edited posts land in the review queue;
 * approve to publish, reject with a reason the student sees, hide a live post
 * without deleting it, or feature one at the top of the page. The page-wide
 * on/off switch sits here too (it's the `showcase` feature flag).
 */
export default function AdminShowcase() {
  const [tab, setTab] = useState<ShowcaseStatus>("pending");
  const [rows, setRows] = useState<ShowcasePost[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [pageOn, setPageOn] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [list, all, flag] = await Promise.all([
      sb.from("showcase_posts").select("*").eq("status", tab).order("created_at", { ascending: tab === "pending" }),
      sb.from("showcase_posts").select("status"),
      tbl("feature_flags").select("enabled").eq("key", "showcase").maybeSingle(),
    ]);
    if (list.error) { setMissing(true); setLoading(false); return; }
    setMissing(false);
    setRows((list.data ?? []) as ShowcasePost[]);
    const c: Record<string, number> = {};
    for (const r of (all.data ?? []) as { status: string }[]) c[r.status] = (c[r.status] ?? 0) + 1;
    setCounts(c);
    setPageOn((flag.data as any)?.enabled !== false);
    setLoading(false);
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  const update = async (p: ShowcasePost, patch: Partial<ShowcasePost>, msg: string) => {
    const { error } = await sb.from("showcase_posts").update(patch).eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success(msg); load(); }
  };

  const reject = (p: ShowcasePost) => {
    const reason = prompt(`Why isn't “${p.title}” approved? The student will see this.`, "Please add a clearer description and a working link.");
    if (reason === null) return;
    update(p, { status: "rejected", reject_reason: reason.trim() || null }, "Rejected");
  };

  const del = async (p: ShowcasePost) => {
    if (!confirm(`Delete “${p.title}” permanently?`)) return;
    const { error } = await sb.from("showcase_posts").delete().eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const togglePage = async () => {
    const { error } = await tbl("feature_flags").update({ enabled: !pageOn }).eq("key", "showcase");
    if (error) return toast.error(error.message);
    setPageOn(!pageOn);
    toast.success(!pageOn ? "Campus Showcase is visible" : "Campus Showcase is hidden from students");
  };

  if (missing) {
    return (
      <div className="td-surface rounded-3xl p-6 max-w-3xl">
        <p className="text-amber-400 text-sm">Run <code>20261006150000_campus_showcase.sql</code> in the SQL editor first — the showcase tables don't exist yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="td-surface rounded-3xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-white font-semibold flex items-center gap-2"><Power className="w-4 h-4 td-accent-text" /> Show Campus Showcase</p>
          <p className="text-zinc-500 text-xs mt-1">Turns the page, its sidebar link and the dashboard section on or off for everyone.</p>
        </div>
        <button onClick={togglePage} aria-pressed={pageOn} aria-label="Show Campus Showcase"
          className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${pageOn ? "td-accent-solid" : "bg-white/15"}`}>
          <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${pageOn ? "left-6" : "left-1"}`} />
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-full px-4 h-9 text-[13px] font-semibold flex items-center gap-2 ${tab === t.id ? "bg-white text-black" : "td-btn-ghost"}`}>
            {t.label}
            {(counts[t.id] ?? 0) > 0 && (
              <span className={`rounded-full px-1.5 text-[11px] font-bold ${tab === t.id ? "bg-black/10" : t.id === "pending" ? "td-accent-badge" : "td-surface-2"}`}>{counts[t.id]}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 td-surface rounded-3xl animate-pulse" />
      ) : rows.length === 0 ? (
        <p className="text-zinc-500 text-sm td-surface rounded-3xl p-6">{tab === "pending" ? "Nothing waiting for review." : "Nothing here."}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <div key={p.id} className="td-surface rounded-3xl p-4 grid md:grid-cols-[180px_1fr] gap-4">
              <ShowcaseCover post={p} className="w-full aspect-[16/10] rounded-2xl overflow-hidden" />
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-bold flex items-center gap-2">{p.title}{p.featured && <Award className="w-4 h-4 td-accent-text" />}</p>
                    <p className="text-zinc-400 text-[13px]">{p.tagline}</p>
                    <p className="text-zinc-600 text-[11px] mt-1">
                      {categoryLabel(p.category)} · by {p.author_name ?? "unknown"} · {ago(p.created_at)}
                      {p.status === "approved" && <> · <Heart className="w-3 h-3 inline -mt-0.5" /> {p.like_count}</>}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {safeHref(p.live_url) && <a href={safeHref(p.live_url)} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full td-surface-2 flex items-center justify-center text-zinc-400" aria-label="Live link"><ExternalLink className="w-3.5 h-3.5" /></a>}
                    {safeHref(p.repo_url) && <a href={safeHref(p.repo_url)} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full td-surface-2 flex items-center justify-center text-zinc-400" aria-label="Code"><Github className="w-3.5 h-3.5" /></a>}
                  </div>
                </div>
                {p.description && <p className="text-zinc-400 text-[13px] mt-2 line-clamp-3 whitespace-pre-line">{p.description}</p>}
                {p.reject_reason && <p className="text-rose-300/90 text-[12px] mt-2">Reason given: {p.reject_reason}</p>}

                <div className="flex flex-wrap gap-2 mt-3">
                  {(p.status === "pending" || p.status === "rejected") && (
                    <button onClick={() => update(p, { status: "approved", reject_reason: null }, "Approved — it's live")}
                      className="td-btn-primary h-9 px-4 rounded-full text-[12px] font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Approve</button>
                  )}
                  {p.status === "pending" && (
                    <button onClick={() => reject(p)} className="td-btn-ghost h-9 px-4 rounded-full text-[12px] font-semibold flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Reject</button>
                  )}
                  {p.status === "approved" && (
                    <>
                      <button onClick={() => update(p, { featured: !p.featured }, p.featured ? "Unfeatured" : "Featured at the top")}
                        className="td-btn-ghost h-9 px-4 rounded-full text-[12px] font-semibold flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> {p.featured ? "Unfeature" : "Feature"}</button>
                      <button onClick={() => update(p, { status: "hidden", featured: false }, "Hidden")}
                        className="td-btn-ghost h-9 px-4 rounded-full text-[12px] font-semibold flex items-center gap-1.5"><EyeOff className="w-3.5 h-3.5" /> Hide</button>
                    </>
                  )}
                  {p.status === "hidden" && (
                    <button onClick={() => update(p, { status: "approved" }, "Visible again")}
                      className="td-btn-ghost h-9 px-4 rounded-full text-[12px] font-semibold flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Show again</button>
                  )}
                  <button onClick={() => del(p)} className="ml-auto w-9 h-9 rounded-full hover:bg-rose-500/15 flex items-center justify-center" aria-label="Delete"><Trash2 className="w-4 h-4 text-rose-400" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
