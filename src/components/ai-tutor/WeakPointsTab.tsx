import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingUp, Lightbulb, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function WeakPointsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["weak-points"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-weak-points");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  if (!data?.subjects || data.subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3 p-4">
        <BarChart3 className="w-12 h-12" />
        <p className="text-center">{data?.message || "Pas encore de données. Entraîne-toi pour voir ton analyse !"}</p>
      </div>
    );
  }

  const chartData = data.subjects.map((s: any) => ({
    name: s.name,
    accuracy: s.accuracy,
    fill: s.accuracy >= 70 ? "hsl(var(--success))" : s.accuracy >= 50 ? "hsl(var(--accent))" : "hsl(var(--destructive))",
  }));

  const priorityColors: Record<string, string> = {
    haute: "destructive",
    moyenne: "default",
    basse: "secondary",
  };

  return (
    <div className="space-y-6 p-4 overflow-y-auto max-h-[calc(100vh-220px)]">
      {/* Performance chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-primary" />
            Performance par matière
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 100]} fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                formatter={(value: number) => [`${value}%`, "Précision"]}
              />
              <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                {chartData.map((entry: any, index: number) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {data.aiAnalysis && (
        <>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="w-5 h-5 text-accent" />
                Encouragement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{data.aiAnalysis.encouragement}</p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="font-heading font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Points à améliorer
            </h3>
            {data.aiAnalysis.weakSubjects.map((ws: any, i: number) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm">{ws.subject}</h4>
                    <Badge variant={priorityColors[ws.priority] as any}>
                      Priorité {ws.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-destructive/80 mb-1">{ws.issue}</p>
                  <div className="flex items-start gap-2 mt-2">
                    <TrendingUp className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{ws.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="pt-4">
              <h4 className="font-semibold text-sm mb-2">Conseil général</h4>
              <p className="text-sm text-muted-foreground">{data.aiAnalysis.overallAdvice}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
