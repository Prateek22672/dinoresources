import { useEffect, useRef, useState } from "react";
import { invokeFn } from "@/integrations/supabase/revamp";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { MarkdownRenderer } from "@/components/ai/MarkdownRenderer";
import { Bot, Send, X, RefreshCw, Ticket, Sparkles } from "lucide-react";

interface Msg { role: "user" | "assistant"; content: string; }

const QUICK = [
  "How do I buy a subject?",
  "What subjects are available?",
  "What's free on TeamDino?",
  "I paid but my subject is locked",
];

/**
 * DinoBot — chat-first help (like ChatGPT support). The brain + catalog live
 * server-side (admin-controlled). "Raise a ticket" hands off to the classic form.
 */
export default function HelpBot({
  open, onClose, onRaiseTicket,
}: { open: boolean; onClose: () => void; onRaiseTicket: () => void }) {
  const { isOn } = useFeatureFlags();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  // If the bot is disabled by admin, go straight to the ticket form.
  useEffect(() => {
    if (open && !isOn("helpbot")) { onClose(); onRaiseTicket(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Mobile: lock the page scroll while the sheet is open (desktop stays free —
  // the docked panel intentionally leaves the page usable).
  useEffect(() => {
    if (!open) return;
    if (!window.matchMedia("(max-width: 639px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next); setInput(""); setBusy(true);
    const { data, error } = await invokeFn<{ reply: string }>("help-bot", { messages: next });
    setBusy(false);
    if (error || !data?.reply) {
      setMessages((m) => [...m, { role: "assistant", content: "I'm having trouble right now — please tap **Raise a ticket** below and the team will help you within 24 hours." }]);
      return;
    }
    setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
  };

  return (
    <>
      {/* Mobile-only light dim (no blur) — tap to close. Desktop has NO backdrop:
          the panel docks bottom-right so the page stays usable while chatting. */}
      <div className="sm:hidden fixed inset-0 z-[94] bg-black/45" onClick={onClose} />
      <div className="fixed z-[95] inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[400px]">
        <div className="td-surface w-full h-[88dvh] sm:h-[600px] sm:max-h-[calc(100dvh-3rem)] rounded-t-[28px] sm:rounded-[28px] flex flex-col overflow-hidden td-in border border-white/10 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.65)]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 shrink-0">
          <span className="w-10 h-10 rounded-2xl td-accent-bg flex items-center justify-center"><Bot className="w-5 h-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold leading-tight">DinoBot</p>
            <p className="text-zinc-500 text-xs">Help &amp; support · replies instantly</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full td-btn-ghost flex items-center justify-center" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages — overscroll-contain stops scroll chaining to the page */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="td-in">
              <div className="td-surface-2 rounded-2xl rounded-tl-md px-4 py-3 max-w-[90%]">
                <p className="text-sm text-zinc-200 leading-relaxed">
                  Hey! 👋 I'm DinoBot. Ask me anything — subjects &amp; prices, how to buy,
                  payment problems, free tools. If I can't fix it, I'll help you raise a ticket.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => send(q)} className="td-btn-ghost px-3 py-1.5 rounded-full text-xs">{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 ${m.role === "user" ? "bg-white text-black rounded-br-md" : "td-surface-2 rounded-tl-md"}`}>
                {m.role === "assistant"
                  ? <MarkdownRenderer content={m.content} />
                  : <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="td-surface-2 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-2 text-zinc-400 text-sm">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Ticket handoff + input (safe-area padded for iOS home bar) */}
        <div className="px-4 pt-2 border-t border-white/8 shrink-0 space-y-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button onClick={() => { onClose(); onRaiseTicket(); }}
            className="w-full td-btn-ghost py-2.5 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5">
            <Ticket className="w-4 h-4 td-accent-text" /> Raise a ticket — team replies in 24h
          </button>
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type your question…"
              className="flex-1 td-surface-2 rounded-full px-4 h-11 text-sm text-white outline-none placeholder:text-zinc-600"
            />
            <button onClick={() => send()} disabled={busy || !input.trim()}
              className="td-btn-primary w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50 shrink-0" aria-label="Send">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-zinc-600 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> AI assistant — may make mistakes; the team confirms via tickets.
          </p>
        </div>
        </div>
      </div>
    </>
  );
}
