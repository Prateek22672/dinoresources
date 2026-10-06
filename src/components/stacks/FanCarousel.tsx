import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

/**
 * A hand of cards fanned along an arc. Every card pivots around one point far
 * below the row, so neighbours swing out and drop slightly — a real fan, not
 * a sideways slide. The front card is the only live one; tapping a side card
 * brings it forward.
 *
 * It advances on its own every `interval` ms, and the active dot fills as a
 * timer so the movement is never a surprise. It holds still while the pointer
 * is over it, while anything inside has focus, while the tab is hidden, after
 * a manual move (for one full interval), when reduced motion is requested,
 * or when paused with the button.
 */
export default function FanCarousel({
  count,
  renderCard,
  label,
  cardW = 268,
  cardH = 268,
  initial = 0,
  interval = 4500,
}: {
  count: number;
  renderCard: (i: number, active: boolean) => ReactNode;
  label?: ReactNode;
  cardW?: number;
  cardH?: number;
  initial?: number;
  interval?: number;
}) {
  const [active, setActive] = useState(Math.min(initial, Math.max(0, count - 1)));
  const [narrow, setNarrow] = useState(false);
  const [hover, setHover] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tick, setTick] = useState(0); // restarts the timer after a manual move
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 640));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => { ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const running = !reduce && !paused && !hover && !focusIn && visible && count > 1;

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % count), interval);
    return () => clearTimeout(t);
  }, [running, active, tick, count, interval]);

  const goTo = useCallback((i: number) => { setActive(((i % count) + count) % count); setTick((t) => t + 1); }, [count]);
  const go = useCallback((d: number) => { setActive((a) => (a + d + count) % count); setTick((t) => t + 1); }, [count]);

  // A shallow, mostly horizontal fan: neighbours slide out sideways with a
  // slight tilt and dip, rather than swinging round a pivot (the old arc
  // curled the outer cards down into the next section). On a phone the step
  // tightens so neighbours stay as slivers at the edges.
  const w = narrow ? Math.round(cardW * 0.84) : cardW;
  const h = narrow ? Math.round(cardH * 0.84) : cardH;
  const step = narrow ? 64 : Math.round(cardW * 0.62);
  const tilt = narrow ? 2.5 : 3;

  return (
    <div
      ref={wrap}
      className="relative"
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setHover(true); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") setHover(false); }}
      onFocus={() => setFocusIn(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusIn(false); }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      }}
    >
      <div className="flex items-center justify-between mb-3 px-0.5">
        {label}
        <div className="flex items-center gap-1.5">
          {!reduce && (
            <button onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play" : "Pause"}
              className="w-8 h-8 rounded-full td-surface-2 hover:bg-white/10 flex items-center justify-center text-zinc-300 transition-colors">
              {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          )}
          <button onClick={() => go(-1)} aria-label="Previous"
            className="w-8 h-8 rounded-full td-surface-2 hover:bg-white/10 flex items-center justify-center text-zinc-300 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => go(1)} aria-label="Next"
            className="w-8 h-8 rounded-full td-surface-2 hover:bg-white/10 flex items-center justify-center text-zinc-300 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* clip sideways only — the arc may hang a little below the row */}
      <div
        className="relative select-none touch-pan-y overflow-x-clip"
        style={{ height: h + 56 }}
        onPointerDown={(e) => { drag.current = { x: e.clientX, moved: false }; }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || d.moved) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 40) { d.moved = true; go(dx < 0 ? 1 : -1); }
        }}
        onPointerUp={() => { setTimeout(() => { drag.current = null; }, 0); }}
        onPointerCancel={() => { drag.current = null; }}
        onClickCapture={(e) => { if (drag.current?.moved) { e.stopPropagation(); e.preventDefault(); } }}
      >
        {Array.from({ length: count }).map((_, i) => {
          // shortest signed distance around the ring, so the hand wraps
          let off = i - active;
          if (off > count / 2) off -= count;
          if (off < -count / 2) off += count;
          const abs = Math.abs(off);
          const hidden = abs > 3;
          const on = off === 0;
          return (
            <div
              key={i}
              aria-hidden={!on}
              className="absolute left-1/2 top-3 will-change-transform"
              style={{
                width: w,
                height: h,
                marginLeft: -w / 2,
                transformOrigin: "50% 100%",
                transform: `translateX(${off * step}px) translateY(${abs * 10}px) rotate(${off * tilt}deg) scale(${on ? 1 : 1 - Math.min(abs, 3) * 0.08})`,
                zIndex: 50 - abs,
                opacity: hidden ? 0 : 1 - abs * 0.12,
                pointerEvents: hidden ? "none" : "auto",
                transition: "transform .8s cubic-bezier(.16,1,.3,1), opacity .6s ease, filter .6s ease",
                filter: on ? "none" : `brightness(${1 - abs * 0.1})`,
              }}
            >
              {renderCard(i, on)}
              {/* side cards: the whole card is one target that brings it forward */}
              {!on && (
                <button
                  tabIndex={-1}
                  onClick={() => goTo(i)}
                  className="absolute inset-0 z-20 rounded-[26px] cursor-pointer"
                  aria-label="Bring forward"
                />
              )}
            </div>
          );
        })}

        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Card ${i + 1}`}
              className="relative h-6 flex items-center"
            >
              <span className="relative h-1.5 rounded-full overflow-hidden transition-[width] duration-300 block"
                style={{ width: i === active ? 26 : 6, background: "rgb(127 127 127 / 0.35)" }}>
              {i === active && (
                <span
                  // keyed on active+tick so the fill restarts each step
                  key={`${active}-${tick}`}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: "var(--td-accent)",
                    width: running ? "0%" : "100%",
                    animation: running ? `td-fan-fill ${interval}ms linear forwards` : undefined,
                  }}
                />
              )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
