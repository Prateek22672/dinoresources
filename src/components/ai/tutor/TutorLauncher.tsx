import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import TutorOrb from "./TutorOrb";
import type { TutorMode, TutorNudge } from "./shared";

const DOCK_KEY = "td:tutor-dock";
const EDGE = 12;
/**
 * The collapsed tab sits fully on screen, flush to the edge margin. Hiding part
 * of it off-screen was tried and looked broken rather than tucked: against a
 * translucent surface a clipped control reads as a rendering fault, and the
 * remaining sliver was too small to hit — especially beside a scrollbar.
 */
const COLLAPSED_SIZE = 46;

type Side = "left" | "right";
interface Dock { y: number; side: Side; collapsed: boolean }
interface Point { x: number; y: number }

const DEFAULT_DOCK: Dock = { y: 0, side: "right", collapsed: false };

/**
 * The floating "Ask Rex" launcher, and the little offers Rex makes from it.
 *
 * Docks to whichever side edge it is dragged nearest, rather than floating
 * anywhere — a free-floating pill inevitably sits over the text somebody is
 * reading, and on a phone there is no safe place to leave it. Collapsing tucks
 * it into the edge as a half-hidden tab, so it is reachable without covering
 * the page. Position and collapsed state persist across pages and sessions.
 *
 * Portalled to <body>: this renders from inside <main class="td-page">, whose
 * animated transform would otherwise make it the containing block for a fixed
 * child and pin the launcher to the page instead of the viewport.
 */
export default function TutorLauncher({
  nudge, onOpen, onDismissNudge,
}: {
  nudge: TutorNudge | null;
  onOpen: (mode: TutorMode, seed?: string) => void;
  onDismissNudge: () => void;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [dock, setDock] = useState<Dock | null>(null);
  /** Free position while a drag is in progress; null when docked. */
  const [dragPos, setDragPos] = useState<Point | null>(null);
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);

  const clampY = useCallback((y: number) => {
    const h = elRef.current?.getBoundingClientRect().height || 46;
    return Math.min(Math.max(y, EDGE), Math.max(EDGE, window.innerHeight - h - EDGE));
  }, []);

  // Restore where they left it, else park it against the right edge, low down.
  useEffect(() => {
    let saved: Partial<Dock> | null = null;
    try {
      const raw = localStorage.getItem(DOCK_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch { /* corrupt entry — fall back to the default */ }
    setDock({
      y: typeof saved?.y === "number" ? clampY(saved.y) : Math.round(window.innerHeight * 0.72),
      side: saved?.side === "left" ? "left" : DEFAULT_DOCK.side,
      collapsed: !!saved?.collapsed,
    });
  }, [clampY]);

  // A resize or orientation change can strand it off-screen.
  useEffect(() => {
    const onResize = () => setDock((d) => (d ? { ...d, y: clampY(d.y) } : d));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampY]);

  const persist = (d: Dock) => {
    try { localStorage.setItem(DOCK_KEY, JSON.stringify(d)); } catch { /* quota */ }
  };

  const update = (patch: Partial<Dock>) => {
    setDock((d) => {
      if (!d) return d;
      const next = { ...d, ...patch };
      persist(next);
      return next;
    });
  };

  // ── Dragging ────────────────────────────────────────────────────────
  // Capture is taken on the element that carries the handlers. Capturing on a
  // parent instead redirects every subsequent pointer event to that parent, so
  // pointerup never reaches the child listening for it and the drag never ends.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const r = elRef.current?.getBoundingClientRect();
    if (!r) return;
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const next = { x: e.clientX - d.dx, y: e.clientY - d.dy };
    if (!d.moved) {
      const r = elRef.current?.getBoundingClientRect();
      // A few pixels of slop, so a slightly shaky tap still counts as a tap.
      if (r && (Math.abs(next.x - r.left) > 5 || Math.abs(next.y - r.top) > 5)) d.moved = true;
    }
    if (d.moved) setDragPos(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    // Release defensively — a pointer that was never captured throws otherwise.
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* not captured */ }

    const dropped = dragPos;
    setDragPos(null);
    if (!d) return;

    if (!d.moved) {
      // A tap: expand if tucked away, otherwise open the tutor.
      if (dock?.collapsed) update({ collapsed: false });
      else onOpen("chat");
      return;
    }
    if (!dropped) return;

    // Snap to whichever side edge the centre ended up nearest.
    const w = elRef.current?.getBoundingClientRect().width || 140;
    const side: Side = dropped.x + w / 2 < window.innerWidth / 2 ? "left" : "right";
    update({ side, y: clampY(dropped.y) });
  };

  if (!dock) return null;

  const dragging = dragPos !== null;
  const { side, collapsed } = dock;

  const style: React.CSSProperties = dragging
    ? { left: dragPos.x, top: dragPos.y }
    : side === "left"
      ? { left: EDGE, top: dock.y }
      : { right: EDGE, top: dock.y };

  // The bubble opens away from whichever edge the launcher is parked against.
  const above = dock.y > window.innerHeight / 2;

  return createPortal(
    <div
      ref={elRef}
      className={`td-portal fixed z-[80] ${dragging ? "" : "transition-[left,right,top] duration-300 ease-out"}`}
      style={{ ...style, touchAction: "none" }}
    >
      {nudge && !dragging && !collapsed && (
        <div
          className="td-pop absolute w-[min(17rem,calc(100vw-2rem))]"
          style={{
            [above ? "bottom" : "top"]: "calc(100% + 10px)",
            [side === "right" ? "right" : "left"]: 0,
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

      {collapsed && !dragging ? (
        /* Tucked into the edge — a half-hidden tab that slides out on hover. */
        <div
          role="button"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); update({ collapsed: false }); } }}
          aria-label="Show Ask Rex"
          title="Show Rex"
          /* td-surface, not td-glass: a translucent circle over arbitrary page
             content has no readable silhouette. A solid surface with a hairline
             border reads as a deliberate control at any scroll position. */
          className="td-surface rounded-full flex items-center justify-center select-none cursor-pointer
            shadow-[0_10px_30px_-8px_rgba(0,0,0,0.8)] transition-transform duration-200 hover:scale-110"
          style={{ width: COLLAPSED_SIZE, height: COLLAPSED_SIZE }}
        >
          <TutorOrb size={28} busy={!!nudge} />
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {side === "left" && !dragging && (
            <CollapseButton side={side} onClick={() => update({ collapsed: true })} order={2} />
          )}
          <div
            role="button"
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen("chat"); } }}
            aria-label="Ask Rex, your study tutor. Drag to move to either edge."
            title="Click to ask Rex · drag to either edge"
            className={`td-glass rounded-full pl-2 pr-3.5 py-2 flex items-center gap-2 select-none
              shadow-[0_18px_45px_-12px_rgba(0,0,0,0.6)] transition-transform ${
              dragging ? "cursor-grabbing scale-[1.06]" : "cursor-grab hover:scale-[1.04]"
            }`}
          >
            <TutorOrb size={30} busy={!!nudge && !dragging} />
            <span className="text-[13px] font-bold text-white whitespace-nowrap">Ask Rex</span>
          </div>
          {side === "right" && !dragging && (
            <CollapseButton side={side} onClick={() => update({ collapsed: true })} order={1} />
          )}
        </div>
      )}
    </div>,
    document.body,
  );
}

/** Tucks the launcher into the edge. Kept out of the drag handler's element so
 *  a click here can never be mistaken for the start of a drag. */
function CollapseButton({ side, onClick, order }: { side: Side; onClick: () => void; order: number }) {
  const Icon = side === "right" ? ChevronRight : ChevronLeft;
  return (
    <button
      onClick={onClick}
      style={{ order }}
      aria-label="Tuck Rex into the edge"
      title="Tuck away"
      className="td-glass w-6 h-6 rounded-full flex items-center justify-center shrink-0
        text-zinc-400 hover:text-white transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
