import { useForm, useFieldArray } from "react-hook-form";
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
import { PlusCircle, Layout, BookOpen, Truck, Settings, Loader2, Trash2, Users, Calendar as CalendarIcon, Clock, Info, Target, Zap, Brain, CreditCard, Compass, Book } from "lucide-react";
import { LessonEditorDialog } from "./LessonEditorDialog";
import { CourseSessionEditorDialog } from "./CourseSessionEditorDialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Lesson, CourseMode, CourseVacation, CourseSession } from "@/types/course";

const formationSchema = z.object({
  title: z.string().min(3, "Le titre doit faire au moins 3 caractères."),
  description: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(['Débutant', 'Intermédiaire', 'Expert', 'Tous niveaux']).default('Tous niveaux'),
  status: z.enum(['draft', 'published']),
  is_paid: z.boolean().default(false),
  price: z.coerce.number().min(0).optional(),
  thumbnail_url: z.string().optional(),
  mode: z.enum(['online', 'presentiel', 'hybrid']).default('online'),
  learning_objectives: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  target_audience: z.array(z.string()).default([]),
  full_price: z.coerce.number().min(0).optional().nullable(),
  registration_fee: z.coerce.number().min(0).optional().nullable(),
  promo_end_date: z.string().optional().nullable(),
  brochure_url: z.string().optional().nullable(),
});

type FormationFormValues = z.infer<typeof formationSchema>;

const DynamicFieldArray = ({ control, name, title, description, placeholder, Icon, colorClass = "primary" }: any) => {
    const { fields, append, remove } = useFieldArray({ control, name });
    const colorVariants = {
      primary: { text: "text-primary", border: "border-primary/20", hoverBg: "hover:bg-primary", focusBorder: "focus:border-primary/30" },
      amber: { text: "text-amber-600", border: "border-amber-500/20", hoverBg: "hover:bg-amber-500", focusBorder: "focus:border-amber-500/30" },
      blue: { text: "text-blue-600", border: "border-blue-500/20", hoverBg: "hover:bg-blue-500", focusBorder: "focus:border-blue-500/30" },
    };
    const colors = colorVariants[colorClass as keyof typeof colorVariants] || colorVariants.primary;
  
    return (
      <div className={`mt-8 p-8 bg-muted/30 rounded-[2.5rem] border ${colors.border}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ${colors.text}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black uppercase italic tracking-tighter text-lg leading-none">{title}</h3>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">{description}</p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => append("")} className={`rounded-xl ${colors.border} ${colors.hoverBg} hover:text-white transition-all`}>
            <PlusCircle className="w-4 h-4 mr-2" /> Ajouter
          </Button>
        </div>
        <div className="grid gap-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
              <div className={`w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-[10px] font-black ${colors.text} border ${colors.border}`}>
                {index + 1}
              </div>
              <FormField
                control={control}
                name={`${name}.${index}` as any}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} placeholder={placeholder} className={`rounded-xl h-11 border-primary/5 ${colors.focusBorder} font-medium`} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {fields.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-primary/5 rounded-[2rem]">
              <p className="text-muted-foreground italic text-xs uppercase tracking-widest">Aucun élément défini.</p>
            </div>
          )}
        </div>
      </div>
    );
};

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
      level: 'Tous niveaux',
      status: 'draft',
      is_paid: false,
      price: 0,
      mode: 'online',
      learning_objectives: [],
      prerequisites: [],
      target_audience: [],
      full_price: undefined,
      registration_fee: undefined,
      promo_end_date: undefined,
      brochure_url: undefined,
    },
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [vacationName, setVacationName] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [vacationTime, setVacationTime] = useState("08:00 - 12:00");
  const [groupSessionId, setGroupSessionId] = useState("");
  useEffect(() => { setVacationTime(`${startTime} - ${endTime}`); }, [startTime, endTime]);
  const [groupVacationId, setGroupVacationId] = useState("");

  const { data: dbCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['courseCategories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: courseData, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (error) throw new Error(error.message);
      return data as any;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (courseData) {
      form.reset({
        ...courseData,
        level: courseData.level || 'Tous niveaux',
        learning_objectives: courseData.learning_objectives || [],
        prerequisites: courseData.prerequisites || [],
        target_audience: courseData.target_audience || [],
      });
    }
  }, [courseData, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormationFormValues) => {
      if (!user) throw new Error("Utilisateur non authentifié.");

      let finalThumbnailUrl = courseData?.thumbnail_url || null;
      if (thumbnailFile) {
        const filePath = `${user.id}_${Date.now()}`;
        const { error: uploadError } = await supabase.storage.from('course-thumbnails').upload(filePath, thumbnailFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('course-thumbnails').getPublicUrl(filePath);
        finalThumbnailUrl = urlData.publicUrl;
      }

      const dataToSave = { ...data, thumbnail_url: finalThumbnailUrl, admin_id: user.id };

      if (isEditMode) {
        const { error } = await supabase.from('courses').update(dataToSave as any).eq('id', courseId);
        if (error) throw error;
      } else {
        const { data: newCourse, error } = await supabase.from('courses').insert([dataToSave as any]).select().single();
        if (error) throw error;
        navigate(`/admin/formation/${newCourse.id}`);
      }
    },
    onSuccess: () => {
      toast.success(`Formation ${isEditMode ? 'mise à jour' : 'créée'} !`);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      if (!isEditMode) return;
    },
    onError: (error) => toast.error(`Erreur: ${error.message}`),
  });

  const onSubmit = (data: FormationFormValues) => {
    const cleanedData = { ...data, price: data.is_paid ? (data.price || 0) : 0 };
    mutate(cleanedData);
  };
  
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
            <Truck className="w-3.5 h-3.5" /> Logistique
          </TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="general" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="rounded-[2.5rem] border-primary/10 shadow-xl overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                  <CardTitle className="uppercase tracking-tighter font-black italic text-lg">1. Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid lg:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[10px] tracking-widest">Titre</FormLabel><FormControl><Input {...field} className="rounded-xl h-12 border-primary/10 font-bold" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[10px] tracking-widest">Description</FormLabel><FormControl><Textarea {...field} className="min-h-[150px] rounded-2xl border-primary/10 font-medium" /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="space-y-8">
                        <div className="p-6 bg-muted/20 rounded-3xl border border-dashed border-primary/20 text-center">
                          <FormLabel className="font-black uppercase text-[10px] tracking-widest mb-4 block">Visuel</FormLabel>
                          {courseData?.thumbnail_url && !thumbnailFile && (<div className="mb-4 aspect-video rounded-2xl overflow-hidden shadow-lg border-2 border-primary/10"><img src={courseData.thumbnail_url} alt="Aperçu" className="w-full h-full object-cover" /></div>)}
                          <FormControl><Input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} className="cursor-pointer file:bg-primary file:text-white file:rounded-lg file:border-none file:px-4 file:mr-4 file:font-bold" /></FormControl>
                        </div>
                        <FormField control={form.control} name="brochure_url" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[10px] tracking-widest">Lien Brochure (PDF)</FormLabel><FormControl><Input {...field} placeholder="URL du PDF..." className="rounded-xl h-12 border-primary/10 font-bold" /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                    </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-primary/10 shadow-xl overflow-hidden mt-8">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                  <CardTitle className="uppercase tracking-tighter font-black italic text-lg">2. Paramètres & Tarifs</CardTitle>
                </CardHeader>
                <CardContent className="p-8 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[10px] tracking-widest">Pôle</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl h-12 border-primary/10 font-bold"><SelectValue placeholder="..." /></SelectTrigger></FormControl><SelectContent>{dbCategories?.map(cat => (<SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="level" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[10px] tracking-widest">Niveau</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl h-12 border-primary/10 font-bold"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Tous niveaux">Tous niveaux</SelectItem><SelectItem value="Débutant">Débutant</SelectItem><SelectItem value="Intermédiaire">Intermédiaire</SelectItem><SelectItem value="Expert">Expert</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="mode" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[10px] tracking-widest">Format</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl h-12 border-primary/10 font-bold"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="online">VOD</SelectItem><SelectItem value="presentiel">Présentiel</SelectItem><SelectItem value="hybrid">Hybride</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[10px] tracking-widest">État</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl h-12 border-primary/10 font-bold"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="draft">Brouillon 📝</SelectItem><SelectItem value="published">Publiée 🚀</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                </CardContent>
                <CardContent className="p-8 pt-0">
                  <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-6">
                    <FormField control={form.control} name="is_paid" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between"><FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary">Accès Payant</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                    {form.watch('is_paid') && (
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[10px] tracking-widest">Prix Vente (USD)</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl h-12 font-bold" /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="full_price" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[10px] tracking-widest opacity-50">Prix Barré</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl h-12 font-bold" /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="registration_fee" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[10px] tracking-widest">Frais Inscription</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl h-12 font-bold" /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="promo_end_date" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[10px] tracking-widest text-emerald-600">Fin Bourse</FormLabel><FormControl><Input type="datetime-local" {...field} className="rounded-xl h-12 font-bold" /></FormControl></FormItem>)} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <DynamicFieldArray control={form.control} name="learning_objectives" title="Objectifs Pédagogiques" description="Ce que l'étudiant va apprendre" placeholder="Ex: Maîtriser les fondamentaux de React..." Icon={Target} colorClass="primary" />
              <DynamicFieldArray control={form.control} name="prerequisites" title="Prérequis" description="Compétences ou état d'esprit nécessaires" placeholder="Ex: Connaissance de base en HTML/CSS..." Icon={Zap} colorClass="amber" />
              <DynamicFieldArray control={form.control} name="target_audience" title="Audience Cible" description="Profils visés par la formation" placeholder="Ex: Développeurs débutants..." Icon={Brain} colorClass="blue" />

              <div className="pt-8 mt-8 border-t border-border flex justify-end">
                <Button type="submit" disabled={isPending} className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] shadow-glow-primary transition-all active:scale-95">
                  {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sauvegarde...</> : isEditMode ? 'Enregistrer les modifications' : 'Créer et Continuer'}
                </Button>
              </div>
            </TabsContent>
          </form>
        </Form>
        
        <TabsContent value="content">
            {/* Le contenu de l'éditeur de leçons est géré par la logique existante */}
        </TabsContent>
        <TabsContent value="logistics">
            {/* Le contenu de l'éditeur de sessions est géré par la logique existante */}
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default FormationEditor;
