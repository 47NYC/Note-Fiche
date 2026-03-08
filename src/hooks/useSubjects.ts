import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Subject = {
  id: string;
  class_id: string;
  name: string;
  color: string;
};

// Fallback subjects when no class context is available
const DEFAULT_SUBJECTS = [
  { name: "Mathématiques", color: "bg-blue-500" },
  { name: "Français", color: "bg-rose-500" },
  { name: "Histoire-Géo EMC", color: "bg-amber-500" },
  { name: "Sciences (SVT)", color: "bg-green-500" },
  { name: "Physique-Chimie", color: "bg-emerald-500" },
  { name: "Anglais", color: "bg-cyan-500" },
  { name: "Espagnol", color: "bg-red-500" },
  { name: "Art Plastiques", color: "bg-pink-500" },
  { name: "Musique", color: "bg-fuchsia-500" },
  { name: "EPS", color: "bg-teal-500" },
  { name: "Technologie", color: "bg-purple-500" },
];

export function useSubjects() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["class-subjects", user?.id, role],
    enabled: !!user,
    queryFn: async () => {
      // Find class_id based on role
      let classId: string | null = null;

      if (role === "teacher") {
        const { data } = await supabase
          .from("classes")
          .select("id")
          .eq("teacher_id", user!.id)
          .maybeSingle();
        classId = data?.id ?? null;
      } else {
        const { data } = await supabase
          .from("class_members")
          .select("class_id")
          .eq("student_id", user!.id)
          .maybeSingle();
        classId = data?.class_id ?? null;
      }

      if (!classId) {
        return DEFAULT_SUBJECTS.map((s, i) => ({
          id: `default-${i}`,
          class_id: "",
          name: s.name,
          color: s.color,
        })) as Subject[];
      }

      const { data, error } = await (supabase
        .from("class_subjects" as any)
        .select("*")
        .eq("class_id", classId)
        .order("name") as any);

      if (error) throw error;
      return (data || []) as Subject[];
    },
  });

  const addSubject = useMutation({
    mutationFn: async ({ name, color, classId }: { name: string; color: string; classId: string }) => {
      const { error } = await (supabase
        .from("class_subjects" as any)
        .insert({ class_id: classId, name, color }) as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["class-subjects"] }),
  });

  const removeSubject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from("class_subjects" as any)
        .delete()
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["class-subjects"] }),
  });

  const subjectNames = query.data?.map((s) => s.name) ?? [];
  const getColor = (name: string) =>
    query.data?.find((s) => s.name === name)?.color ?? "bg-primary";

  return { ...query, subjects: query.data ?? [], subjectNames, getColor, addSubject, removeSubject };
}
