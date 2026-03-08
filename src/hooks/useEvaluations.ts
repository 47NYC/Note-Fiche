import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Evaluation = {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  description: string;
  eval_date: string;
  color: string;
  created_at: string;
  class_id?: string | null;
};

export function useEvaluations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["evaluations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Fetch own evaluations
      const { data: own, error: ownErr } = await supabase
        .from("evaluations")
        .select("*")
        .eq("user_id", user!.id)
        .order("eval_date", { ascending: true });
      if (ownErr) throw ownErr;

      // Fetch class evaluations (from teachers)
      const { data: classEvals } = await supabase
        .from("evaluations")
        .select("*")
        .not("class_id", "is", null)
        .neq("user_id", user!.id)
        .order("eval_date", { ascending: true });

      // Merge and deduplicate
      const all = [...(own || []), ...(classEvals || [])];
      const seen = new Set<string>();
      const unique = all.filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
      unique.sort((a, b) => a.eval_date.localeCompare(b.eval_date));
      return unique as Evaluation[];
    },
  });

  const addEvaluation = useMutation({
    mutationFn: async (eval_: Omit<Evaluation, "id" | "user_id" | "created_at">) => {
      const { data, error } = await supabase
        .from("evaluations")
        .insert({ ...eval_, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluations"] }),
  });

  const updateEvaluation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Evaluation> & { id: string }) => {
      const { error } = await supabase.from("evaluations").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluations"] }),
  });

  const deleteEvaluation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("evaluations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluations"] }),
  });

  return { ...query, addEvaluation, updateEvaluation, deleteEvaluation };
}
