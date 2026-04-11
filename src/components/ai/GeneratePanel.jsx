import { useState, useEffect } from "react";
import { ChevronLeft, BrainCircuit, Zap, ChevronRight, BookOpen, Sparkles } from "lucide-react";
import { PracticeCard } from "./PracticeCard";

export function GeneratePanel({ activeUnit, subjectName, subjectTopics, onClose }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [genPhase, setGenPhase] = useState(0); 
  const [revealedAnswers, setRevealedAnswers] = useState({});

  const allTopics = subjectTopics[activeUnit.toString()] || [];

  // Helper to extract and flatten all questions
  const getFlattenedQuestions = (questions) => {
    if (!questions) return [];
    if (Array.isArray(questions)) return questions;
    return Object.values(questions).flat();
  };

  // Helper to mix all topics into a single comprehensive exam
  const mixAllTopics = () => {
    const allQs = allTopics.flatMap(t => getFlattenedQuestions(t.questions));
    return { title: `Full Unit ${activeUnit} Review`, questions: allQs };
  };

  const startGenerate = (topic) => {
    // Flatten the questions before setting the selected topic
    const flatTopic = { ...topic, questions: getFlattenedQuestions(topic.questions) };
    setSelectedTopic(flatTopic);
    setGenPhase(1);
    setRevealedAnswers({});
    setTimeout(() => setGenPhase(2), 2500);
  };

  const phases = ["Analyzing syllabus context...", "Structuring exam questions...", "Finalizing model answers..."];
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  
  useEffect(() => {
    if (genPhase !== 1) return;
    const t = setInterval(() => setLoadingMsgIdx((p) => (p + 1) % phases.length), 800);
    return () => clearInterval(t);
  }, [genPhase]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="shrink-0 flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/5">
        <button onClick={onClose} className="flex items-center gap-2 text-zinc-400 hover:text-white font-medium bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 scrollbar-thin scrollbar-thumb-zinc-800">
        
        {/* Phase 0: Selection */}
        {genPhase === 0 && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-3xl font-extrabold text-white mb-2">Practice Generator</h3>
            <p className="text-zinc-400 text-base mb-8">Target specific weaknesses or simulate a full unit exam.</p>

            <button
              onClick={() => startGenerate(mixAllTopics())}
              className="w-full mb-8 rounded-[24px] border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/5 hover:from-indigo-500/20 hover:to-purple-500/10 p-6 sm:p-8 text-left flex items-center justify-between transition-all group shadow-xl"
            >
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <Zap className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg sm:text-xl mb-1">Comprehensive Exam</p>
                  <p className="text-sm text-zinc-400">Questions spanning every topic in Unit {activeUnit}</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-indigo-400 group-hover:translate-x-2 transition-transform hidden sm:block" />
            </button>

            <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-4">Or target a specific topic</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => startGenerate(topic)}
                  className="rounded-2xl border border-white/5 bg-[#111113] hover:border-white/20 hover:bg-[#18181b] p-5 text-left flex flex-col justify-between transition-all min-h-[120px]"
                >
                  <BookOpen className="w-5 h-5 text-zinc-500 mb-3" />
                  <div>
                    <p className="font-semibold text-zinc-200 text-sm sm:text-base leading-snug mb-2">{topic.title}</p>
                    <span className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded-md">
                      {getFlattenedQuestions(topic.questions).length} Questions
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phase 1: Loading Animation */}
        {genPhase === 1 && (
          <div className="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-300">
            <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 flex items-center justify-center relative mb-8">
              <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-spin" />
              <BrainCircuit className="w-10 h-10 text-indigo-400 animate-pulse" />
            </div>
            <p className="text-white font-bold text-xl sm:text-2xl mb-3">AI is preparing your exam</p>
            <p className="text-indigo-300 text-base sm:text-lg animate-pulse">{phases[loadingMsgIdx]}</p>
          </div>
        )}

        {/* Phase 2: Flat Results */}
        {genPhase === 2 && selectedTopic && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 pb-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="text-sm text-indigo-400 uppercase tracking-widest font-bold">Generated Set</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{selectedTopic.title}</h3>
            <p className="text-zinc-400 text-base mb-8">Test your knowledge against these {selectedTopic.questions?.length || 0} questions.</p>

            <div className="space-y-4">
              {(selectedTopic.questions || []).map((q, i) => (
                <PracticeCard
                  key={i}
                  q={q}
                  index={i}
                  revealed={!!revealedAnswers[i]}
                  onReveal={() => setRevealedAnswers((p) => ({ ...p, [i]: !p[i] }))}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => { setGenPhase(0); setSelectedTopic(null); }}
                className="flex-1 py-3.5 rounded-full border border-white/10 text-zinc-300 hover:bg-white/5 font-semibold transition-colors"
              >
                Create Another Test
              </button>
              <button
                onClick={() => setRevealedAnswers(Object.fromEntries((selectedTopic.questions || []).map((_, i) => [i, true])))}
                className="flex-1 py-3.5 rounded-full bg-white text-black hover:bg-zinc-200 font-bold transition-transform hover:scale-105 shadow-lg"
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