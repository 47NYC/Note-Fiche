import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Brain, Zap, Smile, Shield, CheckCircle2, Sparkles, Copy } from "lucide-react";
import { useProAccess } from "@/hooks/useProAccess";
import { ProBadge } from "@/components/ProGate";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: Brain,
    title: "Tuteur IA avancé",
    description: "Réponses ultra-détaillées, explications approfondies et méthodologie complète avec un modèle IA plus puissant.",
    free: "10 questions/jour, réponses concises",
    pro: "Illimité, réponses expertes détaillées",
  },
  {
    icon: Zap,
    title: "Exercices illimités",
    description: "Génère autant de QCM que tu veux pour t'entraîner sans limite.",
    free: "10 quiz/jour",
    pro: "Illimité",
  },
  {
    icon: Smile,
    title: "Emoji de profil",
    description: "Personnalise ton avatar dans le classement avec un emoji unique.",
    free: "Avatar par défaut",
    pro: "Emoji personnalisé",
  },
  {
    icon: Shield,
    title: "Accès prioritaire",
    description: "Bénéficie en premier des nouvelles fonctionnalités et mises à jour.",
    free: "Accès standard",
    pro: "Accès anticipé",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const heroVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const Pro = () => {
  const { isPro, expiresAt, referralLink, referralsCount, activate } = useProAccess();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleActivate = async () => {
    setSubmitting(true);
    const ok = await activate(code.trim());
    setSubmitting(false);
    if (ok) {
      toast.success("Pro activé ! Bienvenue dans l'élite 🎉");
      setTimeout(() => window.location.reload(), 500);
    } else {
      toast.error("Code invalide");
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        className="max-w-3xl mx-auto space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Hero */}
        <motion.div className="text-center space-y-4" variants={heroVariants}>
          <motion.div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/25"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Crown className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="font-heading text-3xl font-bold">
            Passe en <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Pro</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Débloque tout le potentiel de NoteFiche : IA avancée, exercices illimités et fonctionnalités exclusives pour réussir ton Brevet.
          </p>
          {isPro && (
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Tu es déjà Pro ! <ProBadge />
            </motion.div>
          )}
        </motion.div>

        {/* Feature comparison */}
        <motion.div className="grid gap-4" variants={containerVariants}>
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={itemVariants}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex-1 p-5 space-y-2">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
                          whileHover={{ scale: 1.1 }}
                        >
                          <f.icon className="w-5 h-5 text-primary" />
                        </motion.div>
                        <div>
                          <h3 className="font-heading font-semibold">{f.title}</h3>
                          <p className="text-sm text-muted-foreground">{f.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col border-t sm:border-t-0 sm:border-l border-border">
                      <div className="flex-1 px-4 py-3 text-xs text-muted-foreground bg-muted/30">
                        <span className="font-medium text-foreground block mb-0.5">Gratuit</span>
                        {f.free}
                      </div>
                      <div className="flex-1 px-4 py-3 text-xs bg-amber-500/5 border-t sm:border-t border-amber-500/10">
                        <span className="font-medium text-amber-600 dark:text-amber-400 block mb-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Pro
                        </span>
                        <span className="text-foreground">{f.pro}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Parrainage (+7 jours par inscription) */}
        {user && referralLink && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <h2 className="font-heading text-xl font-bold">Parrainage</h2>
                  <p className="text-sm text-muted-foreground">
                    Partage ce lien : chaque inscription via ton lien ajoute{" "}
                    <span className="font-medium text-foreground">7 jours</span> d'essai Pro.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Input readOnly value={referralLink} className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(referralLink);
                        toast.success("Lien copié");
                      } catch {
                        toast.error("Impossible de copier le lien");
                      }
                    }}
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copier
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{referralsCount}</span> parrainage(s) validé(s)
                  {expiresAt && new Date(expiresAt) > new Date() ? (
                    <>
                      {" "}• essai actif jusqu'au{" "}
                      <span className="font-medium text-foreground">{new Date(expiresAt).toLocaleDateString()}</span>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Activation */}
        {!isPro && (
          <motion.div variants={itemVariants}>
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
              <CardContent className="p-6 text-center space-y-4">
                <h2 className="font-heading text-xl font-bold flex items-center justify-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Activer le mode Pro
                </h2>
                <p className="text-sm text-muted-foreground">
                  Entre ton code d'accès pour débloquer toutes les fonctionnalités Pro.
                </p>
                <div className="flex gap-2 max-w-md mx-auto">
                  <Input
                    placeholder="Code d'accès"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                    className="text-center"
                  />
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleActivate}
                      disabled={submitting || !code.trim()}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shrink-0"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Activer
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default Pro;
