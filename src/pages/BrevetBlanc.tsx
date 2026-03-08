import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderOpen, FileText, Upload, Plus, Search, BookOpen, Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSubjects } from "@/hooks/useSubjects";

const BrevetBlanc = () => {
  const { subjectNames } = useSubjects();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docFolder, setDocFolder] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("is_brevet_blanc", true)
      .order("created_at", { ascending: false });
    setDocuments(data ?? []);
  };

  const folders = [...new Set(documents.map((d) => d.folder).filter(Boolean))];

  const filtered = documents.filter((doc) => {
    const matchesFolder = !selectedFolder || doc.folder === selectedFolder;
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.folder.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!docTitle.trim()) {
      toast({ title: "Ajoutez un titre", variant: "destructive" });
      return;
    }

    setUploading(true);
    const filePath = `brevet-blanc/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Erreur d'upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    // Teacher may not have a class yet, use a placeholder class_id or first class
    const { data: cls } = await supabase
      .from("classes")
      .select("id")
      .eq("teacher_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!cls) {
      toast({ title: "Créez d'abord une classe", variant: "destructive" });
      setUploading(false);
      return;
    }

    await supabase.from("documents").insert({
      class_id: cls.id,
      teacher_id: user.id,
      title: docTitle,
      file_path: filePath,
      folder: docFolder || "Général",
      is_brevet_blanc: true,
    });

    setDocTitle("");
    setDocFolder("");
    setDialogOpen(false);
    setUploading(false);
    await loadDocuments();
    toast({ title: "Document Brevet Blanc ajouté !" });
  };

  const downloadDoc = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              Brevet Blanc
            </h1>
            <p className="text-muted-foreground mt-1">
              Documents de révision pour le Brevet Blanc
            </p>
          </div>
          {role === "teacher" && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">Nouveau document Brevet Blanc</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>Titre</Label>
                    <Input
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="Ex: Sujet Maths 2025"
                    />
                  </div>
                  <div>
                    <Label>Dossier / Matière</Label>
                    <Select value={docFolder} onValueChange={setDocFolder}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une matière" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectNames.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="cursor-pointer">
                    <Button variant="outline" className="w-full" disabled={uploading} asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? "Upload en cours..." : "Choisir un fichier PDF"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleUpload}
                    />
                  </label>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search & filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant={!selectedFolder ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFolder(null)}
          >
            Tous
          </Button>
          {folders.map((f) => (
            <Button
              key={f}
              variant={selectedFolder === f ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFolder(f)}
            >
              <FolderOpen className="w-4 h-4 mr-1" />
              {f}
            </Button>
          ))}
        </div>

        {/* Documents grid */}
        {filtered.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {documents.length === 0
                  ? "Aucun document Brevet Blanc pour le moment."
                  : "Aucun résultat pour cette recherche."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doc) => (
              <Card
                key={doc.id}
                className="glass-card hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => downloadDoc(doc.file_path)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {doc.folder && (
                          <Badge variant="secondary" className="text-xs">
                            {doc.folder}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BrevetBlanc;
