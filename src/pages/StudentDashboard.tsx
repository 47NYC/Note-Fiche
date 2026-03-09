import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { StreakBanner } from "@/components/dashboard/StreakBanner";
import { SubjectProgress } from "@/components/dashboard/SubjectProgress";
import { WeeklyActivity } from "@/components/dashboard/WeeklyActivity";
import { BadgesGrid } from "@/components/dashboard/BadgesGrid";
import { RecentQuizzes } from "@/components/dashboard/RecentQuizzes";
import { useStudentStats } from "@/hooks/useStudentStats";
import { useWeeklyActivity } from "@/hooks/useWeeklyActivity";
import { useRecentQuizzes } from "@/hooks/useRecentQuizzes";
import { useProAccess } from "@/hooks/useProAccess";
import { Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useStudentStats();
  const { data: weeklyData } = useWeeklyActivity();
  const { data: recentQuizzes } = useRecentQuizzes();
  const { isPro } = useProAccess();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <StreakBanner
          currentStreak={stats?.currentStreak ?? 0}
          totalXP={stats?.totalXP ?? 0}
          loading={statsLoading}
        />

        {!isPro && (
          <button
            onClick={() => navigate("/pro")}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4 flex items-center gap-3 hover:from-amber-500/15 hover:to-orange-500/15 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-heading font-semibold text-sm">Passe en Pro</p>
              <p className="text-xs text-muted-foreground">IA avancée, exercices illimités, emoji de profil...</p>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-500 shrink-0" />
          </button>
        )}

        <StatsCards
          totalXP={stats?.totalXP ?? 0}
          weeklyXP={stats?.weeklyXP ?? 0}
          currentStreak={stats?.currentStreak ?? 0}
          longestStreak={stats?.longestStreak ?? 0}
          totalQuizzes={stats?.totalQuizzes ?? 0}
          weeklyQuizzes={stats?.weeklyQuizzes ?? 0}
          averageScore={stats?.averageScore ?? 0}
          lastWeekAverageScore={stats?.lastWeekAverageScore ?? 0}
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <SubjectProgress />
          <WeeklyActivity data={weeklyData ?? []} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <BadgesGrid totalXP={stats?.totalXP ?? 0} currentStreak={stats?.currentStreak ?? 0} totalQuizzes={stats?.totalQuizzes ?? 0} averageScore={stats?.averageScore ?? 0} />
          <RecentQuizzes quizzes={recentQuizzes ?? []} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
