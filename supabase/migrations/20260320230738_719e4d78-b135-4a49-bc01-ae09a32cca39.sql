
-- Class messages (real-time chat)
CREATE TABLE public.class_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_view_messages" ON public.class_messages
  FOR SELECT TO authenticated
  USING (
    public.is_class_member(auth.uid(), class_id) OR public.is_class_teacher(class_id, auth.uid())
  );

CREATE POLICY "members_send_messages" ON public.class_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (public.is_class_member(auth.uid(), class_id) OR public.is_class_teacher(class_id, auth.uid()))
  );

CREATE POLICY "own_messages_delete" ON public.class_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_messages;

-- Class announcements
CREATE TABLE public.class_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.class_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_manage_announcements" ON public.class_announcements
  FOR ALL TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()))
  WITH CHECK (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "members_view_announcements" ON public.class_announcements
  FOR SELECT TO authenticated
  USING (public.is_class_member(auth.uid(), class_id));

-- Class assignments
CREATE TABLE public.class_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  due_date timestamptz,
  max_points integer DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_manage_assignments" ON public.class_assignments
  FOR ALL TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()))
  WITH CHECK (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "members_view_assignments" ON public.class_assignments
  FOR SELECT TO authenticated
  USING (public.is_class_member(auth.uid(), class_id));

-- Assignment submissions
CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.class_assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  content text DEFAULT '',
  file_path text,
  grade integer,
  feedback text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz
);
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_manage_own_submissions" ON public.assignment_submissions
  FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "teachers_view_submissions" ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (
    assignment_id IN (
      SELECT id FROM public.class_assignments
      WHERE public.is_class_teacher(class_id, auth.uid())
    )
  );

CREATE POLICY "teachers_grade_submissions" ON public.assignment_submissions
  FOR UPDATE TO authenticated
  USING (
    assignment_id IN (
      SELECT id FROM public.class_assignments
      WHERE public.is_class_teacher(class_id, auth.uid())
    )
  );

-- Document comments
CREATE TABLE public.document_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_view_comments" ON public.document_comments
  FOR SELECT TO authenticated
  USING (
    document_id IN (
      SELECT d.id FROM public.documents d
      WHERE public.is_class_teacher(d.class_id, auth.uid())
        OR public.is_class_member(auth.uid(), d.class_id)
    )
  );

CREATE POLICY "members_add_comments" ON public.document_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    document_id IN (
      SELECT d.id FROM public.documents d
      WHERE public.is_class_teacher(d.class_id, auth.uid())
        OR public.is_class_member(auth.uid(), d.class_id)
    )
  );

CREATE POLICY "own_comments_delete" ON public.document_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
