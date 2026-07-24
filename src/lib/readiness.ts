/**
 * Exam-readiness tracking — TeamDino's core USP.
 *
 * We're an *additional* tool in a student's prep, but the one that answers the
 * question nothing else does: "how ready am I, right now, for this exam?"
 *
 * Engagement is tracked honestly on the device (no backend, no payment coupling):
 * opening a unit's Q&A, viewing a material, or watching an editorial marks that
 * unit as "touched" for that subject. Readiness = touched sections / total.
 */

const KEY = "td:readiness";

export type ReadinessSection = "syllabus" | "pyq" | `unit-${number}`;

type Store = Record<string, Record<string, number>>; // subjectId -> { section: lastTouchedMs }

function read(): Store {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function write(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* non-critical */ }
}

/** Mark a section of a subject as engaged with (idempotent per section). */
export function markStudied(subjectId: string, section: ReadinessSection) {
  if (!subjectId) return;
  const s = read();
  s[subjectId] = s[subjectId] || {};
  s[subjectId][section] = Date.now();
  write(s);
  // let any open readiness UI refresh
  try { window.dispatchEvent(new Event("td:readiness-changed")); } catch { /* ignore */ }
}

export interface Readiness {
  studied: number;   // sections touched
  total: number;     // sections that count toward readiness
  pct: number;       // 0–100
  lastAt: number;    // most recent engagement (ms) or 0
  label: string;     // human band
}

/**
 * Compute readiness for a subject. `units` = number of units (default 5); the
 * syllabus + PYQs each count as one section too, so total = units + 2.
 */
export function getReadiness(subjectId: string, units = 5): Readiness {
  const touched = read()[subjectId] || {};
  const keys = Object.keys(touched);
  const total = units + 2; // units + syllabus + pyq
  const studied = Math.min(keys.length, total);
  const pct = total ? Math.round((studied / total) * 100) : 0;
  const lastAt = keys.reduce((m, k) => Math.max(m, touched[k] || 0), 0);
  return { studied, total, pct, lastAt, label: readinessLabel(pct) };
}

export function readinessLabel(pct: number): string {
  if (pct >= 85) return "Exam ready";
  if (pct >= 60) return "Almost there";
  if (pct >= 30) return "Getting started";
  if (pct > 0) return "Just began";
  return "Not started";
}

/** Semantic colour for a readiness percentage (solid, matches the design system). */
export function readinessColor(pct: number): string {
  if (pct >= 85) return "#34d399"; // emerald
  if (pct >= 60) return "var(--td-accent)";
  if (pct >= 30) return "#f59e0b"; // amber
  return "#71717a";                // zinc
}
