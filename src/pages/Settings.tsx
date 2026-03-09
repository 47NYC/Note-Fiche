import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { PreferencesForm } from "@/components/profile/PreferencesForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Settings, Trash2, AlertTriangle, Save, Camera, User, Sun, Moon, Monitor, Crown, Copy, Link } from "lucide-react";
import { useProAccess } from "@/hooks/useProAccess";
import { ProBadge } from "@/components/ProGate";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const { isPro, activate, referralLink, referralsCount, expiresAt } = useProAccess();
  const [proCode, setProCode] = useState("");
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
    }
  }, [profile]);

  const avatarUrl = profile?.avatar_url
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
    : null;

  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const saveNameMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Nom mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Sélectionne une image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: filePath, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Avatar mis à jour");
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
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
      toast.success("Compte supprimé avec succès");
      await signOut();
    } catch {
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
            Gère ton profil, tes préférences et ton compte
          </p>
        </div>

        {/* Profile editing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-5 h-5 text-primary" />
              Mon profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Nom complet</Label>
                <div className="flex gap-2">
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ton nom"
                  />
                  <Button
                    onClick={() => saveNameMutation.mutate()}
                    disabled={saveNameMutation.isPending || fullName === profile?.full_name}
                    size="icon"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sun className="w-5 h-5 text-primary" />
              Apparence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: "light", label: "Clair", icon: Sun },
                { value: "dark", label: "Sombre", icon: Moon },
                { value: "system", label: "Système", icon: Monitor },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <opt.icon className={`w-5 h-5 ${theme === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pro Access */}
        <Card className={isPro ? "border-amber-500/30" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="w-5 h-5 text-amber-500" />
              Accès Pro
              {isPro && <ProBadge />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPro ? (
              <p className="text-sm text-muted-foreground">✅ Ton compte Pro est activé. Tu as accès à toutes les fonctionnalités.</p>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Code d'accès Pro"
                  value={proCode}
                  onChange={e => setProCode(e.target.value)}
                  onKeyDown={async e => {
                    if (e.key === "Enter") {
                      const ok = await activate(proCode.trim());
                      if (ok) { toast.success("Pro activé !"); window.location.reload(); }
                      else toast.error("Code invalide");
                    }
                  }}
                />
                <Button onClick={async () => {
                  const ok = await activate(proCode.trim());
                  if (ok) { toast.success("Pro activé !"); window.location.reload(); }
                  else toast.error("Code invalide");
                }}>Activer</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral / Parrainage */}
        {user && referralLink && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link className="w-5 h-5 text-primary" />
                Parrainage
              </CardTitle>
              <CardDescription>
                Partage ton lien : chaque inscription via ton lien = <span className="font-medium text-foreground">+7 jours</span> d'essai Pro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input readOnly value={referralLink} className="font-mono text-xs" />
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(referralLink);
                      toast.success("Lien copié !");
                    } catch {
                      toast.error("Impossible de copier");
                    }
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{referralsCount}</span> parrainage(s) validé(s)
                {expiresAt && new Date(expiresAt) > new Date() && (
                  <> • essai actif jusqu'au <span className="font-medium text-foreground">{new Date(expiresAt).toLocaleDateString()}</span></>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Preferences */}
        <PreferencesForm />

        {/* Danger zone */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Zone dangereuse
            </CardTitle>
            <CardDescription>Ces actions sont irréversibles</CardDescription>
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
