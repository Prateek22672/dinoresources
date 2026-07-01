# TeamDino Revamp — Backend Setup (run these yourself)

Per project rules, nothing here connects to Supabase automatically. Apply the SQL
and deploy the edge functions manually.

## 1. Apply migrations (Supabase SQL editor)

Run these **in order**:

1. `migrations/20260629100000_years_combos_access.sql` — years, subject combo/price columns, `user_subject_access`, `user_year_access`, `has_subject_access()`.
2. `migrations/20260629100100_subject_qa.sql` — Study-With-AI Q&A table (+ paywall RLS).
3. `migrations/20260629100200_cart_orders.sql` — `cart_items`, `orders`, `order_items`.
4. `migrations/20260629100300_rls_payment_tables.sql` — enables RLS on the legacy `subscriptions` / `user_subject_ownership` / `user_timetables` tables (closes a real security gap).
5. `migrations/20260629100400_admin_audit_and_profiles.sql` — `admin_audit_log`, `profiles.username/full_name`, admin profile/role policies.
6. `migrations/20260629100500_data_migration_seed.sql` — backfills subject slugs + year mapping, migrates existing ownership/subscriptions into the new access tables.

The sanity-check queries are at the bottom of file #6.

> After applying, set prices/years per subject in the **Admin → Subjects** panel
> (defaults: ₹11 subject, ₹29 combo). Map any subjects whose year didn't auto-detect.

## 2. Deploy edge functions

Functions (Deno) live in `supabase/functions/`:

| Function | Purpose | Auth |
|---|---|---|
| `create-cart-order` | Recompute cart total server-side → create Razorpay order → pending `orders`/`order_items` | user JWT |
| `verify-cart-payment` | Verify signature → mark paid → grant access → clear cart (idempotent) | user JWT |
| `admin-grant-access` | Grant subject/combo access + audit | admin only |
| `admin-revoke-access` | Soft-revoke access + audit | admin only |

```bash
supabase functions deploy create-cart-order
supabase functions deploy verify-cart-payment
supabase functions deploy admin-grant-access
supabase functions deploy admin-revoke-access
```

### Required secrets

```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_xxx
supabase secrets set RAZORPAY_KEY_SECRET=xxx
# SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
```

> Use **Razorpay test keys** while verifying the flow end-to-end.

## 3. Smoke test (test mode)

1. Add a subject and a combo to the cart in the app.
2. Checkout → `create-cart-order` returns `{ order_id, key_id, amount }`.
3. Pay with a Razorpay test card → `verify-cart-payment` returns `{ success: true }`.
4. Confirm rows appear in `user_subject_access` / `user_year_access`, the `orders` row is `paid`, and the cart is empty.
5. As an admin, grant then revoke access for a test user → confirm `revoked_at` flips and `admin_audit_log` records both actions.

## 4. Regenerate types (optional but recommended)

`src/integrations/supabase/types.ts` is generated. After migrations:

```bash
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

The frontend also ships hand-written types in `src/integrations/supabase/revamp-types.ts`
so the app compiles before you regenerate.

## Notes
- Legacy `create-subject-order` / `verify-subject-payment` / `create-razorpay-order`
  remain deployed and functional; the new cart flow supersedes them. You can retire
  them once the cart is live.
- Combo access is checked dynamically (`has_subject_access`): buying a year grants a
  single `user_year_access` row, not one row per subject.
