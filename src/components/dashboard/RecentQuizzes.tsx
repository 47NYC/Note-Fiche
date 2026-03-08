import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export interface RecentQuiz {
  subject: string;
  score: number;
  date: string;
}

interface RecentQuizzesProps {
  quizzes: RecentQuiz[];
}

export function RecentQuizzes({ quizzes }: RecentQuizzesProps) {
  if (quizzes.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Quiz récents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aucun quiz terminé pour l'instant.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Quiz récents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quizzes.map((quiz, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
          >
            <div>
              <p className="font-medium text-sm">{quiz.subject}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(quiz.date), { addSuffix: true, locale: fr })}
              </p>
            </div>
            <Badge
              variant={quiz.score >= 80 ? "default" : quiz.score >= 60 ? "secondary" : "destructive"}
              className={quiz.score >= 80 ? "gradient-success text-success-foreground" : ""}
            >
              {quiz.score}%
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
