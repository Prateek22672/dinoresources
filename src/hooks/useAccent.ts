import { useCallback, useState } from "react";

// Curated, slightly desaturated hues that sit well on the grey UI
// (ids kept stable so saved preferences keep working).
// Gold was dropped. Its light-mode text colour measured 3.78:1 on a white card
// and white-on-gold measured 2.25:1 — both under the 4.5:1 needed to be read at
// these sizes, and the worst of the five on every measure. A muddy accent that
// is also the least legible is not a choice worth offering.
export const ACCENTS = [
  { id: "violet", label: "Violet", color: "#7c6cf0" },
  { id: "emerald", label: "Teal", color: "#14b8a6" },
  { id: "blue", label: "Sapphire", color: "#5b8def" },
  { id: "rose", label: "Rose", color: "#d962a8" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];

const KEY = "td:accent";

const isAccent = (id: string) => ACCENTS.some((a) => a.id === id);

function apply(id: string) {
  if (id === "violet") delete document.documentElement.dataset.accent;
  else document.documentElement.dataset.accent = id;
}

/** App-wide accent color, persisted to localStorage and reflected on <html data-accent>. */
export function useAccent() {
  // Anyone still on a retired accent is moved to the default and the stored
  // value rewritten. main.tsx will already have set data-accent to it, but no
  // rule matches so the page is showing violet regardless — without this the
  // picker would show nothing selected and never explain why.
  const [accent, setAccentState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && isAccent(saved)) return saved;
      if (saved) { localStorage.setItem(KEY, "violet"); delete document.documentElement.dataset.accent; }
    } catch { /* unreadable storage — the default is already correct */ }
    return "violet";
  });

  const setAccent = useCallback((id: string) => {
    try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
    apply(id);
    setAccentState(id);
  }, []);

  return { accent, setAccent };
}
