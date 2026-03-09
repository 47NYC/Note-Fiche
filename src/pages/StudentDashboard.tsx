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
import { Crown, ArrowRight, Gift, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

const StudentDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useStudentStats();
  const { data: weeklyData } = useWeeklyActivity();
  const { data: recentQuizzes } = useRecentQuizzes();
  const { isPro, referralLink, referralsCount } = useProAccess();
  const navigate = useNavigate();
  const [referralDismissed, setReferralDismissed] = useState(() =>
    localStorage.getItem("referral_banner_dismissed") === "true"
  );

  const dismissReferral = () => {
    setReferralDismissed(true);
    localStorage.setItem("referral_banner_dismissed", "true");
  };

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Lien copié !");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <StreakBanner
          currentStreak={stats?.currentStreak ?? 0}
          totalXP={stats?.totalXP ?? 0}
          loading={statsLoading}
        />

        {/* Referral gift banner */}
        {!referralDismissed && referralLink && (
          <div className="relative w-full rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-sm">🎁 Parraine quelqu'un et gagne une semaine de Pro !</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Partage ton lien, chaque inscription = +7 jours de Pro gratuit
                {referralsCount > 0 && <> • <span className="font-medium text-foreground">{referralsCount}</span> parrainage(s)</>}
              </p>
            </div>
            <Button size="sm" variant="secondary" className="shrink-0" onClick={copyLink}>
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copier le lien
            </Button>
            <button
              onClick={dismissReferral}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-xs"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        )}

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
