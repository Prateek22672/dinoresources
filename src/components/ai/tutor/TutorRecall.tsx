import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, RefreshCw, PenLine, ChevronDown, Check, Minus, Lightbulb, Lock, Shuffle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { tbl } from "@/integrations/supabase/revamp";
import { MarkdownRenderer } from "@/components/ai/MarkdownRenderer";
import TutorOrb from "./TutorOrb";
import { gradeAnswer, jumpToSource, scoreBand, type GradeResult, type TutorContext, type TutorQa } from "./shared";

/**
 * Active recall — the drill that actually moves marks. The student writes the
 * answer from memory and it is graded against the real Study-With-AI answer,
 * so the feedback is "here is what you left out", not a vibe.
 *
 * The questions come straight from subject_qa on the client, so this mode still
 * works when the model is unreachable; only the grading needs the server, and
 * that degrades to term-overlap rather than failing.
 */
export default function TutorRecall({ ctx }: { ctx: TutorContext }) {
  // Only questions whose answer the student can actually see can be graded.
  const pool = useMemo<TutorQa[]>(
    () => ctx.qa.filter((q) => q.answer_md && (ctx.unit === null || q.unit_number === ctx.unit)),
    [ctx.qa, ctx.unit],
  );
  const lockedCount = ctx.qa.length - pool.length;

  const [order, setOrder] = useState<number[]>([]);
  const [seat, setSeat] = useState(0);
  const [written, setWritten] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [showModel, setShowModel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneCount, setDoneCount] = useState(0);
  const [runningPct, setRunningPct] = useState<number[]>([]);

  const reshuffle = useCallback(() => {
    const idx = pool.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    setOrder(idx);
    setSeat(0);
    setWritten(""); setResult(null); setShowModel(false); setError(null);
  }, [pool]);

  useEffect(() => { reshuffle(); }, [reshuffle]);

  // `order` is filled by an effect, which does not run until after the first
  // render — so on that pass order[seat] is undefined and the lookup misses.
  // Fall back to the first card until the shuffle lands; without this the whole
  // mode threw on `card.id` the moment it opened.
  const card: TutorQa | undefined = pool[order[seat]] ?? pool[0];

  const check = async () => {
    if (!card || busy || written.trim().length < 2) return;
    setBusy(true); setError(null);
    const { data, error: err } = await gradeAnswer(ctx, {
      question: card.question,
      answer: written,
      sourceId: card.id,
      unit: card.unit_number,
    });
    setBusy(false);
    if (err || !data) { setError(err ?? "Couldn't grade that just now."); return; }
    setResult(data);
    setDoneCount((n) => n + 1);
    setRunningPct((p) => [...p, data.score]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await tbl("study_attempts").insert({
          user_id: user.id,
          subject_id: ctx.subjectId,
          unit_number: card.unit_number,
          topic_id: card.topic_id ?? null,
          mode: "recall",
          score: data.score,
          total: 100,
          detail: [{ q: card.question.slice(0, 200), score: data.score, source_id: card.id }],
        });
      }
    } catch { /* history is a nicety */ }
  };

  const nextCard = () => {
    setWritten(""); setResult(null); setShowModel(false); setError(null);
    setSeat((s) => (s + 1) % Math.max(pool.length, 1));
  };

  if (!pool.length || !card) {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-8">
        <div className="td-surface rounded-3xl p-6 text-center">
          <span className="w-12 h-12 rounded-2xl td-surface-2 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5 text-zinc-500" />
          </span>
          <p className="text-white font-bold">Nothing to drill yet</p>
          <p className="text-zinc-500 text-[13px] mt-1.5 leading-relaxed">
            {lockedCount > 0
              ? `This unit's ${lockedCount} answers are still locked. Unlock the subject and I'll turn every one of them into a recall drill.`
              : "No Study-With-AI answers have been added to this unit yet."}
          </p>
        </div>
      </div>
    );
  }

  const avg = runningPct.length ? Math.round(runningPct.reduce((a, b) => a + b, 0) / runningPct.length) : null;
  const band = result ? scoreBand(result.score) : null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 px-4 sm:px-5 pt-4 pb-3 flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-600">
          Recall {seat + 1} / {pool.length}
        </span>
        {avg !== null && (
          <span className="td-surface-2 rounded-full px-2.5 py-1 text-[10px] font-bold text-zinc-300">
            avg {avg}% · {doneCount} done
          </span>
        )}
        <button onClick={reshuffle} className="ml-auto td-btn-ghost px-2.5 py-1.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1.5">
          <Shuffle className="w-3 h-3" /> Shuffle
        </button>
      </div>

      <div key={card.id} className="td-msg flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 pb-5 space-y-4">
        <div className="td-surface rounded-3xl p-5 relative overflow-hidden">
          <div className="td-aurora" aria-hidden><i /><i /></div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-500 mb-2 flex items-center gap-1.5">
              <PenLine className="w-3 h-3 td-accent-text" /> Write it from memory
            </p>
            <p className="text-white text-[16px] font-semibold leading-snug">{card.question}</p>
          </div>
        </div>

        {!result && (
          <>
            <textarea
              value={written}
              onChange={(e) => setWritten(e.target.value)}
              rows={7}
              placeholder="Answer as you would in the exam — points, keywords, an example. Don't peek."
              className="td-surface-2 w-full rounded-2xl px-4 py-3.5 text-[14px] text-white outline-none placeholder:text-zinc-600 resize-y min-h-[8rem] focus:border-white/25 transition-colors"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-600">{written.trim().split(/\s+/).filter(Boolean).length} words</span>
              <button
                onClick={check}
                disabled={busy || written.trim().length < 2}
                className="td-btn-primary px-5 py-2.5 rounded-full text-[13px] font-bold inline-flex items-center gap-1.5 disabled:opacity-40"
              >
                {busy ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Marking…</> : <>Check my answer <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </div>
            {error && <p className="text-[12px] text-amber-400">{error}</p>}
            {busy && (
              <div className="flex items-center gap-2.5">
                <TutorOrb size={22} busy />
                <span className="td-scan td-surface-2 rounded-full px-3 py-1.5 text-[11px] text-zinc-400">
                  Comparing yours against the real answer…
                </span>
              </div>
            )}
          </>
        )}

        {result && band && (
          <div className="space-y-3.5">
            <div className="td-surface rounded-3xl p-5">
              <div className="flex items-center gap-4">
                <div className="td-score-in shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center"
                  style={{ background: "rgb(var(--td-accent-rgb) / 0.10)", border: `1.5px solid ${band.color}` }}>
                  <span className="text-xl font-bold text-white leading-none">{result.score}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mt-0.5">/100</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[15px]" style={{ color: band.color }}>{band.label}</p>
                  <p className="text-zinc-300 text-[13px] mt-0.5 leading-snug">{result.verdict}</p>
                </div>
              </div>

              {/* progress bar of this answer's score */}
              <div className="h-1.5 rounded-full mt-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{ width: `${result.score}%`, background: band.color, transition: "width 800ms cubic-bezier(.22,1,.36,1)" }} />
              </div>
            </div>

            {(result.hits.length > 0 || result.misses.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-2.5">
                {result.hits.length > 0 && (
                  <div className="td-surface rounded-2xl p-4">
                    <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-400 mb-2">You got</p>
                    <ul className="space-y-1.5">
                      {result.hits.map((h, i) => (
                        <li key={i} className="text-[12.5px] text-zinc-300 flex gap-2 leading-snug">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.misses.length > 0 && (
                  <div className="td-surface rounded-2xl p-4">
                    <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-rose-400 mb-2">You missed</p>
                    <ul className="space-y-1.5">
                      {result.misses.map((h, i) => (
                        <li key={i} className="text-[12.5px] text-zinc-300 flex gap-2 leading-snug">
                          <Minus className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" /> {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {result.tip && (
              <div className="td-card-accent rounded-2xl p-4 flex gap-2.5">
                <Lightbulb className="w-4 h-4 td-accent-text shrink-0 mt-0.5" />
                <p className="text-[13px] text-zinc-200 leading-relaxed">{result.tip}</p>
              </div>
            )}

            {result.degraded && (
              <p className="text-[11px] text-amber-400/80">
                Marked on keyword overlap — the marking model was unavailable, so treat the score as rough.
              </p>
            )}

            <div className="td-surface rounded-2xl overflow-hidden">
              <button onClick={() => setShowModel((s) => !s)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                <span className="text-[13px] font-semibold text-zinc-200 flex-1">The full answer from your notes</span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${showModel ? "rotate-180" : ""}`} />
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${showModel ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 pt-1 border-t border-white/5">
                    <MarkdownRenderer content={result.model_answer} />
                    <button
                      onClick={() => jumpToSource(card.id)}
                      className="td-btn-ghost mt-3 px-3 py-1.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1.5"
                    >
                      Open it in the unit <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="shrink-0 px-4 sm:px-5 pt-3 pb-[max(0.9rem,env(safe-area-inset-bottom))] border-t border-white/8">
          <button onClick={nextCard} className="td-btn-primary w-full py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-2">
            Next question <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
