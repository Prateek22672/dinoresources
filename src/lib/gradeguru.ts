// GradeGuru — GITAM grade logic, reconstructed from the official grade chart.
export const GRADE_POINTS: Record<string, number> = {
  O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5, P: 4, F: 0,
  I: 4, "Ab/R": 0, "L/AB": 0,
};

export const GRADE_OPTIONS = ["O", "A+", "A", "B+", "B", "C", "P", "F", "I", "Ab/R", "L/AB"] as const;
export type GradeLetter = (typeof GRADE_OPTIONS)[number];

// Grade conversion chart (WGP -> letter), exactly as shown in GradeGuru.
export const GRADE_CHART: { letter: string; rule: string; color: string }[] = [
  { letter: "O", rule: "> 9.50", color: "#34d399" },
  { letter: "A+", rule: "> 8.50", color: "#4ade80" },
  { letter: "A", rule: "> 7.50", color: "#22c55e" },
  { letter: "B+", rule: "> 6.50", color: "#fbbf24" },
  { letter: "B", rule: "> 5.50", color: "#f59e0b" },
  { letter: "C", rule: "> 4.50", color: "#fb923c" },
  { letter: "P", rule: "= 4.00", color: "#a1a1aa" },
  { letter: "F", rule: "< 4.00", color: "#ef4444" },
  { letter: "I", rule: "Incomplete (GP 4 if both sessionals ≥ 25)", color: "#a1a1aa" },
  { letter: "Ab/R", rule: "Absent / Repeat (GP 0)", color: "#ef4444" },
  { letter: "L/AB", rule: "LE Absent (GP 0, Final F)", color: "#ef4444" },
];

export const WEIGHTS = { s1: 0.30, s2: 0.45, le: 0.25 };

export interface GGCourse {
  id: string;
  name: string;
  credits: number;
  hasLab: boolean;
  grading: "relative" | "absolute";
  s1: GradeLetter | "";
  s2: GradeLetter | "";
  le: GradeLetter | "";
}

export const newCourse = (): GGCourse => ({
  id: Math.random().toString(36).slice(2),
  name: "", credits: 3, hasLab: false, grading: "relative", s1: "", s2: "", le: "",
});

/** Weighted Grade Point for a course (0 until all three grades chosen). */
export function courseWGP(c: GGCourse): number | null {
  if (!c.s1 || !c.s2 || !c.le) return null;
  return GRADE_POINTS[c.s1] * WEIGHTS.s1 + GRADE_POINTS[c.s2] * WEIGHTS.s2 + GRADE_POINTS[c.le] * WEIGHTS.le;
}

/** Final letter from WGP (per the conversion chart). */
export function wgpToLetter(wgp: number): string {
  if (wgp > 9.5) return "O";
  if (wgp > 8.5) return "A+";
  if (wgp > 7.5) return "A";
  if (wgp > 6.5) return "B+";
  if (wgp > 5.5) return "B";
  if (wgp > 4.5) return "C";
  if (wgp >= 4) return "P";
  return "F";
}

export function courseFinal(c: GGCourse): { wgp: number; letter: string; gp: number } | null {
  const wgp = courseWGP(c);
  if (wgp === null) return null;
  // LE absent overrides everything -> F
  if (c.le === "L/AB") return { wgp, letter: "F", gp: 0 };
  const letter = wgpToLetter(wgp);
  return { wgp, letter, gp: GRADE_POINTS[letter] };
}

export function calcSGPA(courses: GGCourse[]) {
  let pts = 0, credits = 0;
  for (const c of courses) {
    const f = courseFinal(c);
    if (f && c.name !== undefined) { pts += f.gp * c.credits; credits += c.credits; }
  }
  return { sgpa: credits ? pts / credits : 0, totalCredits: credits, totalPoints: pts };
}

export function calcCGPA(currentSGPA: number, currentCredits: number, prevCGPA: number, prevCredits: number) {
  const totalCredits = currentCredits + prevCredits;
  if (totalCredits === 0) return 0;
  return (currentSGPA * currentCredits + prevCGPA * prevCredits) / totalCredits;
}
