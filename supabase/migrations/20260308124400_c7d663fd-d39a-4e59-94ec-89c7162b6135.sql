
-- Add folder and brevet blanc flag to documents
ALTER TABLE public.documents
  ADD COLUMN folder text NOT NULL DEFAULT '',
  ADD COLUMN is_brevet_blanc boolean NOT NULL DEFAULT false;

-- Allow all authenticated students to view brevet blanc documents (public revision docs)
CREATE POLICY "students_view_brevet_docs" ON public.documents
  FOR SELECT TO authenticated
  USING (is_brevet_blanc = true);
