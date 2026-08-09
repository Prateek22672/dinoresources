// verify-cart-payment
// Verifies the Razorpay signature, marks the order paid, grants access for every
// order_item (subject -> user_subject_access, combo -> user_year_access), and
// clears the cart. Idempotent: re-running on an already-paid order is a no-op.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient, getAuthUser, verifyRazorpaySignature, gatewayKeys } from "../_shared/razorpay.ts";

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
      .select("id, user_id, status, coupon_code, gateway")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", user.id)
      .single();
    if (orderErr || !order) return jsonResponse({ error: "Order not found" }, 404);

    // Verify the signature with the SAME account that created the order
    const slot = order.gateway === "secondary" ? "secondary" : "primary";
    const ok = await verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, gatewayKeys(slot).secret);
    if (!ok) return jsonResponse({ error: "Signature verification failed" }, 400);

    // Idempotency: already processed
    if (order.status === "paid") return jsonResponse({ success: true, already: true });

    const { data: items, error: itemsErr } = await db
      .from("order_items")
      .select("item_type, subject_id, year_id, price_paise")
      .eq("order_id", order.id);
    if (itemsErr) throw itemsErr;

    // Global validity window (0 = lifetime). Applied to new purchases only.
    const { data: settings } = await db.from("app_settings").select("purchase_validity_days").maybeSingle();
    const validityDays = Number(settings?.purchase_validity_days ?? 0);
    const expiresAt = validityDays > 0
      ? new Date(Date.now() + validityDays * 86_400_000).toISOString()
      : null;

    // Grant access. The active-row unique index is partial (revoked_at IS NULL),
    // so we check-then-insert rather than relying on upsert/onConflict.
    for (const i of items ?? []) {
      if (i.item_type === "subject" && i.subject_id) {
        const { data: existing } = await db
          .from("user_subject_access")
          .select("id")
          .eq("user_id", user.id).eq("subject_id", i.subject_id).is("revoked_at", null)
          .maybeSingle();
        if (!existing) {
          await db.from("user_subject_access").insert({
            user_id: user.id, subject_id: i.subject_id, source: "purchase",
            order_id: order.id, amount_paise: i.price_paise, expires_at: expiresAt,
          });
        }
      } else if (i.item_type === "combo" && i.year_id) {
        const { data: existing } = await db
          .from("user_year_access")
          .select("id")
          .eq("user_id", user.id).eq("year_id", i.year_id).is("revoked_at", null)
          .maybeSingle();
        if (!existing) {
          await db.from("user_year_access").insert({
            user_id: user.id, year_id: i.year_id, source: "combo",
            order_id: order.id, amount_paise: i.price_paise, expires_at: expiresAt,
          });
        }
      }
    }

    // Mark paid + clear cart
    await db.from("orders").update({ status: "paid", razorpay_payment_id }).eq("id", order.id);
    await db.from("cart_items").delete().eq("user_id", user.id);

    // Record coupon redemption (best-effort)
    if (order.coupon_code) {
      const { data: c } = await db.from("coupons").select("id, times_redeemed").ilike("code", order.coupon_code).maybeSingle();
      if (c) await db.from("coupons").update({ times_redeemed: (c.times_redeemed ?? 0) + 1 }).eq("id", c.id);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("verify-cart-payment error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
