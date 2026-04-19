import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  List,
  LayoutGrid,
  X,
  BookOpen,
  Lock,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ResourceCard from "./ResourceCard";
import { UserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumUnlockDialog } from "./premiumUnlockDialog";
import { getAiSubject } from "@/data/aiSyllabus";
import genai from "@/assets/aiWhite.png";

interface Resource {
  id: string;
  title: string;
  type: "pdf" | "youtube" | "link";
  url: string;
  created_at: string;
  created_by: string | null;
  category: string;
  unit_number: number | null;
}

interface SubjectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName: string;
  userRole: UserRole | null;
  userId: string | null;
  onOpenAiDrawer?: (subjectId: string, subjectName: string, unit: number) => void;
}

export default function SubjectDrawer({
  open, onOpenChange, subjectId, subjectName, userRole, userId, onOpenAiDrawer,
}: SubjectDrawerProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Syllabus");
  const [viewMode, setViewMode] = useState<"list" | "expanded">("list");
  const { isSubscribed, refresh: refreshSubscription } = useSubscription();
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState("premium resources");

  const aiSubjectTopics = getAiSubject(subjectName) || {};
  const availableAiUnits = [1, 2, 3, 4, 5].filter(
    (u) => Array.isArray(aiSubjectTopics[u.toString()]) && aiSubjectTopics[u.toString()].length > 0
  );
  const hasAiModule = availableAiUnits.length > 0;

  const selectedUnitNumber = (() => {
    const m = selectedCategory.match(/^Unit (\d)$/);
    return m ? parseInt(m[1]) : null;
  })();

  const aiAvailableForSelectedUnit =
    selectedUnitNumber !== null && availableAiUnits.includes(selectedUnitNumber);
  const targetAiUnit = aiAvailableForSelectedUnit
    ? selectedUnitNumber!
    : availableAiUnits[0] ?? 1;

  useEffect(() => {
    if (open && subjectId) loadResources();
  }, [open, subjectId]);

  const loadResources = async () => {
    const { data, error } = await supabase
      .from("resources")
      .select("id, title, type, url, created_at, created_by, category, unit_number")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load resources"); return; }
    setResources(data || []);
  };

  const getResourcesByCategory = (category: string) =>
    resources.filter((r) => r.category === category);

  const getCategoryLabel = (category: string) =>
    category === "Previous Papers" ? "PYQs" : category;

  const selectedResources = getResourcesByCategory(selectedCategory);

  const isLockedCategory = (category: string) => {
    if (isSubscribed) return false;
    return (
      category === "Unit 4" ||
      category === "Unit 5" ||
      category === "Previous Papers"
    );
  };

  const handleCategoryClick = (category: string) => {
    if (isLockedCategory(category)) {
      setLockedFeatureName(
        category === "Previous Papers" ? "Previous Papers" : category
      );
      setIsPremiumDialogOpen(true);
      return;
    }
    setSelectedCategory(category);
  };

  const handleAiTransition = () => {
    if (!onOpenAiDrawer) return;
    onOpenChange(false);
    setTimeout(() => onOpenAiDrawer(subjectId, subjectName, targetAiUnit), 250);
  };

  const CATEGORIES = [
    "Syllabus",
    "Unit 1",
    "Unit 2",
    "Unit 3",
    "Unit 4",
    "Unit 5",
    "Previous Papers",
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[100dvh] sm:h-[94vh] max-h-[100dvh] w-full mx-auto rounded-none sm:rounded-t-[32px] overflow-hidden bg-[#0a0a0c] border-t border-white/10 text-zinc-100 flex flex-col focus:outline-none pointer-events-auto">
        <DrawerDescription className="hidden">
          Study Materials for {subjectName}
        </DrawerDescription>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <DrawerHeader className="relative shrink-0 border-b border-white/5 bg-[#0a0a0c] z-[60] px-4 py-4 flex flex-col items-center justify-center min-h-[90px]">
          {/* Close */}
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 z-[70] pointer-events-auto text-zinc-400 hover:bg-white/5 rounded-full transition-colors h-10 w-10"
            >
              <X className="h-6 w-6" />
            </Button>
          </DrawerClose>

          {/* AI Quick Button */}
          {hasAiModule && (
            <button
              onClick={(e) => { e.stopPropagation(); handleAiTransition(); }}
              className="absolute left-3 top-3 z-[70] pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-all duration-300 group shadow-lg"
            >
              <img src={genai} alt="AI" className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[11px] font-bold tracking-tight uppercase sm:inline hidden">
                Try AI Learning
              </span>
              <span className="text-[11px] font-bold uppercase sm:hidden inline">
                Try AI
              </span>
            </button>
          )}

          <div className="flex items-center gap-2 mb-0.5 text-zinc-500 mt-2 sm:mt-0">
            <BookOpen className="w-3 h-3" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
              Academic Portal
            </span>
          </div>

          <DrawerTitle className="text-lg sm:text-xl font-bold text-white text-center max-w-[70%] truncate">
            {subjectName}
          </DrawerTitle>
        </DrawerHeader>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

          {/* ── Sidebar ─────────────────────────────────────────────── */}
          {/* On mobile: fixed-height horizontal pill strip that scrolls independently */}
          {/* On desktop: full-height vertical column */}
          <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-white/5 bg-[#0d0d10] z-20 overflow-hidden">
            <nav
              className="
                flex md:flex-col
                gap-2 md:gap-1.5
                px-3 py-2.5 md:p-3
                overflow-x-auto md:overflow-x-hidden md:overflow-y-auto
                scrollbar-none
                snap-x snap-mandatory md:snap-none
                items-center md:items-stretch
                scroll-smooth
              "
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              /* Stop the Drawer (Vaul) from swallowing horizontal touch swipes */
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {CATEGORIES.map((category) => {
                const isActive = selectedCategory === category;
                const isLocked = isLockedCategory(category);
                const unitNum = category.match(/^Unit (\d)$/)
                  ? parseInt(category.match(/^Unit (\d)$/)![1])
                  : null;
                const hasAiForThis =
                  unitNum !== null && availableAiUnits.includes(unitNum);

                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={`
                      /* Sizing — compact pill on mobile, full-width row on desktop */
                      shrink-0 md:w-full
                      px-4 py-2 md:px-5 md:py-3
                      rounded-xl
                      /* Snap */
                      snap-start
                      /* Touch */
                      touch-manipulation active:scale-95
                      /* Layout */
                      flex items-center justify-between
                      /* Typography */
                      text-xs font-semibold whitespace-nowrap
                      /* Border */
                      border
                      /* Transition */
                      transition-all duration-200
                      ${isActive
                        ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-[inset_3px_0_0_0_#6366f1]"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border-transparent"
                      }
                    `}
                  >
                    <span>
                      {category === "Previous Papers" ? "PYQs" : category}
                    </span>

                    <div className="flex items-center gap-1.5 ml-2.5">
                      {hasAiForThis && !isLocked && (
                        <div className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                          <img
                            src={genai}
                            alt="AI"
                            className="relative inline-flex rounded-full h-2.5 w-2.5 opacity-90"
                          />
                        </div>
                      )}
                      {isLocked && (
                        <Lock className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Right breathing room for the last pill on mobile */}
              <div className="md:hidden shrink-0 w-2" aria-hidden />
            </nav>
          </div>

          {/* ── Main Content ─────────────────────────────────────────── */}
          <div className="flex-1 overflow-hidden bg-[#0a0a0c] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-zinc-800">

              {/* Section header + view toggle */}
              <div className="flex items-center justify-between mb-6 gap-4">
                <h3 className="text-xl font-bold text-white truncate">
                  {getCategoryLabel(selectedCategory)}
                </h3>
                <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg border border-white/5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-9 p-0 rounded-md transition-all ${
                      viewMode === "list"
                        ? "bg-white text-black"
                        : "text-zinc-500 hover:text-white"
                    }`}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-9 p-0 rounded-md transition-all ${
                      viewMode === "expanded"
                        ? "bg-white text-black"
                        : "text-zinc-500 hover:text-white"
                    }`}
                    onClick={() => setViewMode("expanded")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* AI banner — only shown when this unit has AI */}
              {aiAvailableForSelectedUnit && (
                <button
                  onClick={handleAiTransition}
                  className="w-full mb-8 group relative overflow-hidden flex items-center gap-4 p-5 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 via-[#111] to-transparent hover:border-violet-500/40 transition-all duration-500 active:scale-[0.98] touch-manipulation"
                >
                  <div className="absolute top-0 right-0 w-32 h-full bg-violet-600/5 blur-3xl pointer-events-none" />

                  <div className="shrink-0 w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <img src={genai} alt="AI" className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-violet-200 mb-0.5 flex items-center gap-1.5">
                      Smart AI Learning
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-violet-500/30 text-violet-300 uppercase font-black">
                        AI DRIVEN
                      </span>
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2">
                      Master this unit with syllabus-driven Q&A and topic breakdowns.
                    </p>
                  </div>

                  <div className="shrink-0">
                    <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-violet-500/20 transition-all">
                      <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-violet-200" />
                    </div>
                  </div>
                </button>
              )}

              {/* Resources grid / list */}
              {selectedResources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6 text-zinc-700" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-500 tracking-wide">
                    No Resources Uploaded Yet
                  </h4>
                  <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">
                    Check back later
                  </p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === "list"
                      ? "space-y-4"
                      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  }
                >
                  {selectedResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      viewMode={viewMode}
                      userRole={userRole}
                      userId={userId}
                      onUpdate={loadResources}
                    />
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      </DrawerContent>

      <PremiumUnlockDialog
        open={isPremiumDialogOpen}
        onOpenChange={setIsPremiumDialogOpen}
        title="Unlock Premium Access"
        description="Unlock Unit 4, 5 and PYQs with a one-time payment of ₹11."
        featureName={lockedFeatureName}
        priceLabel="₹11"
        onPaymentSuccess={async () => {
          await refreshSubscription();
          setIsPremiumDialogOpen(false);
        }}
      />
    </Drawer>
  );
}