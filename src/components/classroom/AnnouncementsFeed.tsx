import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Megaphone, Pin, Plus, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AnnouncementsFeedProps {
  classId: string;
  isTeacher: boolean;
}

export function AnnouncementsFeed({ classId, isTeacher }: AnnouncementsFeedProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const { data: announcements = [] } = useQuery({
    queryKey: ["class-announcements", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data } = await supabase
        .from("class_announcements")
        .select("*")
        .eq("class_id", classId)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-all"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data || [];
    },
  });

  const handlePost = async () => {
    if (!title.trim() || !content.trim() || !user) return;
    setPosting(true);
    const { error } = await supabase.from("class_announcements").insert({
      class_id: classId,
      teacher_id: user.id,
      title: title.trim(),
      content: content.trim(),
    });
    if (error) toast.error("Erreur lors de la publication");
    else {
      toast.success("Annonce publiée !");
      setTitle("");
      setContent("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["class-announcements", classId] });
    }
    setPosting(false);
  };

  const togglePin = async (id: string, pinned: boolean) => {
    await supabase.from("class_announcements").update({ pinned: !pinned }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["class-announcements", classId] });
  };

  const getProfile = (userId: string) => profiles.find((p) => p.user_id === userId);

  return (
    <div className="space-y-4">
      {isTeacher && (
        <>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Publier une annonce
            </Button>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="font-heading font-semibold text-sm">Nouvelle annonce</p>
                  <Button size="icon" variant="ghost" onClick={() => setShowForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder="Contenu de l'annonce..." value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
                <Button onClick={handlePost} disabled={posting || !title.trim() || !content.trim()}>
                  <Megaphone className="w-4 h-4 mr-2" /> Publier
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {announcements.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-6">Aucune annonce pour le moment</p>
      )}

      {announcements.map((a: any) => {
        const profile = getProfile(a.teacher_id);
        return (
          <Card key={a.id} className={a.pinned ? "border-primary/30 bg-primary/5" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {(profile?.full_name || "P")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-semibold text-sm">{profile?.full_name || "Professeur"}</p>
                    {a.pinned && <Pin className="w-3 h-3 text-primary" />}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(a.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="font-medium mt-1">{a.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.content}</p>
                </div>
                {isTeacher && (
                  <Button size="icon" variant="ghost" onClick={() => togglePin(a.id, a.pinned)} title={a.pinned ? "Désépingler" : "Épingler"}>
                    <Pin className={`w-4 h-4 ${a.pinned ? "text-primary" : "text-muted-foreground"}`} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
