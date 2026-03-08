import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { RecentQuiz } from "@/components/dashboard/RecentQuizzes";

export function useRecentQuizzes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recent-quizzes", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<RecentQuiz[]> => {
      const { data } = await supabase
        .from("practice_sessions")
        .select("subject, score, started_at")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false })
        .limit(5);

      return (data ?? []).map((s) => ({
        subject: s.subject || "Quiz",
        score: s.score,
        date: s.started_at,
      }));
    },
  });
}
