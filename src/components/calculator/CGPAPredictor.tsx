import { useState, useMemo } from "react";
import { Target, TrendingUp, BarChart3 } from "lucide-react";

interface Sem { credits: number; sgpa: number; }

const band = (c: number) => c >= 9 ? "Outstanding" : c >= 8 ? "Excellent" : c >= 7 ? "Good" : c >= 6 ? "Average" : c > 0 ? "Needs work" : "—";

export default function CGPAPredictor() {
  const [currentCGPA, setCurrentCGPA] = useState("");
  const [totalCredits, setTotalCredits] = useState("");
  const [count, setCount] = useState(1);
  const [sems, setSems] = useState<Sem[]>([{ credits: 20, sgpa: 7 }]);
  const [target, setTarget] = useState("8");

  const setCountAndSync = (n: number) => {
    setCount(n);
    setSems((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? { credits: 20, sgpa: 7 }));
  };
  const updateSem = (i: number, patch: Partial<Sem>) => setSems((p) => p.map((s, j) => j === i ? { ...s, ...patch } : s));

  const cur = parseFloat(currentCGPA) || 0;
  const curCred = parseInt(totalCredits) || 0;

  const { projected, futureCredits } = useMemo(() => {
    const fc = sems.reduce((a, s) => a + (s.credits || 0), 0);
    const fp = sems.reduce((a, s) => a + (s.credits || 0) * (s.sgpa || 0), 0);
    const total = curCred + fc;
    return { projected: total ? (cur * curCred + fp) / total : 0, futureCredits: fc };
  }, [sems, cur, curCred]);

  const required = useMemo(() => {
    const t = parseFloat(target) || 0;
    if (!futureCredits) return null;
    const need = (t * (curCred + futureCredits) - cur * curCred) / futureCredits;
    return { need, ok: need >= 0 && need <= 10 };
  }, [target, curCred, cur, futureCredits]);

  const delta = projected - cur;

  return (
    <div className="gg space-y-5">
      <style>{`
        .gg-in { background:#18181b; border:1px solid rgba(255,255,255,0.10); color:#fafafa; border-radius:12px; padding:9px 12px; font-size:14px; outline:none; width:100%; }
        .gg-in:focus { border-color: rgba(168,85,247,0.55); }
        .gg-card { background: rgba(24,24,27,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:24px; }
        .gg-range { accent-color:#a855f7; }
      `}</style>

      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center justify-center gap-2"><Target className="w-5 h-5 text-purple-400" /> What-If CGPA Predictor</h2>
        <p className="text-zinc-500 text-sm mt-1">Enter your current standing and simulate future semesters.</p>
      </div>

      {/* current standing */}
      <div className="gg-card p-5">
        <p className="font-bold text-white mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-400" /> Your current standing</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <div><label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Current CGPA (0–10)</label>
            <input className="gg-in" type="number" step="0.01" placeholder="e.g. 8.2" value={currentCGPA} onChange={(e) => setCurrentCGPA(e.target.value)} /></div>
          <div><label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Total credits completed</label>
            <input className="gg-in" type="number" placeholder="e.g. 80" value={totalCredits} onChange={(e) => setTotalCredits(e.target.value)} /></div>
          <div><label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Grading scale</label>
            <input className="gg-in" value="10-Point Scale" disabled /></div>
        </div>
      </div>

      {/* future semesters */}
      <div className="gg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-pink-400" /> Future semesters</p>
          <label className="text-xs text-zinc-400 flex items-center gap-2">Predict
            <select className="gg-in !w-auto !py-1.5" value={count} onChange={(e) => setCountAndSync(parseInt(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <div className="space-y-3">
          {sems.map((s, i) => (
            <div key={i} className="rounded-2xl border border-purple-500/20 p-4" style={{ background: "rgba(168,85,247,0.04)" }}>
              <p className="text-sm font-semibold text-white mb-2.5">Semester {i + 2} <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-200 ml-1">What-If</span></p>
              <div className="grid sm:grid-cols-[160px_1fr] gap-3 items-center">
                <div><label className="text-[11px] text-zinc-500 mb-1 block">Credits</label>
                  <input className="gg-in" type="number" value={s.credits} onChange={(e) => updateSem(i, { credits: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="text-[11px] text-zinc-500 mb-1 block">SGPA ({s.sgpa.toFixed(1)})</label>
                  <input className="gg-range w-full" type="range" min={0} max={10} step={0.1} value={s.sgpa} onChange={(e) => updateSem(i, { sgpa: parseFloat(e.target.value) })} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* projected */}
      <div className="gg-card p-6 text-center border-sky-500/30">
        <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1 flex items-center justify-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Your projected CGPA</p>
        <div className="text-5xl sm:text-6xl font-black text-sky-400">{projected.toFixed(2)}</div>
        <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-sky-500/15 text-sky-300 font-semibold">{band(projected)}</span>
        <p className="text-xs text-zinc-500 mt-3">Previous: <strong className="text-zinc-300">{cur.toFixed(2)}</strong> → Projected: <strong className="text-sky-300">{projected.toFixed(2)}</strong>
          <span className={delta >= 0 ? "text-emerald-400 ml-1.5" : "text-red-400 ml-1.5"}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}</span></p>
        <div className="h-2 rounded-full bg-white/8 overflow-hidden mt-3"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, projected * 10)}%` }} /></div>
      </div>

      {/* required */}
      <div className="gg-card p-5">
        <p className="font-bold text-white mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-orange-400" /> Required SGPA calculator</p>
        <div className="grid sm:grid-cols-2 gap-4 items-center">
          <div><label className="text-xs font-semibold text-zinc-400 mb-1.5 block">What CGPA do you want?</label>
            <input className="gg-in" type="number" step="0.1" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
          {required && (
            <div className="rounded-2xl px-4 py-3 bg-white/5 border border-white/10 text-center">
              <p className="text-xs text-zinc-500">You need an average SGPA of</p>
              <p className={`text-3xl font-black ${required.ok ? "text-emerald-400" : "text-red-400"}`}>{required.need.toFixed(2)}</p>
              <p className={`text-xs font-semibold ${required.ok ? "text-emerald-400" : "text-red-400"}`}>{required.ok ? "Achievable ✓" : "Not achievable on a 10-point scale"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
