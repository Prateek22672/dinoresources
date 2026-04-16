// src/components/ai/TopicDetail.tsx
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, BrainCircuit, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTypewriter } from "../../hooks/useTypewriter";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { PracticeCard } from "./PracticeCard";
import genai from "@/assets/aiWhite.png";

interface TopicDetailProps {
  topic: any;
  activeUnit: number;
  currentTopics: any[];
  onBack: (action: string, nextTopic: any) => void;
  onUpdateProgress: (topicId: string, progress: number, status: string) => void;
  isSubscribed?: boolean;
  onPaymentSuccess?: () => void;
}

const seenKey = (topicId: string) => `anim_seen_${topicId}`;

export function TopicDetail({
  topic,
  activeUnit,
  currentTopics,
  onBack,
  onUpdateProgress,
  isSubscribed = false,
  onPaymentSuccess,
}: TopicDetailProps) {
  const [phase, setPhase] = useState("streaming");
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  const alreadySeen = (() => {
    try { return sessionStorage.getItem(seenKey(topic.id)) === "1"; } catch { return false; }
  })();

  const { displayed, done, skip } = useTypewriter(topic.content, alreadySeen ? 0 : 18, true);

  useEffect(() => { if (alreadySeen) skip(); }, [topic.id]);

  useEffect(() => {
    if (done) {
      try { sessionStorage.setItem(seenKey(topic.id), "1"); } catch { }
    }
  }, [done, topic.id]);

  useEffect(() => {
    if (!topic?.content || topic.content.length === 0) return;
    const pct = Math.min(100, Math.floor((displayed.length / topic.content.length) * 100));
    if (pct === 100 || done) onUpdateProgress(topic.id, 100, "completed");
    else onUpdateProgress(topic.id, pct, "in-progress");
  }, [displayed.length, topic.content.length, topic.id, done]);

  const scrollTrigger = Math.floor(displayed.length / 40);
  useEffect(() => {
    if (contentRef.current && phase === "streaming" && !alreadySeen) {
      const { scrollHeight, clientHeight } = contentRef.current;
      contentRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: "auto" });
    }
  }, [scrollTrigger, phase, alreadySeen]);

  useEffect(() => {
    if (done && phase === "streaming") {
      const t = setTimeout(() => setPhase("questions"), 300);
      return () => clearTimeout(t);
    }
  }, [done, phase]);

  const handleNext = () => {
    const idx = currentTopics.findIndex((t) => t.id === topic.id);
    if (idx < currentTopics.length - 1) onBack("next", currentTopics[idx + 1]);
    else { toast.success("Unit complete! Great work."); onBack("back", null); }
  };

  const questionsToRender: any[] = Array.isArray(topic.questions)
    ? topic.questions
    : Object.values(topic.questions || {}).flat();

  const currentIndex = currentTopics.findIndex((t) => t.id === topic.id);
  const hasNext = currentIndex < currentTopics.length - 1;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between pl-4 pr-14 sm:pl-5 sm:pr-16 py-3 border-b border-neutral-800 bg-[#0f0f0f] min-h-[52px]">
        <button
          onClick={() => onBack("back", null)}
          className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-200 transition-colors text-sm font-medium py-1.5 pr-3 rounded-lg hover:bg-neutral-800/60"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Parts</span>
          <span className="sm:hidden">Back</span>
        </button>

        {!done && !alreadySeen && (
          <button
            onClick={skip}
            className="text-xs text-neutral-400 font-medium bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Skip animation
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      >
        <div className="max-w-3xl mx-auto pb-24">

          {/* Badge */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-medium text-neutral-500 bg-neutral-800 border border-neutral-700 px-2.5 py-1 rounded-md">
              Unit {activeUnit} · Part {currentIndex + 1} of {currentTopics.length}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-100 mb-6 leading-tight tracking-tight">
            {topic.title}
          </h2>

          {/* AI Concept Card */}
          <div className="bg-[#141414] border border-neutral-800 rounded-xl p-5 sm:p-6 mb-8 relative overflow-hidden">

            {/* Streaming progress bar */}
            {!done && (
              <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
                <div className="h-full bg-neutral-600 animate-pulse" style={{
                  width: `${Math.min(100, Math.floor((displayed.length / (topic.content?.length || 1)) * 100))}%`,
                  transition: "width 0.3s ease"
                }} />
              </div>
            )}

            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-neutral-800">
              <img src={genai} alt="AI" className="w-4 h-4 opacity-60" />
              <span className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
                AI Concept Breakdown
              </span>
            </div>

            <div className="text-sm sm:text-[15px] leading-[1.75] text-neutral-300">
              {done || alreadySeen ? (
                <MarkdownRenderer content={topic.content} isTyping={false} />
              ) : (
                <div className="font-mono text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">
                  {displayed}
                  <span className="animate-[blink_0.7s_steps(1)_infinite] text-neutral-400">▋</span>
                </div>
              )}
            </div>
          </div>

          {/* Framed Questions */}
          {(phase === "questions" || alreadySeen) && questionsToRender.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4 text-neutral-400" />
                </div>
                <h4 className="text-base font-semibold text-neutral-200">Framed Questions</h4>
                <span className="text-xs text-neutral-600 bg-neutral-800/60 px-2 py-0.5 rounded ml-auto">
                  {questionsToRender.length} Q{questionsToRender.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-2.5">
                {questionsToRender.map((q, i) => (
                  <PracticeCard
                    key={q.id ?? i}
                    q={q}
                    index={i}
                    revealed={!!revealedAnswers[i]}
                    onReveal={() => setRevealedAnswers((p) => ({ ...p, [i]: !p[i] }))}
                    isSubscribed={isSubscribed}
                    onPaymentSuccess={onPaymentSuccess}
                  />
                ))}
              </div>

              {/* Completion nudge */}
              <div className="mt-6 rounded-xl bg-neutral-900/60 border border-neutral-800 p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-neutral-500 shrink-0" />
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Reviewing these questions helps with retention. When you feel confident, move to the next part.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      {done && (
        <div className="shrink-0 px-4 sm:px-6 py-3.5 border-t border-neutral-800 bg-[#0f0f0f] flex justify-between items-center animate-in slide-in-from-bottom-2 duration-300">
          <p className="text-xs text-neutral-600 hidden sm:block max-w-[50%] truncate">
            {hasNext ? `Next: ${currentTopics[currentIndex + 1]?.title}` : "Last part in this unit"}
          </p>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-neutral-100 hover:bg-white text-neutral-900 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm ml-auto"
          >
            {hasNext ? "Next Part" : "Complete Unit"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}