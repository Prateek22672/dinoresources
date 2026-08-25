import { useCallback, useEffect, useState } from "react";
import { BarChart3, Check, Send, X, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  tbl, rpc, pollOptions, pollIsOpen,
  type PollOption, type PollResultRow, type PollRow,
} from "@/integrations/supabase/revamp";

const DISMISS_KEY = "td:polls-dismissed";

const readDismissed = (): string[] => {
  try { const v = JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]"); return Array.isArray(v) ? v : []; }
  catch { return []; }
};

/**
 * One short poll, in the flow of the page.
 *
 * Support tickets only arrive when something is broken — never when something
 * is merely pointless — so the team hears about faults and never about whether
 * a feature was worth building. This asks directly, in the two taps a
 * WhatsApp poll takes.
 *
 * Deliberately quiet: one poll at a time, never a modal, dismissible for good,
 * and it renders nothing at all when there is nothing to ask. Results appear
 * only after answering, so a running tally can't colour the answer — the server
 * enforces that too, not just this component.
 */
export default function PollCard({ className = "" }: { className?: string }) {
  const [poll, setPoll] = useState<PollRow | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [voted, setVoted] = useState(false);
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);

  const loadResults = useCallback(async (pollId: string) => {
    const { data } = await rpc("poll_results", { _poll_id: pollId });
    const rows = (Array.isArray(data) ? data : []) as PollResultRow[];
    const map: Record<string, number> = {};
    for (const r of rows) map[r.option_id] = Number(r.votes) || 0;
    setResults(map);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !alive) return;

        const dismissed = readDismissed();
        const { data } = await tbl("polls")
          .select("*").eq("active", true)
          .order("created_at", { ascending: false }).limit(10);

        // closes_at is filtered here as well as in RLS — a poll open when the
        // page loaded can lapse while it is still on screen.
        const open = ((data ?? []) as PollRow[])
          .filter(pollIsOpen)
          .filter((p) => !dismissed.includes(p.id));
        const next = open[0];
        if (!next || !alive) return;

        const { data: mine } = await tbl("poll_votes")
          .select("option_ids, comment").eq("poll_id", next.id).eq("user_id", user.id).maybeSingle();

        if (!alive) return;
        setPoll(next);
        setOptions(pollOptions(next.options));
        if (mine) {
          setPicked(mine.option_ids ?? []);
          setComment(mine.comment ?? "");
          setVoted(true);
          await loadResults(next.id);
        }
      } catch { /* a poll is never worth breaking the page over */ }
    })();
    return () => { alive = false; };
  }, [loadResults]);

  const dismiss = () => {
    setGone(true);
    if (!poll) return;
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify([...readDismissed(), poll.id].slice(-50)));
    } catch { /* quota — it just reappears next visit */ }
  };

  const toggle = (id: string) => {
    if (voted) return;
    setPicked((cur) =>
      poll?.kind === "multi"
        ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])
        : [id]);
  };

  const submit = async () => {
    if (!poll || busy || (!picked.length && !comment.trim())) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await tbl("poll_votes").upsert({
        poll_id: poll.id,
        user_id: user.id,
        option_ids: picked,
        comment: comment.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "poll_id,user_id" });
      if (error) throw error;
      setVoted(true);
      await loadResults(poll.id);
    } catch (e) {
      console.error("[PollCard] vote failed:", e);
    } finally {
      setBusy(false);
    }
  };

  if (!poll || gone) return null;

  const total = results ? Object.values(results).reduce((a, b) => a + b, 0) : 0;
  const canSend = !!picked.length || !!comment.trim();

  return (
    <div className={`td-surface rounded-3xl p-4 sm:p-5 relative overflow-hidden ${className}`}>
      <div className="td-aurora" aria-hidden><i /><i /><i /></div>

      <div className="relative z-10">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl td-accent-bg flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-zinc-500">
                Quick question
              </p>
              <span className="text-[9px] font-bold tracking-[0.14em] uppercase td-surface-2 text-zinc-400 px-1.5 py-0.5 rounded-full">
                Beta
              </span>
            </div>
            {/* break-words, not truncate: an admin writes this and a clipped
                question is worse than a tall card. */}
            <p className="text-white font-semibold text-[14.5px] leading-snug mt-1 break-words">
              {poll.question}
            </p>
          </div>
          <button
            onClick={dismiss}
            className="w-8 h-8 rounded-full td-btn-ghost flex items-center justify-center shrink-0"
            aria-label="Not now"
            title="Not now — don't show this again"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-3.5 space-y-1.5">
          {options.map((o) => {
            const on = picked.includes(o.id);
            const count = results?.[o.id] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <button
                key={o.id}
                onClick={() => toggle(o.id)}
                disabled={voted}
                className={`relative w-full text-left rounded-2xl px-3.5 py-2.5 overflow-hidden transition-colors ${
                  voted ? "td-surface-2 cursor-default" : on ? "td-surface-2 border border-white/25" : "td-surface-2 hover:border-white/20"
                }`}
              >
                {/* The result bar is behind the label, so a long option never
                    has to compete with a number for the same row. */}
                {voted && (
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
                    style={{ width: `${pct}%`, background: "rgb(var(--td-accent-rgb) / 0.20)" }}
                  />
                )}
                <span className="relative flex items-center gap-2.5">
                  <span className={`shrink-0 w-4 h-4 flex items-center justify-center border-2 transition-colors ${
                    poll.kind === "multi" ? "rounded-[5px]" : "rounded-full"
                  } ${on ? "td-accent-solid border-transparent" : "border-zinc-600"}`}>
                    {on && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] text-zinc-200 break-words">{o.label}</span>
                  {voted && (
                    <span className="shrink-0 text-[11px] font-bold text-zinc-400 tabular-nums">{pct}%</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {poll.allow_text && !voted && (
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder={poll.text_prompt || "Anything else? (optional)"}
            className="td-surface-2 rounded-2xl w-full mt-2 px-3.5 py-2.5 text-[13px] text-white outline-none resize-none placeholder:text-zinc-600 focus:border-white/25 transition-colors"
          />
        )}

        {voted ? (
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <span className="text-[11.5px] text-zinc-500 inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 td-accent-text" />
              Thanks — that's recorded.
            </span>
            <span className="text-[11px] text-zinc-600 tabular-nums">
              {total} response{total === 1 ? "" : "s"}
            </span>
            <button onClick={dismiss} className="td-btn-ghost px-3 py-1.5 rounded-full text-[11px] font-semibold ml-auto">
              Close
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <button
              onClick={submit}
              disabled={!canSend || busy}
              className="td-btn-primary px-4 py-2 rounded-full text-[12.5px] font-bold inline-flex items-center gap-1.5 disabled:opacity-45"
            >
              <Send className="w-3.5 h-3.5" /> {busy ? "Sending…" : "Send"}
            </button>
            {poll.kind === "multi" && (
              <span className="text-[11px] text-zinc-600">Pick as many as you like</span>
            )}
            {/* Anyone with database access can read this table, so the UI does
                not pretend otherwise. */}
            <span className="text-[10.5px] text-zinc-600 inline-flex items-center gap-1 w-full sm:w-auto sm:ml-auto">
              <MessageSquare className="w-3 h-3 shrink-0" /> The team can see who answered
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
