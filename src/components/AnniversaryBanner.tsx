import { useState } from "react";
import { useTheme } from "next-themes";
import { X } from "lucide-react";
import dinoBlack from "@/assets/dinosaurBlack.png";
import dinoWhite from "@/assets/dinosaurWhite.png";

const DISMISS_KEY = "td-anniversary-dismissed-v2";

interface AnniversaryBannerProps {
  variant?: "full" | "slim";
  dismissible?: boolean;
  className?: string;
}

/**
 * "One year of TeamDino" — premium, editorial, monochrome with a single
 * restrained accent. No emoji, no clip-art.
 */
export default function AnniversaryBanner({
  variant = "full",
  dismissible = true,
  className = "",
}: AnniversaryBannerProps) {
  const { resolvedTheme } = useTheme();
  // card is white in dark mode (use black logo) and black in light mode (use white logo)
  const brandMark = resolvedTheme === "light" ? dinoWhite : dinoBlack;

  const [show, setShow] = useState(() => {
    if (!dismissible) return true;
    try { return localStorage.getItem(DISMISS_KEY) !== "1"; } catch { return true; }
  });
  if (!show) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <div
      className={`td-banner-bw relative overflow-hidden ${
        variant === "full" ? "rounded-[24px] p-6 sm:p-7" : "rounded-2xl px-5 py-3.5"
      } ${className}`}
    >
      {variant === "full" ? (
        <div className="flex items-start justify-between gap-4 relative">
          {/* decorative brand mark — black on the white card, white on the black card */}
          <img src={brandMark} alt="" aria-hidden
            className="hidden md:block absolute right-7 top-1/2 -translate-y-1/2 w-24 lg:w-28 opacity-90 pointer-events-none select-none" />

          <div className="min-w-0 relative z-10">
            <span className="td-bw-soft inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.25em] uppercase mb-3">
              <span className="w-6 h-px bg-current opacity-50" /> One year of TeamDino
            </span>
            <h3 className="font-semibold text-xl sm:text-[26px] leading-tight tracking-tight">
              Rebuilt, end&nbsp;to&nbsp;end.
            </h3>
            <p className="td-bw-soft text-sm mt-1.5 max-w-md leading-relaxed">
              A year in — a faster, cleaner way to find notes, prep for exams, and study with AI.
            </p>
          </div>
          {dismissible && (
            <button onClick={dismiss} aria-label="Dismiss"
              className="td-bw-chip shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 relative z-10">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="td-bw-soft text-[10px] font-semibold tracking-[0.25em] uppercase shrink-0 flex items-center gap-2">
            <span className="w-5 h-px bg-current opacity-50" /> One year
          </span>
          <p className="text-sm font-medium flex-1 min-w-0 truncate">
            The all-new TeamDino — rebuilt end to end.
          </p>
          {dismissible && (
            <button onClick={dismiss} aria-label="Dismiss"
              className="td-bw-chip shrink-0 w-7 h-7 rounded-full flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
