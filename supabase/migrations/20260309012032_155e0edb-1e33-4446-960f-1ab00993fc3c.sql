
CREATE OR REPLACE FUNCTION public.reward_referrer_upgrade(_referred_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _referrer_id uuid;
  _current_expires timestamp with time zone;
BEGIN
  SELECT referrer_id INTO _referrer_id
  FROM public.referrals
  WHERE referred_user_id = _referred_user_id
  LIMIT 1;

  IF _referrer_id IS NULL THEN
    RETURN;
  END IF;

  SELECT expires_at INTO _current_expires
  FROM public.pro_access
  WHERE user_id = _referrer_id;

  IF FOUND THEN
    UPDATE public.pro_access
    SET expires_at = GREATEST(COALESCE(_current_expires, now()), now()) + interval '30 days'
    WHERE user_id = _referrer_id;
  ELSE
    INSERT INTO public.pro_access (user_id, code_used, expires_at)
    VALUES (_referrer_id, 'referral_upgrade', now() + interval '30 days');
  END IF;
END;
$$;
