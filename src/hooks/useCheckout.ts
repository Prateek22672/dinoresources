import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeFn } from "@/integrations/supabase/revamp";
import { ensureRazorpaySDK, overrideTouchAction } from "@/lib/razorpay";
import { toast } from "sonner";

export type CheckoutState =
  | "idle" | "creating_order" | "checkout_open" | "verifying" | "success" | "failed";

/**
 * Cart checkout: create a server order from the user's cart, open Razorpay,
 * verify the payment, and grant access. Amount is always server-computed.
 */
export function useCheckout(onSuccess?: () => void | Promise<void>) {
  const [state, setState] = useState<CheckoutState>("idle");
  const [error, setError] = useState<string | null>(null);

  const busy = ["creating_order", "checkout_open", "verifying"].includes(state);

  const start = useCallback(async (couponCode?: string, chargeIds?: string[], coinsToUse?: number) => {
    setError(null);
    try {
      await ensureRazorpaySDK();
    } catch {
      setState("failed");
      setError("Payment SDK failed to load. Check your connection and retry.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Please log in to continue."); return; }

    setState("creating_order");
    const orderBody: Record<string, unknown> = {};
    if (couponCode) orderBody.coupon_code = couponCode;
    if (chargeIds && chargeIds.length) orderBody.charge_ids = chargeIds;
    if (coinsToUse && coinsToUse > 0) orderBody.coins_to_use = coinsToUse;
    const { data, error: orderErr } = await invokeFn<{
      order_id?: string; key_id?: string; amount?: number; currency?: string; free?: boolean;
    }>("create-cart-order", Object.keys(orderBody).length ? orderBody : undefined);

    // Free cart (all ₹0 items): unlocked server-side already — no Razorpay.
    if (data?.free) {
      setState("success");
      toast.success("🎉 Unlocked — it's free!");
      await onSuccess?.();
      return;
    }

    if (orderErr || !data?.order_id) {
      setState("failed");
      setError(orderErr ?? "Could not start checkout.");
      return;
    }

    setState("checkout_open");
    const restore = overrideTouchAction();

    await new Promise<void>((resolve) => {
      const rzp = new window.Razorpay({
        key: data.key_id,
        order_id: data.order_id,
        amount: data.amount,
        currency: data.currency ?? "INR",
        name: "Team Dino",
        description: "TeamDino purchase",
        theme: { color: getComputedStyle(document.documentElement).getPropertyValue("--td-accent").trim() || "#7c6cf0" },
        handler: async (response: any) => {
          restore();
          setState("verifying");
          const { data: vr, error: vErr } = await invokeFn<{ success: boolean }>(
            "verify-cart-payment",
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          );
          if (vErr || !vr?.success) {
            setState("failed");
            setError(
              "Payment received but verification failed. Contact support with payment ID: " +
                response.razorpay_payment_id,
            );
          } else {
            setState("success");
            toast.success("🎉 Purchase complete!");
            await onSuccess?.();
          }
          resolve();
        },
        modal: {
          ondismiss: () => {
            restore();
            setState((prev) => (prev === "checkout_open" ? "idle" : prev));
            resolve();
          },
          escape: false,
          backdropclose: false,
        },
      });
      rzp.on("payment.failed", (resp: any) => {
        restore();
        setState("failed");
        setError(`Payment failed: ${resp?.error?.description ?? "Unknown error"}.`);
        resolve();
      });
      rzp.open();
    });
  }, [onSuccess]);

  const reset = useCallback(() => { setState("idle"); setError(null); }, []);

  return { state, error, busy, start, reset };
}
