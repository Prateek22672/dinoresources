import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Sparkles, BrainCircuit, Trophy, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTypewriter } from "../../hooks/useTypewriter";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { PracticeCard } from "./PracticeCard";

export function TopicDetail({ topic, activeUnit, currentTopics, onBack, onUpdateProgress }) {
  const [phase, setPhase] = useState("streaming");
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const contentRef = useRef(null);

  const { displayed, done, skip } = useTypewriter(topic.content, 18, true);

  // Calculate and emit live progress percentage
  useEffect(() => {
    if (!topic || !topic.content) return;
    
    const currentPercent = Math.min(100, Math.floor((displayed.length / topic.content.length) * 100));
    
    if (currentPercent === 100 || done) {
      onUpdateProgress(topic.id, 100, "completed");
    } else if (currentPercent > 0 && currentPercent % 5 === 0) {
      onUpdateProgress(topic.id, currentPercent, "in-progress");
    }
  }, [displayed.length, topic.content.length, topic.id, done, onUpdateProgress]);

  // Auto-scroll logic tailored for mobile
  useEffect(() => {
    if (contentRef.current && phase === "streaming") {
      const { scrollHeight, clientHeight } = contentRef.current;
      contentRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: "smooth" });
    }
  }, [displayed, phase]);

  useEffect(() => {
    if (done && phase === "streaming") {
      const t = setTimeout(() => setPhase("questions"), 500);
      return () => clearTimeout(t);
    }
  }, [done, phase]);

  const handleNext = () => {
    const currentIndex = currentTopics.findIndex((t) => t.id === topic.id);
    if (currentIndex < currentTopics.length - 1) {
      onBack("next", currentTopics[currentIndex + 1]);
    } else {
      toast.success("🎉 Unit complete! Great job.");
      onBack("back", null);
    }
  };

  // CLUB THEM ALL: Safely extract and flatten questions whether they are an array or an object
  const questionsToRender = Array.isArray(topic.questions) 
    ? topic.questions 
    : Object.values(topic.questions || {}).flat();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur z-10">
        <button
          onClick={() => onBack("back", null)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm sm:text-base font-medium py-2 pr-4 rounded-full hover:bg-white/5"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back to Topics</span>
          <span className="sm:hidden">Back</span>
        </button>

        {!done && (
          <button
            onClick={skip}
            className="text-xs sm:text-sm text-zinc-300 font-medium bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full transition-colors"
          >
            Skip Animation →
          </button>
        )}
      </div>

      <div ref={contentRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-10 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-bold tracking-widest uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-4 inline-block">
            Unit {activeUnit}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-8 sm:mb-10 leading-tight">
            {topic.title}
          </h2>

          <div className="bg-[#111113] border border-white/5 rounded-[24px] p-6 sm:p-10 mb-8 relative shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[24px] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-[shimmer_2s_linear_infinite] w-[200%]" />
            </div>

            <div className="flex items-center gap-2 mb-6 text-indigo-400 border-b border-white/5 pb-4">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase">AI Concept Breakdown</span>
            </div>

            <MarkdownRenderer content={displayed} isTyping={!done} />
          </div>

          {phase !== "streaming" && questionsToRender.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center gap-3 mb-6">
                <BrainCircuit className="w-6 h-6 text-purple-400" />
                <h4 className="text-xl sm:text-2xl font-bold text-white">Knowledge Check</h4>
              </div>
              <div className="space-y-4">
                {questionsToRender.map((q, i) => (
                  <PracticeCard
                    key={i}
                    q={q}
                    index={i}
                    revealed={!!revealedAnswers[i]}
                    onReveal={() => setRevealedAnswers((p) => ({ ...p, [i]: !p[i] }))}
                  />
                ))}
              </div>

              <div className="mt-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-emerald-300 text-sm sm:text-base leading-relaxed">
                  Reviewing these questions builds memory retention. When you feel confident, move to the next topic!
                </p>
              </div>
            </div>
          )}
          <div className="h-32" />
        </div>
      </div>

      {done && (
        <div className="shrink-0 px-4 sm:px-8 py-4 border-t border-white/5 bg-[#0a0a0c]/90 backdrop-blur-xl flex justify-between items-center animate-in slide-in-from-bottom-2 duration-300">
          <div className="text-sm text-zinc-400 hidden sm:block max-w-xs truncate">
            {currentTopics.findIndex((t) => t.id === topic.id) < currentTopics.length - 1
              ? `Up Next: ${currentTopics[currentTopics.findIndex((t) => t.id === topic.id) + 1]?.title}`
              : "Last topic in this unit"}
          </div>
          <button
            onClick={handleNext}
            className="flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-bold px-8 py-3.5 rounded-full transition-transform hover:scale-105 w-full sm:w-auto shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] ml-auto"
          >
            {currentTopics.findIndex((t) => t.id === topic.id) < currentTopics.length - 1
              ? "Start Next Topic"
              : "Complete Unit"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}