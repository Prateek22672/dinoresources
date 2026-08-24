import { useEffect, useState } from "react";

/**
 * One-at-a-time gate for the popups that greet a student.
 *
 * Four separate things wanted the screen on first login — the feature tour, the
 * appearance picker, the What's-New card and the proactive help nudge — and each
 * decided for itself with its own setTimeout. The tour and the theme picker both
 * used 1200ms, so they landed on top of each other; the nudge arrived at 3500ms
 * over whatever was still open.
 *
 * Staggering the timers would only have made the collision rarer, not impossible
 * — a slow network moves every one of them. Instead each popup declares that it
 * WANTS the screen, and this decides who actually gets it: the highest-priority
 * claimant, alone, until it releases. The rest wait their turn rather than
 * racing.
 */
export type SlotId = "tour" | "theme" | "whatsnew" | "nudge";

/** Earlier in the list wins. Order is the onboarding story: what the product is,
 *  then how it looks, then what changed, and only then an offer of help. */
const ORDER: SlotId[] = ["tour", "theme", "whatsnew", "nudge"];

const wanting = new Set<SlotId>();
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

/** Whoever is at the front of the queue right now, or null if nobody wants it. */
export function activeSlot(): SlotId | null {
  for (const id of ORDER) if (wanting.has(id)) return id;
  return null;
}

/**
 * Declare that this popup is ready to show, and learn whether it may.
 *
 * `wants` is the popup's OWN condition (timer elapsed, not dismissed before,
 * right page). The return value is that condition AND being first in the queue.
 */
export function useOnboardingSlot(id: SlotId, wants: boolean): boolean {
  const [, bump] = useState(0);

  useEffect(() => {
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  useEffect(() => {
    if (wants) wanting.add(id);
    else wanting.delete(id);
    notify();
    // Unmounting has to release the slot too, or a popup that navigates away
    // mid-sequence would block everything behind it forever.
    return () => { wanting.delete(id); notify(); };
  }, [id, wants]);

  return wants && activeSlot() === id;
}
