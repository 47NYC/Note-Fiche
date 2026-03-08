import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, ExternalLink, Download, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const JoinClass = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [myClass, setMyClass] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadMyClass();
  }, [user]);

  const loadMyClass = async () => {
    if (!user) return;
    const { data: membership } = await supabase
      .from("class_members")
      .select("*, classes(*)")
      .eq("student_id", user.id)
      .maybeSingle();

    if (membership && membership.classes) {
      setMyClass(membership.classes);
      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("class_id", (membership.classes as any).id)
        .order("created_at", { ascending: false });
      setDocuments(docs || []);
    }
  };

  const handleJoin = async () => {
    if (!user || !code.trim()) return;
    setJoining(true);

    // Use the security definer function or direct query
    const { data: cls } = await supabase
      .from("classes")
      .select("id")
      .eq("invite_code", code.trim().toLowerCase())
      .maybeSingle();

    if (!cls) {
      toast({ title: "Code invalide", description: "Vérifiez le code et réessayez", variant: "destructive" });
      setJoining(false);
      return;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("class_members")
      .select("id")
      .eq("class_id", cls.id)
      .eq("student_id", user.id)
      .maybeSingle();

    if (existing) {
      toast({ title: "Déjà membre", description: "Vous êtes déjà dans cette classe" });
      setJoining(false);
      await loadMyClass();
      return;
    }

    const { error } = await supabase.from("class_members").insert({
      class_id: cls.id,
      student_id: user.id,
    });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Classe rejointe avec succès !" });
      await loadMyClass();
    }
    setJoining(false);
  };

  const openDoc = (doc: any) => {
    if (doc.google_doc_url) {
      window.open(doc.google_doc_url, "_blank");
    } else if (doc.file_path) {
      supabase.storage.from("documents").createSignedUrl(doc.file_path, 3600).then(({ data }) => {
        if (data?.signedUrl) window.open(data.signedUrl, "_blank");
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Ma classe
        </h1>

        {!myClass ? (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Rejoindre une classe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code d'invitation</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Entrez le code de votre classe"
                  className="font-mono text-lg tracking-widest"
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
              </div>
              <Button variant="gradient" onClick={handleJoin} disabled={joining} className="w-full">
                {joining ? "Chargement..." : "Rejoindre"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Classe</p>
                  <p className="text-xl font-heading font-bold">{myClass.name}</p>
                </div>
                <Badge variant="secondary">Membre</Badge>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/learn")}>
                <Brain className="w-4 h-4 mr-2" /> Fiches structurées
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/brevet-blanc")}>
                <FileText className="w-4 h-4 mr-2" /> Brevet Blanc
              </Button>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Documents de la classe ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Pas de documents pour le moment</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => openDoc(doc)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                      >
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.folder && <span className="mr-2">{doc.folder}</span>}
                            {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        {doc.google_doc_url ? (
                          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JoinClass;
