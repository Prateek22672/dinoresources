import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Sparkles, BrainCircuit, Trophy, ArrowRight } from "lucide-react";
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

  useEffect(() => {
    if (alreadySeen) skip();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id]);

  useEffect(() => {
    if (done) {
      try { sessionStorage.setItem(seenKey(topic.id), "1"); } catch { /* ok */ }
    }
  }, [done, topic.id]);

  useEffect(() => {
    // 🔥 FIX: Critical safety check to prevent dividing by zero or processing empty content
    if (!topic?.content || topic.content.length === 0) return;
    
    const pct = Math.min(100, Math.floor((displayed.length / topic.content.length) * 100));
    
    if (pct === 100 || done) {
      onUpdateProgress(topic.id, 100, "completed");
    } else {
      // Parent now safely throttles this, so we can just pass the raw pct!
      onUpdateProgress(topic.id, pct, "in-progress");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (idx < currentTopics.length - 1) {
      onBack("next", currentTopics[idx + 1]);
    } else {
      toast.success("🎉 Unit complete! Great job.");
      onBack("back", null);
    }
  };

  const questionsToRender: any[] = Array.isArray(topic.questions)
    ? topic.questions
    : Object.values(topic.questions || {}).flat();

  const currentIndex = currentTopics.findIndex((t) => t.id === topic.id);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top bar ── */}
      <div className="shrink-0 flex items-center justify-between pl-4 pr-16 sm:pl-6 sm:pr-20 py-3 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur z-10 min-h-[56px]">
        <button
          onClick={() => onBack("back", null)}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm font-medium py-1.5 pr-3 rounded-full hover:bg-white/5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Parts</span>
          <span className="sm:hidden">Back</span>
        </button>

        {!done && !alreadySeen && (
          <button
            onClick={skip}
            className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95"
          >
            Generate Fast
          </button>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:pt-8 scrollbar-thin scrollbar-thumb-zinc-800"
      >
        <div className="max-w-5xl mx-auto pb-24">

          {/* Badge */}
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-4 inline-block shadow-sm">
            Unit {activeUnit} · Part {currentIndex + 1}
          </span>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 sm:mb-8 leading-[1.15] tracking-tight">
            {topic.title}
          </h2>

          {/* ── AI Concept Breakdown card ── */}
          <div className="bg-[#121214] border border-white/5 rounded-3xl p-5 sm:p-8 lg:p-10 mb-10 relative shadow-2xl overflow-hidden">
            
            {!done && (
              <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-[shimmer_2s_linear_infinite] w-[200%]" />
              </div>
            )}

            <div className="flex items-center gap-2 mb-6 text-indigo-400 border-b border-white/5 pb-4">
              <img src={genai} alt="GenAI" className="w-6 h-6 rounded-full bg-indigo-500/10 p-1" />
              <span className="text-xs font-bold tracking-widest uppercase">AI Concept Breakdown</span>
            </div>

            <div className="text-base sm:text-lg leading-relaxed sm:leading-[1.8] text-zinc-300">
              {done || alreadySeen ? (
                <MarkdownRenderer 
                  content={topic.content} 
                  isTyping={false} 
                />
              ) : (
                <div className="whitespace-pre-wrap font-mono text-[15px] opacity-80 text-zinc-400">
                  {displayed}<span className="animate-pulse text-indigo-400">_</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Topic Framed Questions ── */}
          {(phase === "questions" || alreadySeen) && questionsToRender.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="text-2xl font-bold text-white tracking-tight">Topic Framed Questions</h4>
              </div>

              <div className="space-y-4">
                {questionsToRender.map((q, i) => (
                  <PracticeCard
                    key={q.id ?? i}
                    q={q}
                    index={i}
                    revealed={!!revealedAnswers[i]}
                    onReveal={() =>
                      setRevealedAnswers((p) => ({ ...p, [i]: !p[i] }))
                    }
                    isSubscribed={isSubscribed}
                    onPaymentSuccess={onPaymentSuccess}
                  />
                ))}
              </div>

              <div className="mt-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h5 className="text-emerald-300 font-bold mb-1">Great Job!</h5>
                  <p className="text-emerald-400/80 text-sm leading-relaxed">
                    Reviewing these questions builds memory retention. When you feel confident, move to the next part!
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Bottom action bar ── */}
      {done && (
        <div className="shrink-0 px-4 sm:px-6 py-4 border-t border-white/5 bg-[#0a0a0c]/90 backdrop-blur-xl flex justify-between items-center animate-in slide-in-from-bottom-4 duration-500">
          <div className="text-sm text-zinc-400 hidden sm:block max-w-sm truncate">
            {currentIndex < currentTopics.length - 1
              ? `Up Next: ${currentTopics[currentIndex + 1]?.title}`
              : "Last part in this unit"}
          </div>
          <button
            onClick={handleNext}
            className="flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-bold px-8 py-3.5 rounded-full transition-all hover:scale-105 w-full sm:w-auto shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] ml-auto"
          >
            {currentIndex < currentTopics.length - 1 ? "Start Next Part" : "Complete Unit"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}