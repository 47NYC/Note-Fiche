import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ClassChat } from "@/components/classroom/ClassChat";
import { AnnouncementsFeed } from "@/components/classroom/AnnouncementsFeed";
import { AssignmentsList } from "@/components/classroom/AssignmentsList";
import { ClassCard } from "@/components/classroom/ClassCard";
import { DocumentComments } from "@/components/classroom/DocumentComments";
import { Copy, GraduationCap, Users, MessageCircle, Megaphone, ClipboardList, FileText, ExternalLink, Download, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const ClassroomPage = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isTeacher = role === "teacher";

  const [classData, setClassData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    if (isTeacher) {
      const { data: cls } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id)
        .maybeSingle();
      setClassData(cls);
      if (cls) loadMembers(cls.id);
      if (cls) loadDocs(cls.id);
    } else {
      const { data: membership } = await supabase
        .from("class_members")
        .select("*, classes(*)")
        .eq("student_id", user.id)
        .maybeSingle();
      if (membership?.classes) {
        setClassData(membership.classes);
        loadMembers((membership.classes as any).id);
        loadDocs((membership.classes as any).id);
      }
    }
  };

  const loadMembers = async (classId: string) => {
    const { data: mems } = await supabase
      .from("class_members")
      .select("*")
      .eq("class_id", classId);
    if (mems && mems.length > 0) {
      const studentIds = mems.map((m) => m.student_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", studentIds);
      setMembers(
        mems.map((m) => ({
          ...m,
          full_name: profiles?.find((p) => p.user_id === m.student_id)?.full_name || "Élève",
        }))
      );
    } else {
      setMembers([]);
    }
  };

  const loadDocs = async (classId: string) => {
    const { data: docs } = await supabase
      .from("documents")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });
    setDocuments(docs || []);
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
      toast({ title: "Code invalide", variant: "destructive" });
      setJoining(false);
      return;
    }
    const { data: existing } = await supabase
      .from("class_members")
      .select("id")
      .eq("class_id", cls.id)
      .eq("student_id", user.id)
      .maybeSingle();
    if (existing) {
      toast({ title: "Déjà membre" });
      setJoining(false);
      await loadData();
      return;
    }
    const { error } = await supabase.from("class_members").insert({
      class_id: cls.id,
      student_id: user.id,
    });
    if (error) toast({ title: "Erreur", variant: "destructive" });
    else {
      toast({ title: "Classe rejointe !" });
      await loadData();
    }
    setJoining(false);
  };

  const copyCode = () => {
    if (classData?.invite_code) {
      navigator.clipboard.writeText(classData.invite_code);
      toast({ title: "Code copié !" });
    }
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

  // No class yet (student)
  if (!classData && !isTeacher) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-lg mx-auto">
          <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            Ma classe
          </h1>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Rejoindre une classe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Code d'invitation</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Entrez le code"
                  className="font-mono text-lg tracking-widest"
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
              </div>
              <Button variant="gradient" onClick={handleJoin} disabled={joining} className="w-full">
                {joining ? "Chargement..." : "Rejoindre"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Class card header */}
        {classData && (
          <ClassCard
            className={classData.name}
            memberCount={members.length}
            colorIndex={0}
          />
        )}

        {/* Invite code for teachers */}
        {isTeacher && classData && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <code className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-mono text-lg font-bold tracking-widest">
                {classData.invite_code}
              </code>
              <Button variant="outline" size="icon" onClick={copyCode}>
                <Copy className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Code d'invitation</span>
            </CardContent>
          </Card>
        )}

        {/* Quick links for students */}
        {!isTeacher && (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/learn")}>
              <Brain className="w-4 h-4 mr-2" /> Fiches
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/brevet-blanc")}>
              <FileText className="w-4 h-4 mr-2" /> Brevet Blanc
            </Button>
          </div>
        )}

        {/* Main tabs */}
        <Tabs defaultValue="announcements" className="w-full">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="announcements" className="gap-1.5">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Annonces</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-1.5">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Devoirs</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-1.5">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Membres</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="mt-4">
            {classData && (
              <AnnouncementsFeed classId={classData.id} isTeacher={isTeacher} />
            )}
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            {classData && (
              <Card>
                <ClassChat classId={classData.id} />
              </Card>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="mt-4">
            {classData && (
              <AssignmentsList classId={classData.id} isTeacher={isTeacher} />
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <div className="space-y-2">
              {documents.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">Pas de documents</p>
              ) : (
                documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4 space-y-3">
                      <button
                        onClick={() => openDoc(doc)}
                        className="w-full flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
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
                      {/* Comment toggle */}
                      <button
                        onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        {expandedDoc === doc.id ? "Masquer les commentaires" : "💬 Commentaires"}
                      </button>
                      {expandedDoc === doc.id && (
                        <DocumentComments documentId={doc.id} />
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Membres ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun élève</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                          {m.full_name?.[0] || "?"}
                        </div>
                        <span className="font-medium text-sm">{m.full_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ClassroomPage;
