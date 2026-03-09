import { ReactNode, useState } from "react";
import { useProAccess } from "@/hooks/useProAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ProGateProps {
  children: ReactNode;
  feature: string;
  description?: string;
}

export function ProGate({ children, feature, description }: ProGateProps) {
  const { isPro, loading } = useProAccess();

  if (loading) return null;
  if (isPro) return <>{children}</>;

  return <ProLockedCard feature={feature} description={description} />;
}

export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wide">
      <Crown className="w-3 h-3" /> Pro
    </span>
  );
}

function ProLockedCard({ feature, description }: { feature: string; description?: string }) {
  const { activate } = useProAccess();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleActivate = async () => {
    setSubmitting(true);
    const ok = await activate(code.trim());
    setSubmitting(false);
    if (ok) {
      toast.success("Pro activé ! Rechargez la page pour profiter de toutes les fonctionnalités.");
      window.location.reload();
    } else {
      toast.error("Code invalide. Vérifie ton code d'accès Pro.");
    }
  };

  return (
    <Card className="glass-card border-amber-500/30 max-w-md mx-auto mt-8">
      <CardHeader className="text-center pb-2">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <CardTitle className="font-heading text-lg">
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {feature}
            <ProBadge />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          {description || "Cette fonctionnalité est réservée aux utilisateurs Pro. Entre ton code d'accès pour débloquer."}
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Code d'accès Pro"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleActivate()}
          />
          <Button onClick={handleActivate} disabled={submitting || !code.trim()} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
            Activer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
