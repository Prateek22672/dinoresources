import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Bot, TrendingUp, CalendarDays, Palette, Bug, ArrowRight, ArrowLeft, X, Check,
} from "lucide-react";
import dinoLogo from "@/assets/dinosaurWhite.png";

const DONE_KEY = "td:tour-v1";

interface Step {
  icon: any;
  tint: string;
  eyebrow: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: Sparkles, tint: "var(--td-accent)", eyebrow: "#TheNewTeamDino",
    title: "Welcome to the new TeamDino 🦖",
    body: "We've added a lot — an AI assistant, an exam-readiness score, themes and more. Here's a 30-second tour of what's new.",
  },
  {
    icon: Bot, tint: "#5b8def", eyebrow: "Your AI helper",
    title: "Meet DinoBot",
    body: "Ask it anything — how to buy, where a subject is, why something's locked. It can even change your theme, add to your cart, and raise a ticket for you. Find it at ⚡ Instant Help in the header.",
  },
  {
    icon: TrendingUp, tint: "#34d399", eyebrow: "Know where you stand",
    title: "Exam readiness score",
    body: "As you open units, Q&A and PYQs, your readiness rises. The dashboard shows how ready you are for each subject — tied to your exam countdown.",
  },
  {
    icon: CalendarDays, tint: "#f59e0b", eyebrow: "Never miss a date",
    title: "Exam countdown",
    body: "Mark your exam dates on the dashboard calendar and we'll count down the days for you — colour-coded as they get close.",
  },
  {
    icon: Palette, tint: "#a78bfa", eyebrow: "Make it yours",
    title: "Themes & more",
    body: "Recolour the whole app from the palette icon, switch light/dark, and collapse the side rail for more room. Small touches, big comfort.",
  },
  {
    icon: Bug, tint: "#f472b6", eyebrow: "Help us improve",
    title: "Spotted a bug? Tell us",
    body: "Use 'Report an issue' in the left rail (or inside DinoBot). Your report reaches the team and you can track its status.",
  },
];

/** First-run welcome carousel. Shows once per user (localStorage), skippable,
 *  and re-openable from the What's-New page. */
export default function FeatureTour() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    let done = false;
    try { done = localStorage.getItem(DONE_KEY) === "1"; } catch { /* ignore */ }
    if (!done) {
      const t = setTimeout(() => setOpen(true), 1200); // let the dashboard settle first
      return () => clearTimeout(t);
    }
  }, []);

  // allow re-opening from elsewhere
  useEffect(() => {
    const openIt = () => { setI(0); setOpen(true); };
    window.addEventListener("td:open-tour", openIt);
    return () => window.removeEventListener("td:open-tour", openIt);
  }, []);

  const finish = () => {
    setOpen(false);
    try { localStorage.setItem(DONE_KEY, "1"); } catch { /* ignore */ }
  };

  if (!open) return null;
  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  const Icon = step.icon;

  return createPortal(
    <div className="td-portal fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={finish} />
      <div className="td-surface relative w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl">
        {/* header band */}
        <div className="relative p-6 pb-5 overflow-hidden">
          <div aria-hidden className="absolute -top-16 -right-10 w-52 h-44 opacity-50 pointer-events-none"
            style={{ background: `${step.tint === "var(--td-accent)" ? "rgb(var(--td-accent-rgb) / 0.28)" : step.tint + "40"}`, borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(6px)" }} />
          <button onClick={finish} className="absolute top-4 right-4 w-8 h-8 rounded-full td-surface-2 flex items-center justify-center text-zinc-400 hover:text-white z-10" aria-label="Skip">
            <X className="w-4 h-4" />
          </button>
          <div className="relative z-[1]">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${step.tint === "var(--td-accent)" ? "rgb(var(--td-accent-rgb) / 0.18)" : step.tint + "26"}` }}>
                {i === 0 ? <img src={dinoLogo} alt="" className="w-6 h-6 td-nav-logo" /> : <Icon className="w-5 h-5" style={{ color: step.tint }} />}
              </span>
              <span className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: step.tint === "var(--td-accent)" ? "var(--td-accent)" : step.tint }}>{step.eyebrow}</span>
            </div>
            <h2 className="text-white text-xl font-extrabold tracking-tight leading-snug">{step.title}</h2>
            <p className="text-zinc-400 text-[14px] leading-relaxed mt-2.5">{step.body}</p>
          </div>
        </div>

        {/* footer: dots + controls */}
        <div className="px-6 pb-6 pt-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, s) => (
              <span key={s} className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: s === i ? 18 : 6, background: s === i ? "var(--td-accent)" : "rgba(255,255,255,0.18)" }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button onClick={() => setI(i - 1)} className="td-btn-ghost w-9 h-9 rounded-full flex items-center justify-center" aria-label="Back">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {last ? (
              <button onClick={() => { finish(); navigate("/whats-new"); }} className="td-btn-primary h-10 px-4 rounded-full text-sm font-semibold flex items-center gap-1.5">
                See everything <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setI(i + 1)} className="td-btn-primary h-10 px-5 rounded-full text-sm font-semibold flex items-center gap-1.5">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {!last && (
          <button onClick={finish} className="w-full py-2.5 text-xs text-zinc-500 hover:text-zinc-300 border-t border-white/5 flex items-center justify-center gap-1.5">
            <Check className="w-3 h-3" /> Skip the tour
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
