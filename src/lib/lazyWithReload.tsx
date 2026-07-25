import { lazy, ComponentType } from "react";

/**
 * lazy() wrapper that survives stale chunks after a deploy.
 *
 * When a new version ships, an already-open page holds references to the OLD
 * chunk filenames. The host purges those, so a dynamic import 404s and React
 * shows a blank screen. Here we catch that first failure and reload the page
 * ONCE (guarded per session) — the reload pulls the fresh index.html + new
 * chunk names and everything works, with no blank screen and no manual refresh.
 */
export function lazyWithReload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      // a successful load means chunks are healthy again — clear the guard
      try { sessionStorage.removeItem("td:chunk-reloaded"); } catch { /* ignore */ }
      return mod;
    } catch (err) {
      // Only auto-reload for chunk/module load failures, and only once, so a
      // genuinely broken build can't trap the user in a reload loop.
      const msg = String((err as Error)?.message || err);
      const isChunkError =
        /Loading chunk|dynamically imported module|Importing a module script failed|Failed to fetch/i.test(msg);
      let reloaded = false;
      try { reloaded = sessionStorage.getItem("td:chunk-reloaded") === "1"; } catch { /* ignore */ }

      if (isChunkError && !reloaded) {
        try { sessionStorage.setItem("td:chunk-reloaded", "1"); } catch { /* ignore */ }
        window.location.reload();
        // Never resolve — the reload replaces the page.
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}
