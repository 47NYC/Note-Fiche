import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Upload, Users, FileText, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classData, setClassData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
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
      const { data: mems } = await supabase
        .from("class_members")
        .select("*")
        .eq("class_id", cls.id);
      
      // Fetch profile names for members
      if (mems && mems.length > 0) {
        const studentIds = mems.map(m => m.student_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", studentIds);
        
        const enriched = mems.map(m => ({
          ...m,
          full_name: profiles?.find(p => p.user_id === m.student_id)?.full_name || "Élève",
        }));
        setMembers(enriched);
      } else {
        setMembers([]);
      }

      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("class_id", cls.id)
        .order("created_at", { ascending: false });
      setDocuments(docs || []);
    }
  };

  const copyCode = () => {
    if (classData?.invite_code) {
      navigator.clipboard.writeText(classData.invite_code);
      toast({ title: "Code copié !", description: "Partagez-le avec vos élèves." });
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
    await loadData();
    setUploading(false);
    toast({ title: "Document ajouté !" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold">Espace Enseignant</h1>

        {/* Invite code banner */}
        {classData && (
          <Card className="glass-card border-primary/20 bg-primary/5">
            <CardContent className="py-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Code d'invitation de votre classe</p>
                <p className="font-semibold text-lg">{classData.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-5 py-2 rounded-xl bg-primary/10 text-primary font-mono text-xl font-bold tracking-widest">
                  {classData.invite_code}
                </code>
                <Button variant="outline" size="icon" onClick={copyCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Class info */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Ma classe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classData && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Nom de la classe</p>
                  <p className="font-semibold text-lg">{classData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Code d'invitation</p>
                  <div className="flex items-center gap-2">
                    <code className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-mono text-xl font-bold tracking-widest">
                      {classData.invite_code}
                    </code>
                    <Button variant="outline" size="icon" onClick={copyCode}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Partagez ce code à vos élèves pour qu'ils rejoignent la classe
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Members */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Élèves ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucun élève pour le moment. Partagez le code d'invitation !</p>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {m.full_name?.[0] || "?"}
                      </div>
                      <span className="font-medium text-sm">{m.full_name || "Élève"}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Documents ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload form */}
              <div className="space-y-2 p-3 rounded-xl border border-dashed border-border">
                <Label htmlFor="docTitle">Titre du document</Label>
                <Input
                  id="docTitle"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ex: Fiche Pythagore"
                />
                <label className="cursor-pointer">
                  <Button variant="outline" className="w-full" disabled={uploading} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Upload..." : "Ajouter un PDF"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </label>
              </div>

              {documents.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucun document uploadé</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
