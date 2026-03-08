import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface SessionPoint {
  date: string;
  xp: number;
  score: number;
}

interface StudentProgressChartProps {
  studentName: string;
  sessions: SessionPoint[];
}

export function StudentProgressChart({ studentName, sessions }: StudentProgressChartProps) {
  const [open, setOpen] = useState(false);

  if (sessions.length === 0) return null;

  // Aggregate by date
  const byDate = new Map<string, { xp: number; scores: number[]; count: number }>();
  sessions.forEach((s) => {
    const entry = byDate.get(s.date) || { xp: 0, scores: [], count: 0 };
    entry.xp += s.xp;
    entry.scores.push(s.score);
    entry.count++;
    byDate.set(s.date, entry);
  });

  // Cumulative XP
  let cumXP = 0;
  const chartData = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => {
      cumXP += v.xp;
      const avgScore = Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length);
      return { date, xpCumulé: cumXP, scoreMoyen: avgScore };
    });

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-primary hover:underline flex items-center gap-1"
      >
        <TrendingUp className="w-3 h-3" />
        {open ? "Masquer le graphique" : "Voir la progression"}
      </button>
      {open && (
        <Card className="mt-2 glass-card">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-heading">Progression de {studentName}</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis yAxisId="xp" fontSize={10} />
                <YAxis yAxisId="score" orientation="right" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
                <Line yAxisId="xp" type="monotone" dataKey="xpCumulé" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line yAxisId="score" type="monotone" dataKey="scoreMoyen" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
