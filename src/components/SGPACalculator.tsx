import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, X } from "lucide-react";

/* ---------- Grade System ---------- */

const GRADES = ["O", "A+", "A", "B+", "B", "C", "P"] as const;
type Grade = (typeof GRADES)[number];

const GRADE_POINTS: Record<Grade, number> = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  C: 5,
  P: 4,
};

function wgpToFinalGradePoint(wgp: number): number {
  if (wgp > 9) return 10;
  if (wgp > 8) return 9;
  if (wgp > 7) return 8;
  if (wgp > 6) return 7;
  if (wgp > 5) return 6;
  if (wgp > 4) return 5;
  if (wgp === 4) return 4;
  return 0;
}

/* ---------- Types ---------- */

interface Subject {
  id: string;
  name: string;
  credits: number;
  s1Grade: Grade;
  leGrade: Grade;
  s2Grade: Grade;
}

/* ---------- Toast ---------- */

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm shadow-xl">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ---------- Grade chip ---------- */

function GradeChip({ label, grade }: { label: string; grade: Grade }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{grade}</span>
    </span>
  );
}

/* ---------- Subject Row ---------- */

function SubjectRow({
  sub,
  idx,
  getFinalGP,
  onUpdate,
  onRemove,
}: {
  sub: Subject;
  idx: number;
  getFinalGP: (s: Subject) => number;
  onUpdate: (id: string, patch: Partial<Subject>) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const gp = getFinalGP(sub);

  return (
    <div className="border-b border-border/30 last:border-0">

      {/* Compact summary */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-[11px] text-muted-foreground w-4 shrink-0 tabular-nums">
          {idx + 1}.
        </span>

        {/* Two-line main content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate">{sub.name}</span>
            <span className="text-[11px] text-muted-foreground shrink-0">{sub.credits} cr</span>
          </div>
          <div className="flex items-center gap-2">
            <GradeChip label="S1" grade={sub.s1Grade} />
            <span className="text-muted-foreground/40 text-xs select-none">·</span>
            <GradeChip label="LE" grade={sub.leGrade} />
            <span className="text-muted-foreground/40 text-xs select-none">·</span>
            <GradeChip label="S2" grade={sub.s2Grade} />
          </div>
        </div>

        {/* GP circle */}
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-primary text-primary-foreground">
          {gp}
        </span>

        <span className="text-muted-foreground shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </div>

      {/* Expanded edit panel */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 bg-muted/10" onClick={(e) => e.stopPropagation()}>
          <Input
            className="h-8 text-sm"
            placeholder="Subject name"
            value={sub.name}
            onChange={(e) => onUpdate(sub.id, { name: e.target.value })}
          />
          <div className="flex gap-2">
            {[
              { key: "s1Grade" as const, label: "S1 · 30%", val: sub.s1Grade },
              { key: "leGrade" as const, label: "LE · 25%", val: sub.leGrade },
              { key: "s2Grade" as const, label: "S2 · 45%", val: sub.s2Grade },
            ].map(({ key, label, val }) => (
              <div key={key} className="flex-1 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                <Select value={val} onValueChange={(v) => onUpdate(sub.id, { [key]: v as Grade })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g} className="text-xs">{g} ({GRADE_POINTS[g]})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Credits</span>
              <Select
                value={String(sub.credits)}
                onValueChange={(v) => onUpdate(sub.id, { credits: parseInt(v) })}
              >
                <SelectTrigger className="h-8 text-xs w-[72px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6].map((c) => (
                    <SelectItem key={c} value={String(c)} className="text-xs">{c} cr</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-destructive hover:text-destructive gap-1"
              onClick={() => onRemove(sub.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Main ---------- */

let toastId = 0;

export default function SGPACalculator() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("3");
  const [s1, setS1] = useState<Grade | "">("");
  const [le, setLE] = useState<Grade | "">("");
  const [s2, setS2] = useState<Grade | "">("");
  const [hasCLAD, setHasCLAD] = useState(false);
  const [cladGrade, setCladGrade] = useState<Grade | "">("");
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);

  /* ── Persistence ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sgpa-data");
      if (saved) {
        const p = JSON.parse(saved);
        setSubjects(p.subjects || []);
        setHasCLAD(p.hasCLAD || false);
        setCladGrade(p.cladGrade || "");
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sgpa-data", JSON.stringify({ subjects, hasCLAD, cladGrade }));
    } catch {}
  }, [subjects, hasCLAD, cladGrade]);

  const showToast = (msg: string) => setToast({ id: ++toastId, msg });

  /* ── Logic ── */
  const getFinalGP = useCallback((sub: Subject): number => {
    const wgp =
      GRADE_POINTS[sub.s1Grade] * 0.3 +
      GRADE_POINTS[sub.leGrade] * 0.25 +
      GRADE_POINTS[sub.s2Grade] * 0.45;
    return wgpToFinalGradePoint(wgp);
  }, []);

  const { sgpa, totalCredits } = useMemo(() => {
    let sum = 0, total = 0;
    subjects.forEach((s) => { sum += getFinalGP(s) * s.credits; total += s.credits; });
    if (hasCLAD && cladGrade) { sum += GRADE_POINTS[cladGrade]; total += 1; }
    return { sgpa: total ? sum / total : 0, totalCredits: total };
  }, [subjects, hasCLAD, cladGrade, getFinalGP]);

  /* ── Actions ── */
  const addSubject = () => {
    if (!s1) { showToast("Please select a grade for Sessional 1"); return; }
    if (!le) { showToast("Please select a grade for Learning Engagement"); return; }
    if (!s2) { showToast("Please select a grade for Sessional 2"); return; }
    setSubjects((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: name.trim() || `Subject ${prev.length + 1}`,
        credits: parseInt(credits) || 3,
        s1Grade: s1 as Grade,
        leGrade: le as Grade,
        s2Grade: s2 as Grade,
      },
    ]);
    setName(""); setS1(""); setLE(""); setS2("");
  };

  const updateSubject = (id: string, patch: Partial<Subject>) =>
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const removeSubject = (id: string) =>
    setSubjects((prev) => prev.filter((s) => s.id !== id));

  /* ── Render ── */
  return (
    <div className="max-w-xl mx-auto space-y-3 font-sans text-sm pb-6">

      {toast && (
        <Toast key={toast.id} message={toast.msg} onClose={() => setToast(null)} />
      )}

      {/* CLAD */}
      <div className="flex items-center justify-between px-3 py-2.5 border border-border/60 rounded-lg bg-muted/20">
        <span className="font-medium">
          Do you have CLAD?{" "}
          <span className="text-xs text-muted-foreground font-normal">(1 credit)</span>
        </span>
        <div className="flex items-center gap-3">
          {hasCLAD && (
            <Select value={cladGrade} onValueChange={(v) => setCladGrade(v as Grade)}>
              <SelectTrigger className="h-8 text-xs w-[80px]">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g} className="text-xs">{g} ({GRADE_POINTS[g]})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <button
            onClick={() => { setHasCLAD((v) => !v); setCladGrade(""); }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hasCLAD ? "bg-primary" : "bg-muted-foreground/30"}`}
            aria-label="Toggle CLAD"
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${hasCLAD ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Subject table */}
      <div className="border border-border/60 rounded-lg bg-card overflow-hidden">

        {/* Desktop headers */}
        <div className="hidden sm:grid grid-cols-[1fr_64px_72px_72px_72px_36px] gap-x-2 px-3 pt-2.5 pb-1">
          {["Subject", "Cr", "S1 30%", "LE 25%", "S2 45%", ""].map((h) => (
            <span key={h} className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {/* Desktop input row */}
        <div className="hidden sm:grid grid-cols-[1fr_64px_72px_72px_72px_36px] gap-2 p-3 border-b border-border/40 bg-muted/20">
          <Input
            className="h-8 text-xs"
            placeholder="Subject name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSubject()}
          />
          <Select value={credits} onValueChange={setCredits}>
            <SelectTrigger className="h-8 text-xs px-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6].map((c) => (
                <SelectItem key={c} value={String(c)} className="text-xs">{c}cr</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {[
            { val: s1, set: setS1, ph: "S1" },
            { val: le, set: setLE, ph: "LE" },
            { val: s2, set: setS2, ph: "S2" },
          ].map(({ val, set, ph }) => (
            <Select key={ph} value={val} onValueChange={(v) => set(v as Grade)}>
              <SelectTrigger className="h-8 text-xs px-2">
                <SelectValue placeholder={ph} />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          <Button size="icon" className="h-8 w-8" onClick={addSubject}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile input form */}
        <div className="sm:hidden p-3 space-y-2 border-b border-border/40 bg-muted/20">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Add Subject</p>
          <Input
            className="h-8 text-sm w-full"
            placeholder="Subject name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-2">
            {[
              { val: s1, set: setS1, label: "S1 · 30%" },
              { val: le, set: setLE, label: "LE · 25%" },
              { val: s2, set: setS2, label: "S2 · 45%" },
            ].map(({ val, set, label }) => (
              <div key={label} className="flex-1 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                <Select value={val} onValueChange={(v) => set(v as Grade)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g} className="text-xs">{g} ({GRADE_POINTS[g]})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Credits</span>
            <Select value={credits} onValueChange={setCredits}>
              <SelectTrigger className="h-8 text-xs w-[76px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6].map((c) => (
                  <SelectItem key={c} value={String(c)} className="text-xs">{c} cr</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="flex-1 h-8 text-xs" onClick={addSubject}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Subject
            </Button>
          </div>
        </div>

        {/* Subject list */}
        {subjects.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-xs">
            No subjects added yet
          </div>
        ) : (
          subjects.map((sub, idx) => (
            <SubjectRow
              key={sub.id}
              sub={sub}
              idx={idx}
              getFinalGP={getFinalGP}
              onUpdate={updateSubject}
              onRemove={removeSubject}
            />
          ))
        )}
      </div>

      {/* Semester Summary */}
      {(subjects.length > 0 || (hasCLAD && cladGrade)) && (
        <div className="border border-border/60 rounded-lg px-4 py-4 bg-card">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Semester Summary
          </p>
          <div className="flex justify-between text-center">
            <div>
              <p className="text-2xl font-bold text-sky-400 tabular-nums leading-none">
                {subjects.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Subjects</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400 tabular-nums leading-none">
                {totalCredits}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Credits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400 tabular-nums leading-none">
                {sgpa.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">SGPA</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
