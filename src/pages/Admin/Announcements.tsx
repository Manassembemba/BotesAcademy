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
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 italic">
          <Megaphone className="w-10 h-10 text-primary" />
          ANNONCES & BROADCAST
        </h1>
        <p className="text-muted-foreground font-medium">Envoyez des messages ciblés à vos étudiants.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire de création */}
        <Card className="lg:col-span-1 shadow-xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-xl font-black uppercase italic">Nouvelle Annonce</CardTitle>
            <CardDescription>Ciblez un cours ou une vacation spécifique.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest">Titre</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Ex: Changement d'horaire"
                className="rounded-xl border-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest">Cours Cible</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="rounded-xl border-primary/20">
                  <SelectValue placeholder="Tous les cours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les cours (Global)</SelectItem>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCourse !== "all" && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest">Vacation Cible</label>
                <Select value={selectedVacation} onValueChange={setSelectedVacation}>
                  <SelectTrigger className="rounded-xl border-primary/20">
                    <SelectValue placeholder="Toutes les vacations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les vacations</SelectItem>
                    {vacations?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest">Message</label>
              <Textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Votre message ici..."
                className="rounded-xl border-primary/20 focus:border-primary min-h-[150px]"
              />
            </div>

            <Button 
              className="w-full rounded-xl font-black uppercase tracking-widest gap-2 py-6"
              onClick={() => createMutation.mutate()}
              disabled={!title || !message || createMutation.isPending}
            >
              <Send className="w-4 h-4" />
              Diffuser l'annonce
            </Button>
          </CardContent>
        </Card>

        {/* Historique des annonces */}
        <Card className="lg:col-span-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-black uppercase italic">Historique des Diffusions</CardTitle>
            <CardDescription>Consultez vos anciennes annonces.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <p>Chargement...</p>
              ) : announcements?.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground italic">
                  Aucune annonce diffusée pour le moment.
                </div>
              ) : (
                announcements?.map((ann) => (
                  <div key={ann.id} className="p-4 rounded-2xl border border-border/50 bg-muted/20 hover:bg-primary/5 transition-colors relative group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-lg uppercase tracking-tighter">{ann.title}</h3>
                        <div className="flex flex-wrap gap-2 items-center text-[10px] font-bold text-muted-foreground uppercase">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Par {ann.sender?.full_name}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(ann.created_at), 'dd MMMM yyyy HH:mm', { locale: fr })}</span>
                          {ann.course && <span className="flex items-center gap-1 text-primary"><BookOpen className="w-3 h-3" /> {ann.course.title}</span>}
                          {ann.vacation_name && <span className="px-2 py-0.5 bg-primary/20 rounded text-primary">{ann.vacation_name}</span>}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteMutation.mutate(ann.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm font-medium text-foreground/80 whitespace-pre-wrap">{ann.message}</p>
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
