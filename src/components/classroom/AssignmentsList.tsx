import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, X, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AssignmentsListProps {
  classId: string;
  isTeacher: boolean;
}

export function AssignmentsList({ classId, isTeacher }: AssignmentsListProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxPoints, setMaxPoints] = useState("100");
  const [posting, setPosting] = useState(false);

  const { data: assignments = [] } = useQuery({
    queryKey: ["class-assignments", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data } = await supabase
        .from("class_assignments")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: mySubmissions = [] } = useQuery({
    queryKey: ["my-submissions", classId],
    enabled: !!classId && !isTeacher && !!user,
    queryFn: async () => {
      const assignmentIds = assignments.map((a: any) => a.id);
      if (assignmentIds.length === 0) return [];
      const { data } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("student_id", user!.id)
        .in("assignment_id", assignmentIds);
      return data || [];
    },
  });

  const handleCreate = async () => {
    if (!title.trim() || !user) return;
    setPosting(true);
    const { error } = await supabase.from("class_assignments").insert({
      class_id: classId,
      teacher_id: user.id,
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      max_points: parseInt(maxPoints) || 100,
    });
    if (error) toast.error("Erreur");
    else {
      toast.success("Devoir créé !");
      setTitle(""); setDescription(""); setDueDate(""); setMaxPoints("100");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["class-assignments", classId] });
    }
    setPosting(false);
  };

  const handleSubmit = async (assignmentId: string) => {
    if (!user) return;
    const { error } = await supabase.from("assignment_submissions").insert({
      assignment_id: assignmentId,
      student_id: user.id,
      content: "Rendu",
    });
    if (error) toast.error("Erreur lors du rendu");
    else {
      toast.success("Devoir rendu !");
      queryClient.invalidateQueries({ queryKey: ["my-submissions", classId] });
    }
  };

  const getStatus = (assignment: any) => {
    const sub = mySubmissions.find((s: any) => s.assignment_id === assignment.id);
    if (sub?.grade != null) return "graded";
    if (sub) return "submitted";
    if (assignment.due_date && new Date(assignment.due_date) < new Date()) return "late";
    return "pending";
  };

  return (
    <div className="space-y-4">
      {isTeacher && (
        <>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Créer un devoir
            </Button>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="font-heading font-semibold text-sm">Nouveau devoir</p>
                  <Button size="icon" variant="ghost" onClick={() => setShowForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Input placeholder="Titre du devoir" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder="Instructions..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Date limite</label>
                    <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Points max</label>
                    <Input type="number" value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={posting || !title.trim()}>
                  <ClipboardList className="w-4 h-4 mr-2" /> Créer
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {assignments.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-6">Aucun devoir pour le moment</p>
      )}

      {assignments.map((a: any) => {
        const status = !isTeacher ? getStatus(a) : null;
        const isPastDue = a.due_date && new Date(a.due_date) < new Date();
        return (
          <Card key={a.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ClipboardList className="w-4 h-4 text-primary shrink-0" />
                    <p className="font-heading font-semibold text-sm">{a.title}</p>
                    <Badge variant={isPastDue ? "destructive" : "secondary"} className="text-[10px]">
                      {a.max_points} pts
                    </Badge>
                  </div>
                  {a.description && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.description}</p>
                  )}
                  {a.due_date && (
                    <p className={`text-xs mt-2 flex items-center gap-1 ${isPastDue ? "text-destructive" : "text-muted-foreground"}`}>
                      <Clock className="w-3 h-3" />
                      {isPastDue ? "Expiré" : "À rendre avant"} le {new Date(a.due_date).toLocaleDateString("fr-FR")} à {new Date(a.due_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
                {!isTeacher && (
                  <div className="shrink-0">
                    {status === "submitted" && (
                      <Badge className="bg-green-500/10 text-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Rendu
                      </Badge>
                    )}
                    {status === "graded" && (
                      <Badge className="bg-primary/10 text-primary">
                        Note : {mySubmissions.find((s: any) => s.assignment_id === a.id)?.grade}/{a.max_points}
                      </Badge>
                    )}
                    {status === "pending" && (
                      <Button size="sm" onClick={() => handleSubmit(a.id)}>Rendre</Button>
                    )}
                    {status === "late" && (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" /> En retard
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
