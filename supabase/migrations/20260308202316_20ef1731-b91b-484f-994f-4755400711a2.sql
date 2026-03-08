
-- Fix infinite recursion: create security definer functions to break circular RLS
CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND teacher_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.class_members WHERE student_id = _user_id AND class_id = _class_id)
$$;

CREATE OR REPLACE FUNCTION public.get_student_class_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT class_id FROM public.class_members WHERE student_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_teacher_class_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.classes WHERE teacher_id = _user_id
$$;

-- Fix classes policies
DROP POLICY IF EXISTS "students_view_joined_classes" ON public.classes;
CREATE POLICY "students_view_joined_classes" ON public.classes
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_student_class_ids(auth.uid())));

-- Fix class_members policies  
DROP POLICY IF EXISTS "teachers_view_members" ON public.class_members;
CREATE POLICY "teachers_view_members" ON public.class_members
  FOR SELECT TO authenticated
  USING (class_id IN (SELECT public.get_teacher_class_ids(auth.uid())));

-- Fix structured_documents policies
DROP POLICY IF EXISTS "students_view_structured_docs" ON public.structured_documents;
CREATE POLICY "students_view_structured_docs" ON public.structured_documents
  FOR SELECT TO authenticated
  USING (document_id IN (
    SELECT d.id FROM public.documents d
    WHERE d.class_id IN (SELECT public.get_student_class_ids(auth.uid()))
  ));

-- Fix documents policies
DROP POLICY IF EXISTS "students_view_docs" ON public.documents;
CREATE POLICY "students_view_docs" ON public.documents
  FOR SELECT TO authenticated
  USING (class_id IN (SELECT public.get_student_class_ids(auth.uid())));

-- Create student_doc_progress table
CREATE TABLE public.student_doc_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  structured_document_id uuid NOT NULL REFERENCES public.structured_documents(id) ON DELETE CASCADE,
  completed_chapters integer[] DEFAULT '{}',
  qcm_scores jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, structured_document_id)
);

ALTER TABLE public.student_doc_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_progress" ON public.student_doc_progress
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create flashcards table
CREATE TABLE public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  structured_document_id uuid REFERENCES public.structured_documents(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  subject text NOT NULL DEFAULT '',
  card_type text NOT NULL DEFAULT 'definition',
  next_review timestamptz DEFAULT now(),
  interval_days integer DEFAULT 0,
  ease_factor real DEFAULT 2.5,
  repetitions integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_flashcards" ON public.flashcards
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Make documents.file_path nullable (for Google Docs which have no file)
ALTER TABLE public.documents ALTER COLUMN file_path DROP NOT NULL;
ALTER TABLE public.documents ALTER COLUMN file_path SET DEFAULT '';

-- Add google_doc_url column to documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS google_doc_url text DEFAULT '';
