-- Atomic coin adjustment — single UPDATE, no read-modify-write race, always
-- floors at 0, and records the ledger in the same transaction. Returns the new
-- balance (NULL if the user row is missing). Used by every earn/spend path so
-- coins can never be lost, double-counted, or leave the balance stuck.
CREATE OR REPLACE FUNCTION public.award_coins(_user uuid, _delta integer, _reason text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_balance integer;
BEGIN
  UPDATE public.profiles SET coins = GREATEST(0, coins + _delta)
  WHERE id = _user RETURNING coins INTO new_balance;
  IF new_balance IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.coin_transactions (user_id, delta, reason) VALUES (_user, _delta, _reason);
  RETURN new_balance;
END; $$;

-- turn the referral program ON
UPDATE public.app_settings SET referral_active = true;
