import { useCallback, useEffect, useState } from "react";
import {
  Check, X, ArrowRight, RefreshCw, Sparkles, BookOpen, Flame, RotateCcw, AlertCircle, ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { tbl } from "@/integrations/supabase/revamp";
import { MarkdownRenderer } from "@/components/ai/MarkdownRenderer";
import TutorOrb from "./TutorOrb";
import { buildDrill, jumpToSource, scoreBand, type DrillQuestion, type TutorContext } from "./shared";

type Phase = "setup" | "loading" | "running" | "done";

/** Circular score meter — one number, read at a glance. */
function ScoreRing({ pct, color }: { pct: number; color: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-[132px] h-[132px] td-score-in">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9" stroke="rgba(255,255,255,0.08)" />
        <circle
          cx="60" cy="60" r={r} fill="none" strokeWidth="9" strokeLinecap="round"
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.max(0, Math.min(100, pct))) / 100}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white leading-none">{pct}%</span>
        <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-zinc-600 mt-1">score</span>
      </div>
    </div>
  );
}

const COUNTS = [5, 8, 10];
const LEVELS: { id: string; label: string; hint: string }[] = [
  { id: "easy", label: "Warm-up", hint: "Definitions and recall" },
  { id: "mixed", label: "Mixed", hint: "Closest to a real paper" },
  { id: "hard", label: "Brutal", hint: "Compare, apply, distinguish" },
];

export default function TutorDrill({ ctx }: { ctx: TutorContext }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [error, setError] = useState<string | null>(null);

  const [scope, setScope] = useState<"topic" | "unit" | "subject">(ctx.topic ? "topic" : "unit");
  const [count, setCount] = useState(5);
  const [level, setLevel] = useState("mixed");

  const [questions, setQuestions] = useState<DrillQuestion[]>([]);
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showSource, setShowSource] = useState(false);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  const current = questions[at];
  const correct = answers.filter((a, i) => a !== null && a === questions[i]?.answer).length;

  const start = useCallback(async (opts?: { only?: DrillQuestion[] }) => {
    setError(null);
    setPicked(null); setAt(0); setStreak(0); setBest(0); setShowSource(false);

    if (opts?.only) {
      setQuestions(opts.only);
      setAnswers(new Array(opts.only.length).fill(null));
      setPhase("running");
      return;
    }

    setPhase("loading");
    const { data, error: err } = await buildDrill(ctx, {
      unit: scope === "subject" ? null : ctx.unit,
      topic: scope === "topic" ? ctx.topic : null,
      count,
      difficulty: level,
    });
    if (err || !data?.questions?.length) {
      setError(err ?? "Couldn't build a drill from this unit.");
      setPhase("setup");
      return;
    }
    setQuestions(data.questions);
    setAnswers(new Array(data.questions.length).fill(null));
    setPhase("running");
  }, [ctx, scope, count, level]);

  const choose = (i: number) => {
    if (picked !== null || !current) return;
    setPicked(i);
    setAnswers((a) => { const n = [...a]; n[at] = i; return n; });
    if (i === current.answer) {
      setStreak((s) => { const n = s + 1; setBest((b) => Math.max(b, n)); return n; });
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    if (picked === null) return;
    if (at + 1 < questions.length) { setAt(at + 1); setPicked(null); setShowSource(false); }
    else setPhase("done");
  };

  // Number keys answer, Enter advances — drilling should not need the mouse.
  useEffect(() => {
    if (phase !== "running") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (picked === null && /^[1-4]$/.test(e.key)) { e.preventDefault(); choose(Number(e.key) - 1); }
      else if (picked !== null && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Record the attempt so the tutor can open with what went wrong last time.
  useEffect(() => {
    if (phase !== "done" || !questions.length) return;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await tbl("study_attempts").insert({
          user_id: user.id,
          subject_id: ctx.subjectId,
          unit_number: scope === "subject" ? null : ctx.unit,
          mode: "quiz",
          score: correct,
          total: questions.length,
          detail: questions.map((q, i) => ({
            q: q.q.slice(0, 200),
            ok: answers[i] === q.answer,
            source_id: q.source_id,
          })),
        });
      } catch { /* history is a nicety — never block the result screen */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Setup ───────────────────────────────────────────────────────
  if (phase === "setup" || phase === "loading") {
    const busy = phase === "loading";
    const scopes: { id: typeof scope; label: string; sub: string; on: boolean }[] = [
      { id: "topic", label: ctx.topic ?? "This topic", sub: "Just the topic you're on", on: !!ctx.topic },
      { id: "unit", label: ctx.unit ? `Unit ${ctx.unit}` : "This unit", sub: "Everything in the open unit", on: ctx.unit !== null },
      { id: "subject", label: "Whole subject", sub: "All units you've unlocked", on: true },
    ];
    return (
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-5 space-y-5">
        <div className="td-surface rounded-3xl p-5 relative overflow-hidden">
          <div className="td-aurora" aria-hidden><i /><i /><i /></div>
          <div className="relative z-10 flex items-start gap-3">
            <TutorOrb size={40} busy={busy} />
            <div>
              <p className="text-white font-bold text-[17px] leading-tight">
                {busy ? "Writing your drill…" : "Let's test you"}
              </p>
              <p className="text-zinc-400 text-[13px] mt-1 leading-relaxed">
                {busy
                  ? "Reading your notes and turning them into questions. A few seconds."
                  : "Every question is written from your own Study-With-AI answers — nothing off-syllabus."}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="td-surface rounded-2xl p-4 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[13px] text-zinc-300">{error}</p>
          </div>
        )}

        <fieldset disabled={busy} className="space-y-5 disabled:opacity-50">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-600 px-1 mb-2">Cover</p>
            <div className="space-y-1.5">
              {scopes.filter((s) => s.on).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setScope(s.id)}
                  className={`w-full text-left rounded-2xl px-4 py-3 flex items-center gap-3 transition-colors ${
                    scope === s.id ? "td-card-accent" : "td-surface hover:border-white/20"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${scope === s.id ? "border-transparent td-accent-solid" : "border-zinc-600"}`}>
                    {scope === s.id && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-white truncate">{s.label}</span>
                    <span className="block text-[11px] text-zinc-500">{s.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-600 px-1 mb-2">Questions</p>
            <div className="flex gap-1.5">
              {COUNTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  className={`flex-1 rounded-2xl py-3 text-sm font-bold transition-colors ${
                    count === c ? "bg-white text-black" : "td-surface text-zinc-300 hover:border-white/20"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-600 px-1 mb-2">Difficulty</p>
            <div className="space-y-1.5">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={`w-full text-left rounded-2xl px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    level === l.id ? "td-card-accent" : "td-surface hover:border-white/20"
                  }`}
                >
                  <span className="text-[13px] font-semibold text-white w-20 shrink-0">{l.label}</span>
                  <span className="text-[11px] text-zinc-500 truncate">{l.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        <button
          onClick={() => start()}
          disabled={busy}
          className="td-btn-primary w-full py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? <><RefreshCw className="w-4 h-4 animate-spin" /> Building…</> : <><Sparkles className="w-4 h-4" /> Start drill</>}
        </button>
      </div>
    );
  }

  // ── Result ──────────────────────────────────────────────────────
  if (phase === "done") {
    const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const band = scoreBand(pct);
    const missed = questions.filter((q, i) => answers[i] !== q.answer);
    return (
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-5 space-y-5">
        <div className="td-surface rounded-3xl p-6 relative overflow-hidden text-center">
          <div className="td-aurora" aria-hidden><i /><i /><i /></div>
          <div className="relative z-10 flex flex-col items-center">
            <ScoreRing pct={pct} color={band.color} />
            <p className="text-white font-bold text-lg mt-4">{band.label}</p>
            <p className="text-zinc-400 text-[13px] mt-1">{band.line}</p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-4">
              <span className="td-surface-2 rounded-full px-3 py-1.5 text-[11px] font-semibold text-zinc-300">
                {correct} of {questions.length} right
              </span>
              {best > 1 && (
                <span className="td-surface-2 rounded-full px-3 py-1.5 text-[11px] font-semibold text-zinc-300 inline-flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-amber-400" /> Best streak {best}
                </span>
              )}
            </div>
          </div>
        </div>

        {missed.length > 0 && (
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-600 px-1 mb-2">
              Go back over these
            </p>
            <div className="space-y-1.5">
              {missed.map((q) => (
                <div key={q.id} className="td-surface rounded-2xl px-4 py-3">
                  <p className="text-[13px] text-zinc-300 leading-snug">{q.q}</p>
                  <p className="text-[12px] text-emerald-300/90 mt-1.5">
                    <span className="font-semibold">Answer:</span> {q.options[q.answer]}
                  </p>
                  {q.source_id && (
                    <button
                      onClick={() => jumpToSource(q.source_id!)}
                      className="td-btn-ghost mt-2.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3 h-3 td-accent-text" /> Read this in your notes
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {missed.length > 0 && (
            <button
              onClick={() => start({ only: missed })}
              className="flex-1 td-btn-ghost py-3 rounded-full text-[13px] font-bold inline-flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry {missed.length} missed
            </button>
          )}
          <button
            onClick={() => setPhase("setup")}
            className="flex-1 td-btn-primary py-3 rounded-full text-[13px] font-bold inline-flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> New drill
          </button>
        </div>
      </div>
    );
  }

  // ── Running ─────────────────────────────────────────────────────
  if (!current) return null;
  const right = picked !== null && picked === current.answer;
  // Present when the cited answer belongs to the unit this page already loaded
  // (the usual case). Whole-subject drills can cite another unit — those still
  // fall back to jumping.
  const sourceAnswer = current.source_id
    ? ctx.qa.find((q) => q.id === current.source_id)?.answer_md ?? null
    : null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* progress + streak */}
      <div className="shrink-0 px-4 sm:px-5 pt-4 pb-3 flex items-center gap-3">
        <div className="flex-1 flex gap-1">
          {questions.map((_, i) => {
            const done = answers[i] !== null;
            const ok = done && answers[i] === questions[i].answer;
            return (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full transition-colors"
                style={{
                  background: i === at ? "var(--td-accent)"
                    : done ? (ok ? "#34d399" : "#f87171")
                    : "rgba(255,255,255,0.10)",
                }}
              />
            );
          })}
        </div>
        <span className="text-[11px] font-bold text-zinc-500 shrink-0 tabular-nums">{at + 1}/{questions.length}</span>
        {streak > 1 && (
          <span className="td-pop shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
            <Flame className="w-3 h-3" /> {streak}
          </span>
        )}
      </div>

      <div key={current.id} className="td-msg flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 pb-5 space-y-4">
        <p className="text-white text-[16px] font-semibold leading-snug">{current.q}</p>

        <div className="space-y-2">
          {current.options.map((o, i) => {
            const isAnswer = i === current.answer;
            const chosen = picked === i;
            let cls = "td-surface hover:border-white/25";
            let ring = "";
            if (picked !== null) {
              if (isAnswer) { cls = "border-transparent"; ring = "0 0 0 1.5px #34d399"; }
              else if (chosen) { cls = "border-transparent"; ring = "0 0 0 1.5px #f87171"; }
              else cls = "td-surface opacity-50";
            }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={picked !== null}
                className={`w-full text-left rounded-2xl px-4 py-3.5 flex items-start gap-3 transition-all ${cls} ${chosen && !isAnswer ? "td-wrong" : ""}`}
                style={{
                  boxShadow: ring || undefined,
                  background: picked !== null && isAnswer ? "rgba(52,211,153,0.10)"
                    : picked !== null && chosen ? "rgba(248,113,113,0.10)" : undefined,
                }}
              >
                <span
                  className="w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                  style={
                    picked !== null && isAnswer ? { background: "#34d399", color: "#062e22" }
                    : picked !== null && chosen ? { background: "#f87171", color: "#3a0d0d" }
                    : { background: "rgb(var(--td-accent-rgb) / 0.12)", color: "var(--td-accent-soft)" }
                  }
                >
                  {picked !== null && isAnswer ? <Check className="w-3.5 h-3.5" />
                    : picked !== null && chosen ? <X className="w-3.5 h-3.5" />
                    : String.fromCharCode(65 + i)}
                </span>
                <span className="text-[14px] text-zinc-200 leading-snug">{o}</span>
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="td-msg td-surface-2 rounded-2xl p-4">
            <p className={`text-[11px] font-bold tracking-[0.15em] uppercase mb-1.5 ${right ? "text-emerald-400" : "text-rose-400"}`}>
              {right ? "Correct" : "Not quite"}
            </p>
            {current.why && <p className="text-[13px] text-zinc-300 leading-relaxed">{current.why}</p>}

            {/* Reveal the source answer in place. Jumping to it would close the
                modal and throw away a half-finished drill. */}
            {sourceAnswer ? (
              <>
                <button
                  onClick={() => setShowSource((s) => !s)}
                  className="td-btn-ghost mt-3 px-2.5 py-1.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1.5 max-w-full"
                >
                  <BookOpen className="w-3 h-3 td-accent-text shrink-0" />
                  <span className="truncate">{showSource ? "Hide the full answer" : (current.source_q ?? "Read the full answer")}</span>
                  <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${showSource ? "rotate-180" : ""}`} />
                </button>
                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${showSource ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <div className="pt-3 mt-3 border-t border-white/8">
                      <MarkdownRenderer content={sourceAnswer} />
                    </div>
                  </div>
                </div>
              </>
            ) : current.source_id ? (
              <button
                onClick={() => jumpToSource(current.source_id!)}
                title={current.source_q ?? undefined}
                className="td-btn-ghost mt-3 px-2.5 py-1.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1.5 max-w-full"
              >
                <BookOpen className="w-3 h-3 td-accent-text shrink-0" />
                <span className="truncate">{current.source_q ?? "Open it in the unit"}</span>
              </button>
            ) : null}
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 sm:px-5 pt-3 pb-[max(0.9rem,env(safe-area-inset-bottom))] border-t border-white/8">
        <button
          onClick={next}
          disabled={picked === null}
          className="td-btn-primary w-full py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {at + 1 < questions.length ? <>Next question <ArrowRight className="w-4 h-4" /></> : <>See my score <ArrowRight className="w-4 h-4" /></>}
        </button>
        <p className="text-center text-[10px] text-zinc-600 mt-2">
          {picked === null ? "Press 1–4 to answer" : "Press ⏎ to continue"}
        </p>
      </div>
    </div>
  );
}
