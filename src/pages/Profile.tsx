import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useStudentStats } from "@/hooks/useStudentStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StreakWidget } from "@/components/profile/StreakWidget";
import { AchievementGrid } from "@/components/profile/AchievementGrid";
import { GoalManager } from "@/components/profile/GoalManager";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ProfilePage = () => {
  const { user, role } = useAuth();
  const { data: stats, isLoading: statsLoading } = useStudentStats();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: streak } = useQuery({
    queryKey: ["streak-detail", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const fullName = profile?.full_name || user?.user_metadata?.full_name || "Utilisateur";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        {/* Profile header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                {profile?.avatar_url && (
                  <AvatarImage src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`} />
                )}
                <AvatarFallback className="gradient-primary text-primary-foreground text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="font-heading text-2xl font-bold">{fullName}</h1>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{role === "teacher" ? "Enseignant" : "Élève"}</Badge>
                  {statsLoading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <Badge className="gradient-streak text-white border-0">{stats?.totalXP ?? 0} XP</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <StreakWidget
          currentStreak={streak?.current_streak ?? 0}
          longestStreak={streak?.longest_streak ?? 0}
          lastActiveDate={streak?.last_active_date ?? null}
          totalXP={stats?.totalXP ?? 0}
        />

        {/* Goals */}
        <GoalManager />

        {/* Achievements */}
        <AchievementGrid />
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
