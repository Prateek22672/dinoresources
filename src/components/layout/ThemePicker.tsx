import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { Sun, Moon, Check, X } from "lucide-react";
import { ACCENTS, useAccent } from "@/hooks/useAccent";
import { useOnboardingSlot } from "@/lib/onboarding";

/** Bumping this re-shows the popup to everyone — use it only when the
 *  appearance options genuinely change, not for unrelated announcements. */
const VERSION = 1;
const SEEN_KEY = "td:theme-picker-seen";

/**
 * One-time appearance popup.
 *
 * The app shipped light-first in this release, and the theme + accent controls
 * live behind a small palette icon in the header that most people never opened
 * — so the choice effectively did not exist for them. This surfaces it once,
 * with a live preview, then never again.
 *
 * It deliberately does NOT change anything on open: whatever the student is
 * already looking at stays until they pick. Someone who has previously chosen
 * dark keeps dark, and this just tells them the switch is there.
 */
export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const [ready, setReady] = useState(false);
  // Waits for the tour. Both used to fire at 1200ms and landed on top of
  // each other, which is what made the first login feel broken.
  const show = useOnboardingSlot("theme", ready);

  useEffect(() => {
    let seen = 0;
    try { seen = parseInt(localStorage.getItem(SEEN_KEY) || "0", 10) || 0; } catch { /* private mode */ }
    if (seen >= VERSION) return;
    // Let the page paint first — a modal that beats the content on screen
    // reads as an interstitial rather than a helpful heads-up.
    const t = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setReady(false);
    try { localStorage.setItem(SEEN_KEY, String(VERSION)); } catch { /* private mode */ }
  };

  if (!show) return null;

  const isDark = theme === "dark";

  return createPortal(
    <div className="td-portal fixed inset-0 z-[125] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

      <div className="td-surface relative w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl td-in">
        {/* head */}
        <div className="relative p-6 pb-5 overflow-hidden">
          <div aria-hidden className="absolute -top-16 -right-10 w-52 h-44 opacity-50 pointer-events-none"
            style={{ background: "rgb(var(--td-accent-rgb) / 0.28)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(6px)" }} />
          <button
            onClick={dismiss}
            className="td-btn-ghost absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative z-[1]">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase td-accent-text">Make it yours</p>
            <h2 className="text-white font-bold text-xl mt-1.5 leading-tight">TeamDino has a light theme now</h2>
            <p className="text-zinc-400 text-[13px] mt-2 leading-relaxed">
              We've switched to light by default — it reads better in daylight and on projectors. Prefer dark? Switch it back here, any time.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* theme */}
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-zinc-500 mb-2">Theme</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "light", label: "Light", icon: Sun, note: "Clean and bright" },
                { id: "dark", label: "Dark", icon: Moon, note: "Easy at night" },
              ] as const).map((t) => {
                const on = t.id === "dark" ? isDark : !isDark;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`rounded-2xl p-3.5 text-left transition-colors ${on ? "td-card-accent" : "td-surface-2 hover:border-white/20"}`}
                  >
                    <span className="flex items-center gap-2">
                      <t.icon className="w-4 h-4 td-accent-text" />
                      <span className="text-white text-[13px] font-bold">{t.label}</span>
                      {on && <Check className="w-3.5 h-3.5 td-accent-text ml-auto" />}
                    </span>
                    <span className="block text-zinc-500 text-[11px] mt-1">{t.note}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* accent — solid swatches, matching the design system's no-gradient rule */}
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-zinc-500 mb-2">Accent colour</p>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccent(a.id)}
                  title={a.label}
                  aria-label={a.label}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                    accent === a.id ? "ring-2 ring-offset-2 ring-offset-transparent" : ""
                  }`}
                  style={{ background: a.color, boxShadow: accent === a.id ? `0 0 0 2px ${a.color}` : undefined }}
                >
                  {accent === a.id && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
            <p className="text-zinc-600 text-[11px] mt-2">
              Changes apply instantly — this popup is previewing them live.
            </p>
          </div>

          <button onClick={dismiss} className="td-btn-primary w-full py-3 rounded-full text-sm font-bold">
            Looks good
          </button>
          <p className="text-center text-zinc-600 text-[11px] -mt-2">
            You can change this any time from the palette icon in the header.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
