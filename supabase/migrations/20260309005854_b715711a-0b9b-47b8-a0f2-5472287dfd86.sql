-- Create referrals table for Pro referral system
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referral_code text UNIQUE NOT NULL DEFAULT substring(md5(random()::text), 1, 8),
  referred_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  used_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Pro users can see their own referral codes
CREATE POLICY "pro_users_view_own_referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id);

-- Pro users can insert their own referral codes
CREATE POLICY "pro_users_create_referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

-- Anyone can view a referral code (to validate it)
CREATE POLICY "anyone_lookup_referral_code" ON public.referrals
  FOR SELECT TO authenticated
  USING (true);

-- Update when referral is used
CREATE POLICY "update_referral_on_use" ON public.referrals
  FOR UPDATE TO authenticated
  USING (referred_user_id IS NULL OR referred_user_id = auth.uid());