// src/components/ai/SubjectDrawerAi.tsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
  DrawerDescription, DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X, PanelLeftClose, PanelLeftOpen, Layers } from "lucide-react";

import { getAiSubject } from "@/data/aiSyllabus";
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

  const [activeUnit, setActiveUnit] = useState(1);
  const [activeTopic, setActiveTopic] = useState<any>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [liveProgress, setLiveProgress] = useState<Record<string, { progress: number; status: string }>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const lastUpdateRef = useRef<Record<string, number>>({});
  const { isSubscribed, refresh: refreshSubscription } = useSubscription();
  const handlePaymentSuccess = () => refreshSubscription();

  const subjectTopics = getAiSubject(subjectName) || {};
  const availableUnits = [1, 2, 3, 4, 5].filter(
    (unit) => subjectTopics[unit.toString()]?.length > 0
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

  const currentTopics = useMemo(() => {
    return (subjectTopics[activeUnit.toString()] || []).map((topic: any) => ({
      ...topic,
      progress: liveProgress[topic.id]?.progress ?? topic.progress,
      status: liveProgress[topic.id]?.status ?? topic.status,
    }));
  }, [subjectTopics, activeUnit, liveProgress]);

  const handleUnitChange = (unit: number) => {
    setActiveUnit(unit);
    setActiveTopic(null);
    setShowGenerate(false);
    setShowAllUnits(false);
  };

  const handleTopicBack = (action: string, nextTopic: any) => {
    if (action === "next" && nextTopic) setActiveTopic(nextTopic);
    else setActiveTopic(null);
  };

  const updateTopicProgress = useCallback((topicId: string, progress: number, status: string) => {
    const last = lastUpdateRef.current[topicId] || 0;
    if (progress - last < 10 && progress !== 100) return;
    lastUpdateRef.current[topicId] = progress;
    setLiveProgress((prev) => ({ ...prev, [topicId]: { progress, status } }));
  }, []);

  const isTopicView = !!activeTopic;
  const isGenerateView = showGenerate && !isTopicView;

  return (
    <>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>

      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="h-[100dvh] sm:h-[96vh] max-h-[100dvh] sm:max-h-[96vh] w-full mx-auto rounded-none sm:rounded-t-2xl overflow-hidden bg-[#0f0f0f] border-t border-neutral-800 text-neutral-100 flex flex-col"
          style={{ pointerEvents: "auto" }}
        >
          <DrawerDescription className="hidden">
            AI Study Tools for {subjectName}
          </DrawerDescription>

          {/* Close button */}
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 z-[60] text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg h-9 w-9 transition-colors"
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>

          {/* Top header (hidden during topic/generate view) */}
          <DrawerHeader
            className={`relative shrink-0 border-b border-neutral-800 bg-[#0f0f0f] z-20 pb-3 pt-4 flex-col items-center transition-all ${
              (isTopicView || isGenerateView) ? "hidden" : "flex"
            }`}
          >
            <div className="flex items-center gap-2 mb-1 text-neutral-400">
              <img src={genai} alt="AI" className="w-4 h-4 opacity-70" />
              <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-500">
                AI Study Hub
              </span>
            </div>
            <DrawerTitle className="text-base sm:text-lg font-semibold text-neutral-100 pr-12 pl-12 text-center line-clamp-1">
              {subjectName}
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

            {/* ── Sidebar ── */}
            <div
              className={`flex-shrink-0 border-b md:border-b-0 md:border-r border-neutral-800 bg-[#0c0c0c] relative z-20 flex-col
                ${(isTopicView || isGenerateView) ? "hidden md:flex" : "flex"}
                ${sidebarOpen ? "w-full md:w-[220px]" : "w-full md:w-[60px]"}
                transition-all duration-300 ease-in-out
              `}
            >
              {/* Collapse toggle */}
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="hidden md:flex absolute -right-3.5 top-5 z-30 w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 items-center justify-center text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700 transition-colors shadow-lg"
                title={sidebarOpen ? "Collapse" : "Expand"}
              >
                {sidebarOpen
                  ? <PanelLeftClose className="w-3.5 h-3.5" />
                  : <PanelLeftOpen className="w-3.5 h-3.5" />}
              </button>

              {/* Sidebar label */}
              {sidebarOpen && (
                <div className="hidden md:block px-4 pt-5 pb-2">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-neutral-600">
                    Units
                  </p>
                </div>
              )}

              {/* Nav items */}
              <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto p-2 md:p-2 scrollbar-none snap-x w-full">

                {displayUnits.map((unitNum) => {
                  const isActive = activeUnit === unitNum && !isTopicView && !isGenerateView && !showAllUnits;
                  return (
                    <button
                      key={unitNum}
                      onClick={() => handleUnitChange(unitNum)}
                      title={`Unit ${unitNum}`}
                      className={`shrink-0 md:w-full text-left px-2.5 py-2 rounded-lg transition-all duration-150 flex items-center gap-2.5 text-sm snap-start
                        ${isActive
                          ? "bg-neutral-800 text-neutral-100 border border-neutral-700"
                          : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/60 border border-transparent"
                        }`}
                    >
                      <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold
                        ${isActive ? "bg-neutral-700 text-neutral-100" : "bg-neutral-800/60 text-neutral-500"}`}>
                        {unitNum}
                      </div>
                      {sidebarOpen && (
                        <span className="whitespace-nowrap hidden md:block text-sm">
                          Unit {unitNum}
                        </span>
                      )}
                      <span className="md:hidden text-sm">Unit {unitNum}</span>
                    </button>
                  );
                })}

                {/* All Units */}
                <button
                  onClick={() => {
                    setShowAllUnits(true);
                    setActiveTopic(null);
                    setShowGenerate(false);
                  }}
                  title="All Units"
                  className={`shrink-0 md:w-full text-left px-2.5 py-2 rounded-lg transition-all duration-150 flex items-center gap-2.5 text-sm snap-start
                    ${showAllUnits && !isTopicView && !isGenerateView
                      ? "bg-neutral-800 text-neutral-100 border border-neutral-700"
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/60 border border-transparent"
                    }`}
                >
                  <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center
                    ${showAllUnits && !isTopicView && !isGenerateView ? "bg-neutral-700 text-neutral-100" : "bg-neutral-800/60 text-neutral-500"}`}>
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  {sidebarOpen && (
                    <span className="whitespace-nowrap hidden md:block text-sm">All Units</span>
                  )}
                  <span className="md:hidden text-sm">All Units</span>
                </button>
              </nav>
            </div>

            {/* ── Main content area ── */}
            <div className="flex-1 overflow-hidden bg-[#0f0f0f] flex flex-col min-w-0">
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
                <div className="flex-1 overflow-y-auto">
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