import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Crown, Medal, Flame, Star, Zap, Target, BookOpen, Calendar, Lock, Award } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProGate } from "@/components/ProGate";

const BADGE_DEFS = [
  { key: "first_lesson", name: "Première leçon", icon: BookOpen, check: (s: Stats) => s.totalQuizzes >= 1 },
  { key: "streak_7", name: "7 jours de suite", icon: Flame, check: (s: Stats) => s.currentStreak >= 7 },
  { key: "xp_100", name: "100 points XP", icon: Star, check: (s: Stats) => s.totalXP >= 100 },
  { key: "perfect_quiz", name: "Quiz parfait", icon: Target, check: (s: Stats) => s.avgScore >= 100 },
  { key: "streak_30", name: "30 jours d'affilée", icon: Calendar, check: (s: Stats) => s.currentStreak >= 30 },
  { key: "xp_500", name: "500 points XP", icon: Zap, check: (s: Stats) => s.totalXP >= 500 },
  { key: "quiz_10", name: "10 quiz terminés", icon: Award, check: (s: Stats) => s.totalQuizzes >= 10 },
  { key: "champion", name: "Champion (1000 XP)", icon: Trophy, check: (s: Stats) => s.totalXP >= 1000 },
  { key: "avg_80", name: "Moyenne ≥ 80%", icon: Target, check: (s: Stats) => s.avgScore >= 80 },
];

interface Stats {
  totalXP: number;
  currentStreak: number;
  avgScore: number;
  totalQuizzes: number;
}

interface LeaderboardEntry {
  student_id: string;
  full_name: string;
  totalXP: number;
  currentStreak: number;
  avgScore: number;
  totalQuizzes: number;
  badgeCount: number;
  compositeScore: number;
  isCurrentUser: boolean;
}

const RANK_REWARDS = [
  { label: "Champion", color: "from-yellow-400 to-amber-500", icon: Crown, ring: "ring-yellow-400/50" },
  { label: "Vice-champion", color: "from-slate-300 to-slate-400", icon: Medal, ring: "ring-slate-300/50" },
  { label: "3ème place", color: "from-amber-600 to-amber-700", icon: Medal, ring: "ring-amber-600/50" },
];

function countBadges(stats: Stats): number {
  return BADGE_DEFS.filter((b) => b.check(stats)).length;
}

/**
 * Composite score: XP = 50%, badges = 16.7%, streak = 16.7%, avgScore = 16.7%
 * Each component is normalized relative to the max in the class
 */
function computeCompositeScores(entries: Omit<LeaderboardEntry, "compositeScore">[]): LeaderboardEntry[] {
  const maxXP = Math.max(1, ...entries.map((e) => e.totalXP));
  const maxBadges = Math.max(1, ...entries.map((e) => e.badgeCount));
  const maxStreak = Math.max(1, ...entries.map((e) => e.currentStreak));
  const maxAvg = Math.max(1, ...entries.map((e) => e.avgScore));

  return entries.map((e) => ({
    ...e,
    compositeScore: Math.round(
      (e.totalXP / maxXP) * 50 +
      (e.badgeCount / maxBadges) * (50 / 3) +
      (e.currentStreak / maxStreak) * (50 / 3) +
      (e.avgScore / maxAvg) * (50 / 3)
    ),
  }));
}

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

    const { data: membership } = await supabase
      .from("class_members")
      .select("class_id")
      .eq("student_id", user.id)
      .maybeSingle();

    if (!membership) { setLoading(false); return; }

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

    if (!members?.length) { setLoading(false); return; }

    const ids = members.map((m) => m.student_id);

    const [profilesRes, sessionsRes, streaksRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", ids),
      supabase.from("practice_sessions").select("user_id, points_earned, score").in("user_id", ids),
      supabase.from("streaks").select("user_id, current_streak").in("user_id", ids),
    ]);

    const raw = ids.map((sid) => {
      const profile = profilesRes.data?.find((p) => p.user_id === sid);
      const sessions = sessionsRes.data?.filter((s) => s.user_id === sid) || [];
      const streak = streaksRes.data?.find((s) => s.user_id === sid);

      const totalXP = sessions.reduce((sum, s) => sum + (s.points_earned ?? 0), 0);
      const avgScore = sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / sessions.length)
        : 0;
      const currentStreak = streak?.current_streak ?? 0;
      const totalQuizzes = sessions.length;
      const stats: Stats = { totalXP, currentStreak, avgScore, totalQuizzes };

      return {
        student_id: sid,
        full_name: profile?.full_name || "Élève",
        totalXP,
        currentStreak,
        avgScore,
        totalQuizzes,
        badgeCount: countBadges(stats),
        isCurrentUser: sid === user.id,
      };
    });

    const scored = computeCompositeScores(raw);
    scored.sort((a, b) => b.compositeScore - a.compositeScore);
    setEntries(scored);
    setLoading(false);
  };

  const currentUser = entries.find((e) => e.isCurrentUser);
  const currentUserRank = entries.findIndex((e) => e.isCurrentUser) + 1;
  const currentStats: Stats | null = currentUser
    ? { totalXP: currentUser.totalXP, currentStreak: currentUser.currentStreak, avgScore: currentUser.avgScore, totalQuizzes: currentUser.totalQuizzes }
    : null;

  const podium = entries.slice(0, 3);

  return (
    <DashboardLayout>
      <ProGate feature="Défis & Classements" description="Défis hebdomadaires entre élèves, classement de classe avec récompenses.">
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
          <Trophy className="w-8 h-8 text-accent" />
          Classement
        </h1>
        {className && <p className="text-muted-foreground -mt-4">{className}</p>}

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
          <Tabs defaultValue="classement">
            <TabsList className="w-full">
              <TabsTrigger value="classement" className="flex-1">Classement</TabsTrigger>
              <TabsTrigger value="badges" className="flex-1">Mes Badges</TabsTrigger>
            </TabsList>

            <TabsContent value="classement" className="space-y-6 mt-4">
              {/* Podium */}
              <Card className="glass-card overflow-hidden">
                <CardContent className="p-6 pb-8">
                  <div className="flex items-end justify-center gap-4 md:gap-8 pt-4">
                    {podium[1] && <PodiumSlot entry={podium[1]} rank={1} height="h-28" />}
                    {podium[0] && <PodiumSlot entry={podium[0]} rank={0} height="h-36" />}
                    {podium[2] && <PodiumSlot entry={podium[2]} rank={2} height="h-20" />}
                  </div>
                </CardContent>
              </Card>

              {/* Scoring info */}
              <Card className="glass-card">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Score = <strong>50% XP</strong> + <strong>16.7% Badges</strong> + <strong>16.7% Série</strong> + <strong>16.7% Moyenne</strong>
                  </p>
                </CardContent>
              </Card>

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
                      <span className={`w-7 text-center font-bold text-sm ${i < 3 ? "text-accent" : "text-muted-foreground"}`}>
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
                          <span className="flex items-center gap-1"><Award className="w-3 h-3 text-purple-400" />{entry.badgeCount}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-primary">{entry.compositeScore} pts</span>
                        <p className="text-xs text-muted-foreground">{entry.totalXP} XP</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="badges" className="space-y-4 mt-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" />
                    Mes Badges ({currentStats ? countBadges(currentStats) : 0} / {BADGE_DEFS.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {BADGE_DEFS.map((badge) => {
                      const unlocked = currentStats ? badge.check(currentStats) : false;
                      return (
                        <div
                          key={badge.key}
                          className={`flex flex-col items-center p-3 rounded-xl text-center transition-all ${
                            unlocked
                              ? "bg-primary/5 border border-primary/20"
                              : "bg-muted/50 opacity-50"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                            unlocked ? "gradient-primary" : "bg-muted"
                          }`}>
                            {unlocked ? (
                              <badge.icon className="w-5 h-5 text-primary-foreground" />
                            ) : (
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="text-xs font-medium">{badge.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Les badges comptent pour <strong>16.7%</strong> de ton score au classement. Débloque-en plus pour monter !
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
        <span className="text-white/80 text-xs font-medium">{entry.compositeScore} pts</span>
      </div>
    </div>
  );
}

export default Leaderboard;
