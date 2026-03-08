import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";

const Flashcards = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
          <Flame className="w-8 h-8 text-primary" />
          Flashcards
        </h1>
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Flame className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Les flashcards arrivent bientôt ! Révise avec la répétition espacée.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Flashcards;
