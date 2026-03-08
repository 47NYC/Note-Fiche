import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const JoinClass = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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

    if (membership) {
      setMyClass((membership as any).classes);
      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("class_id", (membership as any).classes.id)
        .order("created_at", { ascending: false });
      setDocuments(docs || []);
    }
  };

  const handleJoin = async () => {
    if (!user || !code.trim()) return;
    setJoining(true);

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

    const { error } = await supabase.from("class_members").insert({
      class_id: cls.id,
      student_id: user.id,
    });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Classe rejointe !" });
      await loadMyClass();
    }
    setJoining(false);
  };

  const downloadDoc = async (filePath: string) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(filePath, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-heading font-bold">Ma classe</h1>

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
                />
              </div>
              <Button variant="gradient" onClick={handleJoin} disabled={joining}>
                {joining ? "Chargement..." : "Rejoindre"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Classe</p>
                <p className="text-xl font-heading font-bold">{myClass.name}</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Fiches de révision
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
                        onClick={() => downloadDoc(doc.file_path)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                      >
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
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
