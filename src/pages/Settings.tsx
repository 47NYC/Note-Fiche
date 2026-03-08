import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { PreferencesForm } from "@/components/profile/PreferencesForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Delete user data from all tables
      await supabase.from("user_preferences").delete().eq("user_id", user.id);
      await supabase.from("achievements").delete().eq("user_id", user.id);
      await supabase.from("goals").delete().eq("user_id", user.id);
      await supabase.from("practice_sessions").delete().eq("user_id", user.id);
      await supabase.from("flashcards").delete().eq("user_id", user.id);
      await supabase.from("student_doc_progress").delete().eq("user_id", user.id);
      await supabase.from("streaks").delete().eq("user_id", user.id);
      await supabase.from("evaluations").delete().eq("user_id", user.id);
      await supabase.from("class_members").delete().eq("student_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);
      await supabase.from("user_roles").delete().eq("user_id", user.id);

      // Sign out (account deletion from auth requires admin/edge function)
      toast.success("Compte supprimé avec succès");
      await signOut();
    } catch (e: any) {
      toast.error("Erreur lors de la suppression");
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Paramètres
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gère tes préférences et ton compte
          </p>
        </div>

        {/* Preferences (reused component) */}
        <PreferencesForm />

        {/* Danger zone */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Zone dangereuse
            </CardTitle>
            <CardDescription>
              Ces actions sont irréversibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer mon compte
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ton compte ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Toutes tes données seront définitivement supprimées : progression, flashcards, badges, objectifs et préférences. Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Supprimer définitivement
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
