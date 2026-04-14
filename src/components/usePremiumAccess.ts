import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type PaymentState =
  | "idle"
  | "creating_order"
  | "checkout_open"
  | "verifying"
  | "success"
  | "failed"
  | "sdk_missing";

interface UsePremiumAccessOptions {
  amountInPaise?: number;
  priceLabel?: string;
  productName?: string;
  description?: string;
  themeColor?: string;
  onPaymentSuccess?: () => void | Promise<void>;
}

function ensureRazorpaySDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();

    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Razorpay SDK failed to load")), { once: true });
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

export function usePremiumAccess({
  amountInPaise = 1100,
  priceLabel = "₹11",
  productName = "Team Dino Premium",
  description = "Unlock all premium features",
  themeColor = "#6366f1",
  onPaymentSuccess,
}: UsePremiumAccessOptions = {}) {
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetPaymentState = useCallback(() => {
    setPaymentState("idle");
    setErrorMsg(null);
  }, []);

  const paymentButtonLabel = useMemo<Record<PaymentState, string>>(
    () => ({
      idle: `Unlock All for ${priceLabel}`,
      creating_order: "Preparing payment…",
      checkout_open: "Complete payment in popup…",
      verifying: "Verifying payment…",
      success: "Unlocked ✓",
      failed: `Retry — ${priceLabel}`,
      sdk_missing: "Retry (reload page)",
    }),
    [priceLabel]
  );

  const isButtonDisabled = ["creating_order", "checkout_open", "verifying", "success"].includes(paymentState);

  const startPremiumUnlock = useCallback(async () => {
    setErrorMsg(null);

    try {
      await ensureRazorpaySDK();
    } catch {
      setPaymentState("sdk_missing");
      setErrorMsg("Payment SDK failed to load. Check your internet connection and try again.");
      return { ok: false as const, reason: "sdk_missing" as const };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Please log in to continue with payment.");
      return { ok: false as const, reason: "not_logged_in" as const };
    }

    setPaymentState("creating_order");

    let orderId: string;
    let keyId: string;

    try {
      const res = await supabase.functions.invoke("create-razorpay-order", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.error || !res.data?.order_id) {
        if (res.data?.error === "Already subscribed") {
          toast.success("You're already subscribed! Refreshing...");
          setPaymentState("success");
          try {
            localStorage.setItem("studyai_subscribed", "true");
          } catch {
            // ignore
          }
          await onPaymentSuccess?.();
          return { ok: true as const, reason: "already_subscribed" as const };
        }

        throw new Error(res.data?.error ?? "Failed to create order");
      }

      orderId = res.data.order_id;
      keyId = res.data.key_id;
    } catch (err: any) {
      setPaymentState("failed");
      setErrorMsg(err.message ?? "Could not initiate payment. Please try again.");
      return { ok: false as const, reason: "order_creation_failed" as const };
    }

    setPaymentState("checkout_open");
    const restoreTouchAction = overrideTouchAction();

    return await new Promise<
      | { ok: true; reason: "payment_success" | "already_subscribed" }
      | {
          ok: false;
          reason:
            | "dismissed"
            | "payment_failed"
            | "verification_failed"
            | "not_logged_in"
            | "sdk_missing"
            | "order_creation_failed";
        }
    >((resolve) => {
      const options = {
        key: keyId,
        order_id: orderId,
        amount: amountInPaise,
        currency: "INR",
        name: productName,
        description,
        theme: { color: themeColor },

        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          restoreTouchAction();
          setPaymentState("verifying");

          try {
            const verifyRes = await supabase.functions.invoke("verify-razorpay-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (verifyRes.error || !verifyRes.data?.success) {
              throw new Error(verifyRes.data?.error ?? "Verification failed");
            }

            setPaymentState("success");

            try {
              localStorage.setItem("studyai_subscribed", "true");
            } catch {
              // ignore
            }

            toast.success("🎉 Payment successful. Premium access unlocked.");
            await onPaymentSuccess?.();

            resolve({ ok: true, reason: "payment_success" });
          } catch {
            setPaymentState("failed");
            setErrorMsg(
              "Payment received but verification failed. Please contact support with your payment ID: " +
                response.razorpay_payment_id
            );
            resolve({ ok: false, reason: "verification_failed" });
          }
        },

        modal: {
          ondismiss: () => {
            restoreTouchAction();
            setPaymentState((prev) => (prev === "checkout_open" ? "idle" : prev));
            resolve({ ok: false, reason: "dismissed" });
          },
          escape: false,
          backdropclose: false,
          animation: true,
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response: any) => {
        restoreTouchAction();
        setPaymentState("failed");

        const desc = response?.error?.description ?? "Unknown error";
        const code = response?.error?.code ?? "";
        setErrorMsg(`Payment failed: ${desc}${code ? ` (${code})` : ""}. Please try again.`);

        resolve({ ok: false, reason: "payment_failed" });
      });

      rzp.open();
    });
  }, [amountInPaise, description, onPaymentSuccess, productName, themeColor]);

  return {
    paymentState,
    errorMsg,
    paymentButtonLabel,
    isButtonDisabled,
    startPremiumUnlock,
    resetPaymentState,
    priceLabel,
  };
}