import { useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  BookOpen,
  Layers,
  ChevronRight,
  Search,
  X,
  Command,
} from "lucide-react";
import genai from "@/assets/aiWhite.png";

export function SubjectCard({ subject, index, activeTab, onClick }: any) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const isAi = subject.is_ai || activeTab === "ai_subjects";

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;

    card.style.setProperty("--rx", `${y}deg`);
    card.style.setProperty("--ry", `${x}deg`);
    card.style.setProperty(
      "--shine-x",
      `${((e.clientX - rect.left) / rect.width) * 100}%`
    );
    card.style.setProperty(
      "--shine-y",
      `${((e.clientY - rect.top) / rect.height) * 100}%`
    );
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;

    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      className="subject-card group relative"
      style={{ animationDelay: `${index * 40}ms` } as React.CSSProperties}
    >
      <button
        type="button"
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative rounded-[20px] h-[220px] w-full card-inner border border-zinc-800 bg-[#09090b] transition-all duration-300 group-hover:border-zinc-500 overflow-hidden flex flex-col p-6 justify-between text-left cursor-pointer"
      >
        <div className="shine-overlay absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100" />

        <div className="flex justify-between items-start z-10">
          <div
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-tight border flex items-center gap-1.5 ${
              isAi
                ? "bg-purple-500/10 border-purple-500/20 text-white"
                : "bg-zinc-800/50 border-zinc-700 text-zinc-400"
            }`}
          >
            {isAi ? (
              <img src={genai} alt="AI" className="w-3 h-3" />
            ) : (
              <Layers className="w-3 h-3" />
            )}
            {isAi ? "AI DRIVEN" : "RESOURCES"}
          </div>

          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-200 transition-colors pointer-events-none" />
        </div>

        <div className="z-10 pointer-events-none">
          <h3 className="text-lg font-semibold text-zinc-100 leading-tight mb-2 group-hover:text-white transition-colors">
            {subject.name}
          </h3>
          <p className="text-zinc-500 text-xs font-medium flex items-center gap-1">
            {isAi
              ? "Click to launch smart study session"
              : "Access course materials"}
          </p>
        </div>
      </button>
    </div>
  );
}

export function SubjectGrid({
  activeTab,
  isContributor,
  searchQuery,
  setSearchQuery,
  filteredSubjects,
  setIsUploadDialogOpen,
  handleSubjectClick,
}: any) {
  const isAiTab = activeTab === "ai_subjects";
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const dropdownResults = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return filteredSubjects
      .filter((s: any) => s.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [searchQuery, filteredSubjects]);

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto px-4 pb-20 relative">
      <style>{`
        .subject-card { perspective: 1000px; }
        .card-inner {
          transform-style: preserve-3d;
          transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
          transition: transform 0.1s ease-out, border-color 0.3s ease;
          will-change: transform;
        }
        .shine-overlay {
          background: radial-gradient(circle at var(--shine-x, 50%) var(--shine-y, 50%), rgba(255,255,255,0.08) 0%, transparent 70%);
        }
      `}</style>

      <div className="mb-6 flex justify-center relative z-30">
        <div className="relative w-full sm:w-[400px] md:w-[480px] group pointer-events-auto">
          <div
            className={`relative flex items-center bg-[#18181b] border transition-all duration-300 rounded-3xl px-3 h-10 cursor-text ${
              isSearchFocused
                ? "border-zinc-400 ring-4 ring-zinc-400/5"
                : "border-zinc-800"
            }`}
            onClick={() => inputRef.current?.focus()}
            onTouchStart={() => inputRef.current?.focus()}
          >
            <Search
              className={`w-4 h-4 mr-2 pointer-events-none shrink-0 transition-colors ${
                isSearchFocused ? "text-zinc-200" : "text-zinc-500"
              }`}
            />

            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search subjects..."
              className="bg-transparent border-none outline-none text-zinc-200 text-sm flex-1 min-w-0 w-full placeholder:text-zinc-600 focus:ring-0"
            />

            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  inputRef.current?.focus();
                }}
                className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 shrink-0">
                <Command className="w-2.5 h-2.5 text-zinc-500" />
                <span className="text-[10px] text-zinc-500 font-bold">K</span>
              </div>
            )}
          </div>

          {isSearchFocused && dropdownResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2">
              <div className="p-1.5">
                {dropdownResults.map((sub: any) => {
                  const isAi = sub.is_ai || activeTab === "ai_subjects";
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSubjectClick(sub)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-zinc-800/50 rounded-lg transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-md flex items-center justify-center border ${
                            isAi
                              ? "bg-purple-500/10 border-purple-500/20"
                              : "bg-zinc-900 border-zinc-800"
                          }`}
                        >
                          {isAi ? (
                            <img src={genai} alt="AI" className="w-3.5 h-3.5" />
                          ) : (
                            <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                        </div>
                        <div>
                          <div className="text-zinc-200 text-xs font-semibold">
                            {sub.name}
                          </div>
                          <div className="text-zinc-500 text-[10px]">
                            {isAi ? "AI Buddy" : "Resources"}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-zinc-700 group-hover:text-zinc-300 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-0">
        {filteredSubjects.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-zinc-800 rounded-[32px] bg-zinc-900/20">
            <Search className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <h3 className="text-zinc-300 font-bold text-lg">No results found</h3>
            <p className="text-zinc-500 text-sm mt-1">
              Try a different subject name.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-700">
            {filteredSubjects.map((subject: any, index: number) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                index={index}
                activeTab={activeTab}
                onClick={() => handleSubjectClick(subject)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}