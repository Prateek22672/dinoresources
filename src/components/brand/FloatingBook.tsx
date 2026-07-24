import { useEffect, useRef } from "react";
import dinoBlack from "@/assets/dinosaurBlack.png";

/**
 * A tilted SVG hardcover "subject book" — the same visual language as the
 * landing hero. Idle-floats and drifts toward the cursor. Purely decorative.
 */
export default function FloatingBook({
  cover = "#1E2B7A",
  spine = "#E0559B",
  title = "DBMS",
  rot = 10,
  float = 1,
  className = "",
}: {
  cover?: string;
  spine?: string;
  title?: string;
  rot?: number;
  float?: 1 | 2;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // subtle cursor drift (disabled for reduced-motion + touch)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx;
        const dy = (e.clientY - cy) / cy;
        el.style.transform = `translate(${dx * 14}px, ${dy * 10}px)`;
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      <div style={{ transform: `rotate(${rot}deg)`, animation: `ld-float${float} ${float === 1 ? 5.4 : 6.6}s ease-in-out infinite` }}>
        <svg viewBox="0 0 300 400" className="w-full h-auto" style={{ filter: "drop-shadow(0 35px 40px rgba(0,0,0,0.4))" }} aria-hidden>
          <rect x="24" y="10" width="270" height="384" rx="14" fill="#F4EFE3" />
          <g stroke="#DCD3BC" strokeWidth="2"><line x1="284" y1="22" x2="284" y2="382" /><line x1="289" y1="28" x2="289" y2="376" /></g>
          <g stroke="#DCD3BC" strokeWidth="2"><line x1="40" y1="388" x2="270" y2="388" /></g>
          <rect x="6" y="0" width="274" height="382" rx="16" fill={cover} />
          <rect x="262" y="4" width="18" height="374" rx="9" fill="rgba(0,0,0,0.14)" />
          <path d="M6 16 A16 16 0 0 1 22 0 H52 V382 H22 A16 16 0 0 1 6 366 Z" fill={spine} />
          <rect x="52" y="0" width="9" height="382" fill="rgba(0,0,0,0.16)" />
          <rect x="66" y="10" width="4" height="362" rx="2" fill="rgba(255,255,255,0.55)" />
          <circle cx="234" cy="48" r="26" fill="#ffffff" />
          <image href={dinoBlack} x="218" y="32" width="32" height="32" />
          <text x="86" y="316" fill="#ffffff" fontWeight="800" fontSize="44" fontFamily="'Baloo 2', sans-serif">{title}</text>
          <text x="86" y="344" fill="rgba(255,255,255,0.75)" fontWeight="700" fontSize="14" fontFamily="Inter, sans-serif">5 units · PYQs · AI</text>
        </svg>
      </div>
    </div>
  );
}
