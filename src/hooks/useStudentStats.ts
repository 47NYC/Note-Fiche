import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface StudentStats {
  totalXP: number;
  weeklyXP: number;
  currentStreak: number;
  longestStreak: number;
  totalQuizzes: number;
  weeklyQuizzes: number;
  averageScore: number;
  lastWeekAverageScore: number;
}

export function useStudentStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student-stats", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<StudentStats> => {
      const userId = user!.id;
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      // Fetch streak
      const { data: streak } = await supabase
        .from("streaks")
        .select("current_streak, longest_streak")
        .eq("user_id", userId)
        .maybeSingle();

      // Fetch all practice sessions
      const { data: allSessions } = await supabase
        .from("practice_sessions")
        .select("points_earned, score, started_at")
        .eq("user_id", userId);

      const sessions = allSessions ?? [];

      const totalXP = sessions.reduce((s, r) => s + (r.points_earned ?? 0), 0);
      const totalQuizzes = sessions.length;
      const averageScore = totalQuizzes > 0
        ? Math.round(sessions.reduce((s, r) => s + (r.score ?? 0), 0) / totalQuizzes)
        : 0;

      // Weekly stats
      const weeklySessions = sessions.filter(
        (s) => new Date(s.started_at) >= weekStart
      );
      const weeklyXP = weeklySessions.reduce((s, r) => s + (r.points_earned ?? 0), 0);
      const weeklyQuizzes = weeklySessions.length;

      // Last week average for comparison
      const lastWeekSessions = sessions.filter(
        (s) => {
          const d = new Date(s.started_at);
          return d >= lastWeekStart && d < weekStart;
        }
      );
      const lastWeekAverageScore = lastWeekSessions.length > 0
        ? Math.round(lastWeekSessions.reduce((s, r) => s + (r.score ?? 0), 0) / lastWeekSessions.length)
        : 0;

      return {
        totalXP,
        weeklyXP,
        currentStreak: streak?.current_streak ?? 0,
        longestStreak: streak?.longest_streak ?? 0,
        totalQuizzes,
        weeklyQuizzes,
        averageScore,
        lastWeekAverageScore,
      };
    },
  });
}
