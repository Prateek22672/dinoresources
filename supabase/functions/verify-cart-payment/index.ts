// verify-cart-payment
// Verifies the Razorpay signature, marks the order paid, grants access for every
// order_item (subject -> user_subject_access, combo -> user_year_access), and
// clears the cart. Idempotent: re-running on an already-paid order is a no-op.
//
// This is the CLIENT-DRIVEN confirmation path — it only runs if the student's
// browser survives to call it after Razorpay's checkout succeeds. On mobile,
// paying via a UPI app switch routinely kills that browser tab before it gets
// the chance: the money is captured by Razorpay regardless (orders are created
// with payment_capture:1), but this function never runs, the order sits at
// "created" forever, and the student sees no access despite being charged.
// razorpay-webhook is the fix for that — a server-to-server confirmation that
// does not depend on the browser — and both call the same finalizeOrder() so
// whichever one runs first wins and the other is a safe no-op.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient, getAuthUser, verifyRazorpaySignature, gatewayKeys } from "../_shared/razorpay.ts";
import { finalizeOrder } from "../_shared/finalizeOrder.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonResponse({ error: "Missing payment fields" }, 400);
    }

    const db = adminClient();

    // Find the pending order for THIS user FIRST (prevents cross-user claims,
    // and tells us which gateway account signed it).
    const { data: order, error: orderErr } = await db
      .from("orders")
      .select("id, user_id, status, gateway")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", user.id)
      .single();
    if (orderErr || !order) return jsonResponse({ error: "Order not found" }, 404);

    // Verify the signature with the SAME account that created the order
    const slot = order.gateway === "secondary" ? "secondary" : "primary";
    const ok = await verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, gatewayKeys(slot).secret);
    if (!ok) return jsonResponse({ error: "Signature verification failed" }, 400);

    const result = await finalizeOrder(db, order.id, razorpay_payment_id);
    if (!result.ok) return jsonResponse({ error: result.error ?? "Could not finalize order" }, 500);
    return jsonResponse({ success: true, already: result.already });
  } catch (err) {
    console.error("verify-cart-payment error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
