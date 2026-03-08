import { Card, CardContent } from "@/components/ui/card";
import { Star, Flame, Target, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalXP: number;
  weeklyXP: number;
  currentStreak: number;
  longestStreak: number;
  totalQuizzes: number;
  weeklyQuizzes: number;
  averageScore: number;
  lastWeekAverageScore: number;
}

export function StatsCards(props: StatsCardsProps) {
  const scoreDiff = props.averageScore - props.lastWeekAverageScore;
  const scoreTrend = scoreDiff >= 0 ? `+${scoreDiff}%` : `${scoreDiff}%`;

  const stats = [
    { label: "Points XP", value: props.totalXP.toLocaleString("fr-FR"), icon: Star, trend: `+${props.weeklyXP} cette semaine` },
    { label: "Série", value: `${props.currentStreak} jour${props.currentStreak !== 1 ? "s" : ""}`, icon: Flame, trend: `Record : ${props.longestStreak} jours` },
    { label: "Quiz terminés", value: String(props.totalQuizzes), icon: Target, trend: `${props.weeklyQuizzes} cette semaine` },
    { label: "Score moyen", value: `${props.averageScore}%`, icon: TrendingUp, trend: `${scoreTrend} vs semaine dernière` },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="glass-card animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-heading font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.trend}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
