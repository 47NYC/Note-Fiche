import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Timer, CheckCircle, XCircle, ArrowRight, Trophy, RotateCcw, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Question {
  type: "qcm" | "open";
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  chapterTitle: string;
}

interface ExamModeProps {
  title: string;
  subject: string;
  questions: Question[];
  documentId: string;
  onExit: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

type ExamPhase = "ready" | "exam" | "results";

const ExamMode = ({ title, subject, questions, documentId, onExit }: ExamModeProps) => {
  const { user } = useAuth();
  const qcmQuestions = questions.filter((q) => q.type === "qcm" && q.options && q.options.length > 0);

  const totalTime = Math.max(qcmQuestions.length * 45, 60); // 45s per question, min 1 min
  const [phase, setPhase] = useState<ExamPhase>("ready");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [answers, setAnswers] = useState<(string | null)[]>(new Array(qcmQuestions.length).fill(null));
  const [startTime, setStartTime] = useState<number>(0);

  // Timer
  useEffect(() => {
    if (phase !== "exam") return;
    if (timeLeft <= 0) {
      finishExam();
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [phase, timeLeft]);

  const startExam = () => {
    setPhase("exam");
    setTimeLeft(totalTime);
    setStartTime(Date.now());
    setCurrentIndex(0);
    setAnswers(new Array(qcmQuestions.length).fill(null));
  };

  const selectAnswer = (opt: string) => {
    const updated = [...answers];
    updated[currentIndex] = opt;
    setAnswers(updated);
  };

  const finishExam = useCallback(async () => {
    setPhase("results");
    const correct = qcmQuestions.filter((q, i) => answers[i] === q.answer).length;
    const score = Math.round((correct / qcmQuestions.length) * 100);
    const points = correct * 10;

    if (user) {
      await supabase.from("practice_sessions").insert({
        user_id: user.id,
        subject,
        cards_reviewed: qcmQuestions.length,
        correct_count: correct,
        score,
        points_earned: points,
        started_at: new Date(startTime).toISOString(),
        ended_at: new Date().toISOString(),
      });
    }
  }, [answers, qcmQuestions, user, subject, startTime]);

  const correctCount = qcmQuestions.filter((q, i) => answers[i] === q.answer).length;
  const score = qcmQuestions.length > 0 ? Math.round((correctCount / qcmQuestions.length) * 100) : 0;
  const timeTaken = totalTime - timeLeft;
  const timerDanger = timeLeft <= 30;
  const timerWarning = timeLeft <= 60 && !timerDanger;

  // READY phase
  if (phase === "ready") {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onExit}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
        <Card className="glass-card text-center">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">🎯 Mode Examen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Badge variant="secondary">{subject}</Badge>
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-2xl font-bold text-primary">{qcmQuestions.length}</p>
                <p className="text-muted-foreground">Questions</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-2xl font-bold text-primary">{formatTime(totalTime)}</p>
                <p className="text-muted-foreground">Temps imparti</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Répondez à toutes les questions avant la fin du chrono. La correction détaillée sera affichée à la fin.
            </p>
            {qcmQuestions.length === 0 ? (
              <p className="text-destructive text-sm font-medium">Aucune question QCM disponible pour cet examen.</p>
            ) : (
              <Button className="w-full mt-2" size="lg" onClick={startExam}>
                <Timer className="w-5 h-5 mr-2" /> Commencer l'examen
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // EXAM phase
  if (phase === "exam") {
    const q = qcmQuestions[currentIndex];
    const answeredCount = answers.filter((a) => a !== null).length;

    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Timer bar */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">
            Question {currentIndex + 1}/{qcmQuestions.length}
          </Badge>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono font-bold",
            timerDanger ? "bg-destructive/10 text-destructive animate-pulse" :
            timerWarning ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
            "bg-secondary text-foreground"
          )}>
            <Timer className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
        <Progress value={(answeredCount / qcmQuestions.length) * 100} className="h-2" />

        {/* Question card */}
        <Card className="glass-card">
          <CardHeader>
            <Badge variant="secondary" className="w-fit text-xs mb-2">{q.chapterTitle}</Badge>
            <CardTitle className="font-heading text-base">{q.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.options?.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const isSelected = answers[currentIndex] === opt;
              return (
                <Button
                  key={i}
                  variant={isSelected ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => selectAnswer(opt)}
                >
                  <span className="font-bold mr-3 shrink-0">{letter}.</span>
                  {opt}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-2">
          {currentIndex > 0 && (
            <Button variant="outline" onClick={() => setCurrentIndex(currentIndex - 1)}>
              Précédente
            </Button>
          )}
          <div className="flex-1" />
          {currentIndex < qcmQuestions.length - 1 ? (
            <Button onClick={() => setCurrentIndex(currentIndex + 1)}>
              Suivante <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={finishExam}
              className="bg-primary"
            >
              Terminer l'examen
            </Button>
          )}
        </div>

        {/* Question dots */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {qcmQuestions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                i === currentIndex
                  ? "bg-primary text-primary-foreground"
                  : answers[i] !== null
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // RESULTS phase
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Score summary */}
      <Card className="glass-card text-center">
        <CardHeader>
          <CardTitle className="font-heading text-2xl flex items-center justify-center gap-2">
            <Trophy className="w-7 h-7 text-primary" />
            Résultat de l'examen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={cn(
            "text-6xl font-bold",
            score >= 80 ? "text-green-500" : score >= 50 ? "text-amber-500" : "text-destructive"
          )}>
            {score}%
          </div>
          <p className="text-muted-foreground">
            {correctCount}/{qcmQuestions.length} bonnes réponses en {formatTime(timeTaken)}
          </p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/20">
              <p className="text-xl font-bold text-green-600">{correctCount}</p>
              <p className="text-muted-foreground">Correct</p>
            </div>
            <div className="p-3 rounded-xl bg-destructive/10">
              <p className="text-xl font-bold text-destructive">{qcmQuestions.length - correctCount}</p>
              <p className="text-muted-foreground">Incorrect</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary">
              <p className="text-xl font-bold text-primary">+{correctCount * 10}</p>
              <p className="text-muted-foreground">XP</p>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={startExam}>
              <RotateCcw className="w-4 h-4 mr-2" /> Recommencer
            </Button>
            <Button className="flex-1" onClick={onExit}>
              Retour aux fiches
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed correction */}
      <h3 className="font-heading font-bold text-lg">Correction détaillée</h3>
      {qcmQuestions.map((q, i) => {
        const userAnswer = answers[i];
        const isCorrect = userAnswer === q.answer;
        return (
          <Card key={i} className={cn("glass-card border-l-4", isCorrect ? "border-l-green-500" : "border-l-destructive")}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <Badge variant="outline" className="text-xs mb-1">{q.chapterTitle}</Badge>
                  <p className="font-medium text-sm">{q.question}</p>
                </div>
              </div>

              <div className="space-y-1 ml-7">
                {q.options?.map((opt, j) => {
                  const letter = String.fromCharCode(65 + j);
                  const isUserAnswer = userAnswer === opt;
                  const isRightAnswer = q.answer === opt;
                  return (
                    <div
                      key={j}
                      className={cn(
                        "flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg",
                        isRightAnswer ? "bg-green-50 dark:bg-green-950/20 font-medium text-green-700 dark:text-green-400" :
                        isUserAnswer ? "bg-destructive/10 line-through text-destructive" :
                        "text-muted-foreground"
                      )}
                    >
                      <span className="font-bold">{letter}.</span> {opt}
                      {isRightAnswer && <CheckCircle className="w-3.5 h-3.5 ml-auto" />}
                      {isUserAnswer && !isRightAnswer && <XCircle className="w-3.5 h-3.5 ml-auto" />}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="ml-7 p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                  <p className="text-muted-foreground">{q.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ExamMode;
