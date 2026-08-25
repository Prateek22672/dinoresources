import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3, Plus, Trash2, Save, X, ChevronDown, RefreshCw,
  MessageSquare, Power, Sparkles, GripVertical,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  tbl, rpc, pollOptions, pollIsOpen,
  type PollKind, type PollOption, type PollOverviewRow, type PollResultRow, type ProfileRow,
} from "@/integrations/supabase/revamp";

interface Draft {
  id: string | null;
  question: string;
  kind: PollKind;
  options: PollOption[];
  allow_text: boolean;
  text_prompt: string;
  closes_at: string;
}

const newOption = (label = ""): PollOption => ({
  // Stable per option so relabelling one later never orphans its votes.
  id: (crypto.randomUUID?.() ?? `o${Date.now()}${Math.round(performance.now())}`).slice(0, 8),
  label,
});

const blank = (): Draft => ({
  id: null, question: "", kind: "single",
  options: [newOption("Yes"), newOption("No")],
  allow_text: true, text_prompt: "", closes_at: "",
});

/** The three questions worth asking often, one tap away. */
const TEMPLATES: { name: string; make: () => Draft }[] = [
  {
    name: "Is this useful?",
    make: () => ({
      ...blank(), question: "Is Study-With-AI actually useful to you?",
      options: [newOption("Yes, I use it a lot"), newOption("Sometimes"), newOption("Not really")],
      text_prompt: "What would make it more useful?",
    }),
  },
  {
    name: "Could this be better?",
    make: () => ({
      ...blank(), question: "Could this be better?",
      options: [newOption("Yes"), newOption("No, it's good")],
      text_prompt: "Tell us what you'd change",
    }),
  },
  {
    name: "What should we build?",
    make: () => ({
      ...blank(), question: "What should we build next?", kind: "multi",
      options: [newOption("More PYQs"), newOption("Video lectures"), newOption("Better notes"), newOption("Exam planner")],
      text_prompt: "Something else?",
    }),
  },
];

interface Answer {
  user_id: string;
  option_ids: string[];
  comment: string | null;
  created_at: string;
  who: string;
}

/**
 * Polls — ask students a question, read what comes back.
 *
 * Support tickets only ever arrive when something is broken, so the team hears
 * about faults and never about whether a feature was worth building. This is
 * the other half of that: aggregate counts for the shape of the answer, and
 * the written replies underneath for the reason.
 */
export default function AdminPolls() {
  const [rows, setRows] = useState<PollOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, number>>({});
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await rpc("admin_poll_overview");
    if (error) toast.error(error.message);
    setRows(((data ?? []) as PollOverviewRow[]).map((r) => ({ ...r, options: pollOptions(r.options) })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openResults = async (id: string) => {
    if (open === id) { setOpen(null); return; }
    setOpen(id);
    setLoadingResults(true);
    setResults({});
    setAnswers([]);
    try {
      const [res, votes] = await Promise.all([
        rpc("poll_results", { _poll_id: id }),
        tbl("poll_votes").select("user_id, option_ids, comment, created_at")
          .eq("poll_id", id).order("created_at", { ascending: false }).limit(300),
      ]);
      const map: Record<string, number> = {};
      for (const r of ((res.data ?? []) as PollResultRow[])) map[r.option_id] = Number(r.votes) || 0;
      setResults(map);

      const raw = (votes.data ?? []) as Omit<Answer, "who">[];
      // No FK from poll_votes to profiles (both point at auth.users), so
      // PostgREST can't embed them — names come from a second query.
      const ids = [...new Set(raw.map((v) => v.user_id))];
      let names = new Map<string, string>();
      if (ids.length) {
        const { data: profs } = await tbl("profiles").select("id, full_name, username, email").in("id", ids);
        names = new Map(((profs ?? []) as ProfileRow[]).map((p) => [
          p.id, p.full_name || p.username || p.email?.split("@")[0] || "Unknown",
        ]));
      }
      setAnswers(raw.map((v) => ({ ...v, who: names.get(v.user_id) ?? v.user_id.slice(0, 8) })));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't load results");
    } finally {
      setLoadingResults(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    const question = draft.question.trim();
    const options = draft.options.map((o) => ({ ...o, label: o.label.trim() })).filter((o) => o.label);
    if (question.length < 3) { toast.error("Give the poll a question."); return; }
    if (options.length < 2) { toast.error("A poll needs at least two options."); return; }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      question,
      kind: draft.kind,
      options,
      allow_text: draft.allow_text,
      text_prompt: draft.text_prompt.trim() || null,
      closes_at: draft.closes_at ? new Date(draft.closes_at).toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    const q = draft.id
      ? tbl("polls").update(payload).eq("id", draft.id)
      : tbl("polls").insert({ ...payload, created_by: user?.id, active: true });
    const { error } = await q;
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(draft.id ? "Poll updated" : "Poll published");
    setDraft(null);
    load();
  };

  const toggleActive = async (r: PollOverviewRow) => {
    const { error } = await tbl("polls").update({ active: !r.active, updated_at: new Date().toISOString() }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success(r.active ? "Poll closed" : "Poll reopened");
    load();
  };

  const remove = async (r: PollOverviewRow) => {
    if (!confirm(`Delete "${r.question}"? Its ${r.responses} response${r.responses === 1 ? "" : "s"} go too, permanently.`)) return;
    const { error } = await tbl("polls").delete().eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Poll deleted");
    load();
  };

  const edit = (r: PollOverviewRow) => setDraft({
    id: r.id, question: r.question, kind: r.kind, options: pollOptions(r.options),
    allow_text: r.allow_text, text_prompt: r.text_prompt ?? "",
    closes_at: r.closes_at ? r.closes_at.slice(0, 10) : "",
  });

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2.5 mb-2">
        <BarChart3 className="w-5 h-5 td-accent-text" />
        <h2 className="text-lg font-bold text-white">Polls</h2>
        <span className="text-[9px] font-bold tracking-[0.14em] uppercase td-surface-2 text-zinc-400 px-1.5 py-0.5 rounded-full">Beta</span>
      </div>
      <p className="text-zinc-500 text-sm mb-5">
        Ask students a short question on their dashboard. One poll shows at a time — the newest
        open one they haven&apos;t answered or dismissed.
      </p>

      {/* ── Composer ─────────────────────────────────────────── */}
      {draft ? (
        <div className="td-surface rounded-3xl p-4 sm:p-5 mb-6">
          <div className="flex items-center justify-between gap-3 mb-3.5">
            <p className="text-white font-bold text-sm">{draft.id ? "Edit poll" : "New poll"}</p>
            <button onClick={() => setDraft(null)} className="w-8 h-8 rounded-full td-btn-ghost flex items-center justify-center shrink-0" aria-label="Cancel">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <label className="block text-[10px] font-bold tracking-[0.16em] uppercase text-zinc-600 mb-1.5">Question</label>
          <textarea
            value={draft.question}
            onChange={(e) => setDraft({ ...draft, question: e.target.value })}
            rows={2} maxLength={300}
            placeholder="Is Study-With-AI actually useful to you?"
            className="td-surface-2 rounded-2xl w-full px-3.5 py-2.5 text-[13px] text-white outline-none resize-none placeholder:text-zinc-600 focus:border-white/25 transition-colors"
          />

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <div className="td-surface-2 rounded-full p-1 flex gap-1">
              {(["single", "multi"] as PollKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setDraft({ ...draft, kind: k })}
                  className={`px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-colors ${
                    draft.kind === k ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {k === "single" ? "Pick one" : "Pick many"}
                </button>
              ))}
            </div>
            <label className="td-surface-2 rounded-full px-3 py-1.5 flex items-center gap-2 text-[11.5px] text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={draft.allow_text} onChange={(e) => setDraft({ ...draft, allow_text: e.target.checked })} className="accent-[var(--td-accent)]" />
              Ask for a comment
            </label>
            <label className="td-surface-2 rounded-full px-3 h-[34px] flex items-center gap-2 text-[11.5px] text-zinc-400">
              Closes
              <input
                type="date" value={draft.closes_at}
                onChange={(e) => setDraft({ ...draft, closes_at: e.target.value })}
                className="bg-transparent text-white text-[11.5px] outline-none [color-scheme:dark] w-[7.5rem]"
              />
            </label>
          </div>

          {draft.allow_text && (
            <input
              value={draft.text_prompt}
              onChange={(e) => setDraft({ ...draft, text_prompt: e.target.value })}
              maxLength={140}
              placeholder="Comment prompt — e.g. What would make it more useful?"
              className="td-surface-2 rounded-2xl w-full mt-2 px-3.5 py-2.5 text-[13px] text-white outline-none placeholder:text-zinc-600 focus:border-white/25 transition-colors"
            />
          )}

          <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-zinc-600 mt-4 mb-1.5">Options</p>
          <div className="space-y-1.5">
            {draft.options.map((o, i) => (
              <div key={o.id} className="flex items-center gap-2">
                <GripVertical className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                <input
                  value={o.label}
                  onChange={(e) => setDraft({
                    ...draft,
                    options: draft.options.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)),
                  })}
                  maxLength={120}
                  placeholder={`Option ${i + 1}`}
                  className="td-surface-2 rounded-xl min-w-0 flex-1 px-3 py-2 text-[13px] text-white outline-none placeholder:text-zinc-600 focus:border-white/25 transition-colors"
                />
                <button
                  onClick={() => setDraft({ ...draft, options: draft.options.filter((x) => x.id !== o.id) })}
                  disabled={draft.options.length <= 2}
                  title={draft.options.length <= 2 ? "A poll needs at least two options" : "Remove"}
                  className="w-8 h-8 rounded-full td-btn-ghost flex items-center justify-center shrink-0 disabled:opacity-35"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setDraft({ ...draft, options: [...draft.options, newOption()] })}
            className="td-btn-ghost px-3 py-1.5 rounded-full text-[11.5px] font-semibold inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="w-3 h-3" /> Add option
          </button>

          <div className="flex items-center gap-2 mt-5">
            <button onClick={save} disabled={saving} className="td-btn-primary px-4 py-2.5 rounded-full text-[13px] font-bold inline-flex items-center gap-1.5 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? "Saving…" : draft.id ? "Save changes" : "Publish poll"}
            </button>
            <button onClick={() => setDraft(null)} className="td-btn-ghost px-4 py-2.5 rounded-full text-[13px] font-semibold">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button onClick={() => setDraft(blank())} className="td-btn-primary px-4 py-2.5 rounded-full text-[13px] font-bold inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New poll
          </button>
          {TEMPLATES.map((t) => (
            <button key={t.name} onClick={() => setDraft(t.make())} className="td-btn-ghost px-3.5 py-2.5 rounded-full text-[12px] font-semibold inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 td-accent-text" /> {t.name}
            </button>
          ))}
          <button onClick={load} className="td-btn-ghost px-3 py-2.5 rounded-full text-[12px] font-semibold inline-flex items-center gap-1.5 ml-auto">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      )}

      {/* ── List ─────────────────────────────────────────────── */}
      {loading && rows.length === 0 ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl td-surface animate-pulse" />)}</div>
      ) : rows.length === 0 ? (
        <div className="td-surface rounded-3xl p-8 text-center">
          <BarChart3 className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-white font-semibold">No polls yet</p>
          <p className="text-zinc-500 text-sm mt-1">Start from a template above — it takes about ten seconds.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => {
            const live = pollIsOpen(r);
            const opts = pollOptions(r.options);
            const total = Object.values(results).reduce((a, b) => a + b, 0);
            return (
              <div key={r.id} className="td-surface rounded-2xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-[13.5px] font-semibold leading-snug break-words">{r.question}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${live ? "td-accent-bg" : "td-surface-2 text-zinc-500"}`}>
                          {live ? "Live" : "Closed"}
                        </span>
                        <span className="text-[10.5px] text-zinc-600 tabular-nums">
                          {r.responses} response{r.responses === 1 ? "" : "s"}
                        </span>
                        {r.comments > 0 && (
                          <span className="text-[10.5px] text-zinc-600 tabular-nums inline-flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {r.comments}
                          </span>
                        )}
                        <span className="text-[10.5px] text-zinc-700">{r.kind === "multi" ? "pick many" : "pick one"}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => openResults(r.id)}
                      className="td-btn-ghost px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0 inline-flex items-center gap-1.5"
                    >
                      Results <ChevronDown className={`w-3 h-3 transition-transform ${open === r.id ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    <button onClick={() => edit(r)} className="td-btn-ghost px-3 py-1.5 rounded-full text-[11px] font-semibold">Edit</button>
                    <button onClick={() => toggleActive(r)} className="td-btn-ghost px-3 py-1.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5">
                      <Power className="w-3 h-3" /> {r.active ? "Close" : "Reopen"}
                    </button>
                    <button onClick={() => remove(r)} className="td-btn-ghost px-3 py-1.5 rounded-full text-[11px] font-semibold text-red-400/90 inline-flex items-center gap-1.5">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>

                {open === r.id && (
                  <div className="border-t border-white/5 p-4 space-y-3">
                    {loadingResults ? (
                      <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 rounded-xl td-surface-2 animate-pulse" />)}</div>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          {opts.map((o) => {
                            const c = results[o.id] ?? 0;
                            const pct = total > 0 ? Math.round((c / total) * 100) : 0;
                            return (
                              <div key={o.id} className="relative td-surface-2 rounded-xl px-3 py-2 overflow-hidden">
                                <span aria-hidden className="absolute inset-y-0 left-0 transition-[width] duration-700"
                                  style={{ width: `${pct}%`, background: "rgb(var(--td-accent-rgb) / 0.20)" }} />
                                <span className="relative flex items-center gap-2">
                                  <span className="min-w-0 flex-1 text-[12.5px] text-zinc-200 break-words">{o.label}</span>
                                  <span className="shrink-0 text-[11px] text-zinc-400 font-bold tabular-nums">{c} · {pct}%</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {answers.some((a) => a.comment?.trim()) && (
                          <div>
                            <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-zinc-600 mb-1.5">What they said</p>
                            <div className="space-y-1.5 max-h-72 overflow-y-auto">
                              {answers.filter((a) => a.comment?.trim()).map((a) => (
                                <div key={a.user_id} className="td-surface-2 rounded-xl px-3 py-2">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-[11.5px] text-white font-semibold truncate min-w-0">{a.who}</span>
                                    <span className="text-[10px] text-zinc-600 shrink-0 tabular-nums">
                                      {new Date(a.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                                    </span>
                                  </div>
                                  <p className="text-[12.5px] text-zinc-300 mt-1 break-words whitespace-pre-wrap">{a.comment}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {total === 0 && <p className="text-[12px] text-zinc-600">No responses yet.</p>}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
