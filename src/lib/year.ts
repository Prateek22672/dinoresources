import type { YearRow } from "@/integrations/supabase/revamp";

/** Ordinal spellings for academic years 1–4, matched against free-form text. */
const YEAR_PATTERNS: [RegExp, number][] = [
  [/\b(?:first|1st)\b|\b1\b/, 1],
  [/\b(?:second|2nd)\b|\b2\b/, 2],
  [/\b(?:third|3rd)\b|\b3\b/, 3],
  [/\b(?:fourth|4th)\b|\b4\b/, 4],
];

const isSupplementary = (text: string) => /supp/.test(text);

/** All the text that identifies a year row, lowercased. */
const rowText = (y: YearRow) => `${y.slug ?? ""} ${y.name ?? ""}`.toLowerCase();

/**
 * Which academic year (1–4) a row represents, read from its name AND slug so
 * matching works whatever slug convention the `years` table happens to use
 * ("third-year", "3rd-year", "year-3", …). Supplementary has no year number.
 */
function yearNumberOf(y: YearRow): number | null {
  const hay = rowText(y);
  if (isSupplementary(hay)) return null;
  for (const [re, n] of YEAR_PATTERNS) if (re.test(hay)) return n;
  return null;
}

/**
 * Map a student's profile "academic year" value to a year row, so the Store and
 * Dashboard show that student their OWN year's subjects & pack.
 *
 * The profile stores a YEAR string like "3rd Year" (not a semester number).
 * Historically this resolved the profile value to a hard-coded slug
 * ("third-year") and looked that slug up verbatim — so if the `years` table
 * used any other convention the lookup silently missed, fell through to a
 * "bare number = semester" fallback, and mapped BOTH "3rd Year" and "4th Year"
 * onto Second Year. Year identity now comes from the row's own name/slug text
 * instead of an assumed spelling, and a bare 1–4 is read as a year (the only
 * thing the profile UI can produce) rather than a semester.
 */
export function matchProfileYear(sem: string | null | undefined, years: YearRow[]): string | null {
  if (!sem || years.length === 0) return null;
  const raw = String(sem).trim();
  const s = raw.toLowerCase();
  if (!s) return null;

  // 1) Exact match on id / slug / name — cheapest and unambiguous.
  const exact = years.find(
    (y) => y.id === raw || (y.slug ?? "").toLowerCase() === s || (y.name ?? "").toLowerCase() === s,
  );
  if (exact) return exact.id;

  // 2) Supplementary is its own track, not a numbered year.
  if (isSupplementary(s)) return years.find((y) => isSupplementary(rowText(y)))?.id ?? null;

  // 3) Work out which academic year the profile value means.
  let n: number | null = null;
  for (const [re, num] of YEAR_PATTERNS) if (re.test(s)) { n = num; break; }
  if (n === null) {
    const parsed = parseInt(s, 10);
    if (Number.isFinite(parsed)) {
      // 1–4 is a year (all the profile UI can store); 5–8 can only be a legacy
      // semester number, which maps two semesters to each year.
      n = parsed >= 1 && parsed <= 4 ? parsed : parsed >= 5 && parsed <= 8 ? Math.ceil(parsed / 2) : null;
    }
  }
  if (n === null) return null;

  // 4) Find the row that *is* that year, by its own text.
  const byNumber = years.find((y) => yearNumberOf(y) === n);
  if (byNumber) return byNumber.id;

  // 5) Last resort: the nth numbered year in display order.
  const ordered = years
    .filter((y) => !isSupplementary(rowText(y)))
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  return ordered[n - 1]?.id ?? null;
}
