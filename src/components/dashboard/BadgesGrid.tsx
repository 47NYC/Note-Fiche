import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Flame, Star, Target, Calendar, Trophy, Lock } from "lucide-react";

interface BadgesGridProps {
  totalXP: number;
  currentStreak: number;
  totalQuizzes: number;
  averageScore: number;
}

export function BadgesGrid({ totalXP, currentStreak, totalQuizzes, averageScore }: BadgesGridProps) {
  const badges = [
    { name: "Première leçon", icon: BookOpen, unlocked: totalQuizzes >= 1 },
    { name: "7 jours de suite", icon: Flame, unlocked: currentStreak >= 7 },
    { name: "100 points", icon: Star, unlocked: totalXP >= 100 },
    { name: "Quiz parfait", icon: Target, unlocked: averageScore >= 100 },
    { name: "30 jours", icon: Calendar, unlocked: currentStreak >= 30 },
    { name: "Champion", icon: Trophy, unlocked: totalXP >= 1000 },
  ];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          Badges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.name}
              className={`flex flex-col items-center p-3 rounded-xl text-center transition-all ${
                badge.unlocked
                  ? "bg-primary/5 border border-primary/20"
                  : "bg-muted/50 opacity-50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  badge.unlocked ? "gradient-primary" : "bg-muted"
                }`}
              >
                {badge.unlocked ? (
                  <badge.icon className="w-5 h-5 text-primary-foreground" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <span className="text-xs font-medium">{badge.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
