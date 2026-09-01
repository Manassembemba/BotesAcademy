import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Megaphone, Send, Users, BookOpen, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Announcements = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedVacation, setSelectedVacation] = useState<string>("all");

  const { data: courses } = useQuery({
    queryKey: ["courses-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id, title");
      if (error) throw error;
      return data;
    },
  });

  const { data: vacations } = useQuery({
    queryKey: ["vacations-list-simple", selectedCourse],
    queryFn: async () => {
      if (selectedCourse === "all") return [];
      const { data, error } = await supabase
        .from("course_sessions")
        .select("vacation_name")
        .eq("course_id", selectedCourse)
        .not("vacation_name", "is", null);
      if (error) throw error;
      // Filter unique names
      const uniqueNames = Array.from(new Set(data.map(d => d.vacation_name)));
      return uniqueNames.map(name => ({ id: name, name }));
    },
    enabled: selectedCourse !== "all",
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select(`
          *,
          sender:profiles!sender_id(full_name),
          course:courses(title)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("announcements").insert({
        title,
        message,
        course_id: selectedCourse === "all" ? null : selectedCourse,
        vacation_name: selectedVacation === "all" ? null : selectedVacation,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Annonce envoyée avec succès !");
      setTitle("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
    onError: (error) => {
      toast.error("Erreur lors de l'envoi : " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Annonce supprimée");
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
  });

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-20 max-w-7xl">
      {/* HEADER UNIFIÉ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
            <Megaphone className="w-3 h-3" /> Communication Interne
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Gestion des Annonces & Broadcast
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Diffusez des messages ciblés à l'ensemble de vos étudiants ou par promotion.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de création */}
        <Card className="lg:col-span-1 rounded-2xl border border-border/50 bg-card shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold">Nouvelle Annonce</CardTitle>
            <CardDescription className="text-xs">Ciblez une formation ou une vacation spécifique.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Titre de l'annonce</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Ex: Changement d'horaire..."
                className="h-10 rounded-xl font-medium text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Formation ciblée</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="h-10 rounded-xl font-medium text-sm">
                  <SelectValue placeholder="Tous les cours" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Toutes les formations (Global)</SelectItem>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCourse !== "all" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Vacation ciblée</label>
                <Select value={selectedVacation} onValueChange={setSelectedVacation}>
                  <SelectTrigger className="h-10 rounded-xl font-medium text-sm">
                    <SelectValue placeholder="Toutes les vacations" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Toutes les vacations</SelectItem>
                    {vacations?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Message</label>
              <Textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Rédigez votre annonce ici..."
                className="rounded-xl font-medium text-sm min-h-[140px]"
              />
            </div>

            <Button 
              className="w-full h-10 rounded-xl font-semibold text-xs gap-2 shadow-xs"
              onClick={() => createMutation.mutate()}
              disabled={!title || !message || createMutation.isPending}
            >
              <Send className="w-4 h-4" />
              Diffuser l'annonce
            </Button>
          </CardContent>
        </Card>

        {/* Historique des annonces */}
        <Card className="lg:col-span-2 rounded-2xl border border-border/50 bg-card shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold">Historique des Diffusions</CardTitle>
            <CardDescription className="text-xs">Consultez et gérez les annonces publiées.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground text-xs">Chargement...</div>
              ) : announcements?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs italic">
                  Aucune annonce diffusée pour le moment.
                </div>
              ) : (
                announcements?.map((ann) => (
                  <div key={ann.id} className="p-4 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors relative group">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0 mt-0.5">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground">{ann.title}</h3>
                        <div className="flex flex-wrap gap-2 items-center text-[11px] text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Par {ann.sender?.full_name || 'Admin'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(ann.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}</span>
                          {ann.course && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-primary font-medium"><BookOpen className="w-3 h-3" /> {ann.course.title}</span>
                            </>
                          )}
                          {ann.vacation_name && (
                            <span className="px-1.5 py-0.5 bg-primary/15 rounded text-primary font-medium text-[10px]">{ann.vacation_name}</span>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                        onClick={() => deleteMutation.mutate(ann.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-foreground/80 whitespace-pre-wrap pl-11">{ann.message}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Announcements;
