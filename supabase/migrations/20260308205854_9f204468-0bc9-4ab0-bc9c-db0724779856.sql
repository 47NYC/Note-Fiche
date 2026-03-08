
-- Allow teachers to view student_doc_progress for students in their class
CREATE POLICY "teachers_view_student_progress"
ON public.student_doc_progress
FOR SELECT
USING (
  user_id IN (
    SELECT cm.student_id FROM public.class_members cm
    WHERE cm.class_id IN (SELECT public.get_teacher_class_ids(auth.uid()))
  )
);

-- Allow teachers to view practice_sessions for students in their class
CREATE POLICY "teachers_view_student_sessions"
ON public.practice_sessions
FOR SELECT
USING (
  user_id IN (
    SELECT cm.student_id FROM public.class_members cm
    WHERE cm.class_id IN (SELECT public.get_teacher_class_ids(auth.uid()))
  )
);

-- Allow teachers to view flashcards for students in their class
CREATE POLICY "teachers_view_student_flashcards"
ON public.flashcards
FOR SELECT
USING (
  user_id IN (
    SELECT cm.student_id FROM public.class_members cm
    WHERE cm.class_id IN (SELECT public.get_teacher_class_ids(auth.uid()))
  )
);

-- Allow teachers to view streaks for students in their class
CREATE POLICY "teachers_view_student_streaks"
ON public.streaks
FOR SELECT
USING (
  user_id IN (
    SELECT cm.student_id FROM public.class_members cm
    WHERE cm.class_id IN (SELECT public.get_teacher_class_ids(auth.uid()))
  )
);
