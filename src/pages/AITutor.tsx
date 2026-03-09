import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, BarChart3, Sparkles } from "lucide-react";
import { ChatTab } from "@/components/ai-tutor/ChatTab";
import { WeakPointsTab } from "@/components/ai-tutor/WeakPointsTab";
import { ExerciseGeneratorTab } from "@/components/ai-tutor/ExerciseGeneratorTab";

const AITutor = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-4">
          <h1 className="font-heading text-2xl font-bold">Tuteur IA</h1>
          <p className="text-muted-foreground text-sm">Ton assistant intelligent pour réviser le Brevet</p>
        </div>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Chat
            </TabsTrigger>
            <TabsTrigger value="weak-points" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Points faibles
            </TabsTrigger>
            <TabsTrigger value="exercises" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Exercices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat"><ChatTab /></TabsContent>
          <TabsContent value="weak-points"><WeakPointsTab /></TabsContent>
          <TabsContent value="exercises"><ExerciseGeneratorTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AITutor;
