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

const StudentDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useStudentStats();
  const { data: weeklyData } = useWeeklyActivity();
  const { data: recentQuizzes } = useRecentQuizzes();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <StreakBanner
          currentStreak={stats?.currentStreak ?? 0}
          totalXP={stats?.totalXP ?? 0}
          loading={statsLoading}
        />

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
