import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Flame, Star, BookOpen, Target, Trophy, Lock,
  TrendingUp, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const weeklyData = [
  { day: "Lun", minutes: 45 },
  { day: "Mar", minutes: 30 },
  { day: "Mer", minutes: 60 },
  { day: "Jeu", minutes: 20 },
  { day: "Ven", minutes: 50 },
  { day: "Sam", minutes: 75 },
  { day: "Dim", minutes: 40 },
];

const subjects = [
  { name: "Mathématiques", progress: 72, color: "hsl(234, 89%, 58%)" },
  { name: "Français", progress: 58, color: "hsl(34, 100%, 50%)" },
  { name: "Histoire-Géo", progress: 45, color: "hsl(152, 69%, 41%)" },
  { name: "Sciences", progress: 63, color: "hsl(258, 90%, 66%)" },
];

const badges = [
  { name: "Première leçon", icon: BookOpen, unlocked: true },
  { name: "7 jours de suite", icon: Flame, unlocked: true },
  { name: "100 points", icon: Star, unlocked: true },
  { name: "Quiz parfait", icon: Target, unlocked: false },
  { name: "30 jours", icon: Calendar, unlocked: false },
  { name: "Champion", icon: Trophy, unlocked: false },
];

const recentQuizzes = [
  { subject: "Maths — Pythagore", score: 90, date: "Aujourd'hui" },
  { subject: "Français — Grammaire", score: 75, date: "Hier" },
  { subject: "Histoire — WWII", score: 60, date: "Il y a 2j" },
  { subject: "Sciences — Atomes", score: 85, date: "Il y a 3j" },
];

const StudentDashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Streak banner */}
        <div className="rounded-2xl gradient-streak p-6 text-streak-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-streak-foreground/20 flex items-center justify-center">
                <Flame className="w-8 h-8 animate-pulse-glow" />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold">🔥 12 jours de série !</h2>
                <p className="opacity-90">Continue comme ça, tu es #3 du classement !</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-heading font-bold">1 250</p>
              <p className="text-sm opacity-80">points XP</p>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Points XP", value: "1 250", icon: Star, trend: "+120 cette semaine" },
            { label: "Série", value: "12 jours", icon: Flame, trend: "Record : 15 jours" },
            { label: "Quiz terminés", value: "24", icon: Target, trend: "4 cette semaine" },
            { label: "Score moyen", value: "78%", icon: TrendingUp, trend: "+5% vs semaine dernière" },
          ].map((stat) => (
            <Card key={stat.label} className="glass-card animate-slide-up">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-heading font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.trend}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Subject progress */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Progression par matière
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subjects.map((subject) => (
                <div key={subject.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{subject.name}</span>
                    <span className="text-muted-foreground">{subject.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${subject.progress}%`, backgroundColor: subject.color }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weekly activity */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Activité de la semaine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(220, 13%, 91%)",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value: number) => [`${value} min`, "Temps d'étude"]}
                  />
                  <Bar dataKey="minutes" fill="hsl(234, 89%, 58%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Badges */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {badges.map((badge) => (
                  <div
                    key={badge.name}
                    className={`flex flex-col items-center p-3 rounded-xl text-center transition-all ${
                      badge.unlocked
                        ? "bg-primary/5 border border-primary/20"
                        : "bg-muted/50 opacity-50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        badge.unlocked ? "gradient-primary" : "bg-muted"
                      }`}
                    >
                      {badge.unlocked ? (
                        <badge.icon className="w-5 h-5 text-primary-foreground" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-xs font-medium">{badge.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent quizzes */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Quiz récents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentQuizzes.map((quiz) => (
                <div
                  key={quiz.subject}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
                >
                  <div>
                    <p className="font-medium text-sm">{quiz.subject}</p>
                    <p className="text-xs text-muted-foreground">{quiz.date}</p>
                  </div>
                  <Badge
                    variant={quiz.score >= 80 ? "default" : quiz.score >= 60 ? "secondary" : "destructive"}
                    className={
                      quiz.score >= 80
                        ? "gradient-success text-success-foreground"
                        : ""
                    }
                  >
                    {quiz.score}%
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
