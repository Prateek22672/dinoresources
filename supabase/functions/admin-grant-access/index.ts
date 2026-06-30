// admin-grant-access
// Admin-only. Grants a user access to a subject or a full-year combo,
// tagged source='admin_grant', and writes an audit-log entry.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient, getAuthUser, userHasRole } from "../_shared/razorpay.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
    if (!(await userHasRole(user.id, "admin"))) return jsonResponse({ error: "Forbidden" }, 403);

    const { target_user_id, kind, subject_id, year_id, note } = await req.json();
    if (!target_user_id || (kind !== "subject" && kind !== "year")) {
      return jsonResponse({ error: "Invalid request" }, 400);
    }

    const db = adminClient();

    if (kind === "subject") {
      if (!subject_id) return jsonResponse({ error: "subject_id required" }, 400);
      const { data: existing } = await db.from("user_subject_access")
        .select("id").eq("user_id", target_user_id).eq("subject_id", subject_id)
        .is("revoked_at", null).maybeSingle();
      if (!existing) {
        await db.from("user_subject_access").insert({
          user_id: target_user_id, subject_id, source: "admin_grant", granted_by: user.id,
        });
      }
    } else {
      if (!year_id) return jsonResponse({ error: "year_id required" }, 400);
      const { data: existing } = await db.from("user_year_access")
        .select("id").eq("user_id", target_user_id).eq("year_id", year_id)
        .is("revoked_at", null).maybeSingle();
      if (!existing) {
        await db.from("user_year_access").insert({
          user_id: target_user_id, year_id, source: "admin_grant", granted_by: user.id,
        });
      }
    }

    await db.from("admin_audit_log").insert({
      admin_id: user.id,
      action: kind === "subject" ? "grant_subject" : "grant_year",
      target_user_id,
      target_subject_id: subject_id ?? null,
      target_year_id: year_id ?? null,
      detail: { note: note ?? null },
    });

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("admin-grant-access error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
