// src/components/ai/GeneratePanel.tsx
import { useState, useEffect } from "react";
import { ChevronLeft, BrainCircuit, Zap, ChevronRight, BookOpen } from "lucide-react";
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
  const [genPhase, setGenPhase] = useState(0);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  const allTopics = subjectTopics[activeUnit.toString()] || [];

  const getFlattenedQuestions = (questions: any): any[] => {
    if (!questions) return [];
    if (Array.isArray(questions)) return questions;
    return Object.values(questions).flat() as any[];
  };

  const mixAllTopics = () => ({
    title: `All Questions — Unit ${activeUnit}`,
    questions: allTopics.flatMap((t) => getFlattenedQuestions(t.questions)),
  });

  const startGenerate = (topic: any) => {
    setSelectedTopic({ ...topic, questions: getFlattenedQuestions(topic.questions) });
    setGenPhase(1);
    setRevealedAnswers({});
    setTimeout(() => setGenPhase(2), 1600);
  };

  const phases = ["Collecting questions…", "Organising by topic…", "Finalising set…"];
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (genPhase !== 1) return;
    const t = setInterval(() => setLoadingMsgIdx((p) => (p + 1) % phases.length), 700);
    return () => clearInterval(t);
  }, [genPhase]);

  return (
    <div className="flex flex-col h-full w-full">

      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-neutral-800 bg-[#0f0f0f]">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 font-medium text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">

          {/* Phase 0: Selection */}
          {genPhase === 0 && (
            <div className="animate-in fade-in duration-200">
              <h3 className="text-xl sm:text-2xl font-semibold text-neutral-100 mb-1">Question Generator</h3>
              <p className="text-neutral-500 text-sm mb-7">
                Generate all framed questions from a specific part or the entire unit.
              </p>

              {/* All questions button */}
              <button
                onClick={() => startGenerate(mixAllTopics())}
                className="w-full mb-6 rounded-xl border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 p-4 sm:p-5 text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-neutral-700 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-neutral-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-100 text-sm mb-0.5">All Framed Questions</p>
                    <p className="text-xs text-neutral-500">
                      Every question across all parts in Unit {activeUnit}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors hidden sm:block" />
              </button>

              <p className="text-xs text-neutral-600 uppercase tracking-widest font-semibold mb-3">
                Or select a part
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {allTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => startGenerate(topic)}
                    className="rounded-xl border border-neutral-800 bg-[#141414] hover:border-neutral-700 hover:bg-[#1a1a1a] p-4 text-left flex flex-col justify-between transition-all min-h-[96px]"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-neutral-600 mb-2.5" />
                    <div>
                      <p className="font-medium text-neutral-300 text-sm leading-snug mb-1.5">{topic.title}</p>
                      <span className="text-xs text-neutral-600 bg-neutral-800/80 px-2 py-0.5 rounded">
                        {getFlattenedQuestions(topic.questions).length} Questions
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Phase 1: Loading */}
          {genPhase === 1 && (
            <div className="flex flex-col items-center justify-center min-h-[320px] animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-full border-2 border-neutral-800 flex items-center justify-center relative mb-5">
                <div className="absolute inset-0 rounded-full border-t-2 border-neutral-400 animate-spin" />
                <BrainCircuit className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-neutral-200 font-medium text-lg mb-1.5">Gathering questions</p>
              <p className="text-neutral-500 text-sm">{phases[loadingMsgIdx]}</p>
            </div>
          )}

          {/* Phase 2: Results */}
          {genPhase === 2 && selectedTopic && (
            <div className="animate-in fade-in duration-300 pb-10">
              <div className="mb-5">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-1.5">
                  Framed Questions
                </p>
                <h3 className="text-xl font-semibold text-neutral-100 mb-0.5">{selectedTopic.title}</h3>
                <p className="text-neutral-500 text-sm">
                  {selectedTopic.questions?.length || 0} questions ready to practice.
                </p>
              </div>

              <div className="space-y-2.5 mb-8">
                {(selectedTopic.questions || []).map((q: any, i: number) => (
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

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => { setGenPhase(0); setSelectedTopic(null); }}
                  className="flex-1 py-2.5 rounded-lg border border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 font-medium transition-colors text-sm"
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
                  className="flex-1 py-2.5 rounded-lg bg-neutral-100 text-neutral-900 hover:bg-white font-semibold transition-colors text-sm"
                >
                  Reveal All Answers
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}