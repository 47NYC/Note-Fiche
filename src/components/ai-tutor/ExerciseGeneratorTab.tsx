import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSubjects } from "@/hooks/useSubjects";
import { useProAccess } from "@/hooks/useProAccess";

const DAILY_EXERCISE_LIMIT = 10;

function getExerciseDailyKey(): string {
  return `ai_exercise_count_${new Date().toISOString().slice(0, 10)}`;
}

function getExerciseDailyCount(): number {
  return parseInt(localStorage.getItem(getExerciseDailyKey()) || "0", 10);
}

function incrementExerciseDailyCount(): void {
  const key = getExerciseDailyKey();
  localStorage.setItem(key, String(getExerciseDailyCount() + 1));
}

const DIFFICULTIES = [
  { value: "facile", label: "Facile" },
  { value: "moyen", label: "Moyen" },
  { value: "difficile", label: "Difficile" },
];

type Question = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export function ExerciseGeneratorTab() {
  const { subjectNames } = useSubjects();
  const { isPro } = useProAccess();
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("moyen");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const sessionSaved = useRef(false);
  const queryClient = useQueryClient();
  const [dailyExerciseCount, setDailyExerciseCount] = useState(getExerciseDailyCount());

  const exerciseRemaining = DAILY_EXERCISE_LIMIT - dailyExerciseCount;
  const exerciseLimitReached = !isPro && exerciseRemaining <= 0;
  const generate = async () => {
    if (!subject) { toast.error("Choisis une matière"); return; }
    if (exerciseLimitReached) {
      toast.error("Tu as atteint ta limite de 10 exercices par jour. Passe en Pro pour un accès illimité !");
      return;
    }
    setLoading(true);
    setQuestions([]);
    setAnswers({});
    setShowResults(false);
    sessionSaved.current = false;

    if (!isPro) {
      incrementExerciseDailyCount();
      setDailyExerciseCount(getExerciseDailyCount());
    }

    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-exercises", {
        body: { subject, topic, difficulty, count },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setQuestions(data.questions || []);
    } catch (e: any) {
      toast.error(e.message || "Erreur de génération");
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (qIndex: number, optIndex: number) => {
    if (showResults) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);

  const submitResults = async () => {
    setShowResults(true);
    if (sessionSaved.current) return;
    sessionSaved.current = true;

    const finalScore = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
    const scorePercent = Math.round((finalScore / questions.length) * 100);
    const xp = finalScore * 10;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("practice_sessions").insert({
        user_id: user.id,
        subject: subject,
        cards_reviewed: questions.length,
        correct_count: finalScore,
        score: scorePercent,
        points_earned: xp,
        ended_at: new Date().toISOString(),
      });

      queryClient.invalidateQueries({ queryKey: ["student-stats"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-activity"] });
      queryClient.invalidateQueries({ queryKey: ["recent-quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["subject-progress"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      toast.success(`+${xp} XP gagnés !`);
    } catch (e) {
      console.error("Failed to save session:", e);
    }
  };

  return (
    <div className="space-y-6 p-4 overflow-y-auto max-h-[calc(100vh-220px)]">
      {/* Daily limit banner for free users */}
      {!isPro && (
        <div className={`text-xs px-3 py-1.5 rounded-full text-center ${
          exerciseRemaining <= 3 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
        }`}>
          {exerciseLimitReached
            ? "🚫 Limite atteinte (10/10) — Passe en Pro pour un accès illimité !"
            : `🎯 ${exerciseRemaining} quiz restant${exerciseRemaining > 1 ? "s" : ""} aujourd'hui`}
          {!exerciseLimitReached && exerciseRemaining <= 3 && " — Passe en Pro pour l'illimité !"}
        </div>
      )}

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-accent" />
            Générateur de QCM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Matière</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Choisis une matière" /></SelectTrigger>
                <SelectContent>
                  {subjectNames.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Thème (optionnel)</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: Théorème de Thalès" />
            </div>
            <div className="space-y-2">
              <Label>Difficulté</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre de questions</Label>
              <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 5, 10].map((n) => <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={generate} disabled={loading || !subject} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération en cours...</> : <><Sparkles className="w-4 h-4 mr-2" /> Générer les exercices</>}
          </Button>
        </CardContent>
      </Card>

      {/* Questions */}
      {questions.length > 0 && (
        <>
          {questions.map((q, qi) => (
            <Card key={qi} className={showResults ? (answers[qi] === q.correctIndex ? "border-success/50" : "border-destructive/50") : ""}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 mt-0.5">{qi + 1}</Badge>
                  <p className="font-medium text-sm">{q.question}</p>
                </div>
                <div className="grid gap-2">
                  {q.options.map((opt, oi) => {
                    const selected = answers[qi] === oi;
                    const isCorrect = q.correctIndex === oi;
                    let cls = "text-left p-3 rounded-lg border text-sm transition-colors ";
                    if (showResults) {
                      if (isCorrect) cls += "border-success bg-success/10 text-foreground";
                      else if (selected) cls += "border-destructive bg-destructive/10 text-foreground";
                      else cls += "border-border text-muted-foreground";
                    } else {
                      cls += selected ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-primary/50 text-foreground";
                    }
                    return (
                      <button key={oi} onClick={() => selectAnswer(qi, oi)} className={cls} disabled={showResults}>
                        <span className="flex items-center gap-2">
                          {showResults && isCorrect && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                          {showResults && selected && !isCorrect && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {showResults && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Explication :</span> {q.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            {!showResults ? (
              <Button onClick={submitResults} disabled={Object.keys(answers).length < questions.length} className="flex-1">
                Vérifier mes réponses
              </Button>
            ) : (
              <>
                <Card className="flex-1 p-4 flex items-center justify-center">
                  <p className="font-heading font-bold text-lg">
                    Score : {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)
                  </p>
                </Card>
                <Button variant="outline" onClick={generate}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Nouveau quiz
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
