import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global { interface Window { Razorpay: any; } }

type PaymentState =
  | "idle"
  | "creating_order"
  | "checkout_open"
  | "verifying"
  | "success"
  | "failed"
  | "sdk_missing";

interface UseSubjectUnlockOptions {
  subjectId: string;
  subjectName: string;
  /** Used only for immediate display on the button before server responds.
   *  The actual charge is always determined server-side. */
  displayAmountInPaise?: number;
  onPaymentSuccess?: () => void | Promise<void>;
}

function ensureRazorpaySDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
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

export function useSubjectUnlock({
  subjectId,
  subjectName,
  displayAmountInPaise,
  onPaymentSuccess,
}: UseSubjectUnlockOptions) {
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Pre-seed with the display prop so the button shows the price immediately.
  // Gets overwritten with the server-confirmed amount once the order is created.
  const [serverAmount, setServerAmount] = useState<number | null>(
    displayAmountInPaise ?? null
  );

const priceLabel = useMemo(() => {
  if (serverAmount === null || serverAmount === undefined) return "...";
  return `₹${Math.floor(serverAmount / 100)}`;
}, [serverAmount]);

  const resetPaymentState = useCallback(() => {
    setPaymentState("idle");
    setErrorMsg(null);
    // Restore display price from prop so button label stays correct after a failure
    setServerAmount(displayAmountInPaise ?? null);
  }, [displayAmountInPaise]);

  const isButtonDisabled = [
    "creating_order",
    "checkout_open",
    "verifying",
    "success",
  ].includes(paymentState);

  const startUnlock = useCallback(async () => {
    setErrorMsg(null);

    try {
      await ensureRazorpaySDK();
    } catch {
      setPaymentState("sdk_missing");
      setErrorMsg("Payment SDK failed to load. Check your connection and retry.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Please log in to continue."); return; }

    setPaymentState("creating_order");

    let orderId: string;
    let keyId: string;
    let amount: number;

    try {
      // Only subject_id goes to the server — amount is never trusted from client
      const res = await supabase.functions.invoke("create-subject-order", {
        body: { subject_id: subjectId },
      });

      if (res.error || !res.data?.order_id) {
        if (res.data?.error === "Already owned") {
          toast.success("You already own this subject!");
          setPaymentState("success");
          await onPaymentSuccess?.();
          return;
        }
        throw new Error(res.data?.error ?? "Failed to create order");
      }

      orderId = res.data.order_id;
      keyId = res.data.key_id;
      amount = res.data.amount;
      setServerAmount(amount); // Confirm displayed price matches what was charged
    } catch (err: any) {
      setPaymentState("failed");
      setErrorMsg(err.message ?? "Could not initiate payment. Please try again.");
      return;
    }

    setPaymentState("checkout_open");
    const restoreTouchAction = overrideTouchAction();

    await new Promise<void>((resolve) => {
      const options = {
        key: keyId,
        order_id: orderId,
        amount,
        currency: "INR",
        name: "Team Dino",
        description: `Unlock: ${subjectName}`,
        theme: { color: "#6366f1" },

        handler: async (response: any) => {
          restoreTouchAction();
          setPaymentState("verifying");

          try {
            const verifyRes = await supabase.functions.invoke("verify-subject-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                subject_id: subjectId,
              },
            });

            if (verifyRes.error || !verifyRes.data?.success) {
              throw new Error(verifyRes.data?.error ?? "Verification failed");
            }

            setPaymentState("success");
            toast.success(`🎉 ${subjectName} unlocked!`);
            await onPaymentSuccess?.();
          } catch {
            setPaymentState("failed");
            setErrorMsg(
              "Payment received but verification failed. Contact support with payment ID: " +
                response.razorpay_payment_id
            );
          }
          resolve();
        },

        modal: {
          ondismiss: () => {
            restoreTouchAction();
            setPaymentState((prev) => prev === "checkout_open" ? "idle" : prev);
            resolve();
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
        setErrorMsg(`Payment failed: ${desc}. Please try again.`);
        resolve();
      });
      rzp.open();
    });
  }, [subjectId, subjectName, onPaymentSuccess]);

  return { paymentState, errorMsg, isButtonDisabled, startUnlock, resetPaymentState, priceLabel };
}