
-- Allow students to find classes by invite code (needed before joining)
CREATE OR REPLACE FUNCTION public.find_class_by_invite_code(_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.classes WHERE invite_code = _code LIMIT 1
$$;

-- Allow any authenticated user to read classes by invite_code for joining
DROP POLICY IF EXISTS "anyone_find_class_by_invite" ON public.classes;
CREATE POLICY "anyone_find_class_by_invite" ON public.classes
  FOR SELECT TO authenticated
  USING (true);
