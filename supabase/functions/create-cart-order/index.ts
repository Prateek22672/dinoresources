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
import { rewardReferrerOnFirstPurchase } from "../_shared/referral.ts";

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

    // ── FREE UNLOCK ──────────────────────────────────────────────────────────
    // If every item is ₹0 (free / preview subjects), grant access instantly and
    // skip Razorpay entirely — a zero-price cart must never hit the gateway
    // (Razorpay cannot charge ₹0). This makes free subjects work forever.
    if (subtotal <= 0) {
      const { data: settings } = await db.from("app_settings").select("purchase_validity_days").maybeSingle();
      const validityDays = Number(settings?.purchase_validity_days ?? 0);
      const expiresAt = validityDays > 0 ? new Date(Date.now() + validityDays * 86_400_000).toISOString() : null;

      const { data: freeOrder, error: foErr } = await db
        .from("orders")
        .insert({
          user_id: user.id,
          razorpay_order_id: `free_${user.id.slice(0, 8)}_${Date.now()}`,
          razorpay_payment_id: "free",
          amount_paise: 0,
          currency: "INR",
          status: "paid",
        })
        .select("id")
        .single();
      if (foErr) throw foErr;

      await db.from("order_items").insert(items.map((i) => ({ ...i, order_id: freeOrder.id })));

      for (const i of items) {
        if (i.item_type === "subject" && i.subject_id) {
          const { data: ex } = await db.from("user_subject_access").select("id")
            .eq("user_id", user.id).eq("subject_id", i.subject_id).is("revoked_at", null).maybeSingle();
          if (!ex) await db.from("user_subject_access").insert({
            user_id: user.id, subject_id: i.subject_id, source: "purchase",
            order_id: freeOrder.id, amount_paise: 0, expires_at: expiresAt,
          });
        } else if (i.item_type === "combo" && i.year_id) {
          const { data: ex } = await db.from("user_year_access").select("id")
            .eq("user_id", user.id).eq("year_id", i.year_id).is("revoked_at", null).maybeSingle();
          if (!ex) await db.from("user_year_access").insert({
            user_id: user.id, year_id: i.year_id, source: "combo",
            order_id: freeOrder.id, amount_paise: 0, expires_at: expiresAt,
          });
        }
      }

      await db.from("cart_items").delete().eq("user_id", user.id);
      return jsonResponse({ free: true, success: true });
    }

    // Parse the request body once (coupon + selected optional charges).
    const body = await req.json().catch(() => ({} as any));
    const rawCoupon = body?.coupon_code;
    const selectedChargeIds: string[] = Array.isArray(body?.charge_ids)
      ? body.charge_ids.filter((x: unknown) => typeof x === "string")
      : [];

    // 2b) Validate + apply coupon SERVER-SIDE (never trust a client discount)
    let couponCode: string | null = null;
    let discount = 0;
    if (rawCoupon && typeof rawCoupon === "string" && rawCoupon.trim()) {
      const { data: quote } = await db.rpc("coupon_quote", { _code: rawCoupon.trim(), _amount_paise: subtotal });
      const q = Array.isArray(quote) ? quote[0] : quote;
      if (q?.valid) { discount = Math.max(0, Math.min(subtotal, q.discount_paise ?? 0)); couponCode = rawCoupon.trim().toUpperCase(); }
    }

    const taxable = Math.max(0, subtotal - discount);

    // 2c) Apply cart charges SERVER-SIDE. Mandatory charges are always added;
    // optional ones only when the client selected them. Amounts recomputed here.
    const { data: charges } = await db
      .from("cart_charges")
      .select("id, label, kind, amount, mandatory")
      .eq("active", true)
      .order("order_index", { ascending: true });

    const chargeDetail: { id: string; label: string; amount_paise: number; kind: string }[] = [];
    let chargesTotal = 0;
    for (const ch of charges ?? []) {
      const include = ch.mandatory === true || selectedChargeIds.includes(ch.id);
      if (!include) continue;
      const amt = ch.kind === "percent"
        ? Math.max(0, Math.round((taxable * Number(ch.amount)) / 100))
        : Math.max(0, Math.round(Number(ch.amount)));
      if (amt <= 0) continue;
      chargesTotal += amt;
      chargeDetail.push({ id: ch.id, label: ch.label, amount_paise: amt, kind: ch.kind });
    }

    const grossTotal = taxable + chargesTotal;
    if (grossTotal <= 0) return jsonResponse({ error: "Order total must be greater than zero" }, 400);

    // 2d) Apply COINS as a discount (server-side; balance deducted only on
    // payment success in verify-cart-payment, so an abandoned cart keeps its coins).
    const coinsToUse = Math.max(0, parseInt(body?.coins_to_use, 10) || 0);
    let coinsUsed = 0;
    let coinsPaise = 0;
    if (coinsToUse > 0) {
      const { data: cfg } = await db.from("app_settings").select("coins_per_rupee, coins_max_paise_per_order").maybeSingle();
      const { data: prof } = await db.from("profiles").select("coins").eq("id", user.id).maybeSingle();
      const perRupee = Math.max(1, Number(cfg?.coins_per_rupee ?? 20));
      const balance = Number(prof?.coins ?? 0);
      const usableCoins = Math.min(coinsToUse, balance);
      let discount = Math.floor((usableCoins / perRupee) * 100); // paise
      const maxCap = Number(cfg?.coins_max_paise_per_order ?? 0);
      if (maxCap > 0) discount = Math.min(discount, maxCap);
      discount = Math.max(0, Math.min(discount, grossTotal - 100)); // always leave ≥ ₹1 for Razorpay
      coinsPaise = discount;
      coinsUsed = Math.ceil((discount / 100) * perRupee);
    }

    const total = grossTotal - coinsPaise;
    if (total < 100) return jsonResponse({ error: "Order total too low" }, 400);

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
        charges_paise: chargesTotal,
        charges_detail: chargeDetail.length ? chargeDetail : null,
        coins_used: coinsUsed,
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
