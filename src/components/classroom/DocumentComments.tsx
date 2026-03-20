import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface DocumentCommentsProps {
  documentId: string;
}

export function DocumentComments({ documentId }: DocumentCommentsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const { data: comments = [] } = useQuery({
    queryKey: ["doc-comments", documentId],
    enabled: !!documentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("document_comments")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: true });
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

  const handleSend = async () => {
    if (!comment.trim() || !user || sending) return;
    setSending(true);
    await supabase.from("document_comments").insert({
      document_id: documentId,
      user_id: user.id,
      content: comment.trim(),
    });
    setComment("");
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ["doc-comments", documentId] });
  };

  const handleDelete = async (id: string) => {
    await supabase.from("document_comments").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["doc-comments", documentId] });
  };

  const getProfile = (userId: string) => profiles.find((p) => p.user_id === userId);

  return (
    <div className="space-y-3">
      <p className="font-heading font-semibold text-sm">Commentaires ({comments.length})</p>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {comments.map((c: any) => {
          const profile = getProfile(c.user_id);
          const isMe = c.user_id === user?.id;
          return (
            <div key={c.id} className="flex gap-2 group">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                  {(profile?.full_name || "?")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium">{profile?.full_name || "Utilisateur"}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  {isMe && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{c.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
          className="text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button size="icon" variant="secondary" onClick={handleSend} disabled={sending || !comment.trim()}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
