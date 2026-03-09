
CREATE TABLE public.pro_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  activated_at timestamp with time zone NOT NULL DEFAULT now(),
  code_used text NOT NULL
);

ALTER TABLE public.pro_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_pro" ON public.pro_access
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_pro" ON public.pro_access
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
