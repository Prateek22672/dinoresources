import { useEffect, useState } from "react";
import { X, Maximize2, Minimize2, MessageSquare, Target, PenLine, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { tbl } from "@/integrations/supabase/revamp";
import TutorOrb from "./tutor/TutorOrb";
import TutorChat from "./tutor/TutorChat";
import TutorDrill from "./tutor/TutorDrill";
import TutorRecall from "./tutor/TutorRecall";
import { callRpc, type MasteryRow, type TutorContext } from "./tutor/shared";

export type TutorMode = "chat" | "drill" | "recall";

const MODES: { id: TutorMode; label: string; icon: typeof MessageSquare; hint: string }[] = [
  { id: "chat", label: "Explain", icon: MessageSquare, hint: "Ask anything from this unit" },
  { id: "drill", label: "Drill", icon: Target, hint: "Rapid MCQs from your notes" },
  { id: "recall", label: "Recall", icon: PenLine, hint: "Write it out and get marked" },
];

/**
 * The Study-With-AI tutor panel.
 *
 * It docks beside the unit the student is reading rather than floating over it,
 * because the two are meant to be used together: the tutor cites the answer,
 * the student taps the citation, the page behind scrolls to it.
 */
export default function StudyTutor({
  open, onClose, ctx, initialMode = "chat",
}: {
  open: boolean;
  onClose: () => void;
  ctx: TutorContext;
  initialMode?: TutorMode;
}) {
  const [mode, setMode] = useState<TutorMode>(initialMode);
  const [wide, setWide] = useState(false);
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
        const full = p?.full_name || p?.username || p?.email?.split("@")[0] || "there";
        if (alive) setName(String(full).trim().split(/\s+/)[0].slice(0, 20));

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

  // Esc closes; mobile locks the page behind so the sheet scrolls alone.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const small = window.matchMedia("(max-width: 767px)").matches;
    const prev = document.body.style.overflow;
    if (small) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      if (small) document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const scope = ctx.unit
    ? `Unit ${ctx.unit}${ctx.topic ? ` · ${ctx.topic}` : ""}`
    : ctx.subjectName;
  const readable = ctx.qa.filter((q) => q.answer_md).length;

  return (
    <>
      {/* Dim only where the panel overlays content the student might tap. */}
      <div
        className={`fixed inset-0 z-[96] bg-black/50 md:bg-black/30 ${wide ? "" : "md:hidden"}`}
        onClick={onClose}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-label="Study tutor"
        className={
          wide
            ? "fixed z-[97] inset-2 sm:inset-6 lg:inset-x-[max(2rem,calc(50vw-32rem))] lg:inset-y-8"
            : "fixed z-[97] inset-0 md:inset-y-0 md:left-auto md:right-0 md:w-[min(27rem,50vw)]"
        }
      >
        <div className={`td-surface h-full flex flex-col overflow-hidden td-in border border-white/10 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.7)] ${
          wide ? "rounded-[28px]" : "rounded-none md:rounded-l-[28px]"
        }`}>
          {/* ── Head ─────────────────────────────────────────────── */}
          <div className="relative shrink-0 overflow-hidden border-b border-white/8">
            <div className="td-aurora" aria-hidden><i /><i /><i /></div>
            <div className="relative z-10 px-4 sm:px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3.5">
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
                  onClick={() => setWide((w) => !w)}
                  className="hidden md:flex w-9 h-9 rounded-full td-btn-ghost items-center justify-center shrink-0"
                  aria-label={wide ? "Dock to the side" : "Expand"}
                  title={wide ? "Dock to the side" : "Expand"}
                >
                  {wide ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button onClick={onClose} className="w-9 h-9 rounded-full td-btn-ghost flex items-center justify-center shrink-0" aria-label="Close tutor">
                  <X className="w-4 h-4" />
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

          {/* ── Body ─────────────────────────────────────────────── */}
          <div className="flex-1 min-h-0 flex flex-col">
            {mode === "chat" && <TutorChat ctx={ctx} name={name} mastery={mastery} onDrill={() => setMode("drill")} />}
            {mode === "drill" && <TutorDrill ctx={ctx} />}
            {mode === "recall" && <TutorRecall ctx={ctx} />}
          </div>
        </div>
      </aside>
    </>
  );
}
