import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Plus, Trash2, Edit2, BookOpen, Clock } from "lucide-react";
import { format, isSameDay, parseISO, isAfter, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useEvaluations, type Evaluation } from "@/hooks/useEvaluations";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const SUBJECTS = [
  { value: "Mathématiques", color: "bg-blue-500" },
  { value: "Français", color: "bg-rose-500" },
  { value: "Histoire-Géographie", color: "bg-amber-500" },
  { value: "Physique-Chimie", color: "bg-emerald-500" },
  { value: "SVT", color: "bg-green-500" },
  { value: "Technologie", color: "bg-purple-500" },
  { value: "Anglais", color: "bg-cyan-500" },
  { value: "Autre", color: "bg-gray-500" },
];

const getSubjectColor = (subject: string) =>
  SUBJECTS.find((s) => s.value === subject)?.color || "bg-primary";

const CalendrierPage = () => {
  const { data: evaluations, isLoading, addEvaluation, updateEvaluation, deleteEvaluation } = useEvaluations();
  const { user, role } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEval, setEditingEval] = useState<Evaluation | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [shareWithClass, setShareWithClass] = useState(false);

  // Fetch teacher's class_id
  useEffect(() => {
    if (role !== "teacher" || !user) return;
    supabase.from("classes").select("id").eq("teacher_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setClassId(data.id); });
  }, [role, user]);

  // Form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [evalDate, setEvalDate] = useState<Date>(new Date());

  const resetForm = () => {
    setTitle("");
    setSubject("");
    setDescription("");
    setEvalDate(new Date());
    setEditingEval(null);
    setShareWithClass(false);
  };

  const openCreate = (date?: Date) => {
    resetForm();
    if (date) setEvalDate(date);
    setDialogOpen(true);
  };

  const openEdit = (ev: Evaluation) => {
    setEditingEval(ev);
    setTitle(ev.title);
    setSubject(ev.subject);
    setDescription(ev.description || "");
    setEvalDate(parseISO(ev.eval_date));
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !subject) {
      toast.error("Remplis le titre et la matière");
      return;
    }
    try {
      if (editingEval) {
        await updateEvaluation.mutateAsync({
          id: editingEval.id,
          title,
          subject,
          description,
          eval_date: format(evalDate, "yyyy-MM-dd"),
        });
        toast.success("Évaluation modifiée");
      } else {
        await addEvaluation.mutateAsync({
          title,
          subject,
          description,
          eval_date: format(evalDate, "yyyy-MM-dd"),
          color: "primary",
          ...(shareWithClass && classId ? { class_id: classId } : {}),
        } as any);

        toast.success("Évaluation ajoutée");
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvaluation.mutateAsync(id);
      toast.success("Évaluation supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  // Days that have evaluations
  const evalDates = evaluations?.map((e) => parseISO(e.eval_date)) ?? [];

  // Evaluations for selected date
  const selectedEvals = evaluations?.filter((e) => isSameDay(parseISO(e.eval_date), selectedDate)) ?? [];

  // Upcoming evaluations
  const today = startOfDay(new Date());
  const upcoming = evaluations
    ?.filter((e) => isAfter(parseISO(e.eval_date), today) || isSameDay(parseISO(e.eval_date), today))
    .slice(0, 5) ?? [];

  // Past evaluations
  const past = evaluations?.filter((e) => isBefore(parseISO(e.eval_date), today)).reverse().slice(0, 5) ?? [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Calendrier</h1>
            <p className="text-muted-foreground text-sm">Planifie et suis tes évaluations</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => openCreate()}>
                <Plus className="w-4 h-4 mr-2" /> Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEval ? "Modifier l'évaluation" : "Nouvelle évaluation"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Contrôle chapitre 5" />
                </div>
                <div className="space-y-2">
                  <Label>Matière</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger><SelectValue placeholder="Choisis une matière" /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <span className="flex items-center gap-2">
                            <span className={cn("w-2.5 h-2.5 rounded-full", s.color)} />
                            {s.value}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !evalDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {evalDate ? format(evalDate, "PPP", { locale: fr }) : "Choisir une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={evalDate}
                        onSelect={(d) => d && setEvalDate(d)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Description (optionnel)</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes, chapitres à réviser..." rows={3} />
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={addEvaluation.isPending || updateEvaluation.isPending}>
                  {editingEval ? "Enregistrer" : "Ajouter l'évaluation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Calendar */}
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  locale={fr}
                  className="pointer-events-auto w-full"
                  modifiers={{ hasEval: evalDates }}
                  modifiersClassNames={{ hasEval: "bg-primary/15 font-bold text-primary" }}
                  classNames={{
                    months: "w-full",
                    month: "w-full",
                    table: "w-full",
                    head_row: "w-full",
                    row: "w-full",
                    cell: "text-center p-1 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md mx-auto",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground font-bold",
                  }}
                />
              )}

              {/* Events for selected date */}
              <div className="mt-4 border-t pt-4">
                <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
                </h3>
                {selectedEvals.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucune évaluation ce jour</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEvals.map((ev) => (
                      <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 group">
                        <span className={cn("w-3 h-3 rounded-full mt-1 shrink-0", getSubjectColor(ev.subject))} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{ev.title}</p>
                          <p className="text-xs text-muted-foreground">{ev.subject}</p>
                          {ev.description && <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(ev)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(ev.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedEvals.length === 0 && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => openCreate(selectedDate)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter une évaluation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Side panel */}
          <div className="space-y-6">
            {/* Upcoming */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-4 h-4 text-primary" />
                  À venir
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcoming.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucune évaluation à venir</p>
                ) : (
                  upcoming.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedDate(parseISO(ev.eval_date))}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", getSubjectColor(ev.subject))} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(ev.eval_date), "d MMM", { locale: fr })}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{ev.subject}</Badge>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Résumé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-heading font-bold text-primary">{upcoming.length}</p>
                    <p className="text-xs text-muted-foreground">À venir</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-heading font-bold text-foreground">{past.length}</p>
                    <p className="text-xs text-muted-foreground">Passées</p>
                  </div>
                  <div className="col-span-2 text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-heading font-bold text-foreground">{evaluations?.length ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>

                {/* Subject breakdown */}
                {evaluations && evaluations.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Par matière</p>
                    {SUBJECTS.filter((s) => evaluations.some((e) => e.subject === s.value)).map((s) => {
                      const count = evaluations.filter((e) => e.subject === s.value).length;
                      return (
                        <div key={s.value} className="flex items-center gap-2">
                          <span className={cn("w-2.5 h-2.5 rounded-full", s.color)} />
                          <span className="text-sm flex-1">{s.value}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendrierPage;
