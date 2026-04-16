// src/components/ai/SubjectDrawerAi.tsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
  DrawerDescription, DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X, Sparkles, PanelLeftClose, PanelLeftOpen, Layers } from "lucide-react";

import { getAiSubject } from "@/data/aiSyllabus";
import { aiSyllabus } from "@/data/aiSyllabus";
import { TopicGrid } from "./TopicGrid";
import { TopicDetail } from "./TopicDetail";
import { GeneratePanel } from "./GeneratePanel";
import { AllUnitsPanel } from "./AllUnitsPanel";
import { useSubscription } from "@/hooks/useSubscription";
import genai from "@/assets/aiWhite.png";

type SubjectDrawerAiProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName: string;
  userRole: any;
  userId: string | null;
};

export default function SubjectDrawerAi({
  open, onOpenChange, subjectId, subjectName, userRole, userId,
}: SubjectDrawerAiProps) {
  
  const [activeUnit, setActiveUnit]     = useState(1);
  const [activeTopic, setActiveTopic]   = useState<any>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [liveProgress, setLiveProgress] = useState<Record<string, { progress: number; status: string }>>({});
  const [sidebarOpen, setSidebarOpen]   = useState(true);

  // Ref to track last progress update without triggering re-renders
  const lastUpdateRef = useRef<Record<string, number>>({});

  const { isSubscribed, refresh: refreshSubscription } = useSubscription();

  const handlePaymentSuccess = () => {
    refreshSubscription();
  };

  const subjectTopics = getAiSubject(subjectName) || {};

  const availableUnits = [1, 2, 3, 4, 5].filter(
    (unit) => subjectTopics[unit.toString()] && subjectTopics[unit.toString()].length > 0
  );

  const displayUnits = availableUnits.length > 0 ? availableUnits : [1, 2, 3, 4, 5];

  useEffect(() => {
    if (open) {
      setActiveUnit(availableUnits.length > 0 ? availableUnits[0] : 1);
      setActiveTopic(null);
      setShowGenerate(false);
      setShowAllUnits(false);
    }
  }, [open, subjectName]);

  // Memoize currentTopics so it doesn't recalculate on every tiny render
  const currentTopics = useMemo(() => {
    return (subjectTopics[activeUnit.toString()] || []).map((topic: any) => ({
      ...topic,
      progress: liveProgress[topic.id]?.progress ?? topic.progress,
      status:   liveProgress[topic.id]?.status   ?? topic.status,
    }));
  }, [subjectTopics, activeUnit, liveProgress]);

  const handleUnitChange = (unit: number) => {
    setActiveUnit(unit);
    setActiveTopic(null);
    setShowGenerate(false);
    setShowAllUnits(false);
  };

  const handleTopicBack = (action: string, nextTopic: any) => {
    if (action === "next" && nextTopic) {
      setActiveTopic(nextTopic);
    } else {
      setActiveTopic(null);
    }
  };

  // Stabilize the callback and throttle the updates to 10% chunks
  const updateTopicProgress = useCallback((topicId: string, progress: number, status: string) => {
    const last = lastUpdateRef.current[topicId] || 0;

    // Only force a React state update if progress jumped by 10%, or if it's 100% done
    if (progress - last < 10 && progress !== 100) return;

    lastUpdateRef.current[topicId] = progress;

    setLiveProgress((prev) => ({
      ...prev,
      [topicId]: { progress, status }
    }));
  }, []);

  const isTopicView    = !!activeTopic;
  const isGenerateView = showGenerate && !isTopicView;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        .sidebar-transition {
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease;
        }
      `}</style>

      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="h-[100dvh] sm:h-[96vh] max-h-[100dvh] sm:max-h-[96vh] w-full mx-auto rounded-none sm:rounded-t-[40px] overflow-hidden bg-[#0a0a0c] border-t border-indigo-500/20 text-zinc-100 shadow-[0_-20px_60px_-20px_rgba(99,102,241,0.18)] flex flex-col"
          style={{ pointerEvents: "auto" }}
        >
          <DrawerDescription className="hidden">
            AI Study Tools for {subjectName}
          </DrawerDescription>

          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 z-[60] text-zinc-400 hover:bg-white/10 hover:text-white rounded-full h-10 w-10 transition-colors bg-black/20 backdrop-blur-md border border-white/5 sm:bg-transparent sm:border-none"
            >
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>

          <DrawerHeader className={`relative shrink-0 border-b border-white/5 bg-[#0a0a0c] z-20 pb-3 pt-4 flex-col items-center transition-all ${
            (isTopicView || isGenerateView) ? "hidden" : "flex"
          }`}>
            <div className="flex items-center gap-2 mb-0.5 text-indigo-400 mt-1">
              <img src={genai} alt="GenAI Logo" className="w-4 h-4" />
              <span className="text-xs font-bold tracking-widest uppercase">AI Study Hub</span>
            </div>
            <DrawerTitle className="text-lg sm:text-xl font-extrabold tracking-tight text-white pr-12 pl-12 text-center line-clamp-1">
              {subjectName}
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-[#0a0a0c]">

            <div
              className={`sidebar-transition flex-shrink-0 border-b md:border-b-0 md:border-r border-white/5 bg-[#0d0d10] relative z-20 flex-col transition-all duration-300
                ${(isTopicView || isGenerateView) ? "hidden md:flex" : "flex"}
                ${sidebarOpen ? "w-full md:w-[260px]" : "w-full md:w-[80px]"}
              `}
            >
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="hidden md:flex absolute -right-4 top-6 z-30 w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-950 items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 hover:scale-110 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>

              <div className={`hidden md:block h-12 px-4 pt-6 mb-2 overflow-hidden transition-opacity duration-200 ${
                sidebarOpen ? "opacity-100" : "opacity-0"
              }`}>
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 whitespace-nowrap">
                  Curriculum
                </p>
              </div>

              <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto p-3 md:p-4 scrollbar-none snap-x w-full">
                
               
                {displayUnits.map((unitNum) => {
                  const isActive = activeUnit === unitNum && !isTopicView && !isGenerateView && !showAllUnits;
                  return (
                    <button
                      key={unitNum}
                      onClick={() => handleUnitChange(unitNum)}
                      className={`shrink-0 md:w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm border font-medium snap-start overflow-hidden ${
                        isActive
                          ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-[inset_3px_0_0_0_#818cf8]"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border-transparent"
                      }`}
                      title={`Unit ${unitNum}`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                        isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-zinc-500"
                      }`}>
                        {unitNum}
                      </div>
                      <span className={`whitespace-nowrap transition-all duration-200 block md:${sidebarOpen ? "block" : "hidden opacity-0 w-0"}`}>
                        Unit {unitNum}
                      </span>
                    </button>



                  );
                })}

                 {/* ── All Units Button ── */}
                <button
                  onClick={() => {
                    setShowAllUnits(true);
                    setActiveTopic(null);
                    setShowGenerate(false);
                  }}
                  className={`shrink-0 md:w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm border font-medium snap-start overflow-hidden ${
                    showAllUnits && !isTopicView && !isGenerateView
                      ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-[inset_3px_0_0_0_#818cf8]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border-transparent"
                  }`}
                  title="All Units Questions"
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
                    showAllUnits && !isTopicView && !isGenerateView ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-zinc-500"
                  }`}>
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className={`whitespace-nowrap transition-all duration-200 block md:${sidebarOpen ? "block" : "hidden opacity-0 w-0"}`}>
                    All Units Questions
                  </span>
                </button>

              </nav>
            </div>

            <div className="flex-1 overflow-hidden bg-gradient-to-br from-[#0a0a0c] to-[#0e0e14] flex flex-col relative z-0 min-w-0">
              {isTopicView ? (
                <TopicDetail
                  key={activeTopic.id}
                  topic={activeTopic}
                  activeUnit={activeUnit}
                  currentTopics={currentTopics}
                  onBack={handleTopicBack}
                  onUpdateProgress={updateTopicProgress}
                  isSubscribed={isSubscribed}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              ) : isGenerateView ? (
                <GeneratePanel
                  activeUnit={activeUnit}
                  subjectName={subjectName}
                  subjectTopics={subjectTopics}
                  onClose={() => setShowGenerate(false)}
                  isSubscribed={isSubscribed}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              ) : showAllUnits ? (
                <AllUnitsPanel
                  subjectTopics={subjectTopics}
                  isSubscribed={isSubscribed}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              ) : (
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                  <TopicGrid
                    topics={currentTopics}
                    activeUnit={activeUnit}
                    subjectName={subjectName}
                    onSelectTopic={setActiveTopic}
                    onGenerate={() => setShowGenerate(true)}
                  />
                </div>
              )}
            </div>

          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}