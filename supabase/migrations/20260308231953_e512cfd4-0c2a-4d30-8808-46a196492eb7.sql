
-- Create class_subjects table
CREATE TABLE public.class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'bg-primary',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, name)
);

ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

-- Teachers manage their class subjects
CREATE POLICY "teachers_manage_subjects"
ON public.class_subjects
FOR ALL
TO authenticated
USING (class_id IN (SELECT get_teacher_class_ids(auth.uid())))
WITH CHECK (class_id IN (SELECT get_teacher_class_ids(auth.uid())));

-- Students can view their class subjects
CREATE POLICY "students_view_subjects"
ON public.class_subjects
FOR SELECT
TO authenticated
USING (class_id IN (SELECT get_student_class_ids(auth.uid())));

-- Function to seed default subjects when a class is created
CREATE OR REPLACE FUNCTION public.seed_default_subjects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.class_subjects (class_id, name, color) VALUES
    (NEW.id, 'Mathématiques', 'bg-blue-500'),
    (NEW.id, 'Français', 'bg-rose-500'),
    (NEW.id, 'Histoire-Géo EMC', 'bg-amber-500'),
    (NEW.id, 'Sciences (SVT)', 'bg-green-500'),
    (NEW.id, 'Physique-Chimie', 'bg-emerald-500'),
    (NEW.id, 'Anglais', 'bg-cyan-500'),
    (NEW.id, 'Espagnol', 'bg-red-500'),
    (NEW.id, 'Art Plastiques', 'bg-pink-500'),
    (NEW.id, 'Musique', 'bg-fuchsia-500'),
    (NEW.id, 'EPS', 'bg-teal-500'),
    (NEW.id, 'Technologie', 'bg-purple-500');
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_subjects_on_class_create
AFTER INSERT ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.seed_default_subjects();

-- Seed subjects for existing classes
INSERT INTO public.class_subjects (class_id, name, color)
SELECT c.id, s.name, s.color
FROM public.classes c
CROSS JOIN (VALUES
  ('Mathématiques', 'bg-blue-500'),
  ('Français', 'bg-rose-500'),
  ('Histoire-Géo EMC', 'bg-amber-500'),
  ('Sciences (SVT)', 'bg-green-500'),
  ('Physique-Chimie', 'bg-emerald-500'),
  ('Anglais', 'bg-cyan-500'),
  ('Espagnol', 'bg-red-500'),
  ('Art Plastiques', 'bg-pink-500'),
  ('Musique', 'bg-fuchsia-500'),
  ('EPS', 'bg-teal-500'),
  ('Technologie', 'bg-purple-500')
) AS s(name, color)
ON CONFLICT DO NOTHING;
