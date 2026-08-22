import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Maximize2, Minimize2, MessageSquare, Target, PenLine, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { tbl } from "@/integrations/supabase/revamp";
import TutorOrb from "./tutor/TutorOrb";
import TutorChat from "./tutor/TutorChat";
import TutorDrill from "./tutor/TutorDrill";
import TutorRecall from "./tutor/TutorRecall";
import { callRpc, type MasteryRow, type TutorContext, type TutorMode } from "./tutor/shared";

export type { TutorMode };

const MODES: { id: TutorMode; label: string; icon: typeof MessageSquare; hint: string }[] = [
  { id: "chat", label: "Explain", icon: MessageSquare, hint: "Ask anything from this unit" },
  { id: "drill", label: "Drill", icon: Target, hint: "Rapid MCQs from your notes" },
  { id: "recall", label: "Recall", icon: PenLine, hint: "Write it out and get marked" },
];

/**
 * The Study-With-AI tutor.
 *
 * A full modal rather than a side dock: a worked answer, a four-option drill and
 * a marked recall attempt all need room to breathe. Citations close it and jump
 * the page underneath to the real answer, so the two still work together.
 */
export default function StudyTutor({
  open, onClose, ctx, initialMode = "chat", seed = null,
}: {
  open: boolean;
  onClose: () => void;
  ctx: TutorContext;
  initialMode?: TutorMode;
  /** Question to ask automatically on open — set when a nudge was accepted. */
  seed?: string | null;
}) {
  const [mode, setMode] = useState<TutorMode>(initialMode);
  const [full, setFull] = useState(false);
  const [name, setName] = useState("there");
  const [mastery, setMastery] = useState<number | null>(null);

  useEffect(() => { if (open) setMode(initialMode); }, [open, initialMode]);

  // Who am I talking to, and how have they been doing?
  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !alive) return;
        const { data: p } = await tbl("profiles")
          .select("full_name, username, email").eq("id", user.id).maybeSingle();
        const who = p?.full_name || p?.username || p?.email?.split("@")[0] || "there";
        if (alive) setName(String(who).trim().split(/\s+/)[0].slice(0, 20));

        const { data: raw } = await callRpc("study_mastery", { _subject_id: ctx.subjectId });
        const m = (Array.isArray(raw) ? raw : []) as MasteryRow[];
        if (!alive || !m.length) return;
        const here = ctx.unit ? m.find((r) => r.unit_number === ctx.unit) : null;
        const pct = here
          ? Number(here.pct)
          : Math.round(m.reduce((s, r) => s + Number(r.pct || 0), 0) / m.length);
        setMastery(Number.isFinite(pct) ? pct : null);
      } catch { /* personalisation is optional — the tutor works without it */ }
    })();
    return () => { alive = false; };
  }, [open, ctx.subjectId, ctx.unit]);

  // Esc closes, and the page behind is locked at every size — it's a modal now,
  // so scrolling the page under it only ever felt like a bug.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Tapping a citation is a request to go read it — get out of the way so the
  // student actually lands on the answer instead of staring at the backdrop.
  useEffect(() => {
    if (!open) return;
    const onJump = () => onClose();
    window.addEventListener("td:tutor-jump", onJump);
    return () => window.removeEventListener("td:tutor-jump", onJump);
  }, [open, onClose]);

  if (!open) return null;

  const scope = ctx.unit
    ? `Unit ${ctx.unit}${ctx.topic ? ` · ${ctx.topic}` : ""}`
    : ctx.subjectName;
  const readable = ctx.qa.filter((q) => q.answer_md).length;

  // Portalled to <body> on purpose. UnitView renders inside <main class="td-page">,
  // which animates transform/filter and sits inside .td-app (overflow-x: clip).
  // Either is enough to make an ancestor the containing block for a fixed child,
  // which had this modal sizing itself against the whole scrollable page instead
  // of the viewport. On <body> it inherits none of that.
  return createPortal(
    <>
      {/* One fixed, viewport-sized layer that owns both the backdrop and the
          modal, centred with flex rather than top/left + translate — nothing
          to mis-measure, and no transform of its own. */}
      <div className="fixed inset-0 z-[96] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/65 backdrop-blur-[3px]"
          onClick={onClose}
          aria-hidden
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-label="Study tutor"
          className={`relative z-[1] td-surface flex flex-col overflow-hidden td-in border border-white/10 shadow-[0_40px_120px_-24px_rgba(0,0,0,0.85)] ${
            full
              ? "w-full h-full rounded-none"
              : "w-full h-full rounded-none sm:w-[94vw] sm:h-[92dvh] sm:rounded-[28px]"
          }`}
        >
          {/* ── Head ─────────────────────────────────────────────── */}
          <div className="relative shrink-0 overflow-hidden border-b border-white/8">
            <div className="td-aurora" aria-hidden><i /><i /><i /></div>
            <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3.5">
              <div className="flex items-center gap-3">
                <TutorOrb size={38} />
                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold leading-tight flex items-center gap-2">
                    Rex
                    <span className="text-[9px] font-bold tracking-[0.14em] uppercase td-accent-bg px-1.5 py-0.5 rounded-full">Study tutor</span>
                  </p>
                  <p className="text-zinc-500 text-[11.5px] truncate mt-0.5">
                    Reading <span className="text-zinc-300">{scope}</span> with you
                  </p>
                </div>
                <button
                  onClick={() => setFull((f) => !f)}
                  className="hidden sm:flex w-10 h-10 rounded-full td-btn-ghost items-center justify-center shrink-0"
                  aria-label={full ? "Shrink" : "Full screen"}
                  title={full ? "Shrink" : "Full screen"}
                >
                  {full ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-zinc-300 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)" }}
                  aria-label="Close tutor"
                  title="Close (Esc)"
                >
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* ── Modes ─────────────────────────────────────────── */}
              <div className="td-surface-2 rounded-full p-1 flex gap-1 mt-3.5">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    title={m.hint}
                    className={`flex-1 rounded-full py-2 text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      mode === m.id ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <m.icon className="w-3.5 h-3.5" /> {m.label}
                  </button>
                ))}
              </div>

              {!ctx.hasAccess && (
                <p className="mt-2.5 text-[11px] text-amber-400/85 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 shrink-0" />
                  Free preview — I can only read {readable} of this unit&apos;s {ctx.qa.length} answers.
                </p>
              )}
            </div>
          </div>

          {/* ── Body ─────────────────────────────────────────────────
              Capped to a reading width and centred: the modal can be 860px
              wide, but a line of explanation shouldn't be. */}
          <div className="flex-1 min-h-0 flex flex-col w-full max-w-5xl mx-auto">
            {mode === "chat" && <TutorChat ctx={ctx} name={name} mastery={mastery} seed={seed} onDrill={() => setMode("drill")} />}
            {mode === "drill" && <TutorDrill ctx={ctx} />}
            {mode === "recall" && <TutorRecall ctx={ctx} />}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
