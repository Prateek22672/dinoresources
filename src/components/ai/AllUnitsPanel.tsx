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
  const [collapsedUnits, setCollapsedUnits] = useState<Record<number, boolean>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
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
    setCollapsedUnits((prev) => ({ ...prev, [unitNum]: !(prev[unitNum] ?? true) }));

  const toggleAnswer = (key: string) =>
    setRevealedAnswers((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleRevealAll = () => {
    if (allUnitsExpanded) {
      const s: Record<number, boolean> = {};
      availableUnits.forEach((u) => (s[u] = true));
      setCollapsedUnits(s);
      setAllUnitsExpanded(false);
    } else {
      const s: Record<number, boolean> = {};
      availableUnits.forEach((u) => (s[u] = false));
      setCollapsedUnits(s);
      setAllUnitsExpanded(true);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-neutral-800 bg-[#0f0f0f]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-neutral-300" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-100 leading-tight">Complete Question Bank</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {totalQuestions} question{totalQuestions !== 1 ? "s" : ""} · {availableUnits.length} unit{availableUnits.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <button
          onClick={handleRevealAll}
          className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-md transition-all border shrink-0 ${
            allUnitsExpanded
              ? "bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700"
              : "bg-neutral-900 text-neutral-400 border-neutral-700 hover:bg-neutral-800 hover:text-neutral-200"
          }`}
        >
          {allUnitsExpanded ? (
            <><EyeOff className="w-3.5 h-3.5" /><span>Hide All</span></>
          ) : (
            <><Eye className="w-3.5 h-3.5" /><span>Reveal All</span></>
          )}
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto space-y-3 pb-20">

          {availableUnits.map((unitNum) => {
            const topics = subjectTopics[unitNum.toString()] || [];
            const isCollapsed = collapsedUnits[unitNum] ?? true;
            const unitTotalQ = topics.reduce(
              (s, t) => s + getFlattenedQuestions(t.questions).length, 0
            );

            return (
              <div
                key={unitNum}
                className="rounded-xl border border-neutral-800 bg-[#141414] overflow-hidden"
              >
                {/* Unit toggle header */}
                <button
                  onClick={() => toggleUnit(unitNum)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-neutral-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 font-semibold text-sm shrink-0">
                      {unitNum}
                    </div>
                    <div className="text-left">
                      <p className="text-neutral-100 font-semibold text-sm leading-tight">Unit {unitNum}</p>
                      <p className="text-neutral-500 text-xs mt-0.5">
                        {topics.length} part{topics.length !== 1 ? "s" : ""} · {unitTotalQ} Q{unitTotalQ !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-neutral-600 group-hover:text-neutral-400 transition-colors">
                    {isCollapsed
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronUp className="w-4 h-4" />}
                  </div>
                </button>

                {/* Topics */}
                {!isCollapsed && (
                  <div className="border-t border-neutral-800 divide-y divide-neutral-800/60">
                    {topics.map((topic, tIdx) => {
                      const questions = getFlattenedQuestions(topic.questions);
                      if (questions.length === 0) return null;

                      return (
                        <div key={topic.id ?? tIdx} className="px-4 py-4">
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span className="text-xs font-medium text-neutral-300 flex-1 leading-snug">{topic.title}</span>
                            <span className="text-xs text-neutral-600 bg-neutral-800/60 px-2 py-0.5 rounded shrink-0">
                              {questions.length} Q{questions.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="space-y-2.5">
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
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-neutral-800 rounded-2xl">
              <BrainCircuit className="w-9 h-9 text-neutral-700 mb-3" />
              <p className="text-neutral-500 text-sm text-center px-6">No questions available across any unit.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}