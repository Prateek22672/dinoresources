-- Legacy tables that were created directly in the original project's dashboard
-- (not via a migration file): subscriptions, user_subject_ownership, user_timetables.
-- Captured here so the schema is reproducible on any new project. Idempotent.

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status              text,
  razorpay_order_id   text,
  razorpay_payment_id text,
  amount_paise        integer,
  currency            text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_subject_ownership (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id   uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  payment_id   text,
  order_id     text,
  amount_paise integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_timetables (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monday     integer NOT NULL DEFAULT 0,
  tuesday    integer NOT NULL DEFAULT 0,
  wednesday  integer NOT NULL DEFAULT 0,
  thursday   integer NOT NULL DEFAULT 0,
  friday     integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
