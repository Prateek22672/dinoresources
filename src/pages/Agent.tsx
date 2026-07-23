import { useState, useRef, useEffect } from "react";
import { invokeFn } from "@/integrations/supabase/revamp";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import { MarkdownRenderer } from "@/components/ai/MarkdownRenderer";
import { toast } from "sonner";
import { Send, RefreshCw, Mail, Sparkles, FileText, Lock } from "lucide-react";
import { GenAiIcon } from "@/components/BrandIcons";

interface Msg { role: "user" | "assistant"; content: string; }

const PRESETS = [
  { label: "Summarize an email", icon: Mail, prompt: "Summarize this email — key points, action items, deadlines:\n\n" },
  { label: "Draft a reply", icon: FileText, prompt: "Draft a short, polite reply to this email:\n\n" },
  { label: "Explain simply", icon: Sparkles, prompt: "Explain this simply with an example:\n\n" },
];

export default function Agent() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next); setInput(""); setBusy(true);
    const { data, error } = await invokeFn<{ reply: string }>("groq-agent", { messages: next });
    setBusy(false);
    if (error || !data?.reply) { toast.error(error ?? "Agent failed"); return; }
    setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
  };

  return (
    <AppShell>
      <PageHero
        eyebrow="Assistant"
        eyebrowIcon={GenAiIcon}
        title="AI Assistant"
        subtitle="Summarize emails & notes, draft replies, and explain anything — instantly."
      />

      {/* Connect Gmail (needs OAuth setup) */}
      <div className="td-surface rounded-2xl p-4 mb-5 flex items-center gap-3 flex-wrap">
        <Mail className="w-5 h-5 td-accent-text shrink-0" />
        <p className="text-sm text-zinc-300 flex-1 min-w-[200px]">Connect Gmail to auto-fetch &amp; summarize your inbox.</p>
        <button onClick={() => toast.info("Gmail connect needs a Google OAuth client — ask the admin to set it up.")}
          className="td-btn-ghost px-4 py-2 rounded-full text-sm flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Connect Gmail</button>
      </div>

      {/* Presets */}
      {messages.length === 0 && (
        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => setInput(p.prompt)} className="td-surface td-card-click rounded-2xl p-4 text-left">
              <div className="w-9 h-9 rounded-xl td-surface-2 flex items-center justify-center mb-2.5"><p.icon className="w-4 h-4 text-zinc-300" /></div>
              <p className="text-white text-sm font-medium">{p.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Conversation */}
      <div className="space-y-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user" ? "td-bw-chip" : "td-surface"}`}>
              {m.role === "assistant" ? <MarkdownRenderer content={m.content} /> : <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
            </div>
          </div>
        ))}
        {busy && <div className="flex justify-start"><div className="td-surface rounded-2xl px-4 py-3 text-zinc-400 text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Thinking…</div></div>}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="sticky bottom-4 td-surface rounded-3xl p-2 flex items-end gap-2">
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Paste an email or ask anything…" rows={1}
          className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-zinc-600 resize-none px-3 py-2.5 max-h-40"
        />
        <button onClick={() => send()} disabled={busy || !input.trim()} className="td-btn-primary w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-zinc-600 text-[11px] text-center mt-2">Powered by Groq · your messages aren’t stored.</p>
    </AppShell>
  );
}
