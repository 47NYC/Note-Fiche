import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TeacherDocs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classData, setClassData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docTitle, setDocTitle] = useState("");

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
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !classData || !user) return;
    if (!docTitle.trim()) {
      toast({ title: "Erreur", description: "Ajoutez un titre au document", variant: "destructive" });
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
    });

    setDocTitle("");
    // Reset file input
    e.target.value = "";
    await loadData();
    setUploading(false);
    toast({ title: "Document ajouté !" });
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

        {/* Upload form */}
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

        {/* Documents list */}
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
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 group"
                  >
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDocs;
