import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const SUBJECT_COLORS: Record<string, string> = {
  "Mathématiques": "hsl(234, 89%, 58%)",
  "Français": "hsl(34, 100%, 50%)",
  "Histoire-Géo": "hsl(152, 69%, 41%)",
  "Sciences": "hsl(258, 90%, 66%)",
  "Anglais": "hsl(199, 89%, 48%)",
  "Physique-Chimie": "hsl(340, 82%, 52%)",
};

const DEFAULT_COLOR = "hsl(220, 14%, 46%)";

export interface SubjectData {
  name: string;
  progress: number; // average score 0-100
  color: string;
}

export function useSubjectProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subject-progress", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SubjectData[]> => {
      const { data: sessions } = await supabase
        .from("practice_sessions")
        .select("subject, score")
        .eq("user_id", user!.id);

      if (!sessions || sessions.length === 0) return [];

      const bySubject: Record<string, number[]> = {};
      sessions.forEach((s) => {
        const subj = s.subject || "Autre";
        if (!bySubject[subj]) bySubject[subj] = [];
        bySubject[subj].push(s.score ?? 0);
      });

      return Object.entries(bySubject)
        .map(([name, scores]) => ({
          name,
          progress: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          color: SUBJECT_COLORS[name] || DEFAULT_COLOR,
        }))
        .sort((a, b) => b.progress - a.progress);
    },
  });
}
