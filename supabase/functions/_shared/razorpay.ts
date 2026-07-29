// Shared Razorpay + Supabase helpers for TeamDino edge functions.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const RZP_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
export const RZP_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
// Optional SECOND Razorpay account for admin-switchable failover.
const RZP_KEY_ID_2 = Deno.env.get("RAZORPAY_KEY_ID_2") ?? "";
const RZP_KEY_SECRET_2 = Deno.env.get("RAZORPAY_KEY_SECRET_2") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

export type GatewaySlot = "primary" | "secondary";

/** Keys for a gateway slot. Falls back to primary if the secondary isn't set. */
export function gatewayKeys(slot: GatewaySlot): { id: string; secret: string } {
  if (slot === "secondary" && RZP_KEY_ID_2 && RZP_KEY_SECRET_2) {
    return { id: RZP_KEY_ID_2, secret: RZP_KEY_SECRET_2 };
  }
  return { id: RZP_KEY_ID, secret: RZP_KEY_SECRET };
}

/** Is the secondary Razorpay account configured? (drives the admin UI) */
export function secondaryConfigured(): boolean {
  return RZP_KEY_ID_2.length > 0 && RZP_KEY_SECRET_2.length > 0;
}
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

/** Service-role client — bypasses RLS. Use for privileged writes. */
export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/** Resolve the calling user from the request's Authorization header. */
export async function getAuthUser(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/** True if the user has the given role (checked server-side, RLS-bypassing). */
export async function userHasRole(userId: string, role: string): Promise<boolean> {
  const { data } = await adminClient()
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", role)
    .maybeSingle();
  return !!data;
}

/** Create a Razorpay order via REST. amount is in paise. Uses the given key
 *  set (defaults to the primary account). */
export async function createRazorpayOrder(amountPaise: number, receipt: string, keys?: { id: string; secret: string }) {
  const k = keys ?? { id: RZP_KEY_ID, secret: RZP_KEY_SECRET };
  const auth = btoa(`${k.id}:${k.secret}`);
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
      payment_capture: 1,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order failed: ${res.status} ${text}`);
  }
  return (await res.json()) as { id: string; amount: number; currency: string };
}

/** Verify the Razorpay payment signature: HMAC_SHA256(order_id|payment_id).
 *  Verifies against the given secret (defaults to the primary account). */
export async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret?: string,
): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret ?? RZP_KEY_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${orderId}|${paymentId}`));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // constant-time-ish compare
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
