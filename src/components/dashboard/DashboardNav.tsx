import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Lock,
  ChevronRight,
  BookOpen,
  CalendarDays,
  Globe,
  Calculator,
  Megaphone,
  X,
} from "lucide-react";
import genai from "@/assets/aiWhite.png";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumUnlockDialog } from "../PremiumUnlockDialog";

interface DashboardNavProps {
  firstName: string;
  activeTab: string;
  handleTabClick: (tab: any) => void;
}

const GenAIIcon = ({ className }: { className?: string }) => (
  <img src={genai} alt="AI" className={className} />
);

const navCards = [
  {
    id: "subjects",
    overline: "LEARNING",
    title: "Your Subjects",
    desc: "Access all your organized course materials.",
    icon: BookOpen,
    bgGradient: "from-sky-950/55 via-blue-950/35 to-indigo-950/40",
    iconTint: "text-sky-300/15",
    glow: "shadow-[0_0_42px_-10px_rgba(56,189,248,0.22)]",
    buttonText: "Start Studying Now",
    requiresSubscription: false,
  },
  {
    id: "ai_subjects",
    overline: "AI LEARNING",
    title: "Study with AI",
    desc: "Access smart AI tools, summaries, and personalized help.",
    icon: GenAIIcon,
    bgGradient: "from-cyan-950/55 via-slate-950/40 to-emerald-950/35",
    iconTint: "opacity-[0.09] grayscale",
    glow: "shadow-[0_0_44px_-10px_rgba(34,211,238,0.22)]",
    buttonText: "Get AI Assistance",
    requiresSubscription: false,
  },
  {
    id: "sgpa",
    overline: "PERFORMANCE",
    title: "SGPA Calc",
    desc: "Estimate your semester grades easily.",
    icon: Calculator,
    bgGradient: "from-violet-950/50 via-fuchsia-950/30 to-purple-950/35",
    iconTint: "text-fuchsia-300/15",
    glow: "shadow-[0_0_42px_-10px_rgba(192,132,252,0.20)]",
    buttonText: "Unlock to Access",
    unlockedText: "Open Calculator",
    requiresSubscription: true,
  },
  {
    id: "foliofyx",
    overline: "CREATE YOUR WEBSITE",
    title: "FolioFYX",
    desc: "Create a professional portfolio website! Share it to stand out.",
    icon: Globe,
    bgGradient: "from-fuchsia-950/45 via-pink-950/30 to-rose-950/35",
    iconTint: "text-fuchsia-300/15",
    glow: "shadow-[0_0_42px_-10px_rgba(236,72,153,0.18)]",
    externalLink: "https://www.foliofyx.in",
    buttonText: "Create Now Free",
    requiresSubscription: false,
  },
  {
    id: "attendance",
    overline: "TRACKING",
    title: "Attendance",
    desc: "Calculate your required classes.",
    icon: CalendarDays,
    bgGradient: "from-emerald-950/55 via-teal-950/35 to-cyan-950/35",
    iconTint: "text-emerald-300/15",
    glow: "shadow-[0_0_42px_-10px_rgba(16,185,129,0.22)]",
    buttonText: "Unlock to Access",
    unlockedText: "Check Attendance",
    requiresSubscription: true,
  },
  {
    id: "announcements",
    overline: "UPDATES",
    title: "Announcements",
    desc: "Stay informed with campus news.",
    icon: Megaphone,
    bgGradient: "from-amber-950/55 via-orange-950/35 to-red-950/30",
    iconTint: "text-orange-300/15",
    glow: "shadow-[0_0_42px_-10px_rgba(249,115,22,0.20)]",
    buttonText: "View Updates",
    requiresSubscription: false,
  },
];

export function DashboardNav({
  firstName,
  activeTab,
  handleTabClick,
}: DashboardNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const aiCardRef = useRef<HTMLDivElement>(null);

  const { isSubscribed, refresh: refreshSubscription } = useSubscription();

  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState("premium feature");

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleProtectedCardClick = (card: any) => {
    const isExternal = "externalLink" in card;

    if (isExternal) {
      window.open(card.externalLink, "_blank");
      return;
    }

    if (card.requiresSubscription && !isSubscribed) {
      setLockedFeatureName(card.title);
      setIsPremiumDialogOpen(true);
      return;
    }

    handleTabClick(card.id);
  };

  useEffect(() => {
    const hasSeenPermanent =
      localStorage.getItem("has_seen_ai_onboarding_v5") === "true";
    const hasSeenSession =
      sessionStorage.getItem("hide_ai_tutorial_session") === "true";

    if (hasSeenPermanent || hasSeenSession) return;

    const timer = setTimeout(() => {
      setShowTutorial(true);

      if (aiCardRef.current && scrollContainerRef.current) {
        const rect = aiCardRef.current.getBoundingClientRect();
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const scrollLeft =
          aiCardRef.current.offsetLeft -
          containerRect.width / 2 +
          rect.width / 2;

        scrollContainerRef.current.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showTutorial) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showTutorial]);

  const dismissTutorial = () => {
    localStorage.setItem("has_seen_ai_onboarding_v5", "true");
    setShowTutorial(false);
  };

  const muteForSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem("hide_ai_tutorial_session", "true");
    setShowTutorial(false);
  };

  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 4);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const isMobile = window.innerWidth < 640;
      const scrollAmount =
        direction === "left"
          ? isMobile
            ? -260
            : -320
          : isMobile
            ? 260
            : 320;

      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-4 relative">
      <style>{`
        .dashboard-nav-shell {
          position: relative;
        }

        .dashboard-nav-shell::before {
          content: "";
          position: absolute;
          inset: -20px -10px auto -10px;
          height: 240px;
          background:
            radial-gradient(circle at 12% 20%, rgba(56,189,248,0.09), transparent 35%),
            radial-gradient(circle at 85% 10%, rgba(16,185,129,0.06), transparent 32%);
          pointer-events: none;
          filter: blur(28px);
          z-index: 0;
        }

        .nav-scroll {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          scroll-padding-inline: 1rem;
          touch-action: pan-x;
        }

        .nav-scroll::after {
          content: "";
          min-width: 2px;
          height: 1px;
        }

        .dashboard-card {
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          will-change: transform, opacity;
        }

        .dashboard-card-inner {
          position: relative;
          isolation: isolate;
        }

        .dashboard-card-inner::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.14),
            rgba(255,255,255,0.04)
          );
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          pointer-events: none;
          opacity: 0.9;
          z-index: 1;
        }

        .dashboard-card-gloss {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.10), transparent 28%, transparent 60%, rgba(255,255,255,0.03)),
            radial-gradient(circle at top right, rgba(255,255,255,0.10), transparent 30%);
          opacity: 0.55;
          pointer-events: none;
          z-index: 0;
        }

        .dashboard-card-noise {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          opacity: 0.022;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 150px;
          pointer-events: none;
          z-index: 0;
        }

        .dashboard-card-spot {
          position: absolute;
          inset: auto;
          width: 160px;
          height: 160px;
          right: -40px;
          top: -30px;
          border-radius: 9999px;
          filter: blur(40px);
          opacity: 0.22;
          pointer-events: none;
          z-index: 0;
          transition: opacity 0.35s ease, transform 0.35s ease;
        }

        .dashboard-card:hover .dashboard-card-spot {
          opacity: 0.30;
          transform: scale(1.06);
        }

        .dashboard-icon-wrap {
          transform: translateZ(0);
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease;
        }

        .dashboard-card:hover .dashboard-icon-wrap {
          transform: scale(1.08) rotate(-3deg);
        }

        .dashboard-cta {
          backdrop-filter: blur(12px);
        }

        .tutorial-card {
          background:
            linear-gradient(180deg, rgba(18,18,24,0.96) 0%, rgba(13,13,18,0.98) 100%);
          box-shadow:
            0 30px 60px -15px rgba(0,0,0,0.8),
            0 0 0 1px rgba(255,255,255,0.08) inset;
        }

        .tutorial-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.10), transparent 26%, transparent 70%, rgba(255,255,255,0.03));
          pointer-events: none;
        }

        .nav-fade-left,
        .nav-fade-right {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 42px;
          pointer-events: none;
          z-index: 15;
        }

        .nav-fade-left {
          left: 0;
          background: linear-gradient(to right, rgba(9,9,11,0.92), transparent);
        }

        .nav-fade-right {
          right: 0;
          background: linear-gradient(to left, rgba(9,9,11,0.92), transparent);
        }

        @media (hover: hover) and (pointer: fine) {
          .dashboard-card {
            transition:
              transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.35s ease,
              filter 0.35s ease;
          }

          .dashboard-card:hover {
            transform: translateY(-4px);
          }

          .dashboard-card-inner {
            transition:
              transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.35s ease,
              border-color 0.35s ease,
              background-color 0.35s ease;
          }

          .dashboard-card:hover .dashboard-card-inner {
            box-shadow: 0 18px 42px rgba(0,0,0,0.28);
          }
        }

        @media (hover: none), (pointer: coarse) {
          .dashboard-card {
            transition: transform 0.14s ease, opacity 0.25s ease, filter 0.25s ease;
          }

          .dashboard-card:active {
            transform: scale(0.985);
          }

          .dashboard-card-inner {
            transition:
              transform 0.14s ease,
              box-shadow 0.2s ease,
              border-color 0.2s ease,
              background-color 0.2s ease;
          }

          .dashboard-card-gloss {
            opacity: 0.45;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-card,
          .dashboard-card-inner,
          .dashboard-icon-wrap,
          .dashboard-card-spot {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>

      <div className="dashboard-nav-shell">
        {showTutorial && (
          <div
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-md animate-in fade-in duration-500"
            onClick={dismissTutorial}
          />
        )}

        <div className="flex items-start sm:items-center justify-between px-2 animate-in slide-in-from-bottom-4 fade-in duration-700 gap-4 relative z-[50]">
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
            Hey {firstName},{" "}
            <span className="text-zinc-500 font-medium block sm:inline">
              check the latest tools.
            </span>
          </h2>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pt-1 sm:pt-0">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-zinc-900/55 border-white/10 text-white hover:bg-white hover:text-black disabled:opacity-30 transition-all shadow-[0_6px_18px_rgba(0,0,0,0.18)]"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-zinc-900/55 border-white/10 text-white hover:bg-white hover:text-black disabled:opacity-30 transition-all shadow-[0_6px_18px_rgba(0,0,0,0.18)]"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        <div
          className={`relative animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150 fill-mode-both ${
            showTutorial ? "z-[65]" : "z-10"
          }`}
        >
          {!showTutorial && canScrollLeft && <div className="nav-fade-left" />}
          {!showTutorial && canScrollRight && <div className="nav-fade-right" />}

          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="nav-scroll flex overflow-x-auto pt-6 pb-[260px] sm:pb-12 -mx-4 px-4 sm:px-6 gap-5 snap-x snap-mandatory mb-[-260px] sm:mb-0 items-start overflow-y-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {navCards.map((card) => {
              const isLocked = !!card.requiresSubscription && !isSubscribed;
              const isExternal = "externalLink" in card;
              const isActive = activeTab === card.id && !isExternal;
              const isAiCard = card.id === "ai_subjects";

              const isDimmed = showTutorial && !isAiCard;
              const isSpotlit = showTutorial && isAiCard;

              return (
                <div
                  key={card.id}
                  ref={isAiCard ? aiCardRef : null}
                  className={`dashboard-card snap-center shrink-0 relative transition-all duration-500
                    ${isDimmed ? "opacity-20 blur-sm scale-95 pointer-events-none" : "z-20"}
                    ${isSpotlit ? "z-[100]" : ""}
                  `}
                >
                  {isSpotlit && (
                    <div className="absolute top-[calc(100%+20px)] left-1/2 -translate-x-1/2 w-[290px] sm:w-[320px] sm:left-[calc(100%+24px)] sm:top-0 sm:translate-x-0 z-[110] animate-in zoom-in-95 fade-in slide-in-from-top-2 duration-300 pointer-events-auto">
                      <div className="tutorial-card relative backdrop-blur-3xl border border-white/15 rounded-[28px] p-5">
                        <div className="flex justify-between items-start mb-3 relative z-10">
                          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/10 rounded-full border border-white/15">
                            <img src={genai} alt="AI" className="w-4 h-4" />
                            <span className="text-[10px] tracking-widest text-cyan-100 uppercase">
                              Introducing
                            </span>
                          </div>

                          <button
                            onClick={dismissTutorial}
                            className="p-1.5 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <h4 className="text-white font-bold text-lg mb-1 leading-tight relative z-10">
                          AI Study Buddy
                        </h4>

                        <p className="text-zinc-400 text-xs leading-relaxed mb-5 opacity-90 relative z-10">
                          Get instant concept breakdowns and personalized summaries
                          for your specific subjects.
                        </p>

                        <div className="space-y-2 relative z-10">
                          <Button
                            onClick={() => {
                              dismissTutorial();
                              handleTabClick("ai_subjects");
                            }}
                            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-2xl h-12 transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                          >
                            Try it now
                          </Button>

                          <button
                            onClick={muteForSession}
                            className="w-full text-center text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors py-1"
                          >
                            Don&apos;t show again this session
                          </button>
                        </div>
                      </div>

                      <div className="hidden sm:block absolute left-[-6px] top-10 w-4 h-4 bg-[#121218] border-l border-t border-white/15 rotate-[-45deg]" />
                    </div>
                  )}

                  <div
                    onClick={() => {
                      if (isDimmed) return;

                      if (isSpotlit) {
                        dismissTutorial();
                        handleTabClick(card.id);
                        return;
                      }

                      if (!showTutorial) {
                        handleProtectedCardClick(card);
                      }
                    }}
                    className={`
                      dashboard-card-inner
                      w-[240px] sm:w-[280px] h-[300px] sm:h-[360px]
                      rounded-[24px] sm:rounded-[32px] p-6 sm:p-8
                      flex flex-col justify-between cursor-pointer
                      relative overflow-hidden group border
                      ${
                        isActive
                          ? `bg-white border-transparent text-black scale-[1.02] ${card.glow}`
                          : `bg-gradient-to-br ${card.bgGradient} border-white/10 text-white hover:border-white/20`
                      }
                      ${
                        isSpotlit
                          ? "ring-2 ring-white/35 shadow-2xl scale-[1.03]"
                          : ""
                      }
                    `}
                  >
                    <div className="dashboard-card-gloss" />
                    <div className="dashboard-card-noise" />
                    <div
                      className={`dashboard-card-spot ${
                        card.id === "subjects"
                          ? "bg-sky-400/30"
                          : card.id === "ai_subjects"
                            ? "bg-cyan-300/30"
                            : card.id === "sgpa"
                              ? "bg-fuchsia-300/25"
                              : card.id === "foliofyx"
                                ? "bg-pink-300/25"
                                : card.id === "attendance"
                                  ? "bg-emerald-300/25"
                                  : "bg-orange-300/25"
                      }`}
                    />

                    {isLocked && (
                      <div className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-zinc-200 text-[10px] font-bold tracking-widest uppercase backdrop-blur-md">
                        <Lock className="w-3 h-3" />
                        Locked
                      </div>
                    )}

                    <div className="z-10 flex flex-col h-full relative">
                      <div>
                        <p
                          className={`text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mb-2 sm:mb-3 ${
                            isActive ? "text-zinc-500" : "text-zinc-300"
                          }`}
                        >
                          {card.overline}
                        </p>

                        <h3
                          className={`text-2xl sm:text-3xl font-semibold tracking-tight leading-tight mb-3 sm:mb-4 ${
                            isActive ? "text-black" : "text-white"
                          }`}
                        >
                          {card.title}
                        </h3>

                        <p
                          className={`text-xs sm:text-sm font-medium leading-relaxed max-w-[17rem] ${
                            isActive ? "text-zinc-600" : "text-zinc-300"
                          }`}
                        >
                          {card.desc}
                        </p>
                      </div>

                      <div className="mt-auto pt-4 relative z-20">
                        <Button
                          className={`dashboard-cta w-full rounded-full font-bold shadow-none py-5 sm:py-6 text-xs sm:text-sm transition-all duration-300
                            ${
                              isLocked
                                ? "bg-white/10 text-white hover:bg-white/15"
                                : isActive
                                  ? "bg-black text-white hover:bg-zinc-800 hover:scale-[1.02]"
                                  : "bg-white/10 text-white hover:bg-white/20 hover:scale-[1.02]"
                            }
                          `}
                        >
                          {isLocked
                            ? "Unlock for ₹11"
                            : (card as any).unlockedText || card.buttonText}
                        </Button>
                      </div>
                    </div>

                    <card.icon
                      className={`dashboard-icon-wrap absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-40 h-40 sm:w-48 sm:h-48
                        ${isActive ? "text-black/5" : card.iconTint}
                      `}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <PremiumUnlockDialog
          open={isPremiumDialogOpen}
          onOpenChange={setIsPremiumDialogOpen}
          title="Unlock Premium Access"
          description="Pay ₹11 once to unlock the full website, including premium calculators, advanced units, and other locked features."
          featureName={lockedFeatureName}
          priceLabel="₹11"
          onPaymentSuccess={async () => {
            await refreshSubscription();
            setIsPremiumDialogOpen(false);
          }}
        />
      </div>
    </div>
  );
}