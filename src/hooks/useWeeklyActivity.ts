import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function useWeeklyActivity() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["weekly-activity", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);

      const { data: sessions } = await supabase
        .from("practice_sessions")
        .select("started_at, ended_at")
        .eq("user_id", user!.id)
        .gte("started_at", monday.toISOString());

      const minutesByDay = new Array(7).fill(0);

      (sessions ?? []).forEach((s) => {
        const start = new Date(s.started_at);
        const end = s.ended_at ? new Date(s.ended_at) : start;
        const dayIdx = (start.getDay() + 6) % 7; // 0=Mon
        const mins = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
        minutesByDay[dayIdx] += mins;
      });

      return DAY_LABELS.map((day, i) => ({ day, minutes: minutesByDay[i] }));
    },
  });
}
