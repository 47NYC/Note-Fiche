import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Copy, GraduationCap, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TeacherClass = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classData, setClassData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const { data: cls } = await supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", user.id)
      .maybeSingle();
    setClassData(cls);

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
      } else {
        setMembers([]);
      }
    }
  };

  const copyCode = () => {
    if (classData?.invite_code) {
      navigator.clipboard.writeText(classData.invite_code);
      toast({ title: "Code copié !", description: "Partagez-le avec vos élèves." });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-primary" />
          Ma Classe
        </h1>

        {classData && (
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="font-heading">Code d'invitation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <code className="px-6 py-3 rounded-xl bg-primary/10 text-primary font-mono text-2xl font-bold tracking-widest">
                  {classData.invite_code}
                </code>
                <Button variant="outline" size="icon" onClick={copyCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Partagez ce code à vos élèves pour qu'ils rejoignent la classe
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Élèves ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucun élève pour le moment. Partagez le code d'invitation !
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
                  >
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {m.full_name?.[0] || "?"}
                    </div>
                    <span className="font-medium text-sm">{m.full_name}</span>
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

export default TeacherClass;
