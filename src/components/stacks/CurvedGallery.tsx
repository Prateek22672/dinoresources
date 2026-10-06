import { useEffect, useRef } from "react";

export interface CurvedItem { title: string; sub?: string; from: string; to: string }

/**
 * Cards on the inside of a slowly turning cylinder — the centre card sits
 * flat and the edges swing toward you, so the row reads as a curved wall.
 * Drag (or swipe) to spin it; it settles back into its idle drift.
 * Positions are written straight to the DOM each frame — re-rendering two
 * dozen cards at 60fps through React would be the slow part, not the maths.
 */
export default function CurvedGallery({ items, onPick }: { items: CurvedItem[]; onPick?: (i: number) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const state = useRef({ angle: 0, vel: 0, dragging: false, lastX: 0, moved: 0 });

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const n = items.length;
    const step = 360 / n;
    let raf = 0;
    let R = 900, W = 190;

    const size = () => {
      const w = el.clientWidth;
      R = Math.max(420, w * 0.78);
      W = Math.round((2 * Math.PI * R) / n * 0.84);
      el.style.perspective = `${R * 1.15}px`;
      el.style.height = `${Math.round(W * 1.42 + 60)}px`;
      cards.current.forEach((c) => { if (c) { c.style.width = `${W}px`; c.style.height = `${Math.round(W * 1.32)}px`; c.style.marginLeft = `${-W / 2}px`; } });
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);

    const frame = () => {
      const s = state.current;
      if (!s.dragging) {
        // idle drift, with any flick velocity decaying into it
        s.vel *= 0.94;
        s.angle += s.vel + (reduce ? 0 : -0.035);
      }
      cards.current.forEach((c, i) => {
        if (!c) return;
        let t = ((i * step + s.angle) % 360 + 540) % 360 - 180;
        const off = Math.abs(t) > 64;
        c.style.transform = `translateZ(${R}px) rotateY(${t}deg) translateZ(${-R}px)`;
        c.style.opacity = off ? "0" : String(Math.min(1, (64 - Math.abs(t)) / 14));
        c.style.visibility = off ? "hidden" : "visible";
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [items.length]);

  return (
    <div
      ref={stage}
      className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none touch-pan-y"
      style={{ transformStyle: "preserve-3d" }}
      onPointerDown={(e) => { const s = state.current; s.dragging = true; s.lastX = e.clientX; s.moved = 0; s.vel = 0; (e.target as Element).setPointerCapture?.(e.pointerId); }}
      onPointerMove={(e) => {
        const s = state.current;
        if (!s.dragging) return;
        const dx = e.clientX - s.lastX;
        s.lastX = e.clientX;
        s.moved += Math.abs(dx);
        s.vel = dx * 0.06;
        s.angle += dx * 0.06;
      }}
      onPointerUp={() => { state.current.dragging = false; }}
      onPointerCancel={() => { state.current.dragging = false; }}
    >
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {items.map((it, i) => (
          <button
            key={i}
            ref={(c) => { cards.current[i] = c; }}
            onClick={() => { if (state.current.moved < 6) onPick?.(i); }}
            className="absolute left-1/2 top-[30px] rounded-[18px] overflow-hidden text-left will-change-transform"
            style={{
              background: `linear-gradient(180deg, ${it.from} 0%, ${it.to} 100%)`,
              boxShadow: "0 24px 50px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.18)",
              backfaceVisibility: "hidden",
            }}
          >
            <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.14), transparent 40%, rgba(0,0,0,0.28))" }} />
            <span className="absolute left-3 right-3 bottom-3">
              <span className="block text-white text-[13px] sm:text-sm font-bold leading-tight drop-shadow">{it.title}</span>
              {it.sub && <span className="block text-white/60 text-[10px] font-semibold mt-0.5">{it.sub}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
