/**
 * Multi-college tenancy — the hostname decides which college (and which
 * Supabase project) this visit belongs to. Chosen ONCE at page load, before
 * anything renders, so auth + dashboard + every query use the same database.
 *
 * teamdino.in        → GITAM  → Supabase A (existing)
 * srm.teamdino.in    → SRM    → Supabase B (new)
 *
 * Adding a college later = one entry here. Everything else is data.
 */
export interface College {
  slug: string;        // 'gitam' | 'srm' | ...
  name: string;        // shown wherever the college is named ("GITAM", "SRM")
  supabaseUrl: string; // which project this college's data lives in
  supabaseKey: string; // that project's public anon key
}

const GITAM: College = {
  slug: "gitam",
  name: "GITAM",
  supabaseUrl: "https://yidbijzsfrwqskjzawqq.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZGJpanpzZnJ3cXNranphd3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjkyNTAsImV4cCI6MjA3NjMwNTI1MH0.8Q_wm2Z37GafNi9yFOu845PrxgtdJnMT7nQHDchdyU4",
};

const SRM: College = {
  slug: "srm",
  name: "SRM",
  supabaseUrl: "https://hnjokwnklvncvjmdvsfp.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhuam9rd25rbHZuY3ZqbWR2c2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5ODI4MzAsImV4cCI6MjEwMDU1ODgzMH0.Z6we986WgHb0Uj8fmdmSOxV4IdvNPJ8KllrM4fyPYAE",
};

/** Hostname → college. The apex/www is GITAM; subdomains map by slug. */
const BY_HOST: Record<string, College> = {
  "teamdino.in": GITAM,
  "www.teamdino.in": GITAM,
  "srm.teamdino.in": SRM,
};

/** Subdomain slug → college (for *.teamdino.in and previews with ?college=). */
const BY_SLUG: Record<string, College> = {
  gitam: GITAM,
  srm: SRM,
};

/**
 * Resolve the active college. Order: explicit ?college= override (testing) →
 * exact hostname → first subdomain label → DEFAULT to GITAM. The default is the
 * safety net: any unknown/misconfigured host falls back to the existing site.
 */
export function resolveCollege(): College {
  try {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("college");
    if (override && BY_SLUG[override]) {
      try { localStorage.setItem("td:college", override); } catch { /* ignore */ }
      return BY_SLUG[override];
    }
    // sticky override for preview testing (so navigation keeps the college)
    const stored = (() => { try { return localStorage.getItem("td:college"); } catch { return null; } })();

    const host = window.location.hostname.toLowerCase();
    if (BY_HOST[host]) return BY_HOST[host];

    // subdomain label, e.g. "srm" from "srm.teamdino.in"
    const label = host.split(".")[0];
    if (BY_SLUG[label]) return BY_SLUG[label];

    // on localhost / *.vercel.app previews, honor the sticky override if set
    if (stored && BY_SLUG[stored]) return BY_SLUG[stored];
  } catch { /* SSR / no window — fall through */ }
  return GITAM; // safe default — existing behaviour
}

export const CURRENT_COLLEGE: College = resolveCollege();

/** The active college's display name — use everywhere instead of hardcoding "GITAM". */
export const collegeName = () => CURRENT_COLLEGE.name;
