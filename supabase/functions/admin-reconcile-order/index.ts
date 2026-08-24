// admin-reconcile-order
//
// Fixes an order stuck at "created" by asking Razorpay directly whether it was
// actually paid. This exists for the gap the webhook closes only going
// forward: orders paid BEFORE razorpay-webhook existed (or before it was
// configured) have no other way to be discovered as paid, short of a student
// filing a support ticket and an admin taking their word for it.
//
// Because orders are created with payment_capture:1, a successful payment is
// captured by Razorpay the instant the student completes it — independent of
// whether our own systems ever hear about it. So "captured on Razorpay's side"
// is the ground truth this checks against, not our own order status.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient, getAuthUser, userHasRole, gatewayKeys, fetchRazorpayOrderPayments } from "../_shared/razorpay.ts";
import { finalizeOrder } from "../_shared/finalizeOrder.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = await getAuthUser(req);
    if (!admin) return jsonResponse({ error: "Unauthorized" }, 401);
    if (!(await userHasRole(admin.id, "admin"))) return jsonResponse({ error: "Forbidden" }, 403);

    const { order_id } = await req.json().catch(() => ({}));
    if (!order_id) return jsonResponse({ error: "order_id is required" }, 400);

    const db = adminClient();
    const { data: order, error: orderErr } = await db
      .from("orders")
      .select("id, user_id, razorpay_order_id, status, gateway")
      .eq("id", order_id)
      .single();
    if (orderErr || !order) return jsonResponse({ error: "Order not found" }, 404);
    if (order.status === "paid") return jsonResponse({ outcome: "already_paid" });
    if (!order.razorpay_order_id || order.razorpay_order_id.startsWith("free_")) {
      return jsonResponse({ error: "This order has no Razorpay order to check" }, 400);
    }

    const slot = order.gateway === "secondary" ? "secondary" : "primary";
    const payments = await fetchRazorpayOrderPayments(order.razorpay_order_id, gatewayKeys(slot));

    const captured = payments.find((p) => p.status === "captured");
    if (!captured) {
      // Nothing wrongly stuck — the order genuinely was never paid (abandoned
      // checkout, failed payment, or the student is still mid-attempt).
      const attempted = payments.length > 0;
      return jsonResponse({
        outcome: attempted ? "attempted_not_captured" : "no_payment_found",
        payments: payments.map((p) => ({ id: p.id, status: p.status, amount: p.amount })),
      });
    }

    const result = await finalizeOrder(db, order.id, captured.id);
    if (!result.ok) return jsonResponse({ error: result.error ?? "Could not finalize order" }, 500);

    // This is exactly the kind of action an audit trail exists for: it moves
    // real money's worth of access outside the normal checkout flow.
    try {
      await db.from("admin_audit_log").insert({
        admin_id: admin.id,
        action: "order_reconciled",
        target_user_id: order.user_id,
        detail: { order_id: order.id, razorpay_order_id: order.razorpay_order_id, payment_id: captured.id },
      });
    } catch { /* audit failure must not undo a correct grant */ }

    return jsonResponse({ outcome: "reconciled", payment_id: captured.id });
  } catch (err) {
    console.error("admin-reconcile-order error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
