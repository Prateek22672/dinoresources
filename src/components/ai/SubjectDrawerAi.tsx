// src/components/ai/SubjectDrawerAi.tsx
import { useState } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
  DrawerDescription, DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";

import { aiSyllabus }    from "@/data/aiSyllabus";
import { TopicGrid }     from "./TopicGrid";
import { TopicDetail }   from "./TopicDetail";
import { GeneratePanel } from "./GeneratePanel";
import { useSubscription } from "@/hooks/useSubscription";

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
  const UNITS = [3, 4, 5];

  const [activeUnit, setActiveUnit]     = useState(3);
  const [activeTopic, setActiveTopic]   = useState<any>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [liveProgress, setLiveProgress] = useState<Record<string, { progress: number; status: string }>>({});

  // ── Subscription — read from Supabase, cached in localStorage ────────────
  const { isSubscribed, refresh: refreshSubscription } = useSubscription();

  /**
   * Called by PracticeCard after the payment is server-verified.
   * `useSubscription` keeps Supabase as the source of truth, but we also
   * trigger a manual refresh to flip the UI immediately without waiting for
   * the next focus event.
   */
  const handlePaymentSuccess = () => {
    refreshSubscription();
  };
  // ─────────────────────────────────────────────────────────────────────────

  const subjectTopics = aiSyllabus[subjectName] || {};

  const currentTopics = (subjectTopics[activeUnit.toString()] || []).map((topic) => ({
    ...topic,
    progress: liveProgress[topic.id]?.progress ?? topic.progress,
    status:   liveProgress[topic.id]?.status   ?? topic.status,
  }));

  const handleUnitChange = (unit: number) => {
    setActiveUnit(unit);
    setActiveTopic(null);
    setShowGenerate(false);
  };

  const handleTopicBack = (action: string, nextTopic: any) => {
    if (action === "next" && nextTopic) {
      setActiveTopic(nextTopic);
    } else {
      setActiveTopic(null);
    }
  };

  const updateTopicProgress = (topicId: string, progress: number, status: string) => {
    setLiveProgress((prev) => ({ ...prev, [topicId]: { progress, status } }));
  };

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
          50%       { opacity: 0; }
        }
      `}</style>

      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="h-[100dvh] sm:h-[92vh] max-h-[100dvh] sm:max-h-[92vh] w-full mx-auto rounded-none sm:rounded-t-[40px] overflow-hidden bg-[#0a0a0c] border-t border-indigo-500/20 text-zinc-100 shadow-[0_-20px_60px_-20px_rgba(99,102,241,0.18)] flex flex-col"
          style={{ pointerEvents: "auto" }}

        >
          <DrawerDescription className="hidden">
            AI Study Tools for {subjectName}
          </DrawerDescription>

          {/* ── Drawer header ── */}
          <DrawerHeader className="relative shrink-0 border-b border-white/5 bg-[#0a0a0c] z-20 pb-4 pt-5 flex flex-col items-center">
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 z-50 text-zinc-400 hover:bg-white/10 hover:text-white rounded-full h-10 w-10 transition-colors"
              >
                <X className="h-6 w-6" />
              </Button>
            </DrawerClose>

            <div className="flex items-center gap-2 mb-1 text-indigo-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase">AI Study Hub</span>
            </div>
            <DrawerTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-white pr-12 pl-12 text-center line-clamp-1">
              {subjectName}
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-[#0a0a0c]">

            {/* ── Unit sidebar ── */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-[#0d0d10] p-4 flex-shrink-0 z-10">
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-600 mb-3 hidden md:block px-2">
                Curriculum
              </p>
              <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none snap-x">
                {UNITS.map((unitNum) => {
                  const isActive = activeUnit === unitNum && !isTopicView && !isGenerateView;
                  return (
                    <button
                      key={unitNum}
                      onClick={() => handleUnitChange(unitNum)}
                      className={`shrink-0 md:w-full text-left px-4 md:px-3 py-3 rounded-xl transition-all duration-200 flex items-center justify-between text-sm sm:text-base border font-medium snap-start ${
                        isActive
                          ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-[inset_3px_0_0_0_#818cf8]"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-sm font-bold ${isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-zinc-500"}`}>
                          {unitNum}
                        </div>
                        Unit {unitNum}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* ── Main content area ── */}
            <div className="flex-1 overflow-hidden bg-gradient-to-br from-[#0a0a0c] to-[#0e0e14] flex flex-col relative z-0">
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