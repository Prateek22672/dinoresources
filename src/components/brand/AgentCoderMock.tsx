import type React from "react";
import { useEffect, useState } from "react";
import { Check, Plus, History, Settings, Paperclip, ArrowUp, Zap, Hammer } from "lucide-react";

const ORANGE = "#d97757";

/** FreeAgentCoder's logo (same path as public/freeagentcoder.svg). */
export function AgentCoderMark({ className = "w-4 h-4", mono = false, style }: { className?: string; mono?: boolean; style?: React.CSSProperties }) {
  // width/height are the fallback when no size class applies (e.g. "w-4.5",
  // which this Tailwind config doesn't define) — without them the SVG grows
  // to fill its container.
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} className={className} style={style} aria-hidden>
      <path fill={mono ? "currentColor" : ORANGE} fillRule="evenodd" d="M3 3h13v4H7v9H3zM21 21H8v-4h9V8h4zM10 10h4v4h-4z" />
    </svg>
  );
}

/** The logo in the current text colour — for icon slots on coloured fills. */
export function AgentCoderGlyph({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <AgentCoderMark className={className} style={style} mono />;
}

// The agent's run, played back on a loop: plan → write files → preview → test.
const STEPS = [
  { label: "Planned the site", meta: "3 files", mono: false },
  { label: "Wrote index.html", meta: "+48", mono: true },
  { label: "Wrote styles.css", meta: "+31", mono: true },
  { label: "Ran it · 0 errors", meta: "✓", mono: false },
];
const CYCLE = STEPS.length + 3; // steps, then preview, then a beat to read it

/**
 * A miniature of the FreeAgentCoder VS Code panel doing a real task, so the
 * card shows what the tool does instead of describing it. Static (final
 * frame) under reduced motion.
 */
export default function AgentCoderMock({ className = "" }: { className?: string }) {
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [tick, setTick] = useState(reduce ? CYCLE - 1 : 0);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setTick((n) => (n + 1) % CYCLE), 1100);
    return () => clearInterval(t);
  }, [reduce]);

  const done = Math.min(tick, STEPS.length);
  const showPreview = tick >= 2;
  const writing = tick < STEPS.length;

  return (
    <div className={`td-force-dark rounded-[22px] bg-[#141414] border border-white/10 text-white overflow-hidden shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)] ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <AgentCoderMark className="w-[18px] h-[18px]" />
        <span className="text-[14px] font-bold">FreeAgentCoder</span>
        <span className="ml-auto flex items-center gap-2.5 text-white/40"><Plus className="w-3.5 h-3.5" /><History className="w-3.5 h-3.5" /><Settings className="w-3.5 h-3.5" /></span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-end">
          <span className="bg-white/[0.08] border border-white/10 rounded-2xl px-3.5 py-2 text-[12.5px]">Build a portfolio website for me</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <AgentCoderMark className="w-3.5 h-3.5" />
          <span className="text-[12.5px] font-bold mr-1">FreeAgentCoder</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10.5px] flex items-center gap-1"><Hammer className="w-2.5 h-2.5" style={{ color: ORANGE }} /> Build</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10.5px] flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-amber-300" /> Deep</span>
        </div>

        <div className="space-y-1.5 min-h-[92px]">
          {STEPS.slice(0, done).map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-[12px] td-msg">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className={s.mono ? "font-mono font-semibold" : ""}>{s.label}</span>
              <span className={`ml-auto text-[11px] ${s.meta.startsWith("+") ? "text-emerald-400 font-mono" : "text-white/40"}`}>{s.meta}</span>
            </div>
          ))}
        </div>

        {/* live preview of what it built */}
        <div className={`rounded-xl bg-[#f4f4f5] overflow-hidden transition-all duration-500 ${showPreview ? "opacity-100 max-h-40" : "opacity-0 max-h-0"}`}>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-black/5">
            <span className="w-1.5 h-1.5 rounded-full bg-black/15" /><span className="w-1.5 h-1.5 rounded-full bg-black/15" /><span className="w-1.5 h-1.5 rounded-full bg-black/15" />
            <span className="text-[9px] font-mono text-black/40 ml-1">Preview · localhost:5173</span>
          </div>
          <div className="px-3 py-2.5 text-black">
            <div className="flex items-center justify-between text-[9px]"><b>alex.dev</b><span className="text-black/50">Work · About · Contact</span></div>
            <div className="flex items-center gap-2 mt-2.5">
              <span className="w-7 h-7 rounded-full bg-black/10" />
              <span className="text-[13px] font-extrabold text-black/70">Hi, I'm Alex.</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11.5px] text-white/60 border-t border-dashed border-white/10 pt-2.5">
          {writing ? (
            <><span className="w-3 h-3 rounded-full border-2 border-white/20 animate-spin" style={{ borderTopColor: ORANGE }} /> Writing the code…</>
          ) : (
            <><Check className="w-3.5 h-3.5 text-emerald-400" /> Done — your site is running</>
          )}
          <span className="ml-auto text-white/35">{Math.min(tick + 1, STEPS.length + 1)}s</span>
        </div>

        <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5">
          <p className="text-[11.5px] text-white/35">Type what to build. It really builds it.</p>
          <div className="flex items-center gap-2.5 mt-2 text-white/40 text-[10.5px]">
            <Paperclip className="w-3 h-3" /> <span>Auto</span> <span>Auto</span>
            <span className="ml-auto w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: ORANGE }}><ArrowUp className="w-3 h-3 text-white" /></span>
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-[10.5px] text-white/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Free keys · no credit card
        </p>
      </div>
    </div>
  );
}
