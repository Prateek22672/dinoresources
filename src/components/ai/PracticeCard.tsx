import { useState } from "react";
import { ChevronDown, ChevronUp, Lock, AlertCircle, RefreshCw } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window { Razorpay: any; }
}

const PRICE_LABEL = "₹11";

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
  | "idle" | "creating_order" | "checkout_open"
  | "verifying" | "success" | "failed" | "sdk_missing";

function ensureRazorpaySDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay SDK failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
    document.head.appendChild(script);
  });
}

function overrideTouchAction(): () => void {
  const html = document.documentElement;
  const body = document.body;
  const prevHtmlTouch = html.style.touchAction;
  const prevBodyTouch = body.style.touchAction;
  const prevPointerEvents = body.style.pointerEvents;
  html.style.touchAction = "auto";
  body.style.touchAction = "auto";
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
  const [mode, setMode] = useState<"detailed" | "simplified">("detailed");
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLocked = !q.isFree && !isSubscribed;

  const handlePayment = async () => {
    setErrorMsg(null);

    try {
      await ensureRazorpaySDK();
    } catch {
      setPaymentState("sdk_missing");
      setErrorMsg("Payment SDK failed to load. Check your connection and try again.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please log in to purchase a subscription.");
      return;
    }

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
      keyId = res.data.key_id;
    } catch (err: any) {
      setPaymentState("failed");
      setErrorMsg(err.message ?? "Could not initiate payment. Please try again.");
      return;
    }

    setPaymentState("checkout_open");
    const restoreTouchAction = overrideTouchAction();

    await new Promise<void>((resolveCheckout) => {
      const options = {
        key: keyId,
        order_id: orderId,
        amount: 1100,
        currency: "INR",
        name: "StudyAI Pro",
        description: "Unlock all questions & parts",
        theme: { color: "#0f0f0f" },

        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          resolveCheckout();
          restoreTouchAction();
          setPaymentState("verifying");
          try {
            const verifyRes = await supabase.functions.invoke("verify-razorpay-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (verifyRes.error || !verifyRes.data?.success) {
              throw new Error(verifyRes.data?.error ?? "Verification failed");
            }
            setPaymentState("success");
            try { localStorage.setItem("studyai_subscribed", "true"); } catch { }
            toast.success("Unlocked! All answers are now available.");
            onPaymentSuccess?.();
          } catch (err: any) {
            setPaymentState("failed");
            setErrorMsg(
              "Payment received but verification failed. Contact support with payment ID: " +
              response.razorpay_payment_id
            );
          }
        },

        modal: {
          ondismiss: () => {
            resolveCheckout();
            restoreTouchAction();
            setPaymentState((prev) => prev === "checkout_open" ? "idle" : prev);
          },
          escape: false,
          backdropclose: false,
          animation: true,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        resolveCheckout();
        restoreTouchAction();
        setPaymentState("failed");
        const desc = response?.error?.description ?? "Unknown error";
        const code = response?.error?.code ?? "";
        setErrorMsg(`Payment failed: ${desc}${code ? ` (${code})` : ""}. Please try again.`);
      });
      rzp.open();
    });
  };

  const paymentButtonLabel: Record<PaymentState, string> = {
    idle: `Unlock All for ${PRICE_LABEL}`,
    creating_order: "Preparing payment…",
    checkout_open: "Complete payment in popup…",
    verifying: "Verifying…",
    success: "Unlocked ✓",
    failed: `Retry — ${PRICE_LABEL}`,
    sdk_missing: "Retry (reload page)",
  };

  const isButtonDisabled = ["creating_order", "checkout_open", "verifying", "success"].includes(paymentState);

  return (
    <div className="rounded-xl border border-neutral-800 bg-[#141414] overflow-hidden transition-all duration-200">

      {/* Question header */}
      <button
        onClick={onReveal}
        className="w-full text-left px-4 py-3.5 flex items-start justify-between gap-4 hover:bg-neutral-800/40 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-600"
        aria-expanded={revealed}
      >
        <div className="flex items-start gap-3">
          <span className="shrink-0 min-w-[24px] h-6 flex items-center justify-center text-xs font-semibold text-neutral-500 mt-0.5">
            {index + 1}.
          </span>
          <p className="text-neutral-200 text-sm font-normal leading-relaxed pt-0.5">{q.question}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          {isLocked && !revealed && <Lock className="w-3.5 h-3.5 text-neutral-600" />}
          {revealed
            ? <ChevronUp className="w-4 h-4 text-neutral-600" />
            : <ChevronDown className="w-4 h-4 text-neutral-600" />}
        </div>
      </button>

      {/* Answer / paywall */}
      {revealed && (
        <div className="px-4 pb-4 pt-3 border-t border-neutral-800 animate-in slide-in-from-top-1 duration-200">

          {isLocked ? (
            /* PAYWALL */
            <div className="py-2 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-200">Premium Answer</p>
                  <p className="text-xs text-neutral-500">One-time unlock · All questions across all units</p>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 bg-red-950/40 border border-red-900/50 rounded-lg p-3">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-300 leading-relaxed">{errorMsg}</p>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={isButtonDisabled}
                className="flex items-center gap-2 bg-neutral-100 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {(paymentState === "verifying" || paymentState === "creating_order") && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                {paymentButtonLabel[paymentState]}
              </button>

              <p className="text-xs text-neutral-700">Secure payment via Razorpay · No subscription</p>
            </div>

          ) : (
            /* ANSWER */
            <>
              <div className="flex gap-1.5 mb-3.5">
                {(["detailed", "simplified"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-2.5 py-1 text-xs rounded font-medium capitalize transition-colors ${
                      mode === m
                        ? "bg-neutral-700 text-neutral-100"
                        : "bg-transparent text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {m === "simplified" ? "Summary" : m}
                  </button>
                ))}
              </div>
              <MarkdownRenderer content={q.answers?.[mode] ?? ""} />
            </>
          )}
        </div>
      )}
    </div>
  );
}