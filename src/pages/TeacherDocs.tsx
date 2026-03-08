import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Trash2, Brain, Loader2, CheckCircle, Link, ExternalLink, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useSubjects } from "@/hooks/useSubjects";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SUBJECT_COLORS = [
  "bg-blue-500", "bg-rose-500", "bg-amber-500", "bg-green-500", "bg-emerald-500",
  "bg-cyan-500", "bg-red-500", "bg-pink-500", "bg-fuchsia-500", "bg-teal-500", "bg-purple-500",
  "bg-orange-500", "bg-indigo-500", "bg-lime-500", "bg-sky-500",
];

const TeacherDocs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subjects, subjectNames, addSubject, removeSubject } = useSubjects();
  const [classData, setClassData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docSubject, setDocSubject] = useState("");
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);

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

  const handleAddGoogleDoc = async () => {
    if (!classData || !user) return;
    if (!docTitle.trim()) {
      toast({ title: "Erreur", description: "Ajoutez un titre au document", variant: "destructive" });
      return;
    }
    if (!docSubject) {
      toast({ title: "Erreur", description: "Sélectionnez une matière", variant: "destructive" });
      return;
    }
    if (!googleDocUrl.trim() || !googleDocUrl.includes("docs.google.com")) {
      toast({ title: "Erreur", description: "Collez un lien Google Docs valide", variant: "destructive" });
      return;
    }

    setAdding(true);

    const { data: newDoc, error: insertErr } = await supabase.from("documents").insert({
      class_id: classData.id,
      teacher_id: user.id,
      title: docTitle,
      file_path: "",
      folder: docSubject,
      google_doc_url: googleDocUrl,
    }).select().single();

    if (insertErr) {
      toast({ title: "Erreur", description: insertErr.message, variant: "destructive" });
      setAdding(false);
      return;
    }

    setDocTitle("");
    setDocSubject("");
    setGoogleDocUrl("");
    await loadData();
    setAdding(false);
    toast({ title: "Document ajouté !" });

    // Auto-process
    if (newDoc) {
      processDocument(newDoc.id, googleDocUrl);
    }
  };

  const processDocument = async (docId: string, url?: string) => {
    setProcessingId(docId);
    try {
      const { data, error } = await supabase.functions.invoke("process-document", {
        body: { document_id: docId, google_doc_url: url },
      });

      if (error) {
        toast({ title: "Erreur", description: "Échec du traitement IA", variant: "destructive" });
      } else if (data?.error) {
        toast({
          title: data.existing_id ? "Déjà traité" : "Erreur",
          description: data.error,
          variant: data.existing_id ? "default" : "destructive",
        });
        if (data.existing_id) setProcessedIds((prev) => new Set([...prev, docId]));
      } else {
        toast({ title: "Document structuré avec succès !" });
        setProcessedIds((prev) => new Set([...prev, docId]));
      }
    } catch (e) {
      toast({ title: "Erreur", description: "Échec du traitement", variant: "destructive" });
    }
    setProcessingId(null);
  };

  const deleteDoc = async (id: string, filePath: string) => {
    if (filePath) await supabase.storage.from("documents").remove([filePath]);
    await supabase.from("documents").delete().eq("id", id);
    await loadData();
    toast({ title: "Document supprimé" });
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim() || !classData) return;
    try {
      await addSubject.mutateAsync({
        name: newSubjectName.trim(),
        color: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length],
        classId: classData.id,
      });
      setNewSubjectName("");
      toast({ title: "Matière ajoutée !" });
    } catch {
      toast({ title: "Erreur", description: "Cette matière existe peut-être déjà", variant: "destructive" });
    }
  };

  const handleRemoveSubject = async (subjectId: string, subjectName: string) => {
    // Check if any documents use this subject
    const hasDoc = documents.some((d) => d.folder === subjectName);
    if (hasDoc) {
      toast({ title: "Impossible", description: "Cette matière contient des documents. Supprimez-les d'abord.", variant: "destructive" });
      return;
    }
    try {
      await removeSubject.mutateAsync(subjectId);
      toast({ title: "Matière supprimée" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer la matière", variant: "destructive" });
    }
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
            <CardTitle className="font-heading">Ajouter un Google Doc</CardTitle>
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
                  {subjectNames.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="googleUrl">Lien Google Docs</Label>
              <Input
                id="googleUrl"
                value={googleDocUrl}
                onChange={(e) => setGoogleDocUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Le document doit être partagé en mode "Tous ceux qui ont le lien"
              </p>
            </div>
            <Button
              className="w-full"
              disabled={adding}
              onClick={handleAddGoogleDoc}
            >
              <Link className="w-4 h-4 mr-2" />
              {adding ? "Ajout en cours..." : "Ajouter et structurer"}
            </Button>
          </CardContent>
        </Card>

        {/* Subject management */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading flex items-center justify-between">
              <span>Matières ({subjects.length})</span>
              <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" /> Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une matière</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label>Nom de la matière</Label>
                      <Input
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        placeholder="Ex: Latin, Allemand..."
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddSubject(); }}
                      />
                    </div>
                    <Button onClick={() => { handleAddSubject(); setSubjectDialogOpen(false); }} className="w-full" disabled={!newSubjectName.trim()}>
                      Ajouter la matière
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => {
                const hasDoc = documents.some((d) => d.folder === s.name);
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border",
                      hasDoc ? "bg-muted/50" : "bg-muted/30"
                    )}
                  >
                    <span className={cn("w-2.5 h-2.5 rounded-full", s.color)} />
                    <span>{s.name}</span>
                    {hasDoc ? (
                      <Badge variant="secondary" className="text-[10px] ml-1">docs</Badge>
                    ) : (
                      <button
                        onClick={() => handleRemoveSubject(s.id, s.name)}
                        className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Les matières avec des documents ne peuvent pas être supprimées.
            </p>
          </CardContent>
        </Card>

          <CardHeader>
            <CardTitle className="font-heading">
              Mes documents ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun document ajouté</p>
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
                          onClick={() => processDocument(doc.id, doc.google_doc_url)}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Brain className="w-4 h-4 mr-1" />
                          )}
                          {isProcessing ? "Traitement..." : "Structurer IA"}
                        </Button>
                      )}
                      {doc.google_doc_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => window.open(doc.google_doc_url, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
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
