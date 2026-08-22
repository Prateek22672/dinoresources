import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, GripVertical } from "lucide-react";
import TutorOrb from "./TutorOrb";
import type { TutorMode, TutorNudge } from "./shared";

const POS_KEY = "td:tutor-pill";
const EDGE = 10;

interface Point { x: number; y: number }

/**
 * The floating "Ask Rex" pill, and the little offers Rex makes from it.
 *
 * Draggable because it is the one element that sits permanently over the
 * student's reading — wherever it defaults to, it will be covering something
 * for somebody. Its position is remembered across pages and sessions.
 *
 * Portalled to <body>: this renders from inside <main class="td-page">, whose
 * animated transform would otherwise make it the containing block for a fixed
 * child and pin the pill to the page instead of the viewport.
 */
export default function TutorLauncher({
  nudge, onOpen, onDismissNudge,
}: {
  nudge: TutorNudge | null;
  onOpen: (mode: TutorMode, seed?: string) => void;
  onDismissNudge: () => void;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);

  /** Keep the pill fully on screen whatever the window does. */
  const clamp = useCallback((p: Point): Point => {
    const r = elRef.current?.getBoundingClientRect();
    const w = r?.width || 140;
    const h = r?.height || 46;
    return {
      x: Math.min(Math.max(p.x, EDGE), Math.max(EDGE, window.innerWidth - w - EDGE)),
      y: Math.min(Math.max(p.y, EDGE), Math.max(EDGE, window.innerHeight - h - EDGE)),
    };
  }, []);

  // Restore where they left it, else park it bottom-right.
  useEffect(() => {
    let start: Point | null = null;
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.x === "number" && typeof p?.y === "number") start = p;
      }
    } catch { /* corrupt entry — fall back to the default corner */ }
    setPos(clamp(start ?? { x: window.innerWidth - 160, y: window.innerHeight - 76 }));
  }, [clamp]);

  // A resize or an orientation change can strand it off-screen.
  useEffect(() => {
    const onResize = () => setPos((p) => (p ? clamp(p) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  const onPointerDown = (e: React.PointerEvent) => {
    const r = elRef.current?.getBoundingClientRect();
    if (!r) return;
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false };
    elRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const next = { x: e.clientX - d.dx, y: e.clientY - d.dy };
    // A few pixels of slop, so a slightly shaky tap still counts as a tap.
    if (!d.moved && (Math.abs(e.movementX) + Math.abs(e.movementY) > 0)) {
      const r = elRef.current?.getBoundingClientRect();
      if (r && (Math.abs(next.x - r.left) > 4 || Math.abs(next.y - r.top) > 4)) {
        d.moved = true;
        setDragging(true);
      }
    }
    if (d.moved) setPos(clamp(next));
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    elRef.current?.releasePointerCapture?.(e.pointerId);
    setDragging(false);
    if (!d) return;
    if (!d.moved) { onOpen("chat"); return; }
    try { if (pos) localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch { /* quota */ }
  };

  if (!pos) return null;

  // The bubble opens away from whichever edge the pill is parked against.
  const above = pos.y > window.innerHeight / 2;
  const alignRight = pos.x > window.innerWidth / 2;

  return createPortal(
    <div
      ref={elRef}
      className="fixed z-[80]"
      style={{ left: pos.x, top: pos.y, touchAction: "none" }}
    >
      {nudge && !dragging && (
        <div
          className="td-pop absolute w-[min(17rem,calc(100vw-2rem))]"
          style={{
            [above ? "bottom" : "top"]: "calc(100% + 10px)",
            [alignRight ? "right" : "left"]: 0,
          } as React.CSSProperties}
        >
          <div className="td-glass rounded-2xl p-3.5 shadow-[0_20px_50px_-14px_rgba(0,0,0,0.65)] border border-white/10">
            <div className="flex items-start gap-2.5">
              <TutorOrb size={22} />
              <p className="text-[13px] text-zinc-200 leading-snug flex-1 pt-0.5">{nudge.text}</p>
              <button
                onClick={onDismissNudge}
                className="w-6 h-6 rounded-full td-btn-ghost flex items-center justify-center shrink-0"
                aria-label="Not now"
                title="Not now — I'll stay quiet for a while"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {nudge.actions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => { onDismissNudge(); onOpen(a.mode ?? "chat", a.seed); }}
                  className="td-btn-ghost px-3 py-1.5 rounded-full text-[11.5px] font-semibold"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen("chat"); } }}
        aria-label="Ask Rex, your study tutor. Drag to move."
        title="Click to ask Rex · drag to move"
        className={`td-glass rounded-full pl-2 pr-3.5 py-2 flex items-center gap-2 select-none shadow-[0_18px_45px_-12px_rgba(0,0,0,0.6)] group ${
          dragging ? "cursor-grabbing scale-[1.06]" : "cursor-grab hover:scale-[1.04]"
        } transition-transform`}
      >
        <TutorOrb size={30} busy={!!nudge && !dragging} />
        <span className="text-[13px] font-bold text-white whitespace-nowrap">Ask Rex</span>
        <GripVertical className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors -mr-1" />
      </div>
    </div>,
    document.body,
  );
}
