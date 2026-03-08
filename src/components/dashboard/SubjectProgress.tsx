import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { useSubjectProgress } from "@/hooks/useSubjectProgress";

export function SubjectProgress() {
  const { data: subjects, isLoading } = useSubjectProgress();

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Progression par matière
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : !subjects || subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune session pour le moment. Commence un quiz !</p>
        ) : (
          subjects.map((subject) => (
            <div key={subject.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{subject.name}</span>
                <span className="text-muted-foreground">{subject.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${subject.progress}%`, backgroundColor: subject.color }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
