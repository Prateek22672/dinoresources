import { useCallback, useState } from "react";

export const ACCENTS = [
  { id: "violet", label: "Violet", color: "#7c6cf0" },
  { id: "emerald", label: "Emerald", color: "#10b981" },
  { id: "blue", label: "Blue", color: "#3b82f6" },
  { id: "amber", label: "Amber", color: "#f59e0b" },
  { id: "rose", label: "Rose", color: "#f43f5e" },
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
