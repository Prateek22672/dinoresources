import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; isChunk: boolean; }

/**
 * App-level safety net. Any render/runtime error is caught here so the user
 * sees a friendly reload screen instead of a blank black page. Chunk-load
 * errors (stale build after a deploy) auto-reload once.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, isChunk: false };

  static getDerivedStateFromError(err: unknown): State {
    const msg = String((err as Error)?.message || err);
    const isChunk = /Loading chunk|dynamically imported module|Importing a module script failed|Failed to fetch/i.test(msg);
    return { hasError: true, isChunk };
  }

  componentDidCatch(err: unknown) {
    const msg = String((err as Error)?.message || err);
    const isChunk = /Loading chunk|dynamically imported module|Importing a module script failed|Failed to fetch/i.test(msg);
    if (isChunk) {
      let reloaded = false;
      try { reloaded = sessionStorage.getItem("td:chunk-reloaded") === "1"; } catch { /* ignore */ }
      if (!reloaded) {
        try { sessionStorage.setItem("td:chunk-reloaded", "1"); } catch { /* ignore */ }
        window.location.reload();
      }
    }
    // eslint-disable-next-line no-console
    console.error("App error boundary:", err);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    // Chunk error auto-reloads; show a neutral loading state meanwhile.
    if (this.state.isChunk) {
      return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <span className="text-2xl">🦖</span>
        </div>
        <h1 className="text-white text-xl font-bold">Something hiccuped</h1>
        <p className="text-zinc-400 text-sm mt-2 max-w-xs leading-relaxed">
          The page didn't load right. A quick reload usually fixes it.
        </p>
        <button
          onClick={() => { try { sessionStorage.removeItem("td:chunk-reloaded"); } catch { /* ignore */ } window.location.reload(); }}
          className="mt-6 h-11 px-6 rounded-full bg-white text-black text-sm font-bold hover:scale-[1.03] active:scale-95 transition-transform"
        >
          Reload
        </button>
      </div>
    );
  }
}
