import { useEffect, useRef, useState, CSSProperties, ReactNode } from "react";
import { gsap } from "gsap";

interface MenuItem {
  label: string;
  href: string;
  ariaLabel?: string;
  rotation?: number;
  hoverStyles?: { bgColor?: string; textColor?: string };
  onClick?: () => void;
}

interface BubbleMenuProps {
  logo?: ReactNode | string;
  onMenuClick?: (open: boolean) => void;
  className?: string;
  style?: CSSProperties;
  menuAriaLabel?: string;
  menuBg?: string;
  menuContentColor?: string;
  useFixedPosition?: boolean;
  items?: MenuItem[];
  animationEase?: string;
  animationDuration?: number;
  staggerDelay?: number;
}

export default function BubbleMenu({
  logo,
  onMenuClick,
  className,
  style,
  menuAriaLabel = "Toggle menu",
  menuBg = "#fff",
  menuContentColor = "#111",
  useFixedPosition = true,
  items = [],
  animationEase = "back.out(1.5)",
  animationDuration = 0.5,
  staggerDelay = 0.12,
}: BubbleMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const bubblesRef = useRef<HTMLAnchorElement[]>([]);
  const labelRefs = useRef<HTMLSpanElement[]>([]);

  const menuItems = items;

  const containerClassName = [
    "bubble-menu",
    useFixedPosition ? "fixed" : "absolute",
    "left-0 right-0 top-4 sm:top-6",
    "flex items-center justify-between gap-4 px-4 sm:px-8",
    "pointer-events-none z-[1001]",
    className,
  ].filter(Boolean).join(" ");

  const handleToggle = () => {
    const next = !isMenuOpen;
    if (next) setShowOverlay(true);
    setIsMenuOpen(next);
    onMenuClick?.(next);
  };

  useEffect(() => {
    const overlay = overlayRef.current;
    const bubbles = bubblesRef.current.filter(Boolean);
    const labels = labelRefs.current.filter(Boolean);
    if (!overlay || !bubbles.length) return;

    if (isMenuOpen) {
      gsap.set(overlay, { display: "flex" });
      gsap.killTweensOf([...bubbles, ...labels]);
      gsap.set(bubbles, { scale: 0, transformOrigin: "50% 50%" });
      gsap.set(labels, { y: 24, autoAlpha: 0 });
      bubbles.forEach((bubble, i) => {
        const delay = i * staggerDelay + gsap.utils.random(-0.05, 0.05);
        const tl = gsap.timeline({ delay });
        tl.to(bubble, { scale: 1, duration: animationDuration, ease: animationEase });
        if (labels[i]) tl.to(labels[i], { y: 0, autoAlpha: 1, duration: animationDuration, ease: "power3.out" }, "-=" + animationDuration * 0.9);
      });
    } else if (showOverlay) {
      gsap.killTweensOf([...bubbles, ...labels]);
      gsap.to(labels, { y: 24, autoAlpha: 0, duration: 0.2, ease: "power3.in" });
      gsap.to(bubbles, { scale: 0, duration: 0.2, ease: "power3.in", onComplete: () => { gsap.set(overlay, { display: "none" }); setShowOverlay(false); } });
    }
  }, [isMenuOpen, showOverlay, animationEase, animationDuration, staggerDelay]);

  return (
    <>
      <style>{`
        .bubble-menu .menu-line { transition: transform .3s ease, opacity .3s ease; transform-origin: center; }
        @media (min-width: 900px) {
          .bubble-menu-items .pill-link { transform: rotate(var(--item-rot)); }
          .bubble-menu-items .pill-link:hover { transform: rotate(var(--item-rot)) scale(1.06); background: var(--hover-bg) !important; color: var(--hover-color) !important; }
        }
        @media (max-width: 899px) {
          .bubble-menu-items { padding-top: 110px; align-items: flex-start; }
          .bubble-menu-items .pill-list { row-gap: 14px; }
          .bubble-menu-items .pill-col { flex: 0 0 100% !important; margin-left: 0 !important; }
          .bubble-menu-items .pill-link { font-size: clamp(1.5rem,5vw,2.5rem); padding: 1.2rem 0; min-height: 64px !important; }
        }
      `}</style>

      <nav className={containerClassName} style={style} aria-label="Main navigation">
        <div className="bubble logo-bubble inline-flex items-center justify-center rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.18)] pointer-events-auto h-12 md:h-14 px-4 md:px-6 gap-2"
          aria-label="Logo" style={{ background: menuBg, color: menuContentColor }}>
          <span className="inline-flex items-center justify-center gap-2">
            {typeof logo === "string" ? <img src={logo} alt="Logo" className="max-h-[55%] max-w-full object-contain block" /> : logo}
          </span>
        </div>

        <button type="button"
          className={`bubble toggle-bubble menu-btn ${isMenuOpen ? "open" : ""} inline-flex flex-col items-center justify-center rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.18)] pointer-events-auto w-12 h-12 md:w-14 md:h-14 border-0 cursor-pointer p-0`}
          onClick={handleToggle} aria-label={menuAriaLabel} aria-pressed={isMenuOpen} style={{ background: menuBg }}>
          <span className="menu-line block mx-auto rounded-[2px]" style={{ width: 26, height: 2, background: menuContentColor, transform: isMenuOpen ? "translateY(4px) rotate(45deg)" : "none" }} />
          <span className="menu-line short block mx-auto rounded-[2px]" style={{ marginTop: 6, width: 26, height: 2, background: menuContentColor, transform: isMenuOpen ? "translateY(-4px) rotate(-45deg)" : "none" }} />
        </button>
      </nav>

      {showOverlay && (
        <div ref={overlayRef}
          className={`bubble-menu-items ${useFixedPosition ? "fixed" : "absolute"} inset-0 flex items-center justify-center pointer-events-none z-[1000]`}
          style={{ background: "rgba(8,8,10,0.72)", backdropFilter: "blur(8px)" }}
          aria-hidden={!isMenuOpen}>
          <ul className="pill-list list-none m-0 px-6 w-full max-w-[1100px] mx-auto flex flex-wrap gap-x-3 gap-y-3 pointer-events-auto" role="menu">
            {menuItems.map((item, idx) => (
              <li key={idx} role="none" className="pill-col flex justify-center items-stretch [flex:0_0_calc(50%-0.5rem)] box-border">
                <a role="menuitem" href={item.href} aria-label={item.ariaLabel || item.label}
                  onClick={(e) => { if (item.onClick) { e.preventDefault(); item.onClick(); setIsMenuOpen(false); } }}
                  className="pill-link w-full rounded-[999px] no-underline shadow-[0_4px_14px_rgba(0,0,0,0.10)] flex items-center justify-center relative transition-[background,color] duration-300 box-border whitespace-nowrap overflow-hidden font-semibold"
                  style={{
                    ["--item-rot" as any]: `${item.rotation ?? 0}deg`,
                    ["--hover-bg" as any]: item.hoverStyles?.bgColor || "#f3f4f6",
                    ["--hover-color" as any]: item.hoverStyles?.textColor || menuContentColor,
                    background: menuBg, color: menuContentColor,
                    minHeight: 88, padding: "clamp(1rem,2vw,2rem) 0", fontSize: "clamp(1.2rem,2.5vw,2rem)",
                  }}
                  ref={(el) => { if (el) bubblesRef.current[idx] = el; }}>
                  <span className="pill-label inline-block" style={{ willChange: "transform,opacity" }}
                    ref={(el) => { if (el) labelRefs.current[idx] = el; }}>
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
