import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const SUBJECTS = ["Mathématiques", "Français", "Histoire-Géographie", "Physique-Chimie", "SVT", "Technologie"];

export function GoalManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [skill, setSkill] = useState("");
  const [weeklyTarget, setWeeklyTarget] = useState(60);

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addGoal = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("goals").insert({
        user_id: user!.id,
        subject,
        skill,
        weekly_target_minutes: weeklyTarget,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Objectif ajouté");
      setDialogOpen(false);
      setSubject("");
      setSkill("");
      setWeeklyTarget(60);
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Objectif supprimé");
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-5 h-5 text-primary" />
            Objectifs d'apprentissage
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouvel objectif</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Matière</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger><SelectValue placeholder="Choisis" /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Compétence (optionnel)</Label>
                  <Input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Ex: Géométrie, Conjugaison..." />
                </div>
                <div className="space-y-2">
                  <Label>Objectif hebdomadaire (minutes)</Label>
                  <Input type="number" value={weeklyTarget} onChange={(e) => setWeeklyTarget(Number(e.target.value))} min={10} max={600} />
                </div>
                <Button onClick={() => addGoal.mutate()} disabled={!subject || addGoal.isPending} className="w-full">
                  Créer l'objectif
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Chargement...</p>
        ) : !goals || goals.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Aucun objectif défini. Ajoute-en un !</p>
        ) : (
          <div className="space-y-3">
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.current_progress / g.weekly_target_minutes) * 100));
              return (
                <div key={g.id} className="p-3 rounded-lg bg-muted/30 border border-border group">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{g.subject}</p>
                      {g.skill && <p className="text-xs text-muted-foreground">{g.skill}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={() => deleteGoal.mutate(g.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={pct} className="flex-1 h-2" />
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {g.current_progress}/{g.weekly_target_minutes} min
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
