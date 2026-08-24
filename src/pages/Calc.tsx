import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import GradeGuru from "@/components/calculator/GradeGuru";
import CGPAPredictor from "@/components/calculator/CGPAPredictor";
import AttendanceCalculator from "@/components/AttendanceCalculator";
import dinoLogo from "@/assets/dinosaurWhite.png";
import { ArrowLeft, Calculator, CalendarDays, BookOpen, Briefcase, Globe, ArrowRight, Target } from "lucide-react";
import { GenAiIcon } from "@/components/BrandIcons";
import { AGENTFURY_EXT } from "@/lib/links";

type Tab = "sgpa" | "cgpa" | "attendance";

/** Public calculator hub — SGPA + Attendance toggle, no login required.
 *  Promotes the paid USPs (subjects, jobs, agent) around the free tools. */
export default function Calc({ initial = "sgpa" }: { initial?: Tab }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(initial);
  const { isOn } = useFeatureFlags();

  const promos = [
    { title: "Explore subjects", desc: "Notes, PYQs & Study-With-AI.", icon: BookOpen, onClick: () => navigate("/store"), accent: "#6b8afd" },
    ...(isOn("jobs") ? [{ title: "Placement Prep", desc: "Company patterns & questions.", icon: Briefcase, onClick: () => navigate("/jobs"), accent: "#34d399" }] : []),
    ...(isOn("agent") ? [{ title: "Agent Fury", desc: "Create agents — email fetch & summarize.", icon: GenAiIcon, onClick: () => window.open(AGENTFURY_EXT, "_blank"), accent: "#7c6cf0" }] : []),
    { title: "FolioFYX", desc: "Build your portfolio site.", icon: Globe, onClick: () => window.open("https://www.foliofyx.in", "_blank"), accent: "#f472b6" },
  ];

  return (
    <div className="td-app min-h-screen td-base text-zinc-100 font-sans flex flex-col">
      <header className="sticky top-0 z-40 td-glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl td-nav-chip flex items-center justify-center"><img src={dinoLogo} alt="TeamDino" className="td-nav-logo w-5 h-5" /></div>
            <span className="font-bold tracking-tight text-white">TeamDino</span>
          </Link>
          <Link to="/" className="td-btn-ghost px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> Home</Link>
        </div>
      </header>

      <main className="td-page flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Toggle */}
        <div className="flex items-center justify-center mb-7">
          <div className="td-surface rounded-full p-1 flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <button onClick={() => setTab("sgpa")} className={`px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap ${tab === "sgpa" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
              <Calculator className="w-4 h-4" /> Grade Calc
            </button>
            <button onClick={() => setTab("cgpa")} className={`px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap ${tab === "cgpa" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
              <Target className="w-4 h-4" /> CGPA Predictor
            </button>
            <button onClick={() => setTab("attendance")} className={`px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap ${tab === "attendance" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
              <CalendarDays className="w-4 h-4" /> Attendance
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start">
          {/* Calculator */}
          <div className="min-w-0">
            {tab === "attendance" && (
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">Attendance Calculator(VSP)</h1>
                <p className="text-zinc-500">Plan exactly how many classes you can miss. Free · no login.</p>
              </div>
            )}
            {tab === "sgpa" && <GradeGuru />}
            {tab === "cgpa" && <CGPAPredictor />}
            {tab === "attendance" && <div className="td-surface rounded-[32px] p-5 sm:p-6"><AttendanceCalculator /></div>}
          </div>

          {/* Promo rail */}
          <aside className="lg:sticky lg:top-24 space-y-3">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-zinc-500 px-1">More from TeamDino</p>
            {promos.map((p) => (
              <button key={p.title} onClick={p.onClick} className="w-full td-surface td-card-click rounded-2xl p-4 text-left flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${p.accent}1f`, color: p.accent }}><p.icon className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1"><p className="text-white text-sm font-semibold truncate">{p.title}</p><p className="text-zinc-500 text-xs truncate">{p.desc}</p></div>
                <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />
              </button>
            ))}
            <div className="td-banner-bw rounded-2xl p-4 text-center">
              <p className="font-semibold text-sm">Loved the free tools?</p>
              <p className="td-bw-soft text-xs mt-1 mb-3">Unlock full subjects from ₹11.</p>
              <button onClick={() => navigate("/store")} className="td-bw-chip w-full py-2 rounded-full text-sm font-semibold">Explore subjects</button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
