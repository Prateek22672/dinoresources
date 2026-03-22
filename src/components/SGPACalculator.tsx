import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, BookOpen, ToggleLeft, ToggleRight } from "lucide-react";

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

let nextId = 1;

/* ---------- GP color helper ---------- */

function gradePointColor(gp: number): string {
  if (gp >= 10) return "text-emerald-500";
  if (gp >= 9)  return "text-emerald-400";
  if (gp >= 8)  return "text-sky-400";
  if (gp >= 7)  return "text-sky-300";
  if (gp >= 6)  return "text-amber-400";
  if (gp >= 5)  return "text-amber-500";
  if (gp >= 4)  return "text-orange-500";
  return "text-red-500";
}

/* ---------- Reusable grade select ---------- */

function GradeSelect({
  value,
  onChange,
  placeholder,
}: {
  value: Grade | "";
  onChange: (v: Grade) => void;
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Grade)}>
      <SelectTrigger className="h-8 text-xs px-2 min-w-[68px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {GRADES.map((g) => (
          <SelectItem key={g} value={g} className="text-xs">
            {g}
            <span className="ml-1 text-muted-foreground">({GRADE_POINTS[g]})</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ---------- Main Component ---------- */

export default function SGPACalculator() {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("3");
  const [s1, setS1] = useState<Grade | "">("");
  const [le, setLE] = useState<Grade | "">("");
  const [s2, setS2] = useState<Grade | "">("");

  // CLAD
  const [hasCLAD, setHasCLAD] = useState(false);
  const [cladGrade, setCladGrade] = useState<Grade | "">("");

  /* ── Helpers ─────────────────────────────── */

  const getFinalGP = useCallback((sub: Subject): number => {
    const wgp =
      GRADE_POINTS[sub.s1Grade] * 0.3 +
      GRADE_POINTS[sub.leGrade] * 0.25 +
      GRADE_POINTS[sub.s2Grade] * 0.45;
    return wgpToFinalGradePoint(wgp);
  }, []);

  /* ── SGPA ────────────────────────────────── */

  const { sgpa, totalCredits } = useMemo(() => {
    let sumProduct = 0;
    let totalCr = 0;

    for (const sub of subjects) {
      const gp = getFinalGP(sub);
      sumProduct += gp * sub.credits;
      totalCr += sub.credits;
    }

    if (hasCLAD && cladGrade) {
      sumProduct += GRADE_POINTS[cladGrade] * 1;
      totalCr += 1;
    }

    return {
      sgpa: totalCr > 0 ? sumProduct / totalCr : null,
      totalCredits: totalCr,
    };
  }, [subjects, hasCLAD, cladGrade, getFinalGP]);

  /* ── Actions ─────────────────────────────── */

  const canAdd = !!(s1 && le && s2);

  const addSubject = () => {
    if (!canAdd) return;
    setSubjects((prev) => [
      ...prev,
      {
        id: `s-${nextId++}`,
        name: name.trim() || `Subject ${prev.length + 1}`,
        credits: parseInt(credits) || 3,
        s1Grade: s1 as Grade,
        leGrade: le as Grade,
        s2Grade: s2 as Grade,
      },
    ]);
    setName("");
    setS1("");
    setLE("");
    setS2("");
  };

  const removeSubject = (id: string) =>
    setSubjects((prev) => prev.filter((s) => s.id !== id));

  const updateSubject = (id: string, patch: Partial<Subject>) =>
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );

  /* ── Render ──────────────────────────────── */

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 font-sans text-sm">

      {/* ── CLAD Toggle ── */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/60 bg-muted/30">
        <span className="text-sm font-medium">
          Do you have CLAD?{" "}
          <span className="text-xs text-muted-foreground">(1 credit)</span>
        </span>
        <div className="flex items-center gap-2">
          {hasCLAD && (
            <GradeSelect
              value={cladGrade}
              onChange={setCladGrade}
              placeholder="Grade"
            />
          )}
          <button
            onClick={() => {
              setHasCLAD((v) => !v);
              setCladGrade("");
            }}
            className="text-primary transition-colors"
            aria-label="Toggle CLAD"
          >
            {hasCLAD ? (
              <ToggleRight className="w-7 h-7 text-primary" />
            ) : (
              <ToggleLeft className="w-7 h-7 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* ── Subject Table ── */}
      <div className="rounded-lg border border-border/60 bg-card overflow-hidden">

        {/* Column headers — desktop only */}
        <div className="hidden sm:grid grid-cols-[1fr_72px_76px_76px_76px_36px] gap-x-2 px-3 pt-2 pb-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Subject</span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Cr</span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">S1 30%</span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">LE 25%</span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">S2 45%</span>
          <span />
        </div>

        {/* Input row */}
        <div className="flex flex-wrap sm:grid sm:grid-cols-[1fr_72px_76px_76px_76px_36px] gap-2 p-3 border-b border-border/40 bg-muted/20">
          <Input
            className="h-8 text-xs col-span-full sm:col-span-1"
            placeholder="Subject name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSubject()}
          />
          <Select value={credits} onValueChange={setCredits}>
            <SelectTrigger className="h-8 text-xs px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map((c) => (
                <SelectItem key={c} value={String(c)} className="text-xs">
                  {c} cr
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <GradeSelect value={s1} onChange={setS1} placeholder="S1" />
          <GradeSelect value={le} onChange={setLE} placeholder="LE" />
          <GradeSelect value={s2} onChange={setS2} placeholder="S2" />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={addSubject}
            disabled={!canAdd}
            title="Add subject"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Subject rows */}
        {subjects.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-xs">
            <BookOpen className="w-4 h-4" />
            No subjects yet — fill in the grades above and press +
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {subjects.map((sub, idx) => {
              const gp = getFinalGP(sub);
              return (
                <div
                  key={sub.id}
                  className="flex flex-wrap sm:grid sm:grid-cols-[1fr_72px_76px_76px_76px_36px] gap-2 items-center px-3 py-1.5 hover:bg-muted/20 transition-colors"
                >
                  {/* Name + GP — on mobile takes full width */}
                  <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                    <span className="text-[11px] text-muted-foreground w-4 shrink-0 tabular-nums">
                      {idx + 1}.
                    </span>
                    <Input
                      className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 font-medium truncate"
                      value={sub.name}
                      onChange={(e) =>
                        updateSubject(sub.id, { name: e.target.value })
                      }
                    />
                    <span
                      className={`text-xs font-bold tabular-nums shrink-0 ${gradePointColor(gp)}`}
                    >
                      GP {gp}
                    </span>
                  </div>

                  {/* Credits */}
                  <Select
                    value={String(sub.credits)}
                    onValueChange={(v) =>
                      updateSubject(sub.id, { credits: parseInt(v) })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((c) => (
                        <SelectItem key={c} value={String(c)} className="text-xs">
                          {c} cr
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <GradeSelect
                    value={sub.s1Grade}
                    onChange={(v) => updateSubject(sub.id, { s1Grade: v })}
                    placeholder="S1"
                  />
                  <GradeSelect
                    value={sub.leGrade}
                    onChange={(v) => updateSubject(sub.id, { leGrade: v })}
                    placeholder="LE"
                  />
                  <GradeSelect
                    value={sub.s2Grade}
                    onChange={(v) => updateSubject(sub.id, { s2Grade: v })}
                    placeholder="S2"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removeSubject(sub.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Result Bar — always visible once there's data ── */}
      {(subjects.length > 0 || (hasCLAD && cladGrade)) && (
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground tabular-nums">
                {subjects.length}
              </span>{" "}
              subject{subjects.length !== 1 ? "s" : ""}
              {hasCLAD && cladGrade && " + CLAD"}
            </span>
            <span>
              <span className="font-semibold text-foreground tabular-nums">
                {totalCredits}
              </span>{" "}
              credits
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              SGPA
            </span>
            <span className="text-2xl font-bold text-primary tabular-nums">
              {sgpa !== null ? sgpa.toFixed(2) : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
