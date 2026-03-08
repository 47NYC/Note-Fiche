import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, Flame, Trophy, TrendingUp } from "lucide-react";
import { StudentProgressChart } from "@/components/teacher/StudentProgressChart";
import { ExportCSV } from "@/components/teacher/ExportCSV";

interface SessionPoint { date: string; xp: number; score: number }

interface StudentData {
  id: string;
  student_id: string;
  full_name: string;
  joined_at: string;
  totalXP: number;
  currentStreak: number;
  flashcardCount: number;
  completedChapters: number;
  totalChapters: number;
  avgScore: number;
  sessions: SessionPoint[];
}

const TeacherStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadStudentStats();
  }, [user]);

  const loadStudentStats = async () => {
    if (!user) return;
    setLoading(true);

    const { data: cls } = await supabase
      .from("classes").select("id").eq("teacher_id", user.id).maybeSingle();
    if (!cls) { setLoading(false); return; }

    const { data: mems } = await supabase
      .from("class_members").select("*").eq("class_id", cls.id);
    if (!mems || mems.length === 0) { setStudents([]); setLoading(false); return; }

    const studentIds = mems.map(m => m.student_id);

    const [profilesRes, sessionsRes, flashcardsRes, progressRes, streaksRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", studentIds),
      supabase.from("practice_sessions").select("user_id, points_earned, score, started_at").in("user_id", studentIds),
      supabase.from("flashcards").select("user_id").in("user_id", studentIds),
      supabase.from("student_doc_progress").select("user_id, completed_chapters").in("user_id", studentIds),
      supabase.from("streaks").select("user_id, current_streak").in("user_id", studentIds),
    ]);

    // Count total chapters
    const { data: classDocs } = await supabase.from("documents").select("id").eq("class_id", cls.id);
    let totalChapters = 0;
    if (classDocs?.length) {
      const { data: structDocs } = await supabase
        .from("structured_documents").select("id, content").in("document_id", classDocs.map(d => d.id));
      structDocs?.forEach(sd => {
        const c = sd.content as any;
        if (c?.chapters) totalChapters += c.chapters.length;
      });
    }

    const enriched: StudentData[] = mems.map(m => {
      const sid = m.student_id;
      const profile = profilesRes.data?.find(p => p.user_id === sid);
      const sessions = sessionsRes.data?.filter(s => s.user_id === sid) || [];
      const flashcards = flashcardsRes.data?.filter(f => f.user_id === sid) || [];
      const progress = progressRes.data?.filter(p => p.user_id === sid) || [];
      const streak = streaksRes.data?.find(s => s.user_id === sid);

      const totalXP = sessions.reduce((sum, s) => sum + (s.points_earned ?? 0), 0);
      const avgScore = sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / sessions.length) : 0;
      const completedChapters = new Set(progress.flatMap(p => p.completed_chapters || [])).size;

      const sessionPoints: SessionPoint[] = sessions.map(s => ({
        date: new Date(s.started_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        xp: s.points_earned ?? 0,
        score: s.score ?? 0,
      }));

      return {
        id: m.id, student_id: sid,
        full_name: profile?.full_name || "Élève",
        joined_at: m.joined_at, totalXP,
        currentStreak: streak?.current_streak ?? 0,
        flashcardCount: flashcards.length,
        completedChapters, totalChapters, avgScore,
        sessions: sessionPoints,
      };
    });

    enriched.sort((a, b) => b.totalXP - a.totalXP);
    setStudents(enriched);
    setLoading(false);
  };

  const classAvgXP = students.length ? Math.round(students.reduce((s, st) => s + st.totalXP, 0) / students.length) : 0;
  const classAvgScore = students.length ? Math.round(students.reduce((s, st) => s + st.avgScore, 0) / students.length) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Progression des élèves
          </h1>
          {students.length > 0 && <ExportCSV students={students} />}
        </div>

        {/* Class overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, value: students.length, label: "Élèves", color: "text-primary" },
            { icon: Trophy, value: classAvgXP, label: "XP moyen", color: "text-accent" },
            { icon: TrendingUp, value: `${classAvgScore}%`, label: "Score moyen", color: "text-primary" },
            { icon: Flame, value: students.length ? Math.max(...students.map(s => s.currentStreak)) : 0, label: "Meilleure série", color: "text-accent" },
          ].map((stat, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4 text-center">
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-1`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Student list */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading">Détail par élève</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun élève inscrit pour le moment.</p>
            ) : (
              <div className="space-y-4">
                {students.map((s, i) => (
                  <div key={s.id} className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                          {s.full_name[0] || "?"}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{s.full_name}</p>
                          <span className="text-sm font-semibold text-primary">{s.totalXP} XP</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-accent" />{s.currentStreak}j série</span>
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-primary" />{s.flashcardCount} cartes</span>
                          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-primary" />Score moy: {s.avgScore}%</span>
                        </div>
                        {s.totalChapters > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Chapitres complétés</span>
                              <span className="font-medium">{s.completedChapters}/{s.totalChapters}</span>
                            </div>
                            <Progress value={(s.completedChapters / s.totalChapters) * 100} className="h-2" />
                          </div>
                        )}
                        <StudentProgressChart studentName={s.full_name} sessions={s.sessions} />
                      </div>
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
