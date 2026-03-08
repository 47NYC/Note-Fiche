import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export function PreferencesForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["user_preferences", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [notifications, setNotifications] = useState(true);
  const [difficulty, setDifficulty] = useState("moyen");
  const [startHour, setStartHour] = useState(17);
  const [endHour, setEndHour] = useState(20);

  useEffect(() => {
    if (prefs) {
      setNotifications(prefs.notifications_enabled);
      setDifficulty(prefs.difficulty);
      setStartHour(prefs.study_start_hour);
      setEndHour(prefs.study_end_hour);
    }
  }, [prefs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        notifications_enabled: notifications,
        difficulty,
        study_start_hour: startHour,
        study_end_hour: endHour,
        updated_at: new Date().toISOString(),
      };
      if (prefs) {
        const { error } = await supabase.from("user_preferences").update(payload).eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_preferences").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_preferences"] });
      toast.success("Préférences sauvegardées");
    },
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="w-5 h-5 text-primary" />
          Préférences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Label>Notifications</Label>
            <p className="text-xs text-muted-foreground">Rappels d'étude et résultats</p>
          </div>
          <Switch checked={notifications} onCheckedChange={setNotifications} />
        </div>

        <div className="space-y-2">
          <Label>Difficulté par défaut</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="facile">Facile</SelectItem>
              <SelectItem value="moyen">Moyen</SelectItem>
              <SelectItem value="difficile">Difficile</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Début d'étude</Label>
            <Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {hours.map((h) => <SelectItem key={h} value={String(h)}>{String(h).padStart(2, "0")}:00</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fin d'étude</Label>
            <Select value={String(endHour)} onValueChange={(v) => setEndHour(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {hours.map((h) => <SelectItem key={h} value={String(h)}>{String(h).padStart(2, "0")}:00</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
          <Save className="w-4 h-4 mr-2" /> Sauvegarder
        </Button>
      </CardContent>
    </Card>
  );
}
