import type { YearRow } from "@/integrations/supabase/revamp";

/**
 * Map a student's profile "semester"/year value to a year row, so the Store and
 * Dashboard show that student their OWN year's subjects & pack by default —
 * a 1st-year never sees the 4th-year pack unless they deliberately browse to it.
 */
export function matchProfileYear(sem: string | null | undefined, years: YearRow[]): string | null {
  if (!sem) return null;
  const s = sem.toLowerCase().trim();
  const n = parseInt(s, 10);
  const bySlug = (slug: string) => years.find((y) => y.slug === slug)?.id ?? null;

  if (Number.isFinite(n)) {
    const slug = n <= 2 ? "first-year" : n <= 4 ? "second-year" : n <= 6 ? "third-year" : n <= 8 ? "fourth-year" : "supplementary";
    const id = bySlug(slug);
    if (id) return id;
  }
  const tests: [RegExp, string][] = [
    [/\bfirst\b|\b1st\b/, "first-year"], [/\bsecond\b|\b2nd\b/, "second-year"],
    [/\bthird\b|\b3rd\b/, "third-year"], [/\bfourth\b|\b4th\b/, "fourth-year"],
    [/supp/, "supplementary"],
  ];
  for (const [re, slug] of tests) if (re.test(s)) { const id = bySlug(slug); if (id) return id; }

  const y = years.find((yr) => s.includes(yr.name.toLowerCase()) || yr.name.toLowerCase().includes(s));
  return y?.id ?? null;
}
