-- Payment gateway selection (Model A: one active gateway, admin-switchable).
-- test_mode drives sandbox vs live endpoints for Cashfree.
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS active_gateway text NOT NULL DEFAULT 'razorpay',
  ADD COLUMN IF NOT EXISTS gateway_test_mode boolean NOT NULL DEFAULT true;
