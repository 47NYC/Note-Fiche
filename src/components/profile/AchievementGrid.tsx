import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Lock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ALL_ACHIEVEMENTS = [
  { key: "first_session", label: "Première session", description: "Termine ta première session", icon: "🎯" },
  { key: "streak_3", label: "3 jours de suite", description: "Maintiens un streak de 3 jours", icon: "🔥" },
  { key: "streak_7", label: "Semaine parfaite", description: "7 jours consécutifs", icon: "⚡" },
  { key: "streak_30", label: "Mois d'or", description: "30 jours consécutifs", icon: "🏆" },
  { key: "xp_100", label: "Centurion", description: "Accumule 100 XP", icon: "💯" },
  { key: "xp_500", label: "Demi-millier", description: "Accumule 500 XP", icon: "🌟" },
  { key: "xp_1000", label: "Millionnaire XP", description: "Accumule 1000 XP", icon: "👑" },
  { key: "quiz_10", label: "Quiz Master", description: "Termine 10 quiz", icon: "📝" },
  { key: "quiz_50", label: "Quiz Legend", description: "Termine 50 quiz", icon: "🎓" },
  { key: "perfect_score", label: "Score parfait", description: "Obtiens 100% à un quiz", icon: "💎" },
  { key: "all_subjects", label: "Polyvalent", description: "Étudie toutes les matières", icon: "🌈" },
  { key: "night_owl", label: "Noctambule", description: "Étudie après 22h", icon: "🦉" },
];

export function AchievementGrid() {
  const { user } = useAuth();
  const { data: unlocked, isLoading } = useQuery({
    queryKey: ["achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="grid grid-cols-3 gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  const unlockedKeys = new Set(unlocked?.map((a) => a.key) || []);
  const unlockedMap = Object.fromEntries((unlocked || []).map((a) => [a.key, a.unlocked_at]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-5 h-5 text-accent" />
          Achievements ({unlockedKeys.size}/{ALL_ACHIEVEMENTS.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ALL_ACHIEVEMENTS.map((a) => {
            const isUnlocked = unlockedKeys.has(a.key);
            return (
              <div
                key={a.key}
                className={`relative p-3 rounded-xl text-center transition-all ${
                  isUnlocked
                    ? "bg-accent/10 border border-accent/30"
                    : "bg-muted/30 border border-border opacity-50"
                }`}
              >
                <div className="text-2xl mb-1">{isUnlocked ? a.icon : <Lock className="w-5 h-5 mx-auto text-muted-foreground" />}</div>
                <p className="text-xs font-semibold truncate">{a.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>
                {isUnlocked && unlockedMap[a.key] && (
                  <p className="text-[10px] text-accent mt-1">
                    {format(new Date(unlockedMap[a.key]), "d MMM", { locale: fr })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
