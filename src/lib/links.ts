/**
 * Outbound links to our other products, in one place so the three surfaces
 * that promote them cannot drift apart.
 */

/** Agent Fury on the Chrome Web Store — the extension is published. */
export const AGENTFURY_EXT =
  "https://chromewebstore.google.com/detail/agentfury/lellcodbeogpmhpcdnflphnmbefkmhgi?utm_source=teamdino";

/** The web app, for anyone not on Chrome. */
export const AGENTFURY_WEB = "https://agentfury.foliofyx.in/";

/** FreeAgentCoder (by Codeloft) — the free AI coding agent for VS Code. */
export const AGENTCODER_ID = "PrateekKoratala.freeagentcoder";
export const AGENTCODER_PAGE = "https://brain-rho-roan.vercel.app/install";
/** The product page — what "See what it does" opens. */
export const AGENTCODER_HOME = "https://brain-rho-roan.vercel.app/";
export const AGENTCODER_VSCODE = `vscode:extension/${AGENTCODER_ID}`;

/**
 * Try VS Code first; if nothing takes the vscode: link (VS Code isn't
 * installed) the page never loses focus, so after a moment send the tab to
 * the install page instead. That fallback navigates rather than opening a
 * popup — a window.open() 1.4s after the click is no longer a user gesture
 * and gets blocked. Phones can't run VS Code, so they go straight there.
 */
export function openAgentCoder() {
  if (/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) {
    window.open(AGENTCODER_PAGE, "_blank", "noopener");
    return;
  }
  let left = false;
  const onBlur = () => { left = true; };
  window.addEventListener("blur", onBlur, { once: true });
  window.location.href = AGENTCODER_VSCODE;
  setTimeout(() => {
    window.removeEventListener("blur", onBlur);
    if (!left && document.visibilityState === "visible") window.location.href = AGENTCODER_PAGE;
  }, 1400);
}
