/**
 * Tiny stale-while-revalidate cache — classic system-design pattern applied client-side.
 *
 * - localStorage persistence  → instant paint on revisit (no waterfall before first render)
 * - TTL freshness window      → zero network calls while data is fresh
 * - stale-while-revalidate    → expired data is served instantly, refreshed in background
 * - in-flight dedupe          → N components asking for the same key = 1 network request
 */
type Entry<T> = { v: T; t: number };

const inflight = new Map<string, Promise<unknown>>();

export async function cachedQuery<T>(key: string, fetcher: () => Promise<T>, ttlMs = 60_000): Promise<T> {
  const k = `td:swr:${key}`;
  let stale: T | undefined;

  try {
    const raw = localStorage.getItem(k);
    if (raw) {
      const e = JSON.parse(raw) as Entry<T>;
      if (Date.now() - e.t < ttlMs) return e.v; // fresh — serve from cache, no network
      stale = e.v;                              // expired — serve below, revalidate behind
    }
  } catch { /* storage unavailable — fall through to network */ }

  if (!inflight.has(k)) {
    inflight.set(
      k,
      fetcher()
        .then((v) => {
          try { localStorage.setItem(k, JSON.stringify({ v, t: Date.now() })); } catch { /* full/blocked */ }
          inflight.delete(k);
          return v;
        })
        .catch((err) => { inflight.delete(k); throw err; }),
    );
  }

  const p = inflight.get(k) as Promise<T>;
  if (stale !== undefined) {
    p.catch(() => { /* background refresh failed — stale copy already served */ });
    return stale;
  }
  return p;
}

/** Drop cached entries (all, or those whose key starts with a prefix). Use after admin writes. */
export function swrInvalidate(prefix = "") {
  try {
    const full = `td:swr:${prefix}`;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(full)) localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}
