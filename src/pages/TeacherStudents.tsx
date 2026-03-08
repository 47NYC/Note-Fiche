import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

const TeacherStudents = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadStudents();
  }, [user]);

  const loadStudents = async () => {
    if (!user) return;
    const { data: cls } = await supabase
      .from("classes")
      .select("id")
      .eq("teacher_id", user.id)
      .maybeSingle();

    if (cls) {
      const { data: mems } = await supabase
        .from("class_members")
        .select("*")
        .eq("class_id", cls.id);

      if (mems && mems.length > 0) {
        const studentIds = mems.map((m) => m.student_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", studentIds);

        setMembers(
          mems.map((m) => ({
            ...m,
            full_name:
              profiles?.find((p) => p.user_id === m.student_id)?.full_name ||
              "Élève",
          }))
        );
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Mes Élèves
        </h1>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading">
              Liste des élèves ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucun élève inscrit pour le moment.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50"
                  >
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                      {m.full_name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Rejoint le{" "}
                        {new Date(m.joined_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherStudents;
