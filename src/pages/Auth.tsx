import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher">("student");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName, selectedRole);
      }
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Flame className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-gradient-primary">BrevetIA</h1>
          </div>
          <p className="text-muted-foreground">Prépare ton brevet avec l'IA</p>
        </div>

        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="font-heading">
              {isLogin ? "Connexion" : "Inscription"}
            </CardTitle>
            <CardDescription>
              {isLogin ? "Content de te revoir !" : "Crée ton compte pour commencer"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nom complet</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ton nom complet"
                      required
                    />
                  </div>

                  {/* Role selection */}
                  <div className="space-y-2">
                    <Label>Je suis...</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedRole("student")}
                        className={`p-4 rounded-xl border-2 transition-all text-left space-y-1 ${
                          selectedRole === "student"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <GraduationCap className={`w-6 h-6 ${selectedRole === "student" ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="font-semibold text-sm">Élève</p>
                        <p className="text-xs text-muted-foreground">Je révise mon brevet</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole("teacher")}
                        className={`p-4 rounded-xl border-2 transition-all text-left space-y-1 ${
                          selectedRole === "teacher"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <BookOpen className={`w-6 h-6 ${selectedRole === "teacher" ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="font-semibold text-sm">Enseignant</p>
                        <p className="text-xs text-muted-foreground">J'accompagne mes élèves</p>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "Chargement..." : isLogin ? "Se connecter" : "Créer mon compte"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? "Pas encore de compte ? Inscris-toi" : "Déjà un compte ? Connecte-toi"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
