import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays, Target, BookOpen, ClipboardCheck, RefreshCw, AlertTriangle, Sparkles,
} from "lucide-react";
import TutorOrb from "./TutorOrb";
import {
  buildExamPlan, scoreBand,
  type ExamPlan, type PlanBlock, type PlanUnitRow, type TutorContext,
} from "./shared";

/** yyyy-mm-dd in the student's own timezone — toISOString would shift the day. */
const isoLocal = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

const BLOCK_ICON: Record<string, typeof BookOpen> = {
  study: BookOpen,
  drill: Target,
  review: ClipboardCheck,
};

/** Colour for a mastery score, or grey when there is no score to colour. */
function masteryTone(pct: number | null): string {
  if (pct === null) return "#71717a";
  return scoreBand(pct).color;
}

/**
 * Exam mode — a revision schedule built from this student's own drill scores.
 *
 * Asked "I have an exam tomorrow, how do I prepare?", the chat used to return
 * flashcards, a concept map and a reminder to sleep well — advice that would
 * suit any subject on earth, given by a tutor that already knew this student
 * had scored 42% on Unit 3 twice. The schedule here is computed on the server
 * from mastery, from how much material each unit actually has, and from the
 * days remaining; the model only phrases it. So the ordering is answerable —
 * every unit shows the score that put it where it is.
 */
export default function TutorExam({
  ctx, onDrill, onAsk,
}: {
  ctx: TutorContext;
  onDrill: () => void;
  onAsk: (seed: string) => void;
}) {
  const dateKey = `td:exam-date:${ctx.subjectId}`;
  const planKey = `td:exam-plan:${ctx.subjectId}`;

  const [date, setDate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(dateKey);
      if (saved && saved >= isoLocal(new Date())) return saved;
    } catch { /* unreadable storage — fall through to the default */ }
    return isoLocal(new Date(Date.now() + 86_400_000));
  });
  const [plan, setPlan] = useState<ExamPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const build = useCallback(async (forDate: string) => {
    setBusy(true);
    setError(null);
    const { data, error: err } = await buildExamPlan(ctx, forDate);
    setBusy(false);
    if (err || !data) { setError(err ?? "Couldn't build a plan just now."); return; }
    setPlan(data);
    try {
      localStorage.setItem(dateKey, forDate);
      localStorage.setItem(planKey, JSON.stringify({ builtOn: isoLocal(new Date()), date: forDate, plan: data }));
    } catch { /* quota — the plan still works for this session */ }
  }, [ctx, dateKey, planKey]);

  // Reopening shouldn't cost a rebuild, but a plan built yesterday is wrong by
  // exactly one day — the thing that matters most here. So a stale one is
  // rebuilt rather than shown.
  useEffect(() => {
    let cached: { builtOn?: string; date?: string; plan?: ExamPlan } | null = null;
    try { cached = JSON.parse(localStorage.getItem(planKey) || "null"); } catch { cached = null; }
    const today = isoLocal(new Date());
    if (cached?.plan && cached.builtOn === today && cached.date && cached.date >= today) {
      setPlan(cached.plan);
      setDate(cached.date);
      return;
    }
    if (cached?.date && cached.date >= today) void build(cached.date);
    // Intentionally once per subject — rebuilding on every keystroke of the
    // date field would fire a request per digit typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey]);

  const today = isoLocal(new Date());

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-4">

        {/* ── When is it ──────────────────────────────────────────── */}
        <div className="td-surface rounded-3xl p-4 sm:p-5 relative overflow-hidden">
          <div className="td-aurora" aria-hidden><i /><i /><i /></div>
          <div className="relative z-10">
            <div className="flex items-start gap-3">
              <TutorOrb size={34} busy={busy} />
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-[15px] leading-tight flex items-center gap-2 flex-wrap">
                  Exam plan
                  <span className="text-[9px] font-bold tracking-[0.14em] uppercase td-surface-2 text-zinc-400 px-1.5 py-0.5 rounded-full shrink-0">
                    Beta
                  </span>
                </p>
                <p className="text-zinc-500 text-[12px] mt-1 leading-relaxed">
                  Built from your own drill scores for{" "}
                  <span className="text-zinc-300">{ctx.subjectName}</span> — weakest units first.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-2 mt-4">
              <label className="min-w-0 flex-1 basis-[11rem]">
                <span className="block text-[10px] font-bold tracking-[0.16em] uppercase text-zinc-600 mb-1.5">
                  Exam date
                </span>
                <div className="td-surface-2 rounded-xl h-11 px-3 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-zinc-500 shrink-0" />
                  <input
                    type="date"
                    value={date}
                    min={today}
                    onChange={(e) => setDate(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-white text-[13px] outline-none [color-scheme:dark]"
                  />
                </div>
              </label>
              <button
                onClick={() => build(date)}
                disabled={busy || !date || date < today}
                className="td-btn-primary h-11 px-5 rounded-xl text-[13px] font-bold inline-flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                {busy
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Building…</>
                  : <><Sparkles className="w-3.5 h-3.5" /> {plan ? "Rebuild" : "Build my plan"}</>}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="td-surface rounded-2xl p-4 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-zinc-300 min-w-0">{error}</p>
          </div>
        )}

        {!plan && !busy && !error && (
          <p className="text-[12px] text-zinc-600 px-1">
            Pick the date and I&apos;ll work out what to revise, in what order, and how long to spend on each unit.
          </p>
        )}

        {plan && (
          <>
            {/* ── Headline ─────────────────────────────────────────── */}
            <div className="td-surface rounded-2xl p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="td-accent-bg rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums shrink-0">
                  {plan.daysLeft} day{plan.daysLeft === 1 ? "" : "s"} left
                </span>
                <span className="text-[11px] text-zinc-600 tabular-nums">exam {plan.examDate}</span>
              </div>
              <p className="text-white text-[14px] font-semibold mt-2.5 leading-snug break-words">
                {plan.headline}
              </p>
            </div>

            {/* ── Where you stand ──────────────────────────────────── */}
            <section>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-600 px-1 mb-2">
                Where you stand
              </p>
              <div className="space-y-2">
                {plan.units.map((u) => <UnitRow key={u.unit} u={u} onAsk={onAsk} />)}
              </div>
              <p className="text-[11px] text-zinc-600 mt-2 px-1 leading-relaxed">
                Order comes from your drill accuracy and how much material each unit has — not from unit number.
                A unit you&apos;ve never drilled is treated as shaky rather than skipped.
              </p>
            </section>

            {/* ── The schedule ─────────────────────────────────────── */}
            <section>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-600 px-1 mb-2">
                Your plan
              </p>
              <div className="space-y-2.5">
                {plan.days.map((d) => (
                  <div key={d.date} className="td-surface rounded-2xl overflow-hidden">
                    <div className="flex items-baseline gap-2 px-4 pt-3 pb-2">
                      <p className="text-white text-[13px] font-bold truncate min-w-0">{d.label}</p>
                      <span className="text-[10px] text-zinc-600 tabular-nums shrink-0">{d.date}</span>
                    </div>
                    <div className="border-t border-white/5 divide-y divide-white/5">
                      {d.blocks.map((b, i) => <BlockRow key={i} b={b} onDrill={onDrill} />)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {plan.degraded && (
              <p className="text-[11px] text-amber-400/80 px-1">
                The schedule below is yours; only the wording fell back to a computed line — the model was unavailable.
              </p>
            )}

            <p className="text-[11px] text-zinc-600 px-1 pb-1 leading-relaxed">
              Beta — the schedule is worked out from real scores, but it can&apos;t know about your other exams.
              Treat it as a starting order, not a rule.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/** One unit's standing: the score, the share of time it earned, and why. */
function UnitRow({ u, onAsk }: { u: PlanUnitRow; onAsk: (seed: string) => void }) {
  const tone = masteryTone(u.pct);
  return (
    <div className="td-surface rounded-2xl p-3.5">
      <div className="flex items-center gap-3">
        <span
          className="w-9 h-9 rounded-xl td-surface-2 flex items-center justify-center shrink-0 text-[12px] font-bold tabular-nums"
          style={{ color: tone }}
        >
          U{u.unit}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-white text-[13px] font-semibold tabular-nums">
              {u.pct === null ? "Not drilled yet" : `${u.pct}%`}
            </span>
            <span className="text-[10.5px] text-zinc-600 tabular-nums">
              {u.qa} answer{u.qa === 1 ? "" : "s"}
              {u.attempts > 0 && ` · ${u.attempts} drill${u.attempts === 1 ? "" : "s"}`}
            </span>
          </div>
          {/* Bar is the score, so an undrilled unit shows an empty track rather
              than a full one — absence of evidence must not read as 0%. */}
          <div className="h-1.5 rounded-full td-surface-2 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${u.pct ?? 0}%`, background: tone }}
            />
          </div>
        </div>
        {/* Zero is a real outcome when there isn't time for every unit, and it
            always falls on the strongest. Saying "0 blocks" reads as a fault,
            so it says what actually happened and why. */}
        {u.blocks === 0 ? (
          <span
            title="There isn't time for every unit, so the one you score highest on is the one that gives way."
            className="text-[10px] text-zinc-600 shrink-0 text-right leading-tight max-w-[4.5rem]"
          >
            skipped —<br />your strongest
          </span>
        ) : (
          <span className="text-[10px] text-zinc-600 shrink-0 text-right leading-tight tabular-nums">
            {u.blocks}<br />block{u.blocks === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {u.tip && (
        <p className="text-[12px] text-zinc-400 mt-2.5 leading-relaxed break-words">{u.tip}</p>
      )}

      {u.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {u.topics.slice(0, 4).map((t) => (
            <button
              key={t}
              onClick={() => onAsk(`Explain ${t}`)}
              title={`Ask Rex about ${t}`}
              className="td-surface-2 hover:border-white/25 transition-colors rounded-lg px-2 py-1 text-[10.5px] text-zinc-400 max-w-full truncate"
            >
              {t}
            </button>
          ))}
          {u.topics.length > 4 && (
            <span className="text-[10.5px] text-zinc-600 px-1 py-1 shrink-0">
              +{u.topics.length - 4} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** One sitting inside a day. */
function BlockRow({ b, onDrill }: { b: PlanBlock; onDrill: () => void }) {
  const Icon = BLOCK_ICON[b.kind] ?? BookOpen;
  const isDrill = b.kind === "drill" || b.kind === "review";
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="w-7 h-7 rounded-lg td-surface-2 flex items-center justify-center shrink-0">
        <Icon className={`w-3.5 h-3.5 ${isDrill ? "td-accent-text" : "text-zinc-500"}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] text-zinc-300 leading-snug break-words">{b.focus}</p>
        {b.unit !== null && (
          <p className="text-[10px] text-zinc-600 tabular-nums mt-0.5">Unit {b.unit}</p>
        )}
      </div>
      {isDrill && (
        <button
          onClick={onDrill}
          className="td-btn-ghost px-2.5 py-1.5 rounded-full text-[10.5px] font-semibold shrink-0"
        >
          Drill
        </button>
      )}
    </div>
  );
}
