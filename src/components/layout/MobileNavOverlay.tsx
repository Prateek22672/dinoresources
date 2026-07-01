import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { X } from "lucide-react";
import dinoLogo from "@/assets/dinosaurWhite.png";

export interface MobileNavItem {
  label: string;
  icon: any;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}

/** Full-screen bubble/pill menu for mobile (same language as the landing menu). */
export default function MobileNavOverlay({
  open, onClose, items,
}: { open: boolean; onClose: () => void; items: MobileNavItem[] }) {
  const pillsRef = useRef<HTMLButtonElement[]>([]);

  useEffect(() => {
    if (!open) return;
    const pills = pillsRef.current.filter(Boolean);
    gsap.killTweensOf(pills);
    gsap.fromTo(
      pills,
      { scale: 0, autoAlpha: 0, y: 12 },
      { scale: 1, autoAlpha: 1, y: 0, duration: 0.5, ease: "back.out(1.5)", stagger: 0.06 },
    );
  }, [open]);

  // lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="lg:hidden fixed inset-0 z-[70] flex flex-col"
      style={{ background: "rgba(8,8,10,0.86)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-4 h-16 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
            <img src={dinoLogo} alt="" className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-white">TeamDino</span>
        </div>
        <button onClick={onClose} aria-label="Close menu"
          className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* pills */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-10 flex flex-wrap gap-3 content-start">
        {items.map((it, i) => (
          <button
            key={it.label}
            ref={(el) => { if (el) pillsRef.current[i] = el; }}
            onClick={() => { it.onClick(); onClose(); }}
            className={`flex-[0_0_calc(50%-0.375rem)] rounded-[26px] min-h-[76px] px-4 flex flex-col items-center justify-center gap-1.5 font-semibold shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition-transform active:scale-95 ${
              it.danger
                ? "bg-red-500 text-white"
                : it.active
                  ? "td-accent-solid text-white"
                  : "bg-white text-black"
            }`}
          >
            <it.icon className="w-5 h-5" strokeWidth={1.9} />
            <span className="text-sm">{it.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
