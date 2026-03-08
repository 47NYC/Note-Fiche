import { Flame } from "lucide-react";

interface StreakBannerProps {
  currentStreak: number;
  totalXP: number;
  loading?: boolean;
}

export function StreakBanner({ currentStreak, totalXP, loading }: StreakBannerProps) {
  return (
    <div className="rounded-2xl gradient-streak p-6 text-streak-foreground">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-streak-foreground/20 flex items-center justify-center">
            <Flame className="w-8 h-8 animate-pulse-glow" />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold">
              🔥 {loading ? "..." : currentStreak} jour{currentStreak !== 1 ? "s" : ""} de série !
            </h2>
            <p className="opacity-90">Continue comme ça !</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-heading font-bold">{loading ? "..." : totalXP.toLocaleString("fr-FR")}</p>
          <p className="text-sm opacity-80">points XP</p>
        </div>
      </div>
    </div>
  );
}
