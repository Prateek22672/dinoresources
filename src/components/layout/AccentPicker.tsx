import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Palette, Check, Sun, Moon } from "lucide-react";
import { ACCENTS, useAccent } from "@/hooks/useAccent";

/** Single header control for appearance: light/dark theme + accent color. */
export default function AccentPicker() {
  const { accent, setAccent } = useAccent();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const isDark = theme !== "light";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full td-btn-ghost flex items-center justify-center"
        aria-label="Appearance"
        title="Appearance"
      >
        <Palette className="w-4 h-4" style={{ color: "var(--td-accent-soft)" }} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 td-glass border border-white/10 rounded-2xl p-3.5 w-52 shadow-2xl td-in">
          {/* Theme */}
          <p className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 px-1 mb-2">Theme</p>
          <div className="grid grid-cols-2 gap-1 p-1 rounded-full td-surface-2 mb-4">
            <button
              onClick={() => setTheme("light")}
              className={`h-8 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${!isDark ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
            >
              <Sun className="w-3.5 h-3.5" /> Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`h-8 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${isDark ? "bg-white text-black" : "text-zinc-500 hover:text-black dark:hover:text-white"}`}
            >
              <Moon className="w-3.5 h-3.5" /> Dark
            </button>
          </div>

          {/* Accent */}
          <p className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 px-1 mb-2">Accent color</p>
          <div className="grid grid-cols-5 gap-2 px-1 pb-1">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAccent(a.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ background: a.color, boxShadow: accent === a.id ? `0 0 0 2px var(--td-accent), 0 0 0 4px rgba(255,255,255,0.15)` : undefined }}
                aria-label={a.label}
                title={a.label}
              >
                {accent === a.id && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
