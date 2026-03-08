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
};

export function useEvaluations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["evaluations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .eq("user_id", user!.id)
        .order("eval_date", { ascending: true });
      if (error) throw error;
      return data as Evaluation[];
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
