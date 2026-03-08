import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, BookOpen, Palette, Calculator, Globe, FlaskConical,
  Music, Dumbbell, Monitor, Languages, MapPin, ArrowLeft, Download, FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SUBJECTS = [
  { name: "Mathématiques", icon: Calculator, color: "bg-green-100 text-green-600" },
  { name: "Français", icon: BookOpen, color: "bg-blue-100 text-blue-600" },
  { name: "Histoire-Géo EMC", icon: MapPin, color: "bg-yellow-100 text-yellow-600" },
  { name: "Sciences (SVT)", icon: FlaskConical, color: "bg-emerald-100 text-emerald-600" },
  { name: "Physique-Chimie", icon: FlaskConical, color: "bg-orange-100 text-orange-600" },
  { name: "Anglais", icon: Languages, color: "bg-purple-100 text-purple-600" },
  { name: "Espagnol", icon: Globe, color: "bg-red-100 text-red-600" },
  { name: "Art Plastiques", icon: Palette, color: "bg-pink-100 text-pink-600" },
  { name: "Musique", icon: Music, color: "bg-fuchsia-100 text-fuchsia-600" },
  { name: "EPS", icon: Dumbbell, color: "bg-teal-100 text-teal-600" },
  { name: "Technologie", icon: Monitor, color: "bg-sky-100 text-sky-600" },
];

const Learn = () => {
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("is_brevet_blanc", false)
      .order("created_at", { ascending: false });

    const docs = data || [];
    setDocuments(docs);

    const c: Record<string, number> = {};
    docs.forEach((d) => {
      const folder = d.folder || "";
      c[folder] = (c[folder] || 0) + 1;
    });
    setCounts(c);
  };

  const downloadDoc = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const filtered = SUBJECTS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const subjectDocs = documents.filter((d) => d.folder === selectedSubject);

  if (selectedSubject) {
    const subjectInfo = SUBJECTS.find((s) => s.name === selectedSubject);
    const Icon = subjectInfo?.icon || BookOpen;

    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedSubject(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${subjectInfo?.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-heading font-bold">{selectedSubject}</h1>
            <span className="text-muted-foreground text-sm">({subjectDocs.length} fiches)</span>
          </div>

          {subjectDocs.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucune fiche disponible pour cette matière.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {subjectDocs.map((doc) => (
                <Card key={doc.id} className="glass-card hover:shadow-md transition-all cursor-pointer" onClick={() => downloadDoc(doc.file_path)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

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
                onClick={() => setSelectedSubject(subject.name)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${subject.color}`}>
                    <subject.icon className="w-5 h-5" />
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
