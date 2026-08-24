// Grants access for a paid order and marks it paid. The one place this logic
// lives — three callers need it (the client-driven verify, the Razorpay
// webhook, and the admin reconciliation tool), and it was already duplicated
// once between here and create-cart-order's free-unlock branch before this
// existed. A single implementation means a fix to the grant logic can't land
// in one caller and quietly not the others.
//
// Idempotent by design: an already-paid order is a safe no-op. This matters
// beyond neatness — Razorpay retries webhook delivery at-least-once, and a
// student can legitimately trigger both the client callback AND the webhook
// for the same payment.
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface FinalizeResult {
  ok: boolean;
  already: boolean;
  error?: string;
}

export async function finalizeOrder(
  db: SupabaseClient,
  orderId: string,
  paymentId: string | null,
): Promise<FinalizeResult> {
  const { data: order, error: orderErr } = await db
    .from("orders")
    .select("id, user_id, status, coupon_code")
    .eq("id", orderId)
    .single();
  if (orderErr || !order) return { ok: false, already: false, error: "Order not found" };
  if (order.status === "paid") return { ok: true, already: true };

  const { data: items, error: itemsErr } = await db
    .from("order_items")
    .select("item_type, subject_id, year_id, price_paise")
    .eq("order_id", order.id);
  if (itemsErr) return { ok: false, already: false, error: itemsErr.message };

  const { data: settings } = await db.from("app_settings").select("purchase_validity_days").maybeSingle();
  const validityDays = Number(settings?.purchase_validity_days ?? 0);
  const expiresAt = validityDays > 0
    ? new Date(Date.now() + validityDays * 86_400_000).toISOString()
    : null;

  for (const i of items ?? []) {
    if (i.item_type === "subject" && i.subject_id) {
      const { data: existing } = await db
        .from("user_subject_access")
        .select("id")
        .eq("user_id", order.user_id).eq("subject_id", i.subject_id).is("revoked_at", null)
        .maybeSingle();
      if (!existing) {
        await db.from("user_subject_access").insert({
          user_id: order.user_id, subject_id: i.subject_id, source: "purchase",
          order_id: order.id, amount_paise: i.price_paise, expires_at: expiresAt,
        });
      }
    } else if (i.item_type === "combo" && i.year_id) {
      const { data: existing } = await db
        .from("user_year_access")
        .select("id")
        .eq("user_id", order.user_id).eq("year_id", i.year_id).is("revoked_at", null)
        .maybeSingle();
      if (!existing) {
        await db.from("user_year_access").insert({
          user_id: order.user_id, year_id: i.year_id, source: "combo",
          order_id: order.id, amount_paise: i.price_paise, expires_at: expiresAt,
        });
      }
    }
  }

  await db.from("orders").update({
    status: "paid",
    ...(paymentId ? { razorpay_payment_id: paymentId } : {}),
  }).eq("id", order.id);

  // Cart is cleared unconditionally, matching the original inline behaviour —
  // not scoped to this order's items, since a paid cart is assumed spent.
  await db.from("cart_items").delete().eq("user_id", order.user_id);

  if (order.coupon_code) {
    const { data: c } = await db.from("coupons").select("id, times_redeemed").ilike("code", order.coupon_code).maybeSingle();
    if (c) await db.from("coupons").update({ times_redeemed: (c.times_redeemed ?? 0) + 1 }).eq("id", c.id);
  }

  return { ok: true, already: false };
}
