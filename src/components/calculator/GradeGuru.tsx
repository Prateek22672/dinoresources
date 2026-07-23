import { useState, useEffect } from "react";
import {
  GGCourse, GradeLetter, GRADE_OPTIONS, GRADE_CHART, GRADE_POINTS,
  newCourse, courseFinal, calcSGPA, calcCGPA,
} from "@/lib/gradeguru";
import {
  BookOpen, Award, Calculator, TrendingUp, Plus, Trash2, ChevronDown, Sparkles,
  GraduationCap, FlaskConical, Info, RotateCcw,
} from "lucide-react";

const STEPS = [
  { label: "Course & WGP", icon: BookOpen },
  { label: "Letter Grade", icon: Award },
  { label: "SGPA", icon: Calculator },
  { label: "CGPA", icon: TrendingUp },
];

const gradeColor = (g: string) => GRADE_CHART.find((c) => c.letter === g)?.color ?? "#a1a1aa";

export default function GradeGuru() {
  const [courses, setCourses] = useState<GGCourse[]>([newCourse()]);
  const [chartOpen, setChartOpen] = useState(false);
  const [showCGPA, setShowCGPA] = useState(false);
  const [prevCGPA, setPrevCGPA] = useState("");
  const [prevCredits, setPrevCredits] = useState("");

  useEffect(() => {
    try { const s = localStorage.getItem("gg-courses"); if (s) setCourses(JSON.parse(s)); } catch { /* */ }
  }, []);
  useEffect(() => { try { localStorage.setItem("gg-courses", JSON.stringify(courses)); } catch { /* */ } }, [courses]);

  const update = (id: string, patch: Partial<GGCourse>) => setCourses((p) => p.map((c) => c.id === id ? { ...c, ...patch } : c));
  const remove = (id: string) => setCourses((p) => p.filter((c) => c.id !== id));
  const add = () => setCourses((p) => [...p, newCourse()]);
  const reset = () => { setCourses([newCourse()]); setShowCGPA(false); };

  const sg = calcSGPA(courses.filter((c) => courseFinal(c)));
  const anyWGP = courses.some((c) => courseFinal(c));
  const hasResult = sg.totalCredits > 0;
  const step = showCGPA ? 4 : hasResult ? 3 : anyWGP ? 2 : 1;
  const cgpa = calcCGPA(sg.sgpa, sg.totalCredits, parseFloat(prevCGPA) || 0, parseInt(prevCredits) || 0);

  return (
    <div className="gg space-y-6">
      <style>{`
        .gg { --gg-pink:#ec4899; --gg-purple:#a855f7; --gg-cyan:#22d3ee; }
        .gg-dots { background-image: radial-gradient(circle at 1px 1px, rgba(168,85,247,0.18) 1px, transparent 0); background-size: 22px 22px; }
        .gg-grad { background: rgba(168,85,247,0.15); }
        .gg-card-head { background: rgba(168,85,247,0.12); }
        .gg-sel { background:#18181b; border:1px solid rgba(168,85,247,0.25); color:#fafafa; border-radius:9999px; padding:6px 12px; font-size:13px; outline:none; }
        .gg-sel:focus { border-color: rgba(168,85,247,0.6); }
        .gg-in { background:#18181b; border:1px solid rgba(255,255,255,0.10); color:#fafafa; border-radius:12px; padding:9px 12px; font-size:14px; outline:none; width:100%; }
        .gg-in:focus { border-color: rgba(168,85,247,0.55); }
      `}</style>

      {/* Title */}
      <div className="text-center space-y-3">
        <div className="gg-grad inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-pink-400/30">
          <GraduationCap className="w-5 h-5 text-pink-400" />
          <h2 className="text-lg sm:text-xl font-extrabold text-white">Grade Calculator</h2>
          <Sparkles className="w-4 h-4 text-yellow-300" />
        </div>
        <p className="text-zinc-400 text-xs sm:text-sm">Calculate your WGP, SGPA and CGPA with step-by-step breakdowns.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {STEPS.map((s, i) => {
          const active = step >= i + 1;
          return (
            <div key={s.label} className="flex items-center gap-1 sm:gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-colors ${active ? "bg-purple-600 text-white" : "bg-white/5 text-zinc-500 border border-white/10"}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] sm:text-[11px] font-semibold ${active ? "text-purple-300" : "text-zinc-600"}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-5 sm:w-10 h-px ${step > i + 1 ? "bg-purple-500/50" : "bg-white/10"}`} />}
            </div>
          );
        })}
      </div>

      {/* Grade conversion chart */}
      <div className="rounded-2xl border border-yellow-500/30 overflow-hidden" style={{ background: "rgba(250,204,21,0.04)" }}>
        <button onClick={() => setChartOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-bold text-white"><Info className="w-4 h-4 text-yellow-400" /> Grade Conversion Chart</span>
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${chartOpen ? "rotate-180" : ""}`} />
        </button>
        {chartOpen && (
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {GRADE_CHART.map((g) => (
              <span key={g.letter} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                <strong className="text-white">{g.letter}</strong> <span className="text-zinc-500">{g.rule}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Course cards */}
      <div className="space-y-5">
        {courses.map((c, idx) => {
          const f = courseFinal(c);
          return (
            <div key={c.id} className="rounded-3xl border border-purple-500/25 overflow-hidden" style={{ background: "rgba(24,24,27,0.6)" }}>
              <div className="gg-card-head flex items-center justify-between px-5 py-3.5">
                <span className="flex items-center gap-2.5 font-bold text-white">
                  <span className="w-9 h-9 rounded-2xl bg-purple-600 flex items-center justify-center"><BookOpen className="w-4.5 h-4.5 text-white" /></span>
                  Course {idx + 1}
                </span>
                {courses.length > 1 && <button onClick={() => remove(c.id)} className="w-8 h-8 rounded-full hover:bg-red-500/20 flex items-center justify-center"><Trash2 className="w-4 h-4 text-red-400" /></button>}
              </div>

              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Course Name</label>
                    <input className="gg-in" placeholder="e.g. Mathematics" value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} /></div>
                  <div><label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Credits</label>
                    <input className="gg-in" type="number" min={0} max={6} value={c.credits} onChange={(e) => update(c.id, { credits: Math.max(0, Math.min(6, parseInt(e.target.value) || 0)) })} /></div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input type="checkbox" checked={c.hasLab} onChange={(e) => update(c.id, { hasLab: e.target.checked })} />
                    <FlaskConical className="w-4 h-4 text-zinc-500" /> Has Lab?
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Grading:</span>
                    <div className="flex bg-white/5 rounded-full p-0.5">
                      {(["relative", "absolute"] as const).map((g) => (
                        <button key={g} onClick={() => update(c.id, { grading: g })}
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${c.grading === g ? "bg-purple-600 text-white" : "text-zinc-400"}`}>{g}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assessment grades */}
                <div>
                  <p className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Assessment Grades</p>
                  <div className="rounded-2xl border border-white/8 overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2.5 bg-white/5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                      <span>Assessment</span><span>Weight</span><span>Grade</span>
                    </div>
                    {([
                      { key: "s1" as const, label: "Sessional 1", w: "30%" },
                      { key: "s2" as const, label: "Sessional 2", w: "45%" },
                      { key: "le" as const, label: "Learning Engagement", w: "25%" },
                    ]).map((a) => (
                      <div key={a.key} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center px-4 py-3 border-t border-white/5">
                        <span className="text-sm text-white">{a.label}</span>
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400">{a.w}</span>
                        <select className="gg-sel" value={c[a.key]} onChange={(e) => update(c.id, { [a.key]: e.target.value as GradeLetter })}>
                          <option value="">Select</option>
                          {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WGP + final */}
                {f && (
                  <div className="flex items-center justify-between rounded-2xl px-4 py-3 bg-purple-600/15 border border-purple-500/25">
                    <span className="text-sm text-zinc-300">WGP = <strong className="text-white font-mono">{f.wgp.toFixed(2)}</strong></span>
                    <span className="inline-flex items-center gap-2 text-sm">Final:
                      <span className="px-2.5 py-1 rounded-lg font-bold text-white" style={{ background: gradeColor(f.letter) }}>{f.letter}</span>
                      <span className="text-zinc-500">({f.gp})</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2">
        <button onClick={add} className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-cyan-400/50 text-cyan-300 font-bold px-5 py-2.5 text-sm hover:bg-cyan-400/10">
          <Plus className="w-4 h-4" /> Add Another Course
        </button>
        {courses.length > 1 && <button onClick={reset} className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-red-400 text-xs font-bold px-3 py-2"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>}
      </div>

      {/* SGPA */}
      {hasResult && (
        <div className="rounded-3xl border border-emerald-500/30 overflow-hidden">
          <div className="px-5 py-4 text-center bg-emerald-500/10">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Your SGPA</p>
            <div className="text-5xl sm:text-6xl font-black text-emerald-400">{sg.sgpa.toFixed(2)}</div>
            <div className="flex items-center justify-center gap-3 mt-3 text-xs text-zinc-400">
              <span className="bg-white/5 px-3 py-1 rounded-full">Credits: <strong className="text-white">{sg.totalCredits}</strong></span>
              <span className="bg-white/5 px-3 py-1 rounded-full">Grade Points: <strong className="text-white">{sg.totalPoints.toFixed(0)}</strong></span>
            </div>
            <button onClick={() => setShowCGPA((v) => !v)} className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-orange-400/50 text-orange-300 font-bold px-5 py-2 text-sm hover:bg-orange-400/10">
              <TrendingUp className="w-4 h-4" /> {showCGPA ? "Hide CGPA" : "Calculate CGPA (Optional)"}
            </button>
          </div>
        </div>
      )}

      {/* CGPA */}
      {showCGPA && hasResult && (
        <div className="rounded-3xl border border-orange-500/25 p-5 space-y-4" style={{ background: "rgba(24,24,27,0.6)" }}>
          <p className="font-bold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-400" /> CGPA Predictor</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Previous CGPA</label>
              <input className="gg-in" type="number" placeholder="e.g. 8.2" value={prevCGPA} onChange={(e) => setPrevCGPA(e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Previous total credits</label>
              <input className="gg-in" type="number" placeholder="e.g. 80" value={prevCredits} onChange={(e) => setPrevCredits(e.target.value)} /></div>
          </div>
          {prevCGPA && prevCredits && (
            <div className="text-center rounded-2xl px-4 py-4 bg-orange-500/10 border border-orange-500/20">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Projected CGPA</p>
              <div className="text-4xl font-black text-orange-400">{cgpa.toFixed(2)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
