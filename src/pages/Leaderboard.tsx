import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Crown, Medal, Flame, Star, Zap, Target } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LeaderboardEntry {
  student_id: string;
  full_name: string;
  totalXP: number;
  currentStreak: number;
  avgScore: number;
  totalQuizzes: number;
  isCurrentUser: boolean;
}

const RANK_REWARDS = [
  { label: "Champion", color: "from-yellow-400 to-amber-500", icon: Crown, ring: "ring-yellow-400/50" },
  { label: "Vice-champion", color: "from-slate-300 to-slate-400", icon: Medal, ring: "ring-slate-300/50" },
  { label: "3ème place", color: "from-amber-600 to-amber-700", icon: Medal, ring: "ring-amber-600/50" },
];

const ACHIEVEMENTS = [
  { key: "top_streak", label: "Flamme ardente", desc: "Meilleure série", icon: Flame, color: "text-orange-500" },
  { key: "top_score", label: "Précision ultime", desc: "Meilleur score moyen", icon: Target, color: "text-emerald-500" },
  { key: "top_quizzes", label: "Bosseur", desc: "Plus de quiz complétés", icon: Zap, color: "text-blue-500" },
];

const Leaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("");

  useEffect(() => {
    if (!user) return;
    loadLeaderboard();
  }, [user]);

  const loadLeaderboard = async () => {
    if (!user) return;
    setLoading(true);

    // Find user's class
    const { data: membership } = await supabase
      .from("class_members")
      .select("class_id")
      .eq("student_id", user.id)
      .maybeSingle();

    if (!membership) {
      setLoading(false);
      return;
    }

    const { data: cls } = await supabase
      .from("classes")
      .select("name")
      .eq("id", membership.class_id)
      .maybeSingle();

    setClassName(cls?.name || "");

    const { data: members } = await supabase
      .from("class_members")
      .select("student_id")
      .eq("class_id", membership.class_id);

    if (!members?.length) {
      setLoading(false);
      return;
    }

    const ids = members.map((m) => m.student_id);

    const [profilesRes, sessionsRes, streaksRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", ids),
      supabase.from("practice_sessions").select("user_id, points_earned, score").in("user_id", ids),
      supabase.from("streaks").select("user_id, current_streak").in("user_id", ids),
    ]);

    const result: LeaderboardEntry[] = ids.map((sid) => {
      const profile = profilesRes.data?.find((p) => p.user_id === sid);
      const sessions = sessionsRes.data?.filter((s) => s.user_id === sid) || [];
      const streak = streaksRes.data?.find((s) => s.user_id === sid);

      const totalXP = sessions.reduce((sum, s) => sum + (s.points_earned ?? 0), 0);
      const avgScore = sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / sessions.length)
        : 0;

      return {
        student_id: sid,
        full_name: profile?.full_name || "Élève",
        totalXP,
        currentStreak: streak?.current_streak ?? 0,
        avgScore,
        totalQuizzes: sessions.length,
        isCurrentUser: sid === user.id,
      };
    });

    result.sort((a, b) => b.totalXP - a.totalXP);
    setEntries(result);
    setLoading(false);
  };

  // Find special achievement holders
  const topStreak = entries.length ? entries.reduce((a, b) => a.currentStreak > b.currentStreak ? a : b) : null;
  const topScore = entries.length ? entries.reduce((a, b) => a.avgScore > b.avgScore ? a : b) : null;
  const topQuizzes = entries.length ? entries.reduce((a, b) => a.totalQuizzes > b.totalQuizzes ? a : b) : null;
  const achievementMap: Record<string, LeaderboardEntry | null> = {
    top_streak: topStreak,
    top_score: topScore,
    top_quizzes: topQuizzes,
  };

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const currentUserRank = entries.findIndex((e) => e.isCurrentUser) + 1;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
          <Trophy className="w-8 h-8 text-accent" />
          Classement de la classe
        </h1>
        {className && (
          <p className="text-muted-foreground -mt-4">{className}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8 text-center text-muted-foreground">
              Rejoins une classe pour voir le classement !
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Podium */}
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-6 pb-8">
                <div className="flex items-end justify-center gap-4 md:gap-8 pt-4">
                  {/* 2nd place */}
                  {podium[1] && (
                    <PodiumSlot entry={podium[1]} rank={1} height="h-28" />
                  )}
                  {/* 1st place */}
                  {podium[0] && (
                    <PodiumSlot entry={podium[0]} rank={0} height="h-36" />
                  )}
                  {/* 3rd place */}
                  {podium[2] && (
                    <PodiumSlot entry={podium[2]} rank={2} height="h-20" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Special achievements */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ACHIEVEMENTS.map((ach) => {
                const holder = achievementMap[ach.key];
                if (!holder || (holder.currentStreak === 0 && ach.key === "top_streak") ||
                    (holder.avgScore === 0 && ach.key === "top_score") ||
                    (holder.totalQuizzes === 0 && ach.key === "top_quizzes")) return null;
                return (
                  <Card key={ach.key} className="glass-card">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center`}>
                        <ach.icon className={`w-5 h-5 ${ach.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{ach.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{holder.full_name} — {ach.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Current user position */}
            {currentUserRank > 0 && (
              <Card className="glass-card border-primary/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Ta position</span>
                  </div>
                  <span className="text-2xl font-heading font-bold text-primary">
                    #{currentUserRank}
                    <span className="text-sm text-muted-foreground font-normal ml-1">/ {entries.length}</span>
                  </span>
                </CardContent>
              </Card>
            )}

            {/* Full ranking */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Classement complet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {entries.map((entry, i) => (
                  <div
                    key={entry.student_id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      entry.isCurrentUser
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-secondary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <span className={`w-7 text-center font-bold text-sm ${
                      i < 3 ? "text-accent" : "text-muted-foreground"
                    }`}>
                      {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
                    </span>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={`text-xs font-bold ${
                        i < 3 ? "bg-gradient-to-br " + RANK_REWARDS[i].color + " text-white" : "bg-muted"
                      }`}>
                        {entry.full_name[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.full_name}
                        {entry.isCurrentUser && <span className="text-xs text-primary ml-1">(toi)</span>}
                      </p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{entry.currentStreak}j</span>
                        <span className="flex items-center gap-1"><Target className="w-3 h-3 text-emerald-400" />{entry.avgScore}%</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary">{entry.totalXP} XP</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

function PodiumSlot({ entry, rank, height }: { entry: LeaderboardEntry; rank: number; height: string }) {
  const reward = RANK_REWARDS[rank];
  const Icon = reward.icon;

  return (
    <div className="flex flex-col items-center gap-2 w-24 md:w-32">
      <div className="relative">
        <Avatar className={`w-14 h-14 md:w-16 md:h-16 ring-4 ${reward.ring}`}>
          <AvatarFallback className={`text-lg font-bold bg-gradient-to-br ${reward.color} text-white`}>
            {entry.full_name[0] || "?"}
          </AvatarFallback>
        </Avatar>
        <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br ${reward.color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-xs font-semibold text-center truncate w-full">{entry.full_name}</p>
      <div className={`w-full ${height} rounded-t-xl bg-gradient-to-t ${reward.color} flex flex-col items-center justify-end pb-2 shadow-lg`}>
        <span className="text-white font-heading font-bold text-lg">{rank + 1}</span>
        <span className="text-white/80 text-xs font-medium">{entry.totalXP} XP</span>
      </div>
    </div>
  );
}

export default Leaderboard;
