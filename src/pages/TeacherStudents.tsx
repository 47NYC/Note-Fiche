import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, Flame, Trophy, TrendingUp, ClipboardList, Calendar } from "lucide-react";
import { StudentProgressChart } from "@/components/teacher/StudentProgressChart";
import { ExportCSV } from "@/components/teacher/ExportCSV";
import { cn } from "@/lib/utils";
import { ProGate } from "@/components/ProGate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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

interface ExamResult {
  id: string;
  student_name: string;
  subject: string;
  score: number;
  correct_count: number;
  cards_reviewed: number;
  points_earned: number;
  started_at: string;
  duration_min: number;
}

const TeacherStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
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
    if (!mems || mems.length === 0) { setStudents([]); setExamResults([]); setLoading(false); return; }

    const studentIds = mems.map(m => m.student_id);

    const [profilesRes, sessionsRes, flashcardsRes, progressRes, streaksRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", studentIds),
      supabase.from("practice_sessions").select("user_id, points_earned, score, started_at, ended_at, cards_reviewed, correct_count, subject").in("user_id", studentIds),
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

    const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p.full_name]) || []);

    // Build exam results from practice_sessions
    const results: ExamResult[] = (sessionsRes.data || [])
      .filter(s => s.cards_reviewed > 0)
      .map(s => {
        const startDate = new Date(s.started_at);
        const endDate = s.ended_at ? new Date(s.ended_at) : startDate;
        const durationMs = endDate.getTime() - startDate.getTime();
        return {
          id: crypto.randomUUID(),
          student_name: profileMap.get(s.user_id) || "Élève",
          subject: s.subject || "—",
          score: s.score ?? 0,
          correct_count: s.correct_count ?? 0,
          cards_reviewed: s.cards_reviewed ?? 0,
          points_earned: s.points_earned ?? 0,
          started_at: s.started_at,
          duration_min: Math.max(1, Math.round(durationMs / 60000)),
        };
      })
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

    setExamResults(results);

    const enriched: StudentData[] = mems.map(m => {
      const sid = m.student_id;
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
        full_name: profileMap.get(sid) || "Élève",
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

  // Exam results filters
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const examSubjects = [...new Set(examResults.map(r => r.subject).filter(Boolean))];
  const filteredExams = examResults.filter(r => {
    if (filterSubject !== "all" && r.subject !== filterSubject) return false;
    if (filterDateFrom && new Date(r.started_at) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(r.started_at) > new Date(filterDateTo + "T23:59:59")) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <ProGate feature="Tableau de bord analytique" description="Vue détaillée par élève : temps de travail, progression par chapitre, taux de réussite par compétence.">
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

        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Progression
            </TabsTrigger>
            <TabsTrigger value="exams" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Résultats d'examens
            </TabsTrigger>
          </TabsList>

          {/* Student progress tab */}
          <TabsContent value="progress">
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
          </TabsContent>

          {/* Exam results tab */}
          <TabsContent value="exams">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Historique des examens
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Matière" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les matières</SelectItem>
                      {examSubjects.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={e => setFilterDateFrom(e.target.value)}
                    className="w-[160px]"
                    placeholder="Du"
                  />
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={e => setFilterDateTo(e.target.value)}
                    className="w-[160px]"
                    placeholder="Au"
                  />
                </div>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                ) : examResults.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun examen passé pour le moment.</p>
                ) : (
                  <div className="space-y-3">
                    {examResults.map((r) => (
                      <div key={r.id} className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                              r.score >= 80 ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" :
                              r.score >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
                              "bg-destructive/10 text-destructive"
                            )}>
                              {r.score}%
                            </div>
                            <div>
                              <p className="font-medium text-sm">{r.student_name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {new Date(r.started_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">{r.subject}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground ml-13">
                          <span>{r.correct_count}/{r.cards_reviewed} correct</span>
                          <span>·</span>
                          <span>{r.duration_min} min</span>
                          <span>·</span>
                          <span className="text-primary font-medium">+{r.points_earned} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TeacherStudents;
