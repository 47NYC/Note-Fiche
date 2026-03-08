
CREATE TABLE public.structured_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  subject text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.structured_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_view_structured_docs" ON public.structured_documents
FOR SELECT USING (
  document_id IN (
    SELECT d.id FROM public.documents d
    JOIN public.class_members cm ON cm.class_id = d.class_id
    WHERE cm.student_id = auth.uid()
  )
);

CREATE POLICY "teachers_manage_structured_docs" ON public.structured_documents
FOR ALL USING (
  document_id IN (
    SELECT id FROM public.documents WHERE teacher_id = auth.uid()
  )
) WITH CHECK (
  document_id IN (
    SELECT id FROM public.documents WHERE teacher_id = auth.uid()
  )
);
