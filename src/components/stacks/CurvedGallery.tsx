import { useEffect, useRef } from "react";
import BookMock from "@/components/brand/BookMock";

export interface CurvedItem { title: string; sub?: string; cover: string; spine: string }

/**
 * Subject books on the inside of a slowly turning wall — the centre book
 * faces you, the ones at the edges swing toward you. Drag (or swipe) to spin.
 *
 * Each card fakes its place on the curve with its own transform
 * (`perspective()` inside the transform, x from sin, tilt from the angle),
 * so there is no shared 3D scene. The old version put every card on a real
 * preserve-3d cylinder inside an overflow-hidden stage — browsers flatten
 * that unpredictably — and toggled visibility per frame at the visible edge,
 * which is what made the edge cards blink. The edge fade is now a mask on
 * the stage, and cards are only hidden well outside it.
 */
export default function CurvedGallery({ items, onPick }: { items: CurvedItem[]; onPick?: (i: number) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const state = useRef({ angle: 0, vel: 0, dragging: false, lastX: 0, moved: 0, lastDrawn: NaN });

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const n = items.length;
    const step = 360 / n;
    let raf = 0;
    let R = 900, W = 190, H = 250;

    const size = () => {
      const w = el.clientWidth;
      R = Math.max(380, w * 0.62);
      W = Math.max(128, Math.min(230, Math.round(((2 * Math.PI * R) / n) * 0.82)));
      H = Math.round(W * (400 / 300));
      el.style.height = `${H + 90}px`;
      cards.current.forEach((c) => {
        if (!c) return;
        c.style.width = `${W}px`; c.style.height = `${H}px`;
        c.style.marginLeft = `${-W / 2}px`; c.style.marginTop = `${-H / 2}px`;
      });
      state.current.lastDrawn = NaN; // force a redraw at the new size
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);

    const draw = (angle: number) => {
      cards.current.forEach((c, i) => {
        if (!c) return;
        const t = ((i * step + angle) % 360 + 540) % 360 - 180; // -180..180, 0 = front
        const far = Math.abs(t) > 80;
        // hide only well outside the masked area, so nothing blinks in view
        if (far) { if (c.style.visibility !== "hidden") c.style.visibility = "hidden"; return; }
        if (c.style.visibility !== "visible") c.style.visibility = "visible";
        const rad = (t * Math.PI) / 180;
        const x = Math.sin(rad) * R;
        const lift = (1 - Math.cos(rad)) * 0.22;           // edges come toward you
        c.style.transform =
          `translate3d(${x.toFixed(1)}px,0,0) perspective(1200px) rotateY(${(-t * 0.85).toFixed(2)}deg) scale(${(1 + lift).toFixed(3)})`;
        c.style.zIndex = String(200 - Math.round(Math.abs(t)));
      });
    };

    const frame = () => {
      const s = state.current;
      if (!s.dragging) {
        s.vel *= 0.94;
        s.angle += s.vel + (reduce ? 0 : -0.03);
      }
      // nothing moved (reduced motion, idle) — skip the DOM writes
      if (s.angle !== s.lastDrawn) { draw(s.angle); s.lastDrawn = s.angle; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [items.length]);

  return (
    <div
      ref={stage}
      className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none touch-pan-y"
      style={{
        maskImage: "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)",
      }}
      onPointerDown={(e) => { const s = state.current; s.dragging = true; s.lastX = e.clientX; s.moved = 0; s.vel = 0; (e.target as Element).setPointerCapture?.(e.pointerId); }}
      onPointerMove={(e) => {
        const s = state.current;
        if (!s.dragging) return;
        const dx = e.clientX - s.lastX;
        s.lastX = e.clientX;
        s.moved += Math.abs(dx);
        s.vel = dx * 0.05;
        s.angle += dx * 0.05;
      }}
      onPointerUp={() => { state.current.dragging = false; }}
      onPointerCancel={() => { state.current.dragging = false; }}
    >
      {items.map((it, i) => (
        <button
          key={i}
          ref={(c) => { cards.current[i] = c; }}
          onClick={() => { if (state.current.moved < 6) onPick?.(i); }}
          className="absolute left-1/2 top-1/2 text-left will-change-transform"
          style={{ visibility: "hidden" }}
        >
          {/* the same book as the hero; its own drop-shadow is skipped — 24
              filtered SVGs moving every frame is the expensive part */}
          <span className="block w-full h-full" style={{ filter: "drop-shadow(0 24px 30px rgba(0,0,0,0.55))" }}>
            <BookMock cover={it.cover} spine={it.spine} title={it.title} sub={it.sub} shadow={false} />
          </span>
        </button>
      ))}
    </div>
  );
}
