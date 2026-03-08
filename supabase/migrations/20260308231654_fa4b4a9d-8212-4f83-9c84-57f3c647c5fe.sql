
-- Add class_id to evaluations so teacher evals can be shared with students
ALTER TABLE public.evaluations ADD COLUMN class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE;

-- RLS: students can view evaluations for their classes
CREATE POLICY "students_view_class_evaluations"
ON public.evaluations
FOR SELECT
TO authenticated
USING (
  class_id IN (SELECT get_student_class_ids(auth.uid()))
);

-- Create a function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := NEW.user_id;
  _total_xp int;
  _total_quizzes int;
  _max_score int;
  _current_streak int;
  _subjects_count int;
  _hour int;
BEGIN
  -- Get totals
  SELECT COALESCE(SUM(points_earned), 0), COUNT(*), COALESCE(MAX(score), 0)
    INTO _total_xp, _total_quizzes, _max_score
    FROM public.practice_sessions
   WHERE user_id = _user_id;

  SELECT COALESCE(current_streak, 0) INTO _current_streak
    FROM public.streaks WHERE user_id = _user_id;

  SELECT COUNT(DISTINCT subject) INTO _subjects_count
    FROM public.practice_sessions WHERE user_id = _user_id AND subject != '';

  _hour := EXTRACT(HOUR FROM NOW());

  -- first_session
  IF _total_quizzes >= 1 THEN
    INSERT INTO public.achievements (user_id, key) VALUES (_user_id, 'first_session') ON CONFLICT DO NOTHING;
  END IF;

  -- streak achievements
  IF _current_streak >= 3 THEN
    INSERT INTO public.achievements (user_id, key) VALUES (_user_id, 'streak_3') ON CONFLICT DO NOTHING;
  END IF;
  IF _current_streak >= 7 THEN
    INSERT INTO public.achievements (user_id, key) VALUES (_user_id, 'streak_7') ON CONFLICT DO NOTHING;
  END IF;
  IF _current_streak >= 30 THEN
    INSERT INTO public.achievements (user_id, key) VALUES (_user_id, 'streak_30') ON CONFLICT DO NOTHING;
  END IF;

  -- XP achievements
  IF _total_xp >= 100 THEN
    INSERT INTO public.achievements (user_id, key) VALUES (_user_id, 'xp_100') ON CONFLICT DO NOTHING;
  END IF;
  IF _total_xp >= 500 THEN
    INSERT INTO public.achievements (user_id, key) VALUES (_user_id, 'xp_500') ON CONFLICT DO NOTHING;
  END IF;
  IF _total_xp >= 1000 THEN
    INSERT INTO public.achievements (user_id, key) VALUES (_user_id, 'xp_1000') ON CONFLICT DO NOTHING;
  END IF;

  -- Quiz achievements
  IF _total_quizzes >= 10 THEN
    INSERT INTO public.achievements (user_id, key) VALUES (_user_id, 'quiz_10') ON CONFLICT DO NOTHING;
  END IF;
  IF _total_quizzes >= 50 THEN
    INSERT INTO public.achievements (user_id, key) VALUES (_user_id, 'quiz_50') ON CONFLICT DO NOTHING;
  END IF;

  -- Perfect score
  IF _max_score >= 100 THEN
    INSERT INTO public.achievements (user_id, key) VALUES (_user_id, 'perfect_score') ON CONFLICT DO NOTHING;
  END IF;

  -- All subjects (6 main subjects)
  IF _subjects_count >= 6 THEN
    INSERT INTO public.achievements (user_id, key) VALUES (_user_id, 'all_subjects') ON CONFLICT DO NOTHING;
  END IF;

  -- Night owl
  IF _hour >= 22 OR _hour < 5 THEN
    INSERT INTO public.achievements (user_id, key) VALUES (_user_id, 'night_owl') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Add unique constraint for achievements to support ON CONFLICT
ALTER TABLE public.achievements ADD CONSTRAINT achievements_user_key_unique UNIQUE (user_id, key);

-- Trigger after practice session insert
CREATE TRIGGER check_achievements_on_session
AFTER INSERT ON public.practice_sessions
FOR EACH ROW
EXECUTE FUNCTION public.check_achievements();
