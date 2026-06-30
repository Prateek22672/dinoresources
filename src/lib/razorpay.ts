// Razorpay browser SDK helpers, shared across checkout flows.
declare global { interface Window { Razorpay: any } }

export function ensureRazorpaySDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
    document.head.appendChild(script);
  });
}

/** Temporarily relax touch/pointer styles so the Razorpay modal stays usable
 *  when opened over a Radix dialog/drawer. Returns a restore function. */
export function overrideTouchAction(): () => void {
  const html = document.documentElement;
  const body = document.body;
  const prev = {
    html: html.style.touchAction,
    body: body.style.touchAction,
    pe: body.style.pointerEvents,
  };
  html.style.touchAction = "auto";
  body.style.touchAction = "auto";
  body.style.pointerEvents = "auto";
  return () => {
    html.style.touchAction = prev.html;
    body.style.touchAction = prev.body;
    body.style.pointerEvents = prev.pe;
  };
}
