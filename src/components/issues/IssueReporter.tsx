import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { tbl, IssueRow, IssueCategory } from "@/integrations/supabase/revamp";
import { Bug, X, Check, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

/* Categories a student can pick. "UI nitpick" deliberately isn't here — the
   form nudges toward reports the team can act on. Suggestions get their own lane. */
const CATEGORIES: { key: IssueCategory; label: string; hint: string }[] = [
  { key: "bug", label: "Something's broken", hint: "A feature isn't working right" },
  { key: "payment", label: "Payment problem", hint: "Charged, failed or access not granted" },
  { key: "content", label: "Wrong content", hint: "An answer, note or material is incorrect" },
  { key: "access", label: "Can't access", hint: "Login, a subject you bought, a page" },
  { key: "suggestion", label: "Suggestion", hint: "An idea to make TeamDino better" },
];

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-white/10 text-zinc-300" },
  confirmed: { label: "Confirmed", cls: "td-accent-bg" },
  in_progress: { label: "In progress", cls: "bg-amber-500/15 text-amber-300" },
  done: { label: "Done", cls: "bg-emerald-500/15 text-emerald-300" },
  dismissed: { label: "Closed", cls: "bg-white/8 text-zinc-500" },
  duplicate: { label: "Duplicate", cls: "bg-white/8 text-zinc-500" },
};

const MIN_DESC = 15;

export default function IssueReporter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [category, setCategory] = useState<IssueCategory | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [mine, setMine] = useState<IssueRow[]>([]);
  const [tab, setTab] = useState<"report" | "mine">("report");

  const loadMine = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await tbl("issues").select("*").eq("reporter_id", user.id).order("created_at", { ascending: false });
    setMine((data ?? []) as IssueRow[]);
  }, []);

  useEffect(() => { if (open) loadMine(); }, [open, loadMine]);

  // body scroll lock while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const reset = () => { setCategory(null); setTitle(""); setDescription(""); };

  const submit = async () => {
    if (!category) { toast.error("Pick what kind of issue it is"); return; }
    if (title.trim().length < 4) { toast.error("Add a short title"); return; }
    if (description.trim().length < MIN_DESC) { toast.error(`Describe it a little more (what happened, where)`); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in"); setSaving(false); return; }

    const { data: prof } = await tbl("profiles").select("full_name, username, email").eq("id", user.id).single();
    const p = (prof ?? {}) as any;
    const name = p.full_name || p.username || (p.email ? p.email.split("@")[0] : "Student");

    const { error } = await tbl("issues").insert({
      title: title.trim(),
      description: description.trim(),
      category,
      reporter_id: user.id,
      reporter_name: name,
      page_url: window.location.pathname + window.location.search,
      device: `${/Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop"} · ${navigator.userAgent.slice(0, 60)}`,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks — your report reached the team 🦖");
    reset();
    setTab("mine");
    loadMine();
  };

  if (!open) return null;
  const descOk = description.trim().length >= MIN_DESC;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="td-surface relative w-full sm:max-w-lg sm:rounded-[26px] rounded-t-[26px] mt-auto sm:mt-0 max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* header */}
        <div className="flex items-center gap-3 p-5 border-b border-white/8 shrink-0">
          <span className="w-10 h-10 rounded-2xl td-accent-bg flex items-center justify-center shrink-0"><Bug className="w-5 h-5" /></span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold leading-tight">Report an issue</p>
            <p className="text-zinc-500 text-xs">Help us fix it — the team sees every report.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full td-btn-ghost flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
        </div>

        {/* tabs */}
        <div className="flex gap-1.5 p-1 mx-5 mt-4 td-surface-2 rounded-full shrink-0">
          {(["report", "mine"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${tab === t ? "bg-white text-black" : "text-zinc-400"}`}>
              {t === "report" ? "New report" : `My reports${mine.length ? ` (${mine.length})` : ""}`}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto p-5 min-h-0">
          {tab === "report" ? (
            <div className="space-y-4">
              {/* category */}
              <div>
                <p className="text-[11px] font-bold tracking-wider uppercase text-zinc-500 mb-2">What kind of issue?</p>
                <div className="grid gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c.key} onClick={() => setCategory(c.key)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors ${category === c.key ? "border-[var(--td-accent)] bg-[rgb(var(--td-accent-rgb)/0.08)]" : "border-white/8 td-surface-2 hover:border-white/20"}`}>
                      <span className="flex-1 min-w-0">
                        <span className="block text-white text-sm font-semibold">{c.label}</span>
                        <span className="block text-zinc-500 text-xs">{c.hint}</span>
                      </span>
                      {category === c.key && <Check className="w-4 h-4 td-accent-text shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold tracking-wider uppercase text-zinc-500">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90}
                  placeholder="One line — e.g. UPI payment failed but money deducted"
                  className="w-full td-surface-2 rounded-xl px-3.5 h-11 text-sm text-white outline-none placeholder:text-zinc-600 mt-1.5 td-field-focus" />
              </div>

              <div>
                <label className="text-[11px] font-bold tracking-wider uppercase text-zinc-500">What happened?</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                  placeholder="What did you do, what did you expect, what happened instead? Where on the site?"
                  className="w-full td-surface-2 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 mt-1.5 resize-y td-field-focus" />
                <p className={`text-[11px] mt-1 ${descOk ? "text-emerald-400" : "text-zinc-600"}`}>
                  {descOk ? "Great — that's enough detail." : `A little more detail helps (${description.trim().length}/${MIN_DESC})`}
                </p>
              </div>

              <p className="text-zinc-600 text-[11px] flex items-center gap-1.5">
                <Check className="w-3 h-3 shrink-0" /> We automatically note the page and device — no need to add them.
              </p>

              <button onClick={submit} disabled={saving}
                className="td-btn-primary w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />} Send to the team
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {mine.length === 0 ? (
                <div className="td-surface-2 rounded-2xl p-6 text-center text-zinc-500 text-sm">You haven't reported anything yet.</div>
              ) : mine.map((it) => {
                const s = STATUS_LABEL[it.status] ?? STATUS_LABEL.new;
                return (
                  <div key={it.id} className="td-surface-2 rounded-2xl p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-white text-sm font-medium leading-snug">{it.title}</p>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${s.cls}`}>{s.label}</span>
                    </div>
                    <p className="text-zinc-500 text-xs mt-1.5 line-clamp-2">{it.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
