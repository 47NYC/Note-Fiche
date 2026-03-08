import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, HelpCircle, Calendar, MapPin, ChevronDown, ChevronUp, CheckCircle, XCircle, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Question {
  type: "qcm" | "open";
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

interface Definition { term: string; definition: string; }
interface DateEntry { date: string; event: string; }
interface GeoElement { element: string; description: string; }

interface Chapter {
  title: string;
  summary: string;
  questions?: Question[];
  definitions?: Definition[];
  dates?: DateEntry[];
  geo_elements?: GeoElement[];
}

interface StructuredDocViewerProps {
  title: string;
  subject: string;
  content: { chapters: Chapter[] };
  documentId: string;
  onBack: () => void;
}

const QuestionCard = ({ q, onAnswer }: { q: Question; index: number; onAnswer: (correct: boolean) => void }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleSelect = (opt: string) => {
    if (showAnswer) return;
    setSelectedAnswer(opt);
    setShowAnswer(true);
    onAnswer(opt === q.answer);
  };

  return (
    <div className="p-4 rounded-xl bg-secondary/30 space-y-3">
      <p className="font-medium text-sm">
        <Badge variant="outline" className="mr-2 text-xs">
          {q.type === "qcm" ? "QCM" : "Ouverte"}
        </Badge>
        {q.question}
      </p>
      {q.type === "qcm" && q.options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {q.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const isSelected = selectedAnswer === opt;
            const isCorrect = selectedAnswer === q.answer;
            const isRight = showAnswer && opt === q.answer;
            return (
              <Button
                key={i}
                variant={isSelected ? (showAnswer ? (isCorrect ? "default" : "destructive") : "default") : isRight ? "default" : "outline"}
                size="sm"
                className="justify-start text-left h-auto py-2"
                onClick={() => handleSelect(opt)}
              >
                <span className="font-bold mr-2">{letter}.</span>
                {opt}
                {showAnswer && isRight && <CheckCircle className="w-4 h-4 ml-auto shrink-0" />}
                {showAnswer && isSelected && !isCorrect && <XCircle className="w-4 h-4 ml-auto shrink-0" />}
              </Button>
            );
          })}
        </div>
      )}
      {q.type === "open" && !showAnswer && (
        <Button variant="outline" size="sm" onClick={() => { setShowAnswer(true); onAnswer(true); }}>
          Voir la réponse
        </Button>
      )}
      {showAnswer && (
        <div className="text-sm p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="font-medium text-primary">Réponse : {q.answer}</p>
          {q.explanation && <p className="text-muted-foreground mt-1">{q.explanation}</p>}
        </div>
      )}
    </div>
  );
};

const ChapterSection = ({
  chapter,
  index,
  completed,
  onMarkComplete,
  onQcmAnswer,
}: {
  chapter: Chapter;
  index: number;
  completed: boolean;
  onMarkComplete: () => void;
  onQcmAnswer: (chapterIndex: number, correct: boolean) => void;
}) => {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <Card className={`glass-card ${completed ? "border-primary/30" : ""}`}>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="font-heading text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${completed ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
              {completed ? <Check className="w-4 h-4" /> : index + 1}
            </span>
            {chapter.title}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-5">
          <div className="text-sm text-muted-foreground leading-relaxed">{chapter.summary}</div>

          {chapter.definitions && chapter.definitions.length > 0 && (
            <div>
              <h4 className="font-heading font-semibold text-sm flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-primary" /> Définitions clés
              </h4>
              <div className="grid gap-2">
                {chapter.definitions.map((def, i) => (
                  <div key={i} className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                    <span className="font-semibold text-sm">{def.term}</span>
                    <span className="text-sm text-muted-foreground ml-2">— {def.definition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chapter.dates && chapter.dates.length > 0 && (
            <div>
              <h4 className="font-heading font-semibold text-sm flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" /> Dates importantes
              </h4>
              <div className="grid gap-2">
                {chapter.dates.map((d, i) => (
                  <div key={i} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0 font-mono">{d.date}</Badge>
                    <span className="text-sm">{d.event}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chapter.geo_elements && chapter.geo_elements.length > 0 && (
            <div>
              <h4 className="font-heading font-semibold text-sm flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" /> Éléments géographiques
              </h4>
              <div className="grid gap-2">
                {chapter.geo_elements.map((g, i) => (
                  <div key={i} className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                    <span className="font-semibold text-sm">{g.element}</span>
                    <span className="text-sm text-muted-foreground ml-2">— {g.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chapter.questions && chapter.questions.length > 0 && (
            <div>
              <h4 className="font-heading font-semibold text-sm flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-primary" /> Questions ({chapter.questions.length})
              </h4>
              <div className="space-y-3">
                {chapter.questions.map((q, i) => (
                  <QuestionCard key={i} q={q} index={i} onAnswer={(correct) => onQcmAnswer(index, correct)} />
                ))}
              </div>
            </div>
          )}

          {!completed && (
            <Button variant="outline" className="w-full" onClick={onMarkComplete}>
              <Check className="w-4 h-4 mr-2" /> Marquer comme terminé
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
};

const StructuredDocViewer = ({ title, subject, content, documentId, onBack }: StructuredDocViewerProps) => {
  const { user } = useAuth();
  const chapters = content?.chapters || [];
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [qcmScores, setQcmScores] = useState<Record<string, { correct: number; total: number }>>({});

  const loadProgress = useCallback(async () => {
    if (!user || !documentId) return;
    const { data } = await supabase
      .from("student_doc_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("structured_document_id", documentId)
      .maybeSingle();
    if (data) {
      setCompletedChapters((data as any).completed_chapters || []);
      setQcmScores((data as any).qcm_scores || {});
    }
  }, [user, documentId]);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  const saveProgress = async (newCompleted: number[], newScores: Record<string, any>) => {
    if (!user || !documentId) return;
    await supabase.from("student_doc_progress").upsert({
      user_id: user.id,
      structured_document_id: documentId,
      completed_chapters: newCompleted,
      qcm_scores: newScores,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,structured_document_id" });
  };

  const markComplete = (chapterIndex: number) => {
    const updated = [...new Set([...completedChapters, chapterIndex])];
    setCompletedChapters(updated);
    saveProgress(updated, qcmScores);
  };

  const handleQcmAnswer = (chapterIndex: number, correct: boolean) => {
    const key = String(chapterIndex);
    const current = qcmScores[key] || { correct: 0, total: 0 };
    const updated = {
      ...qcmScores,
      [key]: { correct: current.correct + (correct ? 1 : 0), total: current.total + 1 },
    };
    setQcmScores(updated);
    saveProgress(completedChapters, updated);
  };

  const progressPercent = chapters.length > 0 ? Math.round((completedChapters.length / chapters.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-2xl font-heading font-bold">{title}</h2>
        <p className="text-muted-foreground text-sm">{subject} · {chapters.length} chapitre{chapters.length > 1 ? "s" : ""}</p>
        <div className="flex items-center gap-3 mt-3">
          <Progress value={progressPercent} className="flex-1" />
          <span className="text-sm font-medium text-primary">{progressPercent}%</span>
        </div>
      </div>

      {chapters.map((ch, i) => (
        <ChapterSection
          key={i}
          chapter={ch}
          index={i}
          completed={completedChapters.includes(i)}
          onMarkComplete={() => markComplete(i)}
          onQcmAnswer={handleQcmAnswer}
        />
      ))}
    </div>
  );
};

export default StructuredDocViewer;
