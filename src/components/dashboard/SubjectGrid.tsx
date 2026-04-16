// import { useRef, useState, useMemo } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Upload,
//   BookPlus,
//   BookOpen,
//   Layers,
//   ChevronRight,
//   Search,
//   X,
//   Command,
// } from "lucide-react";
// import genai from "@/assets/aiWhite.png";

// export function SubjectCard({ subject, index, activeTab, onClick }: any) {
//   const cardRef = useRef<HTMLButtonElement>(null);
//   const isAi = subject.is_ai || activeTab === "ai_subjects";

//   const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
//     const card = cardRef.current;
//     if (!card) return;

//     const rect = card.getBoundingClientRect();
//     const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
//     const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;

//     card.style.setProperty("--rx", `${y}deg`);
//     card.style.setProperty("--ry", `${x}deg`);
//     card.style.setProperty(
//       "--shine-x",
//       `${((e.clientX - rect.left) / rect.width) * 100}%`
//     );
//     card.style.setProperty(
//       "--shine-y",
//       `${((e.clientY - rect.top) / rect.height) * 100}%`
//     );
//   };

//   const handleMouseLeave = () => {
//     const card = cardRef.current;
//     if (!card) return;

//     card.style.setProperty("--rx", "0deg");
//     card.style.setProperty("--ry", "0deg");
//   };

//   return (
//     <div
//       className="subject-card group relative"
//       style={{ animationDelay: `${index * 40}ms` } as React.CSSProperties}
//     >
//       <button
//         type="button"
//         ref={cardRef}
//         onClick={onClick}
//         onMouseMove={handleMouseMove}
//         onMouseLeave={handleMouseLeave}
//         className="relative rounded-[20px] h-[220px] w-full card-inner border border-zinc-800 bg-[#09090b] transition-all duration-300 group-hover:border-zinc-500 overflow-hidden flex flex-col p-6 justify-between text-left cursor-pointer"
//       >
//         <div className="shine-overlay absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100" />

//         <div className="flex justify-between items-start z-10">
//           <div
//             className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-tight border flex items-center gap-1.5 ${
//               isAi
//                 ? "bg-purple-500/10 border-purple-500/20 text-white"
//                 : "bg-zinc-800/50 border-zinc-700 text-zinc-400"
//             }`}
//           >
//             {isAi ? (
//               <img src={genai} alt="AI" className="w-3 h-3" />
//             ) : (
//               <Layers className="w-3 h-3" />
//             )}
//             {isAi ? "AI DRIVEN" : "RESOURCES"}
//           </div>

//           <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-200 transition-colors pointer-events-none" />
//         </div>

//         <div className="z-10 pointer-events-none">
//           <h3 className="text-lg font-semibold text-zinc-100 leading-tight mb-2 group-hover:text-white transition-colors">
//             {subject.name}
//           </h3>
//           <p className="text-zinc-500 text-xs font-medium flex items-center gap-1">
//             {isAi
//               ? "Click to launch smart study session"
//               : "Access course materials"}
//           </p>
//         </div>
//       </button>
//     </div>
//   );
// }

// export function SubjectGrid({
//   activeTab,
//   isContributor,
//   searchQuery,
//   setSearchQuery,
//   filteredSubjects,
//   setIsAddSubjectDialogOpen,
//   setIsUploadDialogOpen,
//   handleSubjectClick,
// }: any) {
//   const isAiTab = activeTab === "ai_subjects";
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const inputRef = useRef<HTMLInputElement>(null);

//   const dropdownResults = useMemo(() => {
//     if (!searchQuery) return [];
//     const q = searchQuery.toLowerCase();
//     return filteredSubjects
//       .filter((s: any) => s.name.toLowerCase().includes(q))
//       .slice(0, 5);
//   }, [searchQuery, filteredSubjects]);

//   return (
//     <div className="animate-in fade-in duration-700 max-w-7xl mx-auto px-4 pb-20 relative">
//       <style>{`
//         .subject-card { perspective: 1000px; }
//         .card-inner {
//           transform-style: preserve-3d;
//           transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
//           transition: transform 0.1s ease-out, border-color 0.3s ease;
//           will-change: transform;
//         }
//         .shine-overlay {
//           background: radial-gradient(circle at var(--shine-x, 50%) var(--shine-y, 50%), rgba(255,255,255,0.08) 0%, transparent 70%);
//         }
//       `}</style>

//       {isContributor && activeTab === "subjects" && (
//         <div className="mb-6 flex justify-end gap-2">
//           <Button
//             onClick={() => setIsAddSubjectDialogOpen(true)}
//             variant="ghost"
//             className="h-10 px-4 rounded-full bg-white/[0.04] border border-white/8 text-zinc-300 hover:bg-white/8 hover:text-white text-[13px] font-medium"
//           >
//             <BookPlus className="w-3.5 h-3.5 mr-2" />
//             Add
//           </Button>
//           <Button
//             onClick={() => setIsUploadDialogOpen(true)}
//             className="h-10 px-4 rounded-full bg-white text-black hover:bg-zinc-100 text-[13px] font-semibold shadow-md"
//           >
//             <Upload className="w-3.5 h-3.5 mr-2" />
//             Upload
//           </Button>
//         </div>
//       )}

//       <div className="mb-6 flex justify-center relative z-30">
//         <div className="relative w-full sm:w-[400px] md:w-[480px] group pointer-events-auto">
//           <div
//             className={`relative flex items-center bg-[#18181b] border transition-all duration-300 rounded-3xl px-3 h-10 cursor-text ${
//               isSearchFocused
//                 ? "border-zinc-400 ring-4 ring-zinc-400/5"
//                 : "border-zinc-800"
//             }`}
//             onClick={() => inputRef.current?.focus()}
//             onTouchStart={() => inputRef.current?.focus()}
//           >
//             <Search
//               className={`w-4 h-4 mr-2 pointer-events-none shrink-0 transition-colors ${
//                 isSearchFocused ? "text-zinc-200" : "text-zinc-500"
//               }`}
//             />

//             <input
//               ref={inputRef}
//               type="text"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               onFocus={() => setIsSearchFocused(true)}
//               onBlur={() => setIsSearchFocused(false)}
//               placeholder="Search subjects..."
//               className="bg-transparent border-none outline-none text-zinc-200 text-sm flex-1 min-w-0 w-full placeholder:text-zinc-600 focus:ring-0"
//             />

//             {searchQuery ? (
//               <button
//                 type="button"
//                 onClick={() => {
//                   setSearchQuery("");
//                   inputRef.current?.focus();
//                 }}
//                 className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-200"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             ) : (
//               <div className="hidden sm:flex items-center gap-1 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 shrink-0">
//                 <Command className="w-2.5 h-2.5 text-zinc-500" />
//                 <span className="text-[10px] text-zinc-500 font-bold">K</span>
//               </div>
//             )}
//           </div>

//           {isSearchFocused && dropdownResults.length > 0 && (
//             <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2">
//               <div className="p-1.5">
//                 {dropdownResults.map((sub: any) => {
//                   const isAi = sub.is_ai || activeTab === "ai_subjects";
//                   return (
//                     <button
//                       key={sub.id}
//                       type="button"
//                       onClick={() => handleSubjectClick(sub)}
//                       className="w-full flex items-center justify-between p-2.5 hover:bg-zinc-800/50 rounded-lg transition-all text-left group"
//                     >
//                       <div className="flex items-center gap-3">
//                         <div
//                           className={`w-8 h-8 rounded-md flex items-center justify-center border ${
//                             isAi
//                               ? "bg-purple-500/10 border-purple-500/20"
//                               : "bg-zinc-900 border-zinc-800"
//                           }`}
//                         >
//                           {isAi ? (
//                             <img src={genai} alt="AI" className="w-3.5 h-3.5" />
//                           ) : (
//                             <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
//                           )}
//                         </div>
//                         <div>
//                           <div className="text-zinc-200 text-xs font-semibold">
//                             {sub.name}
//                           </div>
//                           <div className="text-zinc-500 text-[10px]">
//                             {isAi ? "AI Buddy" : "Resources"}
//                           </div>
//                         </div>
//                       </div>
//                       <ChevronRight className="w-3 h-3 text-zinc-700 group-hover:text-zinc-300 transition-colors" />
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="relative z-0">
//         {filteredSubjects.length === 0 ? (
//           <div className="py-24 text-center border border-dashed border-zinc-800 rounded-[32px] bg-zinc-900/20">
//             <Search className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
//             <h3 className="text-zinc-300 font-bold text-lg">No results found</h3>
//             <p className="text-zinc-500 text-sm mt-1">
//               Try a different subject name.
//             </p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-700">
//             {filteredSubjects.map((subject: any, index: number) => (
//               <SubjectCard
//                 key={subject.id}
//                 subject={subject}
//                 index={index}
//                 activeTab={activeTab}
//                 onClick={() => handleSubjectClick(subject)}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { useRef, useState, useMemo, useCallback } from "react";
import genai from "@/assets/aiWhite.png";
import ai from "@/assets/genaiWhite.png";

/* ── Custom SVG icons ── */
const Ico = {
  layers: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 1L14 4.5 8 8 2 4.5 8 1z" />
      <path d="M2 8l6 3.5L14 8" />
      <path d="M2 11.5l6 3.5 6-3.5" />
    </svg>
  ),
  book: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3" />
      <path d="M3 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1" />
      <path d="M6 6h4m-4 3h4" />
    </svg>
  ),
  arrowUpRight: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12L12 4m0 0H6m6 0v6" />
    </svg>
  ),
  search: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <circle cx="6.5" cy="6.5" r="4" />
      <path d="M11 11l3 3" />
    </svg>
  ),
  close: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4L4 12" />
    </svg>
  ),
  chevRight: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  ),
  upload: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 11V3m-3 3l3-3 3 3" />
      <path d="M3 12h10" />
    </svg>
  ),
  bookPlus: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 2h7a1 1 0 0 1 1 1v5" />
      <path d="M3 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5" />
      <path d="M10 10h4m-2-2v4" />
    </svg>
  ),
};

/* ─── SubjectCard ─────────────────────────────────────────────── */
export function SubjectCard({ subject, index, activeTab, onClick }: any) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<number | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const isAi = subject.is_ai || activeTab === "ai_subjects";

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(hover: none), (pointer: coarse)").matches
      ) {
        return;
      }

      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (py - 0.5) * 6;
      const ry = (px - 0.5) * 8;

      if (frameRef.current) cancelAnimationFrame(frameRef.current);

      frameRef.current = requestAnimationFrame(() => {
        card.style.setProperty("--rx", `${-rx}deg`);
        card.style.setProperty("--ry", `${ry}deg`);
        card.style.setProperty("--shine-x", `${px * 100}%`);
        card.style.setProperty("--shine-y", `${py * 100}%`);
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--shine-x", "50%");
    card.style.setProperty("--shine-y", "50%");
  }, []);

  return (
    <div
      className="cg-card group"
      style={{ ["--delay" as any]: `${index * 45}ms` }}
    >
      <button
        type="button"
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onPointerDown={() => setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerCancel={() => setIsPressed(false)}
        className={`cg-card-inner relative w-full overflow-hidden select-none cursor-pointer flex flex-col justify-between ${
          isPressed ? "cg-pressed" : ""
        }`}
        style={{
          padding: "clamp(14px, 3.5vw, 18px)",
          minHeight: "clamp(154px, 27vw, 204px)",
          borderRadius: "18px",
          background: isAi
            ? "linear-gradient(180deg, rgba(12,18,21,0.98) 0%, rgba(10,15,18,0.98) 100%)"
            : "linear-gradient(180deg, rgba(16,16,18,0.98) 0%, rgba(13,13,15,0.98) 100%)",
          border: `1px solid ${
            isAi ? "rgba(90, 200, 250, 0.16)" : "rgba(255,255,255,0.08)"
          }`,
          boxShadow: isAi
            ? "0 10px 28px rgba(0,0,0,0.20)"
            : "0 10px 24px rgba(0,0,0,0.16)",
        }}
      >
        {/* subtle surface highlight */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.035), transparent 28%)",
          }}
        />

        {/* shine */}
        <div className="cg-shine absolute inset-0 pointer-events-none z-10 rounded-[inherit]" />

        {/* top edge */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{
            background: isAi
              ? "linear-gradient(to right, transparent, rgba(90,200,250,0.35), transparent)"
              : "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)",
          }}
        />

        {/* AI glow only, very subtle */}
        {isAi && (
          <div
            className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none"
            style={{
              background: "rgba(90,200,250,0.09)",
              filter: "blur(28px)",
            }}
          />
        )}

        {/* top row */}
        <div className="flex justify-between items-start relative z-20">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide"
            style={{
              background: isAi
                ? "rgba(90,200,250,0.08)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${
                isAi ? "rgba(90,200,250,0.16)" : "rgba(255,255,255,0.08)"
              }`,
              color: isAi ? "rgba(140,220,255,0.92)" : "rgba(161,161,170,1)",
            }}
          >
            {isAi ? (
              <img src={genai} alt="" className="w-3 h-3" />
            ) : (
              <span className="w-3 h-3">{Ico.layers}</span>
            )}
            {isAi ? "AI" : "Course"}
          </span>

          <div
            className="cg-arrow w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: isAi
                ? "rgba(90,200,250,0.06)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${
                isAi ? "rgba(90,200,250,0.14)" : "rgba(255,255,255,0.08)"
              }`,
              color: isAi ? "rgba(140,220,255,0.75)" : "rgba(113,113,122,1)",
            }}
          >
            <span className="w-3.5 h-3.5">{Ico.arrowUpRight}</span>
          </div>
        </div>

        {/* content */}
        <div className="relative z-20 mt-3">
          <h3
            className="font-semibold leading-snug mb-1.5 line-clamp-2"
            style={{
              fontSize: "clamp(13px, 3vw, 15px)",
              color: "rgba(244,244,245,1)",
              letterSpacing: "-0.01em",
            }}
          >
            {subject.name}
          </h3>

          <p
            className="text-[11px] font-medium flex items-center gap-1.5"
            style={{
              color: isAi ? "rgba(140,220,255,0.78)" : "rgba(113,113,122,1)",
            }}
          >
            {isAi ? (
              <>
                <img src={ai} alt="" className="w-3.5 h-3.5" />
                Smart study session
              </>
            ) : (
              <>
                <span className="w-3 h-3">{Ico.book}</span>
                Course materials
              </>
            )}
          </p>
        </div>
      </button>
    </div>
  );
}

/* ─── SubjectGrid ─────────────────────────────────────────────── */
export function SubjectGrid({
  activeTab,
  isContributor,
  searchQuery,
  setSearchQuery,
  filteredSubjects,
  setIsAddSubjectDialogOpen,
  setIsUploadDialogOpen,
  handleSubjectClick,
}: any) {
  const isAiTab = activeTab === "ai_subjects";
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const dropdownResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return filteredSubjects
      .filter((s: any) => s.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchQuery, filteredSubjects]);

  const showDropdown = isSearchFocused && dropdownResults.length > 0;

  return (
    <>
      <style>{`
        /* ── Card motion ── */
        @media (hover: hover) and (pointer: fine) {
          .cg-card {
            perspective: 900px;
          }

          .cg-card-inner {
            transform-style: preserve-3d;
            transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
            transition:
              transform 0.16s ease-out,
              border-color 0.2s ease,
              box-shadow 0.22s ease,
              background-color 0.2s ease;
            will-change: transform;
          }

          .cg-card:hover .cg-card-inner {
            transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(-2px);
            box-shadow: 0 16px 38px rgba(0,0,0,0.26) !important;
          }

          .cg-shine {
            opacity: 0;
            transition: opacity 0.22s ease;
            background:
              radial-gradient(
                circle at var(--shine-x,50%) var(--shine-y,35%),
                rgba(255,255,255,0.055) 0%,
                rgba(120,210,255,0.03) 22%,
                transparent 55%
              );
          }

          .cg-card:hover .cg-shine {
            opacity: 1;
          }

          .cg-arrow {
            transition:
              background-color 0.18s ease,
              border-color 0.18s ease,
              color 0.18s ease,
              transform 0.18s ease;
          }

          .cg-card:hover .cg-arrow {
            transform: translate(1px, -1px);
            color: rgba(244,244,245,1) !important;
            background: rgba(255,255,255,0.06) !important;
            border-color: rgba(255,255,255,0.12) !important;
          }
        }

        /* ── Touch ── */
        @media (hover: none), (pointer: coarse) {
          .cg-card-inner {
            transition: transform 0.1s ease, box-shadow 0.12s ease !important;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
          }

          .cg-card-inner:active {
            transform: scale(0.982) !important;
          }

          .cg-shine {
            display: none;
          }
        }

        /* ── Entrance ── */
        @keyframes cg-in {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .cg-card {
          animation: cg-in 0.42s cubic-bezier(0.22,1,0.36,1) both;
          animation-delay: var(--delay, 0ms);
        }

        @keyframes cg-header-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .cg-header { animation: cg-header-in 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .cg-search { animation: cg-header-in 0.4s cubic-bezier(0.22,1,0.36,1) 0.06s both; }
        .cg-actions { animation: cg-header-in 0.4s cubic-bezier(0.22,1,0.36,1) 0.04s both; }

        /* ── Search ── */
        .cg-search-bar {
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }

        .cg-search-bar:focus-within {
          border-color: rgba(255,255,255,0.14) !important;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.04);
        }

        /* ── Dropdown ── */
        @keyframes cg-drop-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .cg-dropdown {
          animation: cg-drop-in 0.18s cubic-bezier(0.22,1,0.36,1) both;
        }

        .cg-drop-item {
          transition: background-color 0.15s ease, transform 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .cg-drop-item:hover {
          background: rgba(255,255,255,0.045);
        }

        .cg-drop-item:active {
          transform: scale(0.992);
        }

        .cg-clear {
          transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
        }

        .cg-clear:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(244,244,245,1);
        }

        .cg-clear:active {
          transform: scale(0.9);
        }

        /* contributor actions */
        .cg-action-btn {
          transition:
            background-color 0.18s ease,
            color 0.18s ease,
            border-color 0.18s ease,
            transform 0.18s ease;
        }

        .cg-action-btn:hover {
          transform: translateY(-1px);
        }

        .cg-action-btn:active {
          transform: scale(0.97);
        }

        @keyframes cg-pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }

        .cg-pulse-dot {
          animation: cg-pulse 2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .cg-card,
          .cg-header,
          .cg-search,
          .cg-actions,
          .cg-dropdown,
          .cg-pulse-dot {
            animation: none !important;
          }

          .cg-card-inner,
          .cg-arrow,
          .cg-search-bar,
          .cg-drop-item,
          .cg-clear,
          .cg-action-btn {
            transition: none !important;
          }
        }
      `}</style>

      <div className="animate-in fade-in duration-400 max-w-6xl mx-auto px-3 sm:px-5 pb-24">
        {/* header */}
        <div className="cg-header mb-7 flex flex-col items-center text-center gap-2 relative">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 rounded-full pointer-events-none"
            style={{
              background: isAiTab
                ? "rgba(90,200,250,0.06)"
                : "rgba(255,255,255,0.03)",
              filter: "blur(36px)",
            }}
          />

          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold border"
            style={{
              background: isAiTab
                ? "rgba(90,200,250,0.07)"
                : "rgba(255,255,255,0.035)",
              borderColor: isAiTab
                ? "rgba(90,200,250,0.16)"
                : "rgba(255,255,255,0.08)",
              color: isAiTab ? "rgba(140,220,255,1)" : "rgba(161,161,170,1)",
              backdropFilter: "blur(12px)",
            }}
          >
            {isAiTab ? (
              <>
                <span
                  className="cg-pulse-dot w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: "rgba(90,200,250,1)" }}
                />
                AI Driven
                <img src={genai} alt="" className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span className="w-3.5 h-3.5">{Ico.layers}</span>
                Standard
              </>
            )}
          </div>

          <h2
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{
              color: "rgba(244,244,245,1)",
              letterSpacing: "-0.02em",
            }}
          >
            {isAiTab ? "AI Driven Modules" : "Standard Subjects"}
          </h2>

          <p
            className="text-sm max-w-xs leading-relaxed"
            style={{ color: "rgba(113,113,122,1)" }}
          >
            {isAiTab
              ? "Personalised sessions powered by AI — adapts to how you learn"
              : "Browse and access your course resources and materials"}
          </p>
        </div>

        {/* contributor actions */}
        {isContributor && activeTab === "subjects" && (
          <div className="cg-actions mb-5 flex justify-end gap-2 flex-wrap">
            <button
              onClick={() => setIsAddSubjectDialogOpen(true)}
              className="cg-action-btn h-9 px-4 rounded-full flex items-center gap-1.5 text-xs font-semibold"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(161,161,170,1)",
              }}
            >
              <span className="w-3.5 h-3.5">{Ico.bookPlus}</span>
              Add Subject
            </button>

            <button
              onClick={() => setIsUploadDialogOpen(true)}
              className="cg-action-btn h-9 px-4 rounded-full flex items-center gap-1.5 text-xs font-semibold"
              style={{
                background: "rgba(244,244,245,0.96)",
                color: "rgba(9,9,11,1)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <span className="w-3.5 h-3.5">{Ico.upload}</span>
              Upload
            </button>
          </div>
        )}

        {/* search */}
        <div className="cg-search mb-7 relative z-30 flex justify-center">
          <div className="relative w-full max-w-lg">
            <div
              className="cg-search-bar relative flex items-center h-11 rounded-2xl"
              style={{
                background:
                  "linear-gradient(180deg, rgba(18,18,20,0.96), rgba(15,15,17,0.96))",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(16px)",
              }}
              onClick={() => inputRef.current?.focus()}
            >
              <span
                className="ml-3.5 w-4 h-4 shrink-0"
                style={{
                  color: isSearchFocused
                    ? "rgba(161,161,170,1)"
                    : "rgba(82,82,91,1)",
                }}
              >
                {Ico.search}
              </span>

              <input
                ref={inputRef}
                type="text"
                inputMode="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 160)}
                placeholder="Search subjects…"
                className="flex-1 bg-transparent border-none outline-none text-sm px-3 min-w-0 focus:ring-0"
                style={{ color: "rgba(244,244,245,1)" }}
              />

              {searchQuery ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setSearchQuery("");
                    inputRef.current?.focus();
                  }}
                  className="cg-clear mr-3 w-6 h-6 flex items-center justify-center rounded-full"
                  style={{ color: "rgba(113,113,122,1)" }}
                >
                  <span className="w-3 h-3">{Ico.close}</span>
                </button>
              ) : (
                <div
                  className="mr-3 hidden sm:flex items-center px-1.5 py-0.5 rounded-md"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <span
                    className="text-[9px] font-bold tracking-wide"
                    style={{ color: "rgba(113,113,122,1)" }}
                  >
                    ⌘K
                  </span>
                </div>
              )}
            </div>

            {/* suggestions */}
            {showDropdown && (
              <div
                className="cg-dropdown absolute top-[calc(100%+10px)] left-0 right-0 overflow-hidden z-50"
                style={{
                  borderRadius: "18px",
                  background:
                    "linear-gradient(180deg, rgba(20,20,22,0.98), rgba(15,15,17,0.98))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.46)",
                }}
              >
                <ul className="p-1.5" role="listbox">
                  {dropdownResults.map((sub: any, i: number) => {
                    const subIsAi = sub.is_ai || activeTab === "ai_subjects";

                    return (
                      <li key={sub.id} role="option">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setIsSearchFocused(false);
                            handleSubjectClick(sub);
                          }}
                          className="cg-drop-item w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left group/item"
                          style={{ animationDelay: `${i * 25}ms` }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                              style={{
                                background: subIsAi
                                  ? "rgba(90,200,250,0.07)"
                                  : "rgba(255,255,255,0.04)",
                                border: `1px solid ${
                                  subIsAi
                                    ? "rgba(90,200,250,0.15)"
                                    : "rgba(255,255,255,0.08)"
                                }`,
                                color: subIsAi
                                  ? "rgba(140,220,255,0.8)"
                                  : "rgba(113,113,122,1)",
                              }}
                            >
                              {subIsAi ? (
                                <img src={genai} alt="" className="w-4 h-4" />
                              ) : (
                                <span className="w-3.5 h-3.5">{Ico.book}</span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p
                                className="text-sm font-semibold truncate"
                                style={{ color: "rgba(228,228,231,1)" }}
                              >
                                {sub.name}
                              </p>
                              <p
                                className="text-[10px] mt-0.5"
                                style={{ color: "rgba(82,82,91,1)" }}
                              >
                                {subIsAi ? "AI Module" : "Resources"}
                              </p>
                            </div>
                          </div>

                          <span
                            className="w-4 h-4 shrink-0"
                            style={{ color: "rgba(82,82,91,1)" }}
                          >
                            {Ico.chevRight}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* grid */}
        {filteredSubjects.length === 0 ? (
          <div
            className="py-20 text-center rounded-3xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              animation: "cg-in 0.35s ease both",
            }}
          >
            <div
              className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
              style={{ color: "rgba(63,63,70,1)" }}
            >
              <svg
                className="w-full h-full"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <circle cx="22" cy="22" r="14" />
                <path d="M33 33l8 8" />
              </svg>
            </div>
            <h3
              className="font-semibold text-sm mb-1"
              style={{ color: "rgba(161,161,170,1)" }}
            >
              No results found
            </h3>
            <p
              className="text-xs"
              style={{ color: "rgba(82,82,91,1)" }}
            >
              Try a different subject name.
            </p>
          </div>
        ) : (
          <div
            className="grid gap-3.5"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 210px), 1fr))",
            }}
          >
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
    </>
  );
}