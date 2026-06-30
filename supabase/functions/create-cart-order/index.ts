// create-cart-order
// Reads the caller's server-side cart, recomputes the total from authoritative
// DB prices (never trusts the client), creates a Razorpay order, and records a
// pending order + snapshotted order_items. Returns checkout params.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  adminClient,
  createRazorpayOrder,
  getAuthUser,
  RZP_KEY_ID,
} from "../_shared/razorpay.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const db = adminClient();

    // 1) Load the user's cart
    const { data: cart, error: cartErr } = await db
      .from("cart_items")
      .select("id, item_type, subject_id, year_id")
      .eq("user_id", user.id);
    if (cartErr) throw cartErr;
    if (!cart || cart.length === 0) return jsonResponse({ error: "Cart is empty" }, 400);

    // 2) Resolve authoritative prices + labels
    const subjectIds = cart.filter((c) => c.subject_id).map((c) => c.subject_id);
    const yearIds = cart.filter((c) => c.year_id).map((c) => c.year_id);

    const [{ data: subjects }, { data: years }] = await Promise.all([
      subjectIds.length
        ? db.from("subjects").select("id, name, price_paise, active").in("id", subjectIds)
        : Promise.resolve({ data: [] as any[] }),
      yearIds.length
        ? db.from("years").select("id, name, combo_price_paise, active").in("id", yearIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const subjMap = new Map((subjects ?? []).map((s: any) => [s.id, s]));
    const yearMap = new Map((years ?? []).map((y: any) => [y.id, y]));

    const items: { item_type: string; subject_id: string | null; year_id: string | null; price_paise: number; label: string }[] = [];
    for (const c of cart) {
      if (c.item_type === "subject") {
        const s = subjMap.get(c.subject_id);
        if (!s || !s.active) return jsonResponse({ error: "A subject in your cart is unavailable" }, 400);
        items.push({ item_type: "subject", subject_id: s.id, year_id: null, price_paise: s.price_paise, label: s.name });
      } else {
        const y = yearMap.get(c.year_id);
        if (!y || !y.active) return jsonResponse({ error: "A combo in your cart is unavailable" }, 400);
        items.push({ item_type: "combo", subject_id: null, year_id: y.id, price_paise: y.combo_price_paise, label: `${y.name} — Full Access` });
      }
    }

    const subtotal = items.reduce((sum, i) => sum + i.price_paise, 0);
    if (subtotal <= 0) return jsonResponse({ error: "Invalid cart total" }, 400);

    // 2b) Validate + apply coupon SERVER-SIDE (never trust a client discount)
    let couponCode: string | null = null;
    let discount = 0;
    const rawCoupon = (await req.clone().json().catch(() => ({}))).coupon_code;
    if (rawCoupon && typeof rawCoupon === "string" && rawCoupon.trim()) {
      const { data: quote } = await db.rpc("coupon_quote", { _code: rawCoupon.trim(), _amount_paise: subtotal });
      const q = Array.isArray(quote) ? quote[0] : quote;
      if (q?.valid) { discount = Math.max(0, Math.min(subtotal, q.discount_paise ?? 0)); couponCode = rawCoupon.trim().toUpperCase(); }
    }

    const total = Math.max(0, subtotal - discount);
    if (total <= 0) return jsonResponse({ error: "Order total must be greater than zero" }, 400);

    // 3) Create the Razorpay order for the DISCOUNTED amount
    const rzpOrder = await createRazorpayOrder(total, `cart_${user.id.slice(0, 8)}_${Date.now()}`);

    // 4) Persist pending order + items
    const { data: order, error: orderErr } = await db
      .from("orders")
      .insert({
        user_id: user.id,
        razorpay_order_id: rzpOrder.id,
        amount_paise: total,
        discount_paise: discount,
        coupon_code: couponCode,
        currency: "INR",
        status: "created",
      })
      .select("id")
      .single();
    if (orderErr) throw orderErr;

    const { error: itemsErr } = await db.from("order_items").insert(
      items.map((i) => ({ ...i, order_id: order.id })),
    );
    if (itemsErr) throw itemsErr;

    return jsonResponse({
      order_id: rzpOrder.id,
      db_order_id: order.id,
      key_id: RZP_KEY_ID,
      amount: total,
      currency: "INR",
    });
  } catch (err) {
    console.error("create-cart-order error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
