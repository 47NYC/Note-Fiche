-- Fix infinite recursion: classes SELECT policy references class_members, 
-- and class_members SELECT policy references classes → loop.
-- Solution: separate teacher and student SELECT policies on classes.

DROP POLICY IF EXISTS "students_view_classes" ON public.classes;

-- Teachers can see their own classes (no join needed)
CREATE POLICY "teachers_view_classes"
  ON public.classes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = teacher_id);

-- Students can see classes they belong to (direct check on class_members without touching classes)
CREATE POLICY "students_view_joined_classes"
  ON public.classes
  FOR SELECT
  TO authenticated
  USING (id IN (SELECT class_id FROM public.class_members WHERE student_id = auth.uid()));

-- Fix class_members: students_view should not reference classes
DROP POLICY IF EXISTS "teachers_view_members" ON public.class_members;

CREATE POLICY "teachers_view_members"
  ON public.class_members
  FOR SELECT
  TO authenticated
  USING (class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid()));

-- Fix documents students_view_docs
DROP POLICY IF EXISTS "students_view_docs" ON public.documents;

CREATE POLICY "students_view_docs"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (class_id IN (SELECT class_id FROM public.class_members WHERE student_id = auth.uid()));