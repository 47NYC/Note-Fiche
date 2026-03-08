import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Download, Trash2, Brain, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const SUBJECTS = [
  "Mathématiques", "Français", "Histoire-Géo EMC", "Sciences (SVT)",
  "Physique-Chimie", "Anglais", "Espagnol", "Art Plastiques",
  "Musique", "EPS", "Technologie",
];

const TeacherDocs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classData, setClassData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docSubject, setDocSubject] = useState("");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const { data: cls } = await supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", user.id)
      .maybeSingle();
    setClassData(cls);

    if (cls) {
      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("class_id", cls.id)
        .eq("is_brevet_blanc", false)
        .order("created_at", { ascending: false });
      setDocuments(docs || []);

      // Check which docs are already processed
      const docIds = (docs || []).map((d: any) => d.id);
      if (docIds.length > 0) {
        const { data: structured } = await supabase
          .from("structured_documents")
          .select("document_id")
          .in("document_id", docIds);
        setProcessedIds(new Set((structured || []).map((s: any) => s.document_id)));
      }
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !classData || !user) return;
    if (!docTitle.trim()) {
      toast({ title: "Erreur", description: "Ajoutez un titre au document", variant: "destructive" });
      return;
    }
    if (!docSubject) {
      toast({ title: "Erreur", description: "Sélectionnez une matière", variant: "destructive" });
      return;
    }

    setUploading(true);
    const filePath = `${classData.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Erreur d'upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    await supabase.from("documents").insert({
      class_id: classData.id,
      teacher_id: user.id,
      title: docTitle,
      file_path: filePath,
      folder: docSubject,
    });

    setDocTitle("");
    setDocSubject("");
    e.target.value = "";
    await loadData();
    setUploading(false);
    toast({ title: "Document ajouté !" });
  };

  const processDocument = async (docId: string) => {
    setProcessingId(docId);
    try {
      const { data, error } = await supabase.functions.invoke("process-document", {
        body: { document_id: docId },
      });

      if (error) {
        toast({ title: "Erreur", description: "Échec du traitement IA", variant: "destructive" });
        console.error("Process error:", error);
      } else if (data?.error) {
        toast({
          title: data.existing_id ? "Déjà traité" : "Erreur",
          description: data.error,
          variant: data.existing_id ? "default" : "destructive",
        });
        if (data.existing_id) {
          setProcessedIds((prev) => new Set([...prev, docId]));
        }
      } else {
        toast({ title: "Document structuré avec succès !" });
        setProcessedIds((prev) => new Set([...prev, docId]));
      }
    } catch (e) {
      toast({ title: "Erreur", description: "Échec du traitement", variant: "destructive" });
    }
    setProcessingId(null);
  };

  const downloadDoc = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const deleteDoc = async (id: string, filePath: string) => {
    await supabase.storage.from("documents").remove([filePath]);
    await supabase.from("documents").delete().eq("id", id);
    await loadData();
    toast({ title: "Document supprimé" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          Documents
        </h1>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading">Ajouter un document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="docTitle">Titre du document</Label>
              <Input
                id="docTitle"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Ex: Fiche Pythagore"
              />
            </div>
            <div>
              <Label>Matière</Label>
              <Select value={docSubject} onValueChange={setDocSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une matière" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="cursor-pointer block">
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
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading">
              Mes documents ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun document uploadé</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const isProcessed = processedIds.has(doc.id);
                  const isProcessing = processingId === doc.id;

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 group"
                    >
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{doc.title}</p>
                          {isProcessed && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Structuré
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {doc.folder && <span className="mr-2">{doc.folder}</span>}
                          {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      {!isProcessed && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          disabled={isProcessing}
                          onClick={() => processDocument(doc.id)}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Brain className="w-4 h-4 mr-1" />
                          )}
                          {isProcessing ? "Traitement..." : "Structurer IA"}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => downloadDoc(doc.file_path)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive"
                        onClick={() => deleteDoc(doc.id, doc.file_path)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDocs;
