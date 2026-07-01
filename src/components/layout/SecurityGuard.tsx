import { useEffect, useState } from "react";
import { tbl } from "@/integrations/supabase/revamp";

/**
 * Site-wide protection, level controlled by admin (app_settings.security_level).
 *  0 — Off (developer mode; nothing blocked)
 *  1 — Block DevTools (F12 / Ctrl+Shift+I/J/C / Ctrl+U) + right-click
 *  2 — Level 1 + block copy / cut / paste + text selection
 *  3 — Level 2 + block printing + image drag (strict)
 */
export function useSecurityLevel(): number {
  const [level, setLevel] = useState<number>(() => {
    const c = Number(localStorage.getItem("td-sec"));
    return Number.isFinite(c) && c >= 0 ? c : 1;
  });
  useEffect(() => {
    tbl("app_settings").select("security_level").maybeSingle().then(({ data }: any) => {
      if (data && typeof data.security_level === "number") {
        setLevel(data.security_level);
        try { localStorage.setItem("td-sec", String(data.security_level)); } catch { /* ignore */ }
      }
    });
  }, []);
  return level;
}

export default function SecurityGuard() {
  const level = useSecurityLevel();

  useEffect(() => {
    if (level <= 0) return;

    const onContext = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      const mod = e.ctrlKey || e.metaKey;
      if (k === "F12") e.preventDefault();
      if (mod && e.shiftKey && ["I", "J", "C"].includes(k)) e.preventDefault();
      if (mod && k === "U") e.preventDefault();
      if (level >= 2 && mod && ["C", "X", "V", "A", "S"].includes(k)) e.preventDefault();
      if (level >= 3 && mod && k === "P") e.preventDefault();
    };
    const onClipboard = (e: Event) => { if (level >= 2) e.preventDefault(); };
    const onDragStart = (e: Event) => { if (level >= 3) e.preventDefault(); };

    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("copy", onClipboard);
    document.addEventListener("cut", onClipboard);
    document.addEventListener("paste", onClipboard);
    document.addEventListener("dragstart", onDragStart);

    let prevSelect = "";
    if (level >= 2) {
      prevSelect = document.body.style.userSelect;
      document.body.style.userSelect = "none";
      (document.body.style as any).webkitUserSelect = "none";
    }

    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("copy", onClipboard);
      document.removeEventListener("cut", onClipboard);
      document.removeEventListener("paste", onClipboard);
      document.removeEventListener("dragstart", onDragStart);
      if (level >= 2) {
        document.body.style.userSelect = prevSelect;
        (document.body.style as any).webkitUserSelect = prevSelect;
      }
    };
  }, [level]);

  return null;
}
