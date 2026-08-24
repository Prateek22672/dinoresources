// razorpay-webhook
//
// The authoritative confirmation that a payment succeeded — independent of
// whether the student's browser survives to call verify-cart-payment.
//
// Why this exists: orders are created with payment_capture:1, so Razorpay
// captures the money the moment the student completes payment, regardless of
// what the browser does next. But verify-cart-payment previously was the ONLY
// way an order got marked paid, and it only runs if Razorpay's checkout.js
// `handler` callback fires in the browser. On mobile, paying via a UPI app
// switch (GPay/PhonePe) routinely backgrounds or kills that tab before it
// returns — the callback never fires, the order sits at "created" forever,
// and the student is charged with nothing to show for it. This function
// closes that gap: Razorpay calls it directly from its own servers the moment
// a payment is captured, so it does not depend on the student's device at all.
//
// Setup (one-time, in the Razorpay Dashboard):
//   Settings → Webhooks → Add New Webhook
//     URL:    https://<project-ref>.functions.supabase.co/razorpay-webhook
//     Secret: any strong random string YOU choose here
//     Events: payment.captured
//   Then: npx supabase secrets set RAZORPAY_WEBHOOK_SECRET=<that same string>
//   If a second Razorpay account is in use, register the webhook there too and
//   set RAZORPAY_WEBHOOK_SECRET_2 — both secrets are accepted below.
//
// Security: Razorpay signs the raw request body with HMAC-SHA256 using the
// webhook secret (a DIFFERENT secret from the payment signature verified in
// verify-cart-payment). The body must be read as raw text and verified BEFORE
// parsing — parsing first and re-serializing can change byte-for-byte
// formatting and silently break the signature check.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient } from "../_shared/razorpay.ts";
import { finalizeOrder } from "../_shared/finalizeOrder.ts";

const WEBHOOK_SECRETS = [
  Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "",
  Deno.env.get("RAZORPAY_WEBHOOK_SECRET_2") ?? "",
].filter(Boolean);

async function hmacHex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    if (WEBHOOK_SECRETS.length === 0) {
      // Not configured yet — this is a deployment/setup problem, not a
      // request problem, so 200 tells Razorpay "don't retry" rather than
      // hammering an endpoint that will never work until secrets are set.
      console.error("razorpay-webhook: no RAZORPAY_WEBHOOK_SECRET configured");
      return jsonResponse({ error: "Webhook not configured" }, 200);
    }

    const raw = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    if (!signature) return jsonResponse({ error: "Missing signature" }, 400);

    let verified = false;
    for (const secret of WEBHOOK_SECRETS) {
      const expected = await hmacHex(secret, raw);
      if (timingSafeEqual(expected, signature)) { verified = true; break; }
    }
    if (!verified) {
      console.error("razorpay-webhook: signature mismatch");
      return jsonResponse({ error: "Invalid signature" }, 400);
    }

    const payload = JSON.parse(raw);
    if (payload.event !== "payment.captured") {
      // Ack anything we don't act on so Razorpay stops retrying it.
      return jsonResponse({ received: true, ignored: payload.event });
    }

    const payment = payload.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;
    const paymentId = payment?.id;
    if (!razorpayOrderId || !paymentId) {
      console.error("razorpay-webhook: payment.captured with no order_id/payment id");
      return jsonResponse({ error: "Malformed payload" }, 400);
    }

    const db = adminClient();
    const { data: order, error: orderErr } = await db
      .from("orders")
      .select("id")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();

    if (orderErr) {
      console.error("razorpay-webhook: order lookup failed", orderErr.message);
      return jsonResponse({ error: "Lookup failed" }, 500);
    }
    if (!order) {
      // A payment for an order this DB never created (or already pruned) —
      // log it for a human to look at, but don't make Razorpay retry forever.
      console.error("razorpay-webhook: no matching order for", razorpayOrderId, "payment", paymentId);
      return jsonResponse({ received: true, matched: false });
    }

    const result = await finalizeOrder(db, order.id, paymentId);
    if (!result.ok) {
      console.error("razorpay-webhook: finalize failed", result.error);
      return jsonResponse({ error: result.error }, 500);
    }
    return jsonResponse({ received: true, matched: true, already: result.already });
  } catch (err) {
    console.error("razorpay-webhook error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
