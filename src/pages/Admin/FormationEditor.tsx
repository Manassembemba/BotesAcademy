import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Layout, BookOpen, Truck, Settings, Loader2, Trash2, Users, Calendar as CalendarIcon, Clock, Info } from "lucide-react";
import { LessonEditorDialog } from "./LessonEditorDialog";
import { CourseSessionEditorDialog } from "./CourseSessionEditorDialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content?: string;
  video_url?: string;
  pdf_url?: string;
  order_index: number;
  lesson_type: 'video' | 'pdf';
}

const formationSchema = z.object({
  title: z.string().min(3, "Le titre doit faire au moins 3 caractères."),
  description: z.string().optional(),
  category: z.string().optional(),
  language: z.string().optional(),
  estimated_duration: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'expert']),
  status: z.enum(['draft', 'published']),
  is_paid: z.boolean().default(false),
  price: z.coerce.number().min(0).optional(),
  thumbnail_url: z.string().optional(),
  mode: z.enum(['online', 'presentiel', 'hybrid']).default('online'),
  location: z.string().optional().nullable(),
  max_students: z.coerce.number().min(0).optional().nullable(),
  is_special_session: z.boolean().default(false),
  session_start_date: z.string().optional().nullable(),
  session_end_date: z.string().optional().nullable(),
});

type FormationFormValues = z.infer<typeof formationSchema>;

const FormationEditor = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const isEditMode = Boolean(courseId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<FormationFormValues>({
    resolver: zodResolver(formationSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      language: "",
      estimated_duration: "",
      level: 'beginner',
      status: 'draft',
      is_paid: false,
      price: 0,
      mode: 'online',
    },
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // States for vacations and groups
  const [vacationName, setVacationName] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [vacationTime, setVacationTime] = useState("08:00 - 12:00");
  const [groupSessionId, setGroupSessionId] = useState("");

  // Sync vacationTime when start or end changes
  useEffect(() => {
    setVacationTime(`${startTime} - ${endTime}`);
  }, [startTime, endTime]);
  const [groupVacationId, setGroupVacationId] = useState("");

  // Fetch dynamic categories
  const { data: dbCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['courseCategories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('course_categories').insert({ name });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Catégorie ajoutée !");
      setNewCategoryName("");
      queryClient.invalidateQueries({ queryKey: ['courseCategories'] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('course_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Catégorie supprimée.");
      queryClient.invalidateQueries({ queryKey: ['courseCategories'] });
    },
    onError: (err: any) => toast.error("Impossible de supprimer une catégorie utilisée.")
  });

  const { data: courseData, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: isEditMode,
  });

  const { data: vacations } = useQuery({
    queryKey: ['courseVacations', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data } = await supabase.from('course_vacations' as any).select('*').eq('course_id', courseId);
      return data || [];
    },
    enabled: isEditMode,
  });

  const { data: groups } = useQuery({
    queryKey: ['courseGroups', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('course_groups')
        .select('*, course_sessions(session_name), course_vacations(name)')
        .eq('course_id', courseId);
      if (error) throw error;
      return data || [];
    },
    enabled: isEditMode,
  });

  const { data: sessions } = useQuery({
    queryKey: ['courseSessions', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase.from('course_sessions').select('*').eq('course_id', courseId).order('start_date');
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: isEditMode,
  });

  const { data: lessons, isLoading: isLoadingLessons } = useQuery<Lesson[]>({
    queryKey: ['lessons', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index');
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (courseData) {
      form.reset(courseData);
    }
  }, [courseData, form]);

  const addGroupMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !groupSessionId || !groupVacationId) return;
      const { error } = await supabase.from('course_groups').insert({
        course_id: courseId,
        session_id: groupSessionId,
        vacation_id: groupVacationId,
        name: "Temporary Name"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Groupe créé avec succès !");
      queryClient.invalidateQueries({ queryKey: ['courseGroups', courseId] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const addVacationMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !vacationName) return;
      const { error } = await supabase.from('course_vacations' as any).insert({
        course_id: courseId,
        name: vacationName,
        time_range: vacationTime
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vacation ajoutée !");
      queryClient.invalidateQueries({ queryKey: ['courseVacations', courseId] });
      setVacationName("");
      setVacationTime("");
    },
    onError: (err: any) => toast.error(err.message)
  });

  const deleteVacationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('course_vacations' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vacation supprimée.");
      queryClient.invalidateQueries({ queryKey: ['courseVacations', courseId] });
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormationFormValues) => {
      if (!user) throw new Error("Utilisateur non authentifié.");

      let finalThumbnailUrl = courseData?.thumbnail_url || null;

      if (thumbnailFile) {
        const filePath = `${user.id}_${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from('course-thumbnails')
          .upload(filePath, thumbnailFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('course-thumbnails')
          .getPublicUrl(filePath);
        finalThumbnailUrl = urlData.publicUrl;
      }

      const dataToSave = { ...data, thumbnail_url: finalThumbnailUrl, admin_id: user.id };

      if (isEditMode) {
        const { error } = await supabase.from('courses').update(dataToSave).eq('id', courseId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('courses').insert([dataToSave]);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success(`Formation ${isEditMode ? 'mise à jour' : 'créée'} avec succès !`);
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      navigate("/admin/dashboard");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const onSubmit = (data: FormationFormValues) => {
    const cleanedData = {
      ...data,
      price: data.is_paid ? (data.price || 0) : 0,
      max_students: data.max_students || null,
      session_start_date: data.session_start_date || null,
      session_end_date: data.session_end_date || null,
      location: data.location || null,
    };
    mutate(cleanedData);
  };

  const onInvalid = (errors: any) => {
    console.error("Validation Errors:", errors);
    toast.error("Veuillez vérifier les champs du formulaire.");
  };

  const handleAddNewLesson = () => { setSelectedLesson(null); setIsLessonDialogOpen(true); };
  const handleEditLesson = (lesson: any) => { setSelectedLesson(lesson); setIsLessonDialogOpen(true); };
  const handleAddNewSession = () => { setSelectedSession(null); setIsSessionDialogOpen(true); };
  const handleEditSession = (session: any) => { setSelectedSession(session); setIsSessionDialogOpen(true); };

  if (isLoadingCourse) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-primary">
            Éditeur de <span className="text-foreground">Formation</span>
          </h1>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Gestion du contenu et de la logistique</p>
        </div>
        {isEditMode && (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-4 py-1.5 rounded-full uppercase tracking-widest text-[10px]">
            ID: {courseId?.slice(0,8)}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-2xl border border-border/50 mb-8 w-full justify-start overflow-x-auto">
          <TabsTrigger value="general" className="rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest data-[state=active]:shadow-lg gap-2">
            <Layout className="w-3.5 h-3.5" /> Général & Vente
          </TabsTrigger>
          <TabsTrigger value="content" className="rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest data-[state=active]:shadow-lg gap-2" disabled={!isEditMode}>
            <BookOpen className="w-3.5 h-3.5" /> Programme
          </TabsTrigger>
          <TabsTrigger value="logistics" className="rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest data-[state=active]:shadow-lg gap-2" disabled={!isEditMode}>
            <Truck className="w-3.5 h-3.5" /> Logistique & Groupes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="rounded-[2.5rem] border-primary/10 shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="uppercase tracking-tighter font-black italic text-lg">1. Configuration de base</CardTitle>
              <CardDescription>Informations visibles sur le catalogue public.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                  <div className="grid lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <FormField 
                        control={form.control} 
                        name="title" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-black uppercase text-[10px] tracking-widest">Titre de la formation</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} className="rounded-xl h-12 border-primary/10 font-bold" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                      <FormField 
                        control={form.control} 
                        name="description" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-black uppercase text-[10px] tracking-widest">Description détaillée</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ''} className="min-h-[150px] rounded-2xl border-primary/10 font-medium" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField 
                          control={form.control} 
                          name="category" 
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel className="font-black uppercase text-[10px] tracking-widest">Pôle / Catégorie</FormLabel>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-[9px] uppercase font-bold text-primary hover:bg-primary/10 rounded-full px-2"
                                  onClick={() => setIsCategoryDialogOpen(true)}
                                >
                                  Gérer les pôles
                                </Button>
                              </div>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl h-12 border-primary/10 font-bold">
                                    <SelectValue placeholder={isLoadingCategories ? "Chargement..." : "Choisir un pôle"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {dbCategories?.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />
                        <FormField 
                          control={form.control} 
                          name="level" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-black uppercase text-[10px] tracking-widest">Niveau Requis</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl h-12 border-primary/10 font-bold">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="beginner">Débutant</SelectItem>
                                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                                  <SelectItem value="expert">Expert</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="p-6 bg-muted/20 rounded-3xl border border-dashed border-primary/20 text-center">
                        <FormLabel className="font-black uppercase text-[10px] tracking-widest mb-4 block">Visuel de Couverture</FormLabel>
                        {courseData?.thumbnail_url && !thumbnailFile && (
                          <div className="mb-4 aspect-video rounded-2xl overflow-hidden shadow-lg border-2 border-primary/10">
                            <img src={courseData.thumbnail_url} alt="Aperçu" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <FormControl>
                          <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} 
                            className="cursor-pointer file:bg-primary file:text-white file:rounded-lg file:border-none file:px-4 file:mr-4 file:font-bold" 
                          />
                        </FormControl>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField 
                          control={form.control} 
                          name="status" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-black uppercase text-[10px] tracking-widest">État de publication</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl h-12 border-primary/10 font-bold">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="draft">Brouillon 📝</SelectItem>
                                  <SelectItem value="published">Publiée 🚀</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />
                        <FormField 
                          control={form.control} 
                          name="mode" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-black uppercase text-[10px] tracking-widest">Format</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl h-12 border-primary/10 font-bold">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="online">VOD (En ligne)</SelectItem>
                                  <SelectItem value="presentiel">Présentiel</SelectItem>
                                  <SelectItem value="hybrid">Hybride</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />
                      </div>

                      <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-6">
                        <FormField 
                          control={form.control} 
                          name="is_paid" 
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary">Accès Payant</FormLabel>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} 
                        />
                        {form.watch('is_paid') && (
                          <FormField 
                            control={form.control} 
                            name="price" 
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-black uppercase text-[10px] tracking-widest">Prix de vente (USD)</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary">$</span>
                                    <Input type="number" step="0.01" {...field} value={field.value || 0} className="rounded-xl h-14 pl-10 border-primary/20 bg-background font-black text-xl" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} 
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-border flex justify-end">
                    <Button type="submit" disabled={isPending} className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] shadow-glow-primary transition-all active:scale-95">
                      {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sauvegarde...</> : 'Enregistrer les modifications'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="rounded-[2.5rem] border-primary/10 shadow-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-primary/5 border-b border-primary/10 py-6 px-8">
              <div>
                <CardTitle className="uppercase tracking-tighter font-black italic text-lg">2. Curriculum</CardTitle>
                <CardDescription>Structurez votre formation par leçons.</CardDescription>
              </div>
              <Button variant="hero" onClick={handleAddNewLesson} type="button" className="rounded-xl h-10 font-bold uppercase text-[10px] tracking-widest">
                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une leçon
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingLessons ? (
                <div className="p-8 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-black uppercase text-[9px] pl-8 w-20">Ordre</TableHead>
                      <TableHead className="font-black uppercase text-[9px]">Titre de la leçon</TableHead>
                      <TableHead className="font-black uppercase text-[9px]">Format</TableHead>
                      <TableHead className="text-right font-black uppercase text-[9px] pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessons?.map((lesson) => (
                      <TableRow key={lesson.id} className="hover:bg-primary/5 transition-colors border-b border-border/50">
                        <TableCell className="pl-8 font-black text-primary italic">{lesson.order_index}</TableCell>
                        <TableCell className="font-bold">{lesson.title}</TableCell>
                        <TableCell><Badge variant="secondary" className="uppercase text-[8px] font-black">{lesson.lesson_type}</Badge></TableCell>
                        <TableCell className="text-right pr-8">
                          <Button variant="ghost" size="sm" onClick={() => handleEditLesson(lesson)} type="button" className="rounded-lg font-bold text-xs">Modifier</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!lessons || lessons.length === 0) && (
                      <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic uppercase text-xs">Aucune leçon pour le moment.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logistics" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="rounded-[2.5rem] border-primary/10 shadow-xl overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/50 py-4 px-6 flex flex-row items-center justify-between">
                <CardTitle className="uppercase tracking-tighter font-black italic text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> 3. Créneaux (Vacations)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col gap-4 bg-primary/5 p-6 rounded-3xl border border-primary/10 shadow-inner">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/70">Nom du créneau</Label>
                      <Select value={vacationName} onValueChange={setVacationName}>
                        <SelectTrigger className="rounded-xl border-primary/10 h-11 font-bold bg-background">
                          <SelectValue placeholder="Choisir un créneau..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Matin">🌅 Matin</SelectItem>
                          <SelectItem value="Après-midi">☀️ Après-midi</SelectItem>
                          <SelectItem value="Soir">🌙 Soir</SelectItem>
                          <SelectItem value="Weekend">📅 Weekend</SelectItem>
                          <SelectItem value="Temps plein">⏳ Temps plein</SelectItem>
                          <SelectItem value="Session Spéciale">🔥 Session Spéciale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/70">Plage Horaire</Label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 z-10" />
                          <Input 
                            type="time" 
                            value={startTime} 
                            onChange={(e) => setStartTime(e.target.value)}
                            className="rounded-xl border-primary/10 h-11 font-bold pl-10 pr-2 bg-background"
                          />
                        </div>
                        <span className="text-muted-foreground font-bold">à</span>
                        <div className="relative flex-1">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 z-10" />
                          <Input 
                            type="time" 
                            value={endTime} 
                            onChange={(e) => setEndTime(e.target.value)}
                            className="rounded-xl border-primary/10 h-11 font-bold pl-10 pr-2 bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => addVacationMutation.mutate()} 
                    disabled={addVacationMutation.isPending || !vacationName || !vacationTime} 
                    className="rounded-xl font-black uppercase text-[10px] tracking-widest h-11 shadow-glow-primary-sm bg-primary"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> Enregistrer le créneau
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vacations?.map((vac: any) => (
                    <div key={vac.id} className="flex items-center justify-between p-4 rounded-2xl bg-card border-2 border-primary/5 group hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-black uppercase text-xs tracking-tighter leading-none mb-1">{vac.name}</p>
                          <p className="text-[10px] text-muted-foreground font-black italic">{vac.time_range}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteVacationMutation.mutate(vac.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {(!vacations || vacations.length === 0) && (
                    <div className="col-span-full py-8 text-center bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Aucun créneau configuré</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-primary/10 shadow-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between bg-muted/30 border-b border-border/50 py-4 px-6">
                <CardTitle className="uppercase tracking-tighter font-black italic text-lg">4. Périodes (Sessions)</CardTitle>
                <Button variant="outline" size="sm" onClick={handleAddNewSession} type="button" className="rounded-xl font-bold uppercase text-[9px] tracking-widest h-10">Nouvelle Session</Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {sessions?.map((session: any) => (
                      <TableRow key={session.id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                        <TableCell className="pl-6 py-4">
                          <p className="font-black uppercase text-xs tracking-tighter">{session.session_name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black italic">
                            <CalendarIcon className="w-3 h-3" />
                            <span>
                              Du {format(new Date(session.start_date), 'dd MMMM yyyy', { locale: fr })} au {format(new Date(session.end_date), 'dd MMMM yyyy', { locale: fr })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="sm" onClick={() => handleEditSession(session)} className="text-[10px] font-bold uppercase hover:text-primary transition-colors">Editer</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[2.5rem] border-primary/10 shadow-xl overflow-hidden">
            <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10 py-6 px-8">
              <CardTitle className="uppercase tracking-tighter font-black italic text-xl flex items-center gap-3 text-emerald-700">
                <Users className="w-6 h-6" /> Classes Actives
              </CardTitle>
              <CardDescription className="text-emerald-600/70 font-bold uppercase text-[9px] tracking-[0.2em]">Association Session + Vacation</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid md:grid-cols-3 gap-6 items-end bg-emerald-500/5 p-8 rounded-[2rem] border border-emerald-500/10 shadow-inner">
                <div className="space-y-3">
                  <Label className="font-black uppercase text-[10px] tracking-widest ml-1 text-emerald-700">1. Choisir Session</Label>
                  <Select value={groupSessionId} onValueChange={setGroupSessionId}>
                    <SelectTrigger className="rounded-xl h-12 bg-background border-emerald-500/20 font-bold"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>{sessions?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.session_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="font-black uppercase text-[10px] tracking-widest ml-1 text-emerald-700">2. Choisir Vacation</Label>
                  <Select value={groupVacationId} onValueChange={setGroupVacationId}>
                    <SelectTrigger className="rounded-xl h-12 bg-background border-emerald-500/20 font-bold"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>{vacations?.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={() => addGroupMutation.mutate()} disabled={addGroupMutation.isPending || !groupSessionId || !groupVacationId} className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Ouvrir la Classe</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups?.map((group: any) => (
                  <div key={group.id} className="p-5 rounded-[1.5rem] border-2 border-emerald-500/10 bg-card hover:border-emerald-500/30 transition-all flex items-center gap-4 group">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 shadow-inner"><Users className="w-5 h-5" /></div>
                    <div className="min-w-0">
                      <p className="font-black uppercase tracking-tighter text-sm italic truncate">{group.course_sessions?.session_name}</p>
                      <Badge variant="secondary" className="text-[8px] font-black h-4 py-0 uppercase bg-emerald-500/10 text-emerald-700 border-none">{group.course_vacations?.name}</Badge>
                    </div>
                  </div>
                ))}
                {(!groups || groups.length === 0) && (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-emerald-500/10 rounded-3xl">
                    <p className="text-muted-foreground uppercase font-black text-[10px] tracking-widest italic">Aucune classe configurée.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LessonEditorDialog isOpen={isLessonDialogOpen} onClose={() => setIsLessonDialogOpen(false)} courseId={courseId!} lesson={selectedLesson} />
      <CourseSessionEditorDialog isOpen={isSessionDialogOpen} onClose={() => setIsSessionDialogOpen(false)} courseId={courseId!} session={selectedSession} />

      {/* Categories CRUD Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-tighter font-black italic">Gestion des Pôles</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest">Ajoutez ou supprimez des catégories de formation.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex gap-2 bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <Input 
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nouveau pôle..."
                className="rounded-xl border-primary/10 h-10 font-bold"
              />
              <Button 
                onClick={() => addCategoryMutation.mutate(newCategoryName)}
                disabled={!newCategoryName.trim() || addCategoryMutation.isPending}
                className="rounded-xl h-10 px-4 font-black uppercase text-[10px] tracking-widest"
              >
                {addCategoryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ajouter"}
              </Button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {dbCategories?.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card group hover:border-primary/20 transition-all">
                  <span className="font-bold text-sm uppercase tracking-tight">{cat.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteCategoryMutation.mutate(cat.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {(!dbCategories || dbCategories.length === 0) && (
                <p className="text-center py-8 text-muted-foreground italic text-xs uppercase tracking-widest">Aucun pôle configuré.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormationEditor;
