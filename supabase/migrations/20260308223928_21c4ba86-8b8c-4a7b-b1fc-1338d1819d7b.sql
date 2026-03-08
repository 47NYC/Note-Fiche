
CREATE OR REPLACE FUNCTION public.update_streak_on_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _today date := CURRENT_DATE;
  _last date;
  _current int;
  _longest int;
BEGIN
  SELECT last_active_date, current_streak, longest_streak
    INTO _last, _current, _longest
    FROM public.streaks
   WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_active_date)
    VALUES (NEW.user_id, 1, 1, _today);
    RETURN NEW;
  END IF;

  -- Already counted today
  IF _last = _today THEN
    RETURN NEW;
  END IF;

  IF _last = _today - 1 THEN
    _current := _current + 1;
  ELSE
    _current := 1;
  END IF;

  IF _current > _longest THEN
    _longest := _current;
  END IF;

  UPDATE public.streaks
     SET current_streak = _current,
         longest_streak = _longest,
         last_active_date = _today,
         updated_at = now()
   WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_streak_on_session
  AFTER INSERT ON public.practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_streak_on_session();
