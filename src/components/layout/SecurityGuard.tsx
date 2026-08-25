import { useEffect, useState } from "react";
import { tbl } from "@/integrations/supabase/revamp";

/**
 * Site-wide protection, level controlled by admin (app_settings.security_level).
 *  0 — Off (developer mode; nothing blocked)
 *  1 — Block DevTools (F12 / Ctrl+Shift+I/J/C / Ctrl+U) + right-click
 *  2 — Level 1 + block copy / cut / paste + text selection
 *  3 — Level 2 + block printing + image drag
 *
 * Screenshot deterrence (PrintScreen) is a separate toggle — see
 * useScreenshotShield below — not part of this ladder.
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

/** app_settings.screenshot_shield — independent on/off for the PrintScreen shield. */
export function useScreenshotShield(): boolean {
  const [on, setOn] = useState<boolean>(() => {
    const c = localStorage.getItem("td-sec-shield");
    return c === null ? true : c === "1";
  });
  useEffect(() => {
    tbl("app_settings").select("screenshot_shield").maybeSingle().then(({ data }: any) => {
      if (data && typeof data.screenshot_shield === "boolean") {
        setOn(data.screenshot_shield);
        try { localStorage.setItem("td-sec-shield", data.screenshot_shield ? "1" : "0"); } catch { /* ignore */ }
      }
    });
  }, []);
  return on;
}

export default function SecurityGuard() {
  const level = useSecurityLevel();
  const shieldEnabled = useScreenshotShield();

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

  // PrintScreen is the only client-observable signal that's actually a
  // screenshot rather than a guess — unlike window-blur, clicking into an
  // embedded video (which steals focus from the top-level window the same
  // way switching tabs does) can never trigger this by accident.
  useEffect(() => {
    if (!shieldEnabled) return;

    const shieldOn = () => document.documentElement.classList.add("td-shield");
    const shieldOff = () => document.documentElement.classList.remove("td-shield");
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        try { navigator.clipboard.writeText(""); } catch { /* clipboard unavailable */ }
        shieldOn();
        setTimeout(shieldOff, 900);
      }
    };

    document.addEventListener("keyup", onKeyUp, true);
    return () => {
      document.removeEventListener("keyup", onKeyUp, true);
      shieldOff();
    };
  }, [shieldEnabled]);

  return null;
}
