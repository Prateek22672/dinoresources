/** Lightweight, honest personalization stored on the device (no backend needed).
 *  - recent subject powers the hero "Resume" card
 *  - day-streak counts consecutive days the dashboard was opened */

const RECENT_KEY = "td:recent-subject";
const STREAK_KEY = "td:streak";

export interface RecentSubject {
  slug: string;
  name: string;
  at: number;
}

export function setRecentSubject(slug: string, name: string) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify({ slug, name, at: Date.now() }));
  } catch {
    /* storage unavailable — non-critical */
  }
}

export function getRecentSubject(): RecentSubject | null {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && v.slug && v.name ? (v as RecentSubject) : null;
  } catch {
    return null;
  }
}

/** Increments once per calendar day; resets if a day is skipped. Returns the current streak. */
export function bumpStreak(): number {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const t = today.getTime();
    const raw = localStorage.getItem(STREAK_KEY);
    const prev = raw ? (JSON.parse(raw) as { last: number; count: number }) : null;

    let count = 1;
    if (prev && typeof prev.last === "number") {
      const diff = Math.round((t - prev.last) / 86_400_000);
      if (diff === 0) count = prev.count || 1;
      else if (diff === 1) count = (prev.count || 0) + 1;
      else count = 1;
    }
    localStorage.setItem(STREAK_KEY, JSON.stringify({ last: t, count }));
    return count;
  } catch {
    return 1;
  }
}
