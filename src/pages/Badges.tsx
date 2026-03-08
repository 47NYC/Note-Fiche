import { DashboardLayout } from "@/components/DashboardLayout";
import { BadgesGrid } from "@/components/dashboard/BadgesGrid";
import { useStudentStats } from "@/hooks/useStudentStats";
import { Trophy } from "lucide-react";

const Badges = () => {
  const { data: stats } = useStudentStats();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary" />
          Mes Badges
        </h1>
        <BadgesGrid
          totalXP={stats?.totalXP ?? 0}
          currentStreak={stats?.currentStreak ?? 0}
          totalQuizzes={stats?.totalQuizzes ?? 0}
          averageScore={stats?.averageScore ?? 0}
        />
      </div>
    </DashboardLayout>
  );
};

export default Badges;
