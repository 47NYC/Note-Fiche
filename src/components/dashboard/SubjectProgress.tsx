import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const subjects = [
  { name: "Mathématiques", progress: 72, color: "hsl(234, 89%, 58%)" },
  { name: "Français", progress: 58, color: "hsl(34, 100%, 50%)" },
  { name: "Histoire-Géo", progress: 45, color: "hsl(152, 69%, 41%)" },
  { name: "Sciences", progress: 63, color: "hsl(258, 90%, 66%)" },
];

export function SubjectProgress() {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Progression par matière
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subjects.map((subject) => (
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
        ))}
      </CardContent>
    </Card>
  );
}
