// src/components/ai/GeneratePanel.tsx
import { useState, useEffect } from "react";
import { ChevronLeft, BrainCircuit, Zap, ChevronRight, BookOpen, Sparkles } from "lucide-react";
import { PracticeCard } from "./PracticeCard";

interface GeneratePanelProps {
  activeUnit: number;
  subjectName: string;
  subjectTopics: Record<string, any[]>;
  onClose: () => void;
  isSubscribed?: boolean;
  onPaymentSuccess?: () => void;
}

export function GeneratePanel({
  activeUnit,
  subjectName,
  subjectTopics,
  onClose,
  isSubscribed = false,
  onPaymentSuccess,
}: GeneratePanelProps) {
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [genPhase, setGenPhase]           = useState(0);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  const allTopics = subjectTopics[activeUnit.toString()] || [];

  const getFlattenedQuestions = (questions: any): any[] => {
    if (!questions) return [];
    if (Array.isArray(questions)) return questions;
    return Object.values(questions).flat() as any[];
  };

  const mixAllTopics = () => ({
    title: `All Framed Questions — Unit ${activeUnit}`,
    questions: allTopics.flatMap((t) => getFlattenedQuestions(t.questions)),
  });

  const startGenerate = (topic: any) => {
    setSelectedTopic({ ...topic, questions: getFlattenedQuestions(topic.questions) });
    setGenPhase(1);
    setRevealedAnswers({});
    setTimeout(() => setGenPhase(2), 2000);
  };

  const phases = [
    "Collecting framed questions…",
    "Organising by topic…",
    "Finalising answer set…",
  ];
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (genPhase !== 1) return;
    const t = setInterval(() => setLoadingMsgIdx((p) => (p + 1) % phases.length), 800);
    return () => clearInterval(t);
  }, [genPhase]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">

      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 sm:px-6 pt-4 pb-3 border-b border-white/5">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-zinc-400 hover:text-white font-medium bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 scrollbar-thin scrollbar-thumb-zinc-800">

        {/* ── Phase 0: Selection ── */}
        {genPhase === 0 && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">Framed Question Generator</h3>
            <p className="text-zinc-400 text-sm sm:text-base mb-6">
              Generate all framed questions from a specific part or from the entire unit.
            </p>

            {/* All questions button */}
            <button
              onClick={() => startGenerate(mixAllTopics())}
              className="w-full mb-6 rounded-[22px] border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/5 hover:from-indigo-500/20 hover:to-purple-500/10 p-5 sm:p-6 text-left flex items-center justify-between transition-all group shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-base sm:text-lg mb-0.5">All Framed Questions</p>
                  <p className="text-sm text-zinc-400">
                    Every framed question across all parts in Unit {activeUnit}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-2 transition-transform hidden sm:block" />
            </button>

            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-3">
              Or pick a specific part
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => startGenerate(topic)}
                  className="rounded-2xl border border-white/5 bg-[#111113] hover:border-white/20 hover:bg-[#18181b] p-4 text-left flex flex-col justify-between transition-all min-h-[100px]"
                >
                  <BookOpen className="w-4 h-4 text-zinc-500 mb-2.5" />
                  <div>
                    <p className="font-semibold text-zinc-200 text-sm leading-snug mb-1.5">
                      {topic.title}
                    </p>
                    <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md">
                      {getFlattenedQuestions(topic.questions).length} Questions
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Phase 1: Loading ── */}
        {genPhase === 1 && (
          <div className="flex flex-col items-center justify-center min-h-[360px] animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 flex items-center justify-center relative mb-6">
              <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-spin" />
              <BrainCircuit className="w-9 h-9 text-indigo-400 animate-pulse" />
            </div>
            <p className="text-white font-bold text-xl sm:text-2xl mb-2">Gathering framed questions</p>
            <p className="text-indigo-300 text-base animate-pulse">
              {phases[loadingMsgIdx]}
            </p>
          </div>
        )}

        {/* ── Phase 2: Results ── */}
        {genPhase === 2 && selectedTopic && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 pb-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-indigo-400 uppercase tracking-widest font-bold">
                Framed Question Set
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-1.5">
              {selectedTopic.title}
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base mb-6">
              {selectedTopic.questions?.length || 0} framed questions ready to practice.
            </p>

            <div className="space-y-3">
              {(selectedTopic.questions || []).map((q: any, i: number) => (
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

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { setGenPhase(0); setSelectedTopic(null); }}
                className="flex-1 py-3 rounded-full border border-white/10 text-zinc-300 hover:bg-white/5 font-semibold transition-colors text-sm"
              >
                Back to Selection
              </button>
              <button
                onClick={() =>
                  setRevealedAnswers(
                    Object.fromEntries(
                      (selectedTopic.questions || []).map((_: any, i: number) => [i, true])
                    )
                  )
                }
                className="flex-1 py-3 rounded-full bg-white text-black hover:bg-zinc-200 font-bold transition-transform hover:scale-105 shadow-lg text-sm"
              >
                Reveal All Answers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}