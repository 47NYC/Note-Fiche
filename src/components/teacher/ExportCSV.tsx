import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface StudentRow {
  full_name: string;
  totalXP: number;
  currentStreak: number;
  flashcardCount: number;
  completedChapters: number;
  totalChapters: number;
  avgScore: number;
}

interface ExportCSVProps {
  students: StudentRow[];
}

export function ExportCSV({ students }: ExportCSVProps) {
  const handleExport = () => {
    const headers = ["Rang", "Nom", "XP Total", "Série actuelle", "Flashcards", "Chapitres complétés", "Total chapitres", "Score moyen (%)"];
    const rows = students.map((s, i) => [
      i + 1,
      s.full_name,
      s.totalXP,
      s.currentStreak,
      s.flashcardCount,
      s.completedChapters,
      s.totalChapters,
      s.avgScore,
    ]);

    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notefiche-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
      <Download className="w-4 h-4" />
      Exporter CSV
    </Button>
  );
}
