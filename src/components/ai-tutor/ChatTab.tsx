import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Loader2, Crown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useProAccess } from "@/hooks/useProAccess";
import { ProBadge } from "@/components/ProGate";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor-chat`;
const DAILY_LIMIT = 10;

function getDailyKey(): string {
  return `ai_chat_count_${new Date().toISOString().slice(0, 10)}`;
}

function getDailyCount(): number {
  return parseInt(localStorage.getItem(getDailyKey()) || "0", 10);
}

function incrementDailyCount(): void {
  const key = getDailyKey();
  localStorage.setItem(key, String(getDailyCount() + 1));
}

export function ChatTab() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(getDailyCount());
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isPro } = useProAccess();

  const remaining = DAILY_LIMIT - dailyCount;
  const limitReached = !isPro && remaining <= 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (limitReached) {
      toast.error("Tu as atteint ta limite de 20 questions par jour. Passe en Pro pour un accès illimité !");
      return;
    }

    const userMsg: Msg = { role: "user", content: text };
    setInput("");
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    if (!isPro) {
      incrementDailyCount();
      setDailyCount(getDailyCount());
    }

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, isPro }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erreur du service IA");
      }

      if (!resp.body) throw new Error("Pas de réponse");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      {/* Daily limit banner for free users */}
      {!isPro && (
        <div className="px-4 pt-3 pb-1">
          <div className={`text-xs px-3 py-1.5 rounded-full text-center ${
            remaining <= 5 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
          }`}>
            {limitReached
              ? "🚫 Limite atteinte (20/20) — Passe en Pro pour un accès illimité !"
              : `💬 ${remaining} question${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""} aujourd'hui`}
            {!limitReached && isPro === false && remaining <= 5 && " — Passe en Pro pour l'illimité !"}
          </div>
        </div>
      )}
      {isPro && (
        <div className="px-4 pt-3 pb-1">
          <div className="text-xs px-3 py-1.5 rounded-full text-center bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
            <Crown className="w-3 h-3" /> Pro — Réponses détaillées & illimitées
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground">Tuteur IA Brevet</h3>
            <p className="text-center max-w-md text-sm">
              Pose-moi une question sur n'importe quelle matière du Brevet ! 
              {isPro ? " En tant que Pro, tu reçois des explications détaillées et approfondies." : " 20 questions par jour en gratuit."}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {["Explique le théorème de Pythagore", "Fiche sur la Révolution française", "Les figures de style en français"].map((s) => (
                <Button key={s} variant="outline" size="sm" onClick={() => { setInput(s); }}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <Card className={`max-w-[80%] p-3 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
              <div className={`prose prose-sm max-w-none ${m.role === "user" ? "prose-invert" : ""}`}>
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </Card>
            {m.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <Card className="p-3 bg-card">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </Card>
          </div>
        )}
      </div>

      <div className="border-t p-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={limitReached ? "Limite atteinte — Passe en Pro" : "Pose ta question..."}
          disabled={isLoading || limitReached}
          className="flex-1"
        />
        <Button onClick={send} disabled={isLoading || !input.trim() || limitReached} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
