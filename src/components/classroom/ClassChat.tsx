import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ClassChatProps {
  classId: string;
}

export function ClassChat({ classId }: ClassChatProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["class-messages", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data } = await supabase
        .from("class_messages")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: true })
        .limit(200);
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["class-profiles", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data || [];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!classId) return;
    const channel = supabase
      .channel(`chat-${classId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "class_messages", filter: `class_id=eq.${classId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["class-messages", classId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [classId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getProfile = (userId: string) =>
    profiles.find((p) => p.user_id === userId);

  const handleSend = async () => {
    if (!message.trim() || !user || sending) return;
    setSending(true);
    await supabase.from("class_messages").insert({
      class_id: classId,
      user_id: user.id,
      content: message.trim(),
    });
    setMessage("");
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[500px]">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Aucun message. Sois le premier à écrire ! 💬
            </p>
          )}
          {messages.map((msg: any) => {
            const isMe = msg.user_id === user?.id;
            const profile = getProfile(msg.user_id);
            const initials = (profile?.full_name || "?")[0].toUpperCase();
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[70%] ${isMe ? "text-right" : ""}`}>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {profile?.full_name || "Utilisateur"}
                  </p>
                  <div className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary rounded-bl-md"
                  }`}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-3 flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Écrire un message..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button size="icon" onClick={handleSend} disabled={sending || !message.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
