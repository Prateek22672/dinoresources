import { useCallback, useState } from "react";

// Curated, slightly desaturated hues that sit well on the grey UI
// (ids kept stable so saved preferences keep working).
export const ACCENTS = [
  { id: "violet", label: "Violet", color: "#7c6cf0" },
  { id: "emerald", label: "Teal", color: "#14b8a6" },
  { id: "blue", label: "Sapphire", color: "#5b8def" },
  { id: "amber", label: "Gold", color: "#d9a441" },
  { id: "rose", label: "Rose", color: "#d962a8" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];

const KEY = "td:accent";

function apply(id: string) {
  if (id === "violet") delete document.documentElement.dataset.accent;
  else document.documentElement.dataset.accent = id;
}

/** App-wide accent color, persisted to localStorage and reflected on <html data-accent>. */
export function useAccent() {
  const [accent, setAccentState] = useState<string>(() => {
    try { return localStorage.getItem(KEY) || "violet"; } catch { return "violet"; }
  });

  const setAccent = useCallback((id: string) => {
    try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
    apply(id);
    setAccentState(id);
  }, []);

  return { accent, setAccent };
}
