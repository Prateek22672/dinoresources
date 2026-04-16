// src/components/ai/AllUnitsPanel.tsx
import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, BrainCircuit, Eye, EyeOff, Layers } from "lucide-react";
import { PracticeCard } from "./PracticeCard";

interface AllUnitsPanelProps {
  subjectTopics: Record<string, any[]>;
  isSubscribed?: boolean;
  onPaymentSuccess?: () => void;
}

export function AllUnitsPanel({
  subjectTopics,
  isSubscribed = false,
  onPaymentSuccess,
}: AllUnitsPanelProps) {
  // Track which unit sections are collapsed
  const [collapsedUnits, setCollapsedUnits] = useState<Record<number, boolean>>({});
  // Track revealed answers per question: key = `${unitNum}-${topicIdx}-${questionIdx}`
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  // Track whether all answers are revealed globally
  const [allUnitsExpanded, setAllUnitsExpanded] = useState(false);

  const availableUnits = [1, 2, 3, 4, 5].filter(
    (u) => subjectTopics[u.toString()]?.length > 0
  );

  const getFlattenedQuestions = (questions: any): any[] => {
    if (!questions) return [];
    if (Array.isArray(questions)) return questions;
    return Object.values(questions).flat() as any[];
  };

  const totalQuestions = availableUnits.reduce((sum, unitNum) => {
    const topics = subjectTopics[unitNum.toString()] || [];
    return sum + topics.reduce((tSum, t) => tSum + getFlattenedQuestions(t.questions).length, 0);
  }, 0);

  const toggleUnit = (unitNum: number) =>
        setCollapsedUnits((prev) => ({
          ...prev,
          [unitNum]: !(prev[unitNum] ?? true),
        }));

  const toggleAnswer = (key: string) =>
    setRevealedAnswers((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleRevealAll = () => {
      if (allUnitsExpanded) {
        const collapsedState: Record<number, boolean> = {};
        availableUnits.forEach((unitNum) => {
          collapsedState[unitNum] = true;
        });

        setCollapsedUnits(collapsedState);
        setAllUnitsExpanded(false);
      } else {
        const expandedState: Record<number, boolean> = {};
        availableUnits.forEach((unitNum) => {
          expandedState[unitNum] = false;
        });

        setCollapsedUnits(expandedState);
        setAllUnitsExpanded(true);
      }
    };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header bar ── */}
      <div className="shrink-0 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur z-10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white leading-tight">Complete Question Bank</h2>
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5">
              {totalQuestions} question{totalQuestions !== 1 ? "s" : ""} across {availableUnits.length} unit{availableUnits.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Reveal / Hide All toggle */}
        <button
          onClick={handleRevealAll}
          className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full transition-all border shrink-0 ${
              allUnitsExpanded
                ? "bg-white/10 text-white border-white/20 hover:bg-white/15"
                : "bg-indigo-500/10 text-indigo-300 border-indigo-500/25 hover:bg-indigo-500/20"
            }`}
        >
          {allUnitsExpanded ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hide All</span>
              <span className="sm:hidden">Hide</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reveal All</span>
              <span className="sm:hidden">Reveal</span>
            </>
          )}
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 px-2 sm:px-6 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-20">
          {availableUnits.map((unitNum) => {
            const topics = subjectTopics[unitNum.toString()] || [];
            const isCollapsed = collapsedUnits[unitNum] ?? true;
            const unitTotalQ = topics.reduce(
              (s, t) => s + getFlattenedQuestions(t.questions).length,
              0
            );

            return (
              <div
                key={unitNum}
                className="rounded-2xl border border-white/5 bg-[#0f0f12] overflow-hidden"
              >
                {/* Unit header / toggle */}
                <button
                  onClick={() => toggleUnit(unitNum)}
                  className="w-full flex items-center justify-between px-3.5 py-3 sm:px-5 sm:py-4 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                      {unitNum}
                    </div>
                    <div className="text-left">
                      <p className="text-white font-bold text-sm sm:text-base leading-tight">Unit {unitNum}</p>
                      <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">
                        {topics.length} part{topics.length !== 1 ? "s" : ""} · {unitTotalQ} question{unitTotalQ !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                </button>

                {/* Unit topics & questions */}
                {!isCollapsed && (
                  <div className="border-t border-white/5 divide-y divide-white/[0.04]">
                    {topics.map((topic, tIdx) => {
                      const questions = getFlattenedQuestions(topic.questions);
                      if (questions.length === 0) return null;

                      return (
                        <div key={topic.id ?? tIdx} className="px-3 py-3 sm:px-5 sm:py-4">
                          {/* Topic header */}
                          <div className="flex items-start sm:items-center gap-2 mb-3 sm:mb-4">
                            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0 mt-0.5 sm:mt-0" />
                            <span className="text-xs sm:text-sm font-semibold text-zinc-300 leading-snug flex-1">
                              {topic.title}
                            </span>
                            <span className="text-[10px] sm:text-xs text-zinc-600 bg-white/5 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                              {questions.length} Q{questions.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Questions */}
                          <div className="space-y-2.5 sm:space-y-3 pl-0 sm:pl-2">
                            {questions.map((q: any, qIdx: number) => {
                              const key = `${unitNum}-${tIdx}-${qIdx}`;
                              return (
                                <PracticeCard
                                  key={q.id ?? key}
                                  q={q}
                                  index={qIdx}
                                  revealed={!!revealedAnswers[key]}
                                  onReveal={() => toggleAnswer(key)}
                                  isSubscribed={isSubscribed}
                                  onPaymentSuccess={onPaymentSuccess}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {availableUnits.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 border border-dashed border-white/10 rounded-3xl mx-2 sm:mx-0">
              <BrainCircuit className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-600 mb-3 sm:mb-4" />
              <p className="text-zinc-400 font-medium text-center px-6 text-sm sm:text-base">
                No questions available yet across any unit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}