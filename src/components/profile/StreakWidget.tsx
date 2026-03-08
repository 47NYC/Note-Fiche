import { Flame, Zap, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  totalXP: number;
}

export function StreakWidget({ currentStreak, longestStreak, lastActiveDate, totalXP }: StreakWidgetProps) {
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const today = new Date().getDay(); // 0=Sun
  const mapped = today === 0 ? 6 : today - 1; // 0=Mon

  return (
    <Card className="overflow-hidden">
      <div className="gradient-streak p-5 text-streak-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <p className="text-3xl font-heading font-bold">{currentStreak}</p>
              <p className="text-sm opacity-90">jours consécutifs</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-1.5 justify-end">
              <Zap className="w-4 h-4" />
              <span className="font-bold">{totalXP} XP</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end text-sm opacity-80">
              <Calendar className="w-3.5 h-3.5" />
              <span>Record : {longestStreak}j</span>
            </div>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-3 font-medium">Cette semaine</p>
        <div className="flex justify-between gap-1">
          {days.map((d, i) => {
            const active = i <= mapped && i >= mapped - currentStreak + 1 && currentStreak > 0;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  active ? "gradient-streak text-white" : i === mapped ? "border-2 border-primary bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {active ? "🔥" : d}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
