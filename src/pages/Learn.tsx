import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, ArrowLeft, Brain, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StructuredDocViewer from "@/components/learn/StructuredDocViewer";
import ExamMode from "@/components/learn/ExamMode";
import { Badge } from "@/components/ui/badge";
import { useSubjects } from "@/hooks/useSubjects";
import { cn } from "@/lib/utils";

type ViewState =
  | { type: "grid" }
  | { type: "subject"; name: string }
  | { type: "doc"; doc: any }
  | { type: "exam"; doc: any };

const Learn = () => {
  const { subjects, getColor } = useSubjects();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewState>({ type: "grid" });
  const [structuredDocs, setStructuredDocs] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadStructuredDocs();
  }, []);

  const loadStructuredDocs = async () => {
    const { data } = await supabase
      .from("structured_documents")
      .select("*")
      .order("created_at", { ascending: false });

    const docs = data || [];
    setStructuredDocs(docs);

    const c: Record<string, number> = {};
    docs.forEach((d: any) => {
      const s = d.subject || "";
      c[s] = (c[s] || 0) + 1;
    });
    setCounts(c);
  };

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // View: exam mode
  if (view.type === "exam") {
    const chapters = view.doc.content?.chapters || [];
    const allQuestions = chapters.flatMap((ch: any) =>
      (ch.questions || []).map((q: any) => ({ ...q, chapterTitle: ch.title }))
    );
    return (
      <DashboardLayout>
        <ExamMode
          title={view.doc.title}
          subject={view.doc.subject}
          questions={allQuestions}
          documentId={view.doc.id}
          onExit={() => setView({ type: "subject", name: view.doc.subject })}
        />
      </DashboardLayout>
    );
  }

  // View: structured document
  if (view.type === "doc") {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-5xl">
          <Button variant="ghost" onClick={() => setView({ type: "subject", name: view.doc.subject })}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux fiches
          </Button>
          <StructuredDocViewer
            title={view.doc.title}
            subject={view.doc.subject}
            content={view.doc.content}
            documentId={view.doc.id}
            onBack={() => setView({ type: "subject", name: view.doc.subject })}
          />
        </div>
      </DashboardLayout>
    );
  }

  // View: subject fiches list
  if (view.type === "subject") {
    const subjectInfo = subjects.find((s) => s.name === view.name);
    const subjectColor = subjectInfo?.color ?? "bg-primary";
    const subjectDocs = structuredDocs.filter((d) => d.subject === view.name);

    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setView({ type: "grid" })}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", subjectColor)}>
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-heading font-bold">{view.name}</h1>
            <span className="text-muted-foreground text-sm">({subjectDocs.length} fiches)</span>
          </div>

          {subjectDocs.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucune fiche structurée disponible pour cette matière.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {subjectDocs.map((doc: any) => {
                const chapters = doc.content?.chapters || [];
                const totalQ = chapters.reduce(
                  (sum: number, ch: any) => sum + (ch.questions?.length || 0),
                  0
                );
                const totalDef = chapters.reduce(
                  (sum: number, ch: any) => sum + (ch.definitions?.length || 0),
                  0
                );

                return (
                  <Card
                    key={doc.id}
                    className="glass-card hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setView({ type: "doc", doc })}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <Brain className="w-5 h-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {chapters.length} chapitre{chapters.length > 1 ? "s" : ""}
                          </Badge>
                          {totalQ > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {totalQ} question{totalQ > 1 ? "s" : ""}
                            </Badge>
                          )}
                          {totalDef > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {totalDef} définition{totalDef > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // View: subject grid
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          Apprendre
        </h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Recherche par matière..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <h2 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Matières
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((subject) => (
              <Card
                key={subject.name}
                className="glass-card hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setView({ type: "subject", name: subject.name })}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white", subject.color)}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{subject.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {counts[subject.name] || 0} fiches
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Learn;
