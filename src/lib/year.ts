import type { YearRow } from "@/integrations/supabase/revamp";

/**
 * Map a student's profile "academic year" value to a year row, so the Store and
 * Dashboard show that student their OWN year's subjects & pack by default.
 *
 * The profile stores a YEAR string like "3rd Year" (not a semester number), so
 * we word-match the year FIRST — a bare parseInt("3rd Year")=3 must NOT be read
 * as semester 3. Semester-number handling is only a last-resort fallback.
 */
export function matchProfileYear(sem: string | null | undefined, years: YearRow[]): string | null {
  if (!sem) return null;
  const s = sem.toLowerCase().trim();
  const bySlug = (slug: string) => years.find((y) => y.slug === slug)?.id ?? null;

  // 1) Year words / ordinals — "1st/2nd/3rd/4th Year", "first/second/…", "supplementary"
  const yearTests: [RegExp, string][] = [
    [/\bfirst\b|\b1st\b/, "first-year"],
    [/\bsecond\b|\b2nd\b/, "second-year"],
    [/\bthird\b|\b3rd\b/, "third-year"],
    [/\bfourth\b|\b4th\b/, "fourth-year"],
    [/supp/, "supplementary"],
  ];
  for (const [re, slug] of yearTests) if (re.test(s)) { const id = bySlug(slug); if (id) return id; }

  // 2) "N Year" (number + the word year) → N is the YEAR directly
  const n = parseInt(s, 10);
  if (/year/.test(s) && Number.isFinite(n) && n >= 1 && n <= 4) {
    const id = bySlug(["", "first-year", "second-year", "third-year", "fourth-year"][n]);
    if (id) return id;
  }

  // 3) Last-resort: a bare semester number (1–8) → its academic year
  if (Number.isFinite(n)) {
    const slug = n <= 2 ? "first-year" : n <= 4 ? "second-year" : n <= 6 ? "third-year" : n <= 8 ? "fourth-year" : "supplementary";
    const id = bySlug(slug);
    if (id) return id;
  }

  // 4) Fuzzy name contains
  const y = years.find((yr) => s.includes(yr.name.toLowerCase()) || yr.name.toLowerCase().includes(s));
  return y?.id ?? null;
}
