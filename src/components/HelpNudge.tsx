import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X, Ticket, ArrowRight } from "lucide-react";
import { DinoIcon } from "@/components/BrandIcons";
import { useOnboardingSlot } from "@/lib/onboarding";

interface Prompt { label: string; ask: string }

/**
 * Proactive DinoBot greeting. Rather than waiting for a student to discover
 * "Instant Help", this offers the questions that actually come up on the page
 * they're standing on — payment trouble in the cart, finding subjects on the
 * dashboard — and hands the chosen one straight to the bot.
 *
 * Deliberately restrained: one appearance per page per day, dismissible, and
 * never covering the primary action.
 */
const CONTEXT: Record<string, { title: string; sub: string; prompts: Prompt[] }> = {
  cart: {
    title: "Trouble checking out?",
    sub: "I can help with payment issues or find you a better deal.",
    prompts: [
      { label: "Payment failed but money was deducted", ask: "My payment failed but money was deducted from my account. What should I do?" },
      { label: "Do I have any coupons?", ask: "Do I have any coupons or discounts I can use on my cart right now?" },
      { label: "Is a full-year pack cheaper?", ask: "Would a full-year pack be cheaper than the subjects in my cart?" },
    ],
  },
  dashboard: {
    title: "Need a hand?",
    sub: "Tell me what you're studying and I'll find it for you.",
    prompts: [
      { label: "Find subjects for my year", ask: "What subjects are available for my year?" },
      { label: "How do I unlock a subject?", ask: "How do I unlock a subject, and what do I get with it?" },
      { label: "Something isn't working", ask: "Something isn't working on the site and I'd like to report it." },
    ],
  },
};

const keyFor = (pathname: string): keyof typeof CONTEXT | null => {
  if (pathname.startsWith("/cart")) return "cart";
  if (pathname === "/" || pathname.startsWith("/dashboard")) return "dashboard";
  return null;
};

const today = () => new Date().toISOString().slice(0, 10);
const seenKey = (ctx: string) => `td:nudge:${ctx}:${today()}`;

export default function HelpNudge({
  onAsk, onRaiseTicket,
}: { onAsk: (question: string) => void; onRaiseTicket: () => void }) {
  const { pathname } = useLocation();
  const ctx = keyFor(pathname);
  const [ready, setReady] = useState(false);
  // Last in the queue. An offer of help lands badly on top of a welcome tour,
  // and it is the least important of the four.
  const show = useOnboardingSlot("nudge", ready);

  useEffect(() => {
    setReady(false);
    if (!ctx) return;
    try { if (localStorage.getItem(seenKey(ctx))) return; } catch { /* private mode */ }
    // Let the page settle first — appearing mid-render reads as an ad.
    const t = setTimeout(() => setReady(true), 3500);
    return () => clearTimeout(t);
  }, [ctx, pathname]);

  if (!ctx || !show) return null;
  const { title, sub, prompts } = CONTEXT[ctx];

  const dismiss = () => {
    setReady(false);
    try { localStorage.setItem(seenKey(ctx), "1"); } catch { /* ignore */ }
  };

  const ask = (question: string) => { dismiss(); onAsk(question); };

  return (
    /* Bottom-LEFT, tucked against the side rail rather than out in the content
       column. The cart's order summary (total + Unlock button) is sticky on the
       right, so anchoring there covered the exact button we want tapped — but
       the old xl offset of 23rem pushed it far enough inward that it sat over
       the dashboard's own cards instead. Hugging the rail keeps it clear of
       both, and it is narrower so it covers less of whatever is behind it. */
    <div className="fixed bottom-4 left-4 xl:left-[15.5rem] z-[70] w-[min(19rem,calc(100vw-2rem))] td-in">
      <div className="td-glass rounded-[22px] p-4 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.85)] border border-white/10">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-full td-accent-solid flex items-center justify-center shrink-0">
            <DinoIcon className="w-5 h-5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-bold leading-tight">{title}</p>
            <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">{sub}</p>
          </div>
          <button onClick={dismiss} aria-label="Dismiss"
            className="w-7 h-7 rounded-full td-btn-ghost flex items-center justify-center shrink-0 -mt-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-3 space-y-1.5">
          {prompts.map((p) => (
            <button key={p.label} onClick={() => ask(p.ask)}
              className="w-full td-surface-2 hover:bg-white/10 rounded-xl px-3 py-2.5 text-left text-[13px] text-zinc-200 font-medium flex items-center gap-2 transition-colors group">
              <span className="min-w-0 flex-1 truncate">{p.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors shrink-0" />
            </button>
          ))}
        </div>

        <button onClick={() => { dismiss(); onRaiseTicket(); }}
          className="w-full mt-2 py-2 text-[11px] font-semibold text-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-1.5">
          <Ticket className="w-3 h-3" /> Raise a ticket instead
        </button>
      </div>
    </div>
  );
}
