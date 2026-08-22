import { useEffect, useMemo, useRef, useState } from "react";
import {
  Send, Copy, Check, RotateCcw, Sparkles, BookOpen, Lock, ArrowUpRight, Trash2, Search,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/ai/MarkdownRenderer";
import { useTypewriter } from "@/hooks/useTypewriter";
import TutorOrb from "./TutorOrb";
import {
  askTutor, jumpToSource, GROUNDING_LABEL,
  type Grounding, type TutorContext, type TutorMessage, type TutorSource,
} from "./shared";

/** Badge that names where an answer's facts came from. */
function GroundingBadge({ g, searched }: { g: Grounding; searched?: number }) {
  const meta = GROUNDING_LABEL[g];
  const style =
    meta.tone === "emerald" ? { background: "rgba(52,211,153,0.14)", color: "#6ee7b7" }
    : meta.tone === "amber" ? { background: "rgba(245,158,11,0.14)", color: "#fbbf24" }
    : meta.tone === "accent" ? { background: "rgb(var(--td-accent-rgb) / 0.16)", color: "var(--td-accent-soft)" }
    : { background: "rgba(161,161,170,0.14)", color: "#a1a1aa" };
  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <span
        title={meta.hint}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase"
        style={style}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />
        {meta.label}
      </span>
      {typeof searched === "number" && searched > 0 && (
        <span className="text-[10px] text-zinc-600 font-medium">searched {searched} answer{searched === 1 ? "" : "s"}</span>
      )}
    </span>
  );
}

/** Tappable citation — lands the student on the real answer behind the panel. */
function SourceChips({ sources }: { sources: TutorSource[] }) {
  if (!sources.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {sources.map((s, i) => (
        <button
          key={s.id}
          onClick={() => jumpToSource(s.id)}
          style={{ animationDelay: `${i * 90}ms` }}
          title={s.question}
          className="td-pop td-surface-2 hover:border-white/25 rounded-xl px-2.5 py-1.5 text-left max-w-full flex items-center gap-2 transition-colors group"
        >
          <BookOpen className="w-3 h-3 td-accent-text shrink-0" />
          <span className="text-[11px] text-zinc-400 truncate max-w-[15rem]">
            <span className="td-accent-text font-bold">U{s.unit}</span> · {s.question}
          </span>
          <ArrowUpRight className="w-3 h-3 text-zinc-600 group-hover:text-zinc-300 shrink-0" />
        </button>
      ))}
    </div>
  );
}

/** The newest reply types itself in; everything above it is already settled. */
function Answer({ text, animate }: { text: string; animate: boolean }) {
  const [armed, setArmed] = useState(!animate);
  useEffect(() => {
    if (!animate) return;
    // Let the source chips land first — seeing what it found, then reading what
    // it made of them, is the whole story of a retrieval answer.
    const t = setTimeout(() => setArmed(true), 420);
    return () => clearTimeout(t);
  }, [animate]);

  const { displayed, done } = useTypewriter(text, 26, animate && armed);
  if (!animate) return <MarkdownRenderer content={text} />;
  return <MarkdownRenderer content={armed ? displayed : ""} isTyping={armed && !done} />;
}

export default function TutorChat({
  ctx, name, mastery, onDrill, seed = null,
}: {
  ctx: TutorContext;
  name: string;
  mastery: number | null;
  onDrill: () => void;
  /** Asked automatically on mount — set when the student accepted a nudge. */
  seed?: string | null;
}) {
  const storeKey = `td:tutor:${ctx.subjectId}:${ctx.unit ?? "all"}`;
  const [messages, setMessages] = useState<TutorMessage[]>(() => {
    try { return JSON.parse(localStorage.getItem(storeKey) || "[]"); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLTextAreaElement | null>(null);
  const seedSent = useRef<string | null>(null);

  // Switching unit switches conversation — the tutor is scoped to what's open.
  useEffect(() => {
    try { setMessages(JSON.parse(localStorage.getItem(storeKey) || "[]")); } catch { setMessages([]); }
  }, [storeKey]);

  useEffect(() => {
    try { localStorage.setItem(storeKey, JSON.stringify(messages.slice(-24))); } catch { /* storage full */ }
  }, [messages, storeKey]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);

  const readable = ctx.qa.filter((q) => q.answer_md);
  const locked = ctx.qa.length - readable.length;

  // Openers come from the unit's real questions, so the first tap is already a
  // grounded question rather than a generic "tell me about this subject".
  const openers = useMemo(() => {
    const pool = (readable.length ? readable : ctx.qa)
      .filter((q) => ctx.unit === null || q.unit_number === ctx.unit)
      .slice(0, 12);
    const picks: string[] = [];
    for (const q of pool) {
      if (picks.length >= 3) break;
      picks.push(q.question.replace(/^Explain\s+/i, "Explain ").trim());
    }
    return picks;
  }, [ctx.qa, ctx.unit, readable]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const next: TutorMessage[] = [
      ...messages.map((m) => ({ ...m, fresh: false })),
      { role: "user", content },
    ];
    setMessages(next);
    setInput("");
    setBusy(true);

    const { data, error } = await askTutor(ctx, next.map((m) => ({ role: m.role, content: m.content })));
    setBusy(false);

    if (error || !data?.reply) {
      setMessages((m) => [...m, {
        role: "assistant",
        content: error ?? "I couldn't reach my notes just then. Ask me again in a moment.",
        grounding: "beyond",
        fresh: false,
      }]);
      return;
    }
    setMessages((m) => [...m, {
      role: "assistant",
      content: data.reply,
      grounding: data.grounding,
      sources: data.sources ?? [],
      followups: data.followups ?? [],
      searched: data.searched,
      degraded: data.degraded,
      fresh: true,
    }]);
  };

  const retryLast = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    // Drop the failed/unwanted reply, then ask the same thing again.
    setMessages((m) => {
      const cut = [...m];
      while (cut.length && cut[cut.length - 1].role === "assistant") cut.pop();
      return cut;
    });
    setTimeout(() => send(lastUser.content), 30);
  };

  const clear = () => {
    setMessages([]);
    try { localStorage.removeItem(storeKey); } catch { /* ignore */ }
  };

  const copy = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1600);
    } catch { /* clipboard blocked — nothing useful to say */ }
  };

  // Opened from a nudge with the question already chosen — ask it for them
  // rather than making them retype it. Ref-guarded so a re-render cannot fire
  // the same seed twice.
  useEffect(() => {
    if (!seed || seedSent.current === seed) return;
    seedSent.current = seed;
    void send(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const scopeLine = ctx.unit
    ? `Unit ${ctx.unit}${ctx.topic ? ` · ${ctx.topic}` : ""} of ${ctx.subjectName}`
    : ctx.subjectName;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Conversation ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-5">
        {messages.length === 0 && (
          <div className="td-in space-y-4">
            <div className="td-surface rounded-3xl p-5 relative overflow-hidden">
              <div className="td-aurora" aria-hidden><i /><i /><i /></div>
              <div className="relative z-10">
                <div className="flex items-start gap-3">
                  <TutorOrb size={40} />
                  <div className="min-w-0">
                    <p className="text-white font-bold text-[17px] leading-tight">Hey {name} 👋</p>
                    <p className="text-zinc-400 text-[13px] mt-1 leading-relaxed">
                      {readable.length > 0 ? (
                        <>I&apos;ve read <span className="text-white font-semibold">{readable.length} answer{readable.length === 1 ? "" : "s"}</span> from {scopeLine}. Ask me anything from it and I&apos;ll explain it in your notes&apos; own words.</>
                      ) : (
                        <>I&apos;m reading {scopeLine} with you. Ask me anything from this unit.</>
                      )}
                    </p>
                  </div>
                </div>

                {(mastery !== null || locked > 0) && (
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {mastery !== null && (
                      <span className="td-surface-2 rounded-full px-3 py-1.5 text-[11px] font-semibold text-zinc-300 inline-flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 td-accent-text" /> Your last drills: {mastery}%
                      </span>
                    )}
                    {locked > 0 && (
                      <span className="td-surface-2 rounded-full px-3 py-1.5 text-[11px] font-medium text-zinc-500 inline-flex items-center gap-1.5">
                        <Lock className="w-3 h-3" /> {locked} answer{locked === 1 ? "" : "s"} still locked
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-600 px-1 mb-2">Start here</p>
              <div className="space-y-1.5">
                {openers.map((q, i) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    style={{ animationDelay: `${i * 70}ms` }}
                    className="td-pop td-surface rounded-2xl w-full text-left px-4 py-3 flex items-center gap-3 hover:border-white/20 transition-colors group"
                  >
                    <span className="w-6 h-6 rounded-lg td-accent-bg text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-[13px] text-zinc-300 flex-1 line-clamp-2">{q}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white shrink-0" />
                  </button>
                ))}
                <button
                  onClick={onDrill}
                  className="td-pop td-surface rounded-2xl w-full text-left px-4 py-3 flex items-center gap-3 hover:border-white/20 transition-colors group"
                  style={{ animationDelay: `${openers.length * 70}ms` }}
                >
                  <span className="w-6 h-6 rounded-lg td-accent-bg flex items-center justify-center shrink-0"><Sparkles className="w-3 h-3" /></span>
                  <span className="text-[13px] text-zinc-300 flex-1">Quiz me on {ctx.unit ? `Unit ${ctx.unit}` : "this subject"}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white shrink-0" />
                </button>
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          if (m.role === "user") {
            return (
              <div key={i} className="td-msg flex justify-end">
                <p className="max-w-[85%] bg-white text-black rounded-2xl rounded-br-md px-4 py-2.5 text-[14px] font-medium whitespace-pre-wrap">
                  {m.content}
                </p>
              </div>
            );
          }
          const last = i === messages.length - 1;
          return (
            <div key={i} className="td-msg">
              <div className="flex items-center gap-2.5 mb-2.5">
                <TutorOrb size={22} />
                <GroundingBadge g={m.grounding ?? "notes"} searched={m.searched} />
              </div>
              {/* An accent rule instead of a bubble — a tutor's answer should
                  read like material, not like a chat blurb. */}
              <div className="pl-3.5 border-l-2" style={{ borderColor: "rgb(var(--td-accent-rgb) / 0.35)" }}>
                <Answer text={m.content} animate={!!m.fresh && last} />
                <SourceChips sources={m.sources ?? []} />

                {m.degraded && (
                  <p className="text-[11px] text-amber-400/80 mt-2.5">Served straight from your notes — the model was unavailable.</p>
                )}

                <div className="flex items-center gap-1 mt-3">
                  <button onClick={() => copy(m.content, i)} className="td-btn-ghost px-2.5 py-1.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1.5">
                    {copied === i ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                  {last && (
                    <button onClick={retryLast} disabled={busy} className="td-btn-ghost px-2.5 py-1.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1.5 disabled:opacity-50">
                      <RotateCcw className="w-3 h-3" /> Again
                    </button>
                  )}
                </div>

                {last && !busy && (m.followups?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {m.followups!.map((f, j) => (
                      <button
                        key={f}
                        onClick={() => send(f)}
                        style={{ animationDelay: `${300 + j * 80}ms` }}
                        className="td-pop td-btn-ghost px-3 py-1.5 rounded-full text-[11px] font-medium max-w-full truncate"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="td-msg flex items-center gap-3">
            <TutorOrb size={22} busy />
            <span className="td-scan td-surface-2 rounded-full px-3 py-1.5 text-[11px] font-medium text-zinc-400 inline-flex items-center gap-1.5">
              <Search className="w-3 h-3" />
              Reading your notes{ctx.unit ? ` · Unit ${ctx.unit}` : ""}…
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* ── Composer ─────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/8 px-3 sm:px-4 pt-3 pb-[max(0.9rem,env(safe-area-inset-bottom))]">
        <div className="td-surface-2 rounded-3xl p-2 flex items-end gap-2 focus-within:border-white/25 transition-colors">
          <textarea
            ref={boxRef}
            value={input}
            rows={1}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target as HTMLTextAreaElement;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder={ctx.unit ? `Ask about Unit ${ctx.unit}…` : "Ask about this subject…"}
            className="flex-1 bg-transparent resize-none px-3 py-2 text-[14px] text-white outline-none placeholder:text-zinc-600 max-h-[132px]"
          />
          <button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            aria-label="Ask"
            className="td-btn-primary w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-2 mt-2 px-1.5">
          <p className="text-[10px] text-zinc-600">
            Answers come from your notes first · <kbd className="font-sans">⏎</kbd> send
          </p>
          {messages.length > 0 && (
            <button onClick={clear} className="text-[10px] text-zinc-600 hover:text-zinc-300 inline-flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
