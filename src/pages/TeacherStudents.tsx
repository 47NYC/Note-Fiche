import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, Flame, Trophy, TrendingUp } from "lucide-react";

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
      .from("classes")
      .select("id")
      .eq("teacher_id", user.id)
      .maybeSingle();

    if (!cls) { setLoading(false); return; }

    const { data: mems } = await supabase
      .from("class_members")
      .select("*")
      .eq("class_id", cls.id);

    if (!mems || mems.length === 0) { setStudents([]); setLoading(false); return; }

    const studentIds = mems.map(m => m.student_id);

    // Fetch all data in parallel
    const [profilesRes, sessionsRes, flashcardsRes, progressRes, streaksRes, structDocsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", studentIds),
      supabase.from("practice_sessions").select("user_id, points_earned, score").in("user_id", studentIds),
      supabase.from("flashcards").select("user_id").in("user_id", studentIds),
      supabase.from("student_doc_progress").select("user_id, completed_chapters, structured_document_id").in("user_id", studentIds),
      supabase.from("streaks").select("user_id, current_streak").in("user_id", studentIds),
      supabase.from("structured_documents").select("id, content").eq("document_id", cls.id).limit(100),
    ]);

    // Count total chapters across all structured docs for this class
    // Get all documents for this class
    const { data: classDocs } = await supabase
      .from("documents")
      .select("id")
      .eq("class_id", cls.id);
    
    let totalChapters = 0;
    if (classDocs && classDocs.length > 0) {
      const docIds = classDocs.map(d => d.id);
      const { data: structDocs } = await supabase
        .from("structured_documents")
        .select("id, content")
        .in("document_id", docIds);
      
      if (structDocs) {
        structDocs.forEach(sd => {
          const content = sd.content as any;
          if (content?.chapters) totalChapters += content.chapters.length;
        });
      }
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
        ? Math.round(sessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / sessions.length)
        : 0;
      const completedChapters = new Set(progress.flatMap(p => p.completed_chapters || [])).size;

      return {
        id: m.id,
        student_id: sid,
        full_name: profile?.full_name || "Élève",
        joined_at: m.joined_at,
        totalXP,
        currentStreak: streak?.current_streak ?? 0,
        flashcardCount: flashcards.length,
        completedChapters,
        totalChapters,
        avgScore,
      };
    });

    // Sort by XP descending
    enriched.sort((a, b) => b.totalXP - a.totalXP);
    setStudents(enriched);
    setLoading(false);
  };

  const classAvgXP = students.length > 0
    ? Math.round(students.reduce((s, st) => s + st.totalXP, 0) / students.length)
    : 0;
  const classAvgScore = students.length > 0
    ? Math.round(students.reduce((s, st) => s + st.avgScore, 0) / students.length)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Progression des élèves
        </h1>

        {/* Class overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{students.length}</p>
              <p className="text-xs text-muted-foreground">Élèves</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 text-accent mx-auto mb-1" />
              <p className="text-2xl font-bold">{classAvgXP}</p>
              <p className="text-xs text-muted-foreground">XP moyen</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{classAvgScore}%</p>
              <p className="text-xs text-muted-foreground">Score moyen</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Flame className="w-6 h-6 text-accent mx-auto mb-1" />
              <p className="text-2xl font-bold">
                {students.length > 0 ? Math.max(...students.map(s => s.currentStreak)) : 0}
              </p>
              <p className="text-xs text-muted-foreground">Meilleure série</p>
            </CardContent>
          </Card>
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
                  <div key={s.id} className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    {/* Rank + Avatar */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-muted-foreground w-5 text-right">
                        {i + 1}
                      </span>
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                        {s.full_name[0] || "?"}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{s.full_name}</p>
                        <span className="text-sm font-semibold text-primary">{s.totalXP} XP</span>
                      </div>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-accent" />
                          {s.currentStreak}j série
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-primary" />
                          {s.flashcardCount} cartes
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-primary" />
                          Score moy: {s.avgScore}%
                        </span>
                      </div>

                      {/* Chapter progress */}
                      {s.totalChapters > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Chapitres complétés</span>
                            <span className="font-medium">{s.completedChapters}/{s.totalChapters}</span>
                          </div>
                          <Progress value={s.totalChapters > 0 ? (s.completedChapters / s.totalChapters) * 100 : 0} className="h-2" />
                        </div>
                      )}
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
