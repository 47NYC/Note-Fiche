import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, RotateCcw, Check, X, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  card_type: string;
  next_review: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
}

const Flashcards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadCards = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .lte("next_review", new Date().toISOString())
      .order("next_review", { ascending: true });
    setCards((data as Flashcard[]) || []);
    setCurrentIndex(0);
    setFlipped(false);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const generateFromStructuredDocs = async () => {
    if (!user) return;
    setGenerating(true);

    try {
      const { data: docs } = await supabase
        .from("structured_documents")
        .select("*");

      if (!docs || docs.length === 0) {
        toast({ title: "Aucune fiche structurée", description: "Ajoutez d'abord des documents dans Apprendre.", variant: "destructive" });
        setGenerating(false);
        return;
      }

      const newCards: any[] = [];

      for (const doc of docs) {
        const content = doc.content as any;
        const chapters = content?.chapters || [];

        for (const ch of chapters) {
          // Definitions → flashcards
          for (const def of ch.definitions || []) {
            newCards.push({
              user_id: user.id,
              structured_document_id: doc.id,
              front: def.term,
              back: def.definition,
              subject: doc.subject || "",
              card_type: "definition",
            });
          }
          // Dates → flashcards
          for (const d of ch.dates || []) {
            newCards.push({
              user_id: user.id,
              structured_document_id: doc.id,
              front: d.date,
              back: d.event,
              subject: doc.subject || "",
              card_type: "date",
            });
          }
        }
      }

      if (newCards.length === 0) {
        toast({ title: "Aucune donnée", description: "Les fiches ne contiennent pas de définitions ou dates." });
        setGenerating(false);
        return;
      }

      // Remove existing cards for this user to avoid duplicates, then insert
      const { error } = await supabase.from("flashcards").upsert(newCards, {
        onConflict: "user_id,structured_document_id,front",
        ignoreDuplicates: true,
      } as any);

      // Fallback: just insert and ignore errors
      if (error) {
        await supabase.from("flashcards").insert(newCards);
      }

      toast({ title: `${newCards.length} flashcards générées !` });
      await loadCards();
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de générer les flashcards", variant: "destructive" });
    }
    setGenerating(false);
  };

  const reviewCard = async (quality: number) => {
    const card = cards[currentIndex];
    if (!card) return;

    // SM-2 algorithm
    let { ease_factor, interval_days, repetitions } = card;
    if (quality >= 3) {
      repetitions += 1;
      if (repetitions === 1) interval_days = 1;
      else if (repetitions === 2) interval_days = 6;
      else interval_days = Math.round(interval_days * ease_factor);
      ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    } else {
      repetitions = 0;
      interval_days = 1;
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval_days);

    await supabase
      .from("flashcards")
      .update({
        ease_factor,
        interval_days,
        repetitions,
        next_review: nextReview.toISOString(),
      })
      .eq("id", card.id);

    setFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await loadCards();
    }
  };

  const currentCard = cards[currentIndex];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
            <Flame className="w-8 h-8 text-primary" />
            Flashcards
          </h1>
          <Button
            variant="outline"
            onClick={generateFromStructuredDocs}
            disabled={generating}
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {generating ? "Génération..." : "Générer depuis les fiches"}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !currentCard ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Flame className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {cards.length === 0
                  ? "Aucune flashcard à réviser. Clique sur 'Générer depuis les fiches' pour commencer !"
                  : "Toutes les cartes ont été révisées ! Reviens plus tard."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-sm text-muted-foreground text-center">
              Carte {currentIndex + 1} / {cards.length}
              {currentCard.subject && (
                <Badge variant="secondary" className="ml-2">{currentCard.subject}</Badge>
              )}
              <Badge variant="outline" className="ml-1">
                {currentCard.card_type === "date" ? "Date" : "Définition"}
              </Badge>
            </div>

            <Card
              className="glass-card cursor-pointer min-h-[250px] flex items-center justify-center transition-all"
              onClick={() => setFlipped(!flipped)}
            >
              <CardContent className="p-8 text-center">
                {!flipped ? (
                  <div>
                    <p className="text-xl font-heading font-bold">{currentCard.front}</p>
                    <p className="text-xs text-muted-foreground mt-4">Clique pour retourner</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg">{currentCard.back}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {flipped && (
              <div className="flex justify-center gap-3">
                <Button variant="destructive" onClick={() => reviewCard(1)}>
                  <X className="w-4 h-4 mr-1" /> Pas su
                </Button>
                <Button variant="outline" onClick={() => reviewCard(3)}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Difficile
                </Button>
                <Button variant="default" onClick={() => reviewCard(4)}>
                  <Check className="w-4 h-4 mr-1" /> Bien
                </Button>
                <Button variant="gradient" onClick={() => reviewCard(5)}>
                  <Sparkles className="w-4 h-4 mr-1" /> Facile
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Flashcards;
