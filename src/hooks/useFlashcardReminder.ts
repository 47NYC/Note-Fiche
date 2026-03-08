import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function useFlashcardReminder() {
  const { user } = useAuth();
  const { toast } = useToast();

  const checkDueCards = useCallback(async () => {
    if (!user) return;

    const { count } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("next_review", new Date().toISOString());

    if (count && count > 0) {
      // In-app toast notification
      toast({
        title: "🔥 Flashcards à réviser !",
        description: `Tu as ${count} carte${count > 1 ? "s" : ""} à réviser maintenant.`,
      });

      // Browser notification if permitted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("BrevetIA – Révisions", {
          body: `Tu as ${count} flashcard${count > 1 ? "s" : ""} à réviser !`,
          icon: "/favicon.ico",
        });
      }
    }
  }, [user, toast]);

  const requestPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Request permission on first load
    requestPermission();

    // Check due cards on load
    const timeout = setTimeout(checkDueCards, 3000);

    // Check every 30 minutes
    const interval = setInterval(checkDueCards, 30 * 60 * 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [user, checkDueCards, requestPermission]);
}
