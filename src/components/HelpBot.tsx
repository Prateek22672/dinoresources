import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { invokeFn } from "@/integrations/supabase/revamp";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useAccent } from "@/hooks/useAccent";
import { useCart } from "@/context/CartContext";
import { MarkdownRenderer } from "@/components/ai/MarkdownRenderer";
import { toast } from "sonner";
import { Send, X, RefreshCw, Ticket, ArrowRight, Check, Trash2, Bug } from "lucide-react";
import { AiIcon, DinoIcon } from "@/components/BrandIcons";

interface BotAction {
  type: string; label: string;
  to?: string; mode?: string; id?: string;
  subject_id?: string; subject_name?: string;
  year_id?: string; year_name?: string;
  category?: string; message?: string;
}
interface Msg { role: "user" | "assistant"; content: string; actions?: BotAction[]; }

const CHAT_KEY = "td:helpbot-chat";

const QUICK = [
  "What subjects are available?",
  "Add a subject to my cart",
  "Change the theme",
  "Raise a ticket for me",
];

/**
 * DinoBot — agentic help. The server returns whitelist-validated actions;
 * tapping a button runs them (navigate / theme / accent / cart). Tickets are
 * filed by the server itself once the bot has collected the details.
 */
export default function HelpBot({
  open, onClose, onRaiseTicket,
}: { open: boolean; onClose: () => void; onRaiseTicket: () => void }) {
  const { isOn } = useFeatureFlags();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { setAccent } = useAccent();
  const { addSubject, addCombo, isInCart } = useCart();

  // Conversation persists on-device (localStorage) — nothing stored server-side.
  const [messages, setMessages] = useState<Msg[]>(() => {
    try { return JSON.parse(localStorage.getItem(CHAT_KEY) || "[]"); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ran, setRan] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-30))); } catch { /* storage full */ }
  }, [messages]);

  const clearChat = () => { setMessages([]); setRan(new Set()); try { localStorage.removeItem(CHAT_KEY); } catch { /* ignore */ } };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  useEffect(() => {
    if (open && !isOn("helpbot")) { onClose(); onRaiseTicket(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
    const { data, error } = await invokeFn<{ reply: string; actions?: BotAction[] }>(
      "help-bot",
      { messages: next.map((m) => ({ role: m.role, content: m.content })) },
    );
    setBusy(false);
    if (error || !data?.reply) {
      setMessages((m) => [...m, { role: "assistant", content: "I'm having trouble right now — please tap **Raise a ticket** below and the team will help you within 24 hours." }]);
      return;
    }
    setMessages((m) => [...m, { role: "assistant", content: data.reply, actions: data.actions ?? [] }]);
  };

  /** Phase-2 ticket confirm: deterministic server insert, no LLM involved. */
  const confirmTicket = async (a: BotAction, key: string) => {
    if (busy) return;
    setRan((p) => new Set(p).add(key));
    setBusy(true);
    const { data } = await invokeFn<{ reply: string; actions?: BotAction[] }>(
      "help-bot",
      { confirm_ticket: { category: a.category, message: a.message } },
    );
    setBusy(false);
    setMessages((m) => [...m, {
      role: "assistant",
      content: data?.reply ?? "Couldn't file the ticket — please use the manual form below.",
      actions: data?.actions ?? [],
    }]);
  };

  /** Execute a validated action. Never throws — worst case is a toast. */
  const runAction = (a: BotAction, key: string) => {
    try {
      switch (a.type) {
        case "confirm_ticket":
          confirmTicket(a, key);
          break;
        case "navigate":
          if (a.to) { onClose(); navigate(a.to); }
          break;
        case "set_theme":
          if (a.mode === "light" || a.mode === "dark") { setTheme(a.mode); toast.success(`Switched to ${a.mode} theme`); }
          break;
        case "set_accent":
          if (a.id) { setAccent(a.id); toast.success("Accent updated"); }
          break;
        case "add_to_cart":
          if (a.subject_id) {
            if (isInCart("subject", a.subject_id)) toast.info("Already in your cart");
            else { addSubject(a.subject_id, a.subject_name ?? "Subject"); toast.success(`${a.subject_name ?? "Subject"} added to cart`); }
            setRan((p) => new Set(p).add(key));
          }
          break;
        case "add_combo":
          if (a.year_id) {
            if (isInCart("combo", a.year_id)) toast.info("Combo already in your cart");
            else { addCombo(a.year_id, a.year_name ?? "Combo"); toast.success(`${a.year_name ?? "Combo"} added to cart`); }
            setRan((p) => new Set(p).add(key));
          }
          break;
        default:
          break;
      }
    } catch {
      toast.error("Couldn't do that — try from the site directly.");
    }
  };

  const actionButton = (a: BotAction, key: string) => {
    if (a.type === "ticket_created") {
      return (
        <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300">
          <Check className="w-3 h-3" /> {a.label}
        </span>
      );
    }
    if (a.type === "confirm_ticket") {
      const done = ran.has(key);
      return (
        <div key={key} className="w-full td-surface-2 rounded-2xl p-3.5 border border-white/10">
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 mb-1.5 flex items-center gap-1.5">
            <Ticket className="w-3 h-3 td-accent-text" /> Review your ticket
          </p>
          <p className="text-[11px] text-zinc-500 mb-0.5 capitalize">Type: <span className="text-zinc-300 font-semibold">{(a.category ?? "").replaceAll("_", " ")}</span></p>
          <p className="text-[13px] text-zinc-200 leading-relaxed mb-3">{a.message}</p>
          <button
            onClick={() => runAction(a, key)}
            disabled={done || busy}
            className="td-btn-primary w-full py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {done ? <><Check className="w-3.5 h-3.5" /> Raised</> : <>Confirm &amp; raise ticket</>}
          </button>
        </div>
      );
    }
    const done = ran.has(key);
    return (
      <button
        key={key}
        onClick={() => runAction(a, key)}
        disabled={done}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-transform hover:scale-[1.03] disabled:opacity-60 ${
          a.type === "navigate" ? "td-btn-primary" : "td-accent-bg border border-white/10"
        }`}
      >
        {done ? <Check className="w-3 h-3" /> : null}
        {a.label}
        {a.type === "navigate" && !done ? <ArrowRight className="w-3 h-3" /> : null}
      </button>
    );
  };

  return (
    <>
      {/* Mobile-only light dim (no blur) — tap to close. Desktop docks bottom-right. */}
      <div className="sm:hidden fixed inset-0 z-[94] bg-black/45" onClick={onClose} />
      <div className="fixed z-[95] inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[400px]">
        <div className="td-surface w-full h-[88dvh] sm:h-[600px] sm:max-h-[calc(100dvh-3rem)] rounded-t-[28px] sm:rounded-[28px] flex flex-col overflow-hidden td-in border border-white/10 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.65)]">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 shrink-0">
            <span className="w-10 h-10 rounded-2xl td-accent-bg flex items-center justify-center"><DinoIcon className="w-6 h-6" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold leading-tight">DinoBot</p>
              <p className="text-zinc-500 text-xs">Does things for you · replies instantly</p>
            </div>
            {messages.length > 0 && (
              <button onClick={clearChat} className="w-9 h-9 rounded-full td-btn-ghost flex items-center justify-center" aria-label="Clear chat" title="Clear chat">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
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
                    Hey! 👋 I'm DinoBot — I can <strong>do things for you</strong>: open pages, change the
                    theme or accent, add subjects to your cart, and file support tickets myself.
                    What do you need?
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
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex flex-col items-start"}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 ${m.role === "user" ? "bg-white text-black rounded-br-md" : "td-surface-2 rounded-tl-md"}`}>
                  {m.role === "assistant"
                    ? <MarkdownRenderer content={m.content} />
                    : <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
                </div>
                {m.role === "assistant" && (m.actions?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[88%]">
                    {m.actions!.map((a, j) => actionButton(a, `${i}:${j}`))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="td-surface-2 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-2 text-zinc-400 text-sm">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> on it…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Ticket handoff + input (safe-area padded for iOS home bar) */}
          <div className="px-4 pt-2 border-t border-white/8 shrink-0 space-y-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex gap-2">
              <button onClick={() => { onClose(); onRaiseTicket(); }}
                className="flex-1 td-btn-ghost py-2.5 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5">
                <Ticket className="w-4 h-4 td-accent-text" /> Raise a ticket
              </button>
              <button onClick={() => { onClose(); window.dispatchEvent(new Event("td:open-issue-reporter")); }}
                className="flex-1 td-btn-ghost py-2.5 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5">
                <Bug className="w-4 h-4 td-accent-text" /> Report a bug
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask me to do something…"
                className="flex-1 td-surface-2 rounded-full px-4 h-11 text-sm text-white outline-none placeholder:text-zinc-600"
              />
              <button onClick={() => send()} disabled={busy || !input.trim()}
                className="td-btn-primary w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50 shrink-0" aria-label="Send">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-[10px] text-zinc-600 flex items-center justify-center gap-1">
              <AiIcon className="w-3 h-3 opacity-70" /> AI assistant — may make mistakes; the team confirms via tickets.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
