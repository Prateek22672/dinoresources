// src/components/ai/PracticeCard.tsx
import { useState } from "react";
import { ChevronDown, ChevronUp, Lock, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window { Razorpay: any; }
}

const PRICE_LABEL = "₹49";

interface Question {
  id: string;
  question: string;
  answers: { detailed: string; simplified: string };
  isFree: boolean;
}

interface PracticeCardProps {
  q: Question;
  index: number;
  revealed: boolean;
  onReveal: () => void;
  isSubscribed?: boolean;
  onPaymentSuccess?: () => void;
}

type PaymentState =
  | "idle"
  | "creating_order"   // calling Edge Fn to create Razorpay order
  | "checkout_open"    // Razorpay modal is open
  | "verifying"        // calling Edge Fn to verify signature
  | "success"
  | "failed"
  | "sdk_missing";     // checkout.js didn't load

// ── Robustly load Razorpay SDK if it isn't already present ─────────────────
function ensureRazorpaySDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();

    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener("load",  () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay SDK failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
    document.head.appendChild(script);
  });
}

// ── Temporarily unlock touch-action so Razorpay's iframe buttons are tappable.
// The parent Drawer can set touch-action: manipulation which silently blocks
// all button taps / text-field focus inside the Razorpay iframe overlay.
// We snapshot the current values, set them to "auto" while the modal is open,
// then restore when it closes (success / dismiss / failure).
function overrideTouchAction(): () => void {
  const html = document.documentElement;
  const body = document.body;

  const prevHtmlTouch = html.style.touchAction;
  const prevBodyTouch = body.style.touchAction;
  const prevPointerEvents = body.style.pointerEvents;

  html.style.touchAction = "auto";
  body.style.touchAction = "auto";

  // 🔥 Critical fix
  body.style.pointerEvents = "auto";

  return () => {
    html.style.touchAction = prevHtmlTouch;
    body.style.touchAction = prevBodyTouch;
    body.style.pointerEvents = prevPointerEvents;
  };
}

export function PracticeCard({
  q,
  index,
  revealed,
  onReveal,
  isSubscribed = false,
  onPaymentSuccess,
}: PracticeCardProps) {
  const [mode, setMode]                 = useState<"detailed" | "simplified">("detailed");
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);

  const isLocked = !q.isFree && !isSubscribed;

  const handlePayment = async () => {
    setErrorMsg(null);

    // ── 1. Ensure Razorpay SDK is loaded ──────────────────────────────────
    try {
      await ensureRazorpaySDK();
    } catch {
      setPaymentState("sdk_missing");
      setErrorMsg("Payment SDK failed to load. Check your internet connection and try again.");
      return;
    }

    // ── 2. Get auth session ────────────────────────────────────────────────
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please log in to purchase a subscription.");
      return;
    }

    // ── 3. Create Razorpay order on server ────────────────────────────────
    setPaymentState("creating_order");

    let orderId: string;
    let keyId: string;

    try {
      const res = await supabase.functions.invoke("create-razorpay-order", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error || !res.data?.order_id) {
        if (res.data?.error === "Already subscribed") {
          toast.success("You're already subscribed! Refreshing...");
          onPaymentSuccess?.();
          return;
        }
        throw new Error(res.data?.error ?? "Failed to create order");
      }

      orderId = res.data.order_id;
      keyId   = res.data.key_id;
    } catch (err: any) {
      setPaymentState("failed");
      setErrorMsg(err.message ?? "Could not initiate payment. Please try again.");
      return;
    }

    // ── 4. Open Razorpay checkout ─────────────────────────────────────────
    setPaymentState("checkout_open");

    // Override touch-action on <html> and <body> so every button / input
    // inside the Razorpay iframe overlay responds to taps normally.
    // restoreTouchAction() MUST be called in every exit path below.
    const restoreTouchAction = overrideTouchAction();

    await new Promise<void>((resolveCheckout) => {
      const options = {
        key:         keyId,
        order_id:    orderId,
        amount:      4900,
        currency:    "INR",
        name:        "StudyAI Pro",
        description: "Unlock all questions & parts",
        theme:       { color: "#6366f1" },

        // ── Payment successful ─────────────────────────────────────────────
        handler: async (response: {
          razorpay_order_id:   string;
          razorpay_payment_id: string;
          razorpay_signature:  string;
        }) => {
          resolveCheckout();
          restoreTouchAction(); // ✅ restore before any async work
          setPaymentState("verifying");

          try {
            const verifyRes = await supabase.functions.invoke("verify-razorpay-payment", {
              body: {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              },
              headers: { Authorization: `Bearer ${session.access_token}` },
            });

            if (verifyRes.error || !verifyRes.data?.success) {
              throw new Error(verifyRes.data?.error ?? "Verification failed");
            }

            setPaymentState("success");
            try { localStorage.setItem("studyai_subscribed", "true"); } catch { /* ok */ }
            toast.success("🎉 Unlocked! All answers are now available.");
            onPaymentSuccess?.();

          } catch (err: any) {
            setPaymentState("failed");
            setErrorMsg(
              "Payment received but verification failed. " +
              "Please contact support with your payment ID: " +
              response.razorpay_payment_id
            );
          }
        },

        // ── Modal closed / dismissed ───────────────────────────────────────
        modal: {
          ondismiss: () => {
            resolveCheckout();
            restoreTouchAction(); // ✅ restore on dismiss
            setPaymentState((prev) =>
              prev === "checkout_open" ? "idle" : prev
            );
          },
          escape:        false,
          backdropclose: false,
          animation:     true,
        },
      };

      const rzp = new window.Razorpay(options);

      // ── Explicit payment failure inside checkout ────────────────────────
      rzp.on("payment.failed", (response: any) => {
        resolveCheckout();
        restoreTouchAction(); // ✅ restore on failure
        setPaymentState("failed");
        const desc = response?.error?.description ?? "Unknown error";
        const code = response?.error?.code        ?? "";
        setErrorMsg(`Payment failed: ${desc}${code ? ` (${code})` : ""}. Please try again.`);
      });

      rzp.open();
    });
  };

  // ── Status label helpers ───────────────────────────────────────────────────
  const paymentButtonLabel: Record<PaymentState, string> = {
    idle:           `Unlock All for ${PRICE_LABEL}`,
    creating_order: "Preparing payment…",
    checkout_open:  "Complete payment in popup…",
    verifying:      "Verifying payment…",
    success:        "Unlocked ✓",
    failed:         `Retry — ${PRICE_LABEL}`,
    sdk_missing:    "Retry (reload page)",
  };

  const isButtonDisabled = ["creating_order", "checkout_open", "verifying", "success"].includes(paymentState);

  return (
    <div className="rounded-xl border border-white/5 bg-[#0e0e11] overflow-hidden transition-all duration-300">

      {/* ── Question header ── */}
      <button
        onClick={onReveal}
        className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/40"
        aria-expanded={revealed}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="shrink-0 w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm flex items-center justify-center font-bold">
            {index + 1}
          </span>
          <p className="text-zinc-100 text-sm sm:text-base font-medium leading-relaxed pt-0.5">
            {q.question}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 mt-1">
          {isLocked && !revealed && <Lock className="w-4 h-4 text-zinc-600" />}
          {revealed
            ? <ChevronUp   className="w-5 h-5 text-zinc-500" />
            : <ChevronDown className="w-5 h-5 text-zinc-500" />
          }
        </div>
      </button>

      {/* ── Answer / paywall ── */}
      {revealed && (
        <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
          <div className="ml-10 sm:ml-11 pl-4 border-l-2 border-indigo-500/40">

            {isLocked ? (
              /* ── PAYWALL ── */
              <div className="py-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">Premium Answer</p>
                    <p className="text-xs text-zinc-500">
                      One-time unlock · All questions across all units
                    </p>
                  </div>
                </div>

                {/* Error message */}
                {errorMsg && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-300 leading-relaxed">{errorMsg}</p>
                  </div>
                )}

                {/* Payment button */}
                <button
                  onClick={handlePayment}
                  disabled={isButtonDisabled}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-100"
                >
                  {paymentState === "verifying" || paymentState === "creating_order"
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : <Sparkles  className="w-4 h-4" />
                  }
                  {paymentButtonLabel[paymentState]}
                </button>

                <p className="text-xs text-zinc-600">
                  Secure payment via Razorpay · One-time unlock · No subscription
                </p>
              </div>

            ) : (
              /* ── ANSWER ── */
              <>
                <div className="flex gap-2 mb-4">
                  {(["detailed", "simplified"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`px-3 py-1 text-xs rounded-full font-medium capitalize transition-colors ${
                        mode === m
                          ? "bg-indigo-500 text-white"
                          : "bg-white/10 text-zinc-400 hover:bg-white/15"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <MarkdownRenderer content={q.answers?.[mode] ?? ""} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}