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
import { 
  PlusCircle, 
  Layout, 
  BookOpen, 
  Truck, 
  Settings, 
  Loader2, 
  Trash2, 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  Info, 
  Target, 
  Zap, 
  Brain, 
  CreditCard, 
  Compass, 
  Book, 
  ShieldCheck, 
  CheckCircle2,
  Edit,
  MapPin
} from "lucide-react";
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
  level: z.enum(['beginner', 'intermediate', 'expert']).default('beginner'),
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
  allow_installments: z.boolean().default(false),
  min_installment_amount: z.coerce.number().min(0).optional().nullable(),
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
      level: 'beginner',
      status: 'draft',
      is_paid: false,
      price: 0,
      mode: 'online',
      learning_objectives: [],
      prerequisites: [],
      target_audience: [],
      full_price: 0,
      registration_fee: 0,
      promo_end_date: "",
      brochure_url: "",
      allow_installments: false,
      min_installment_amount: 0,
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
      if (!courseId || courseId === 'new') return null;
      const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (error) throw new Error(error.message);
      return data as any;
    },
    enabled: isEditMode && courseId !== 'new',
  });

  const { data: lessons } = useQuery({
    queryKey: ['courseLessons', courseId],
    queryFn: async () => {
      if (!courseId || courseId === 'new') return [];
      const { data, error } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isEditMode && courseId !== 'new',
  });

  const { data: courseSessions } = useQuery({
    queryKey: ['courseSessions', courseId],
    queryFn: async () => {
      if (!courseId || courseId === 'new') return [];
      const { data, error } = await supabase.from('course_sessions').select('*').eq('course_id', courseId).order('start_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isEditMode && courseId !== 'new',
  });

  useEffect(() => {
    if (courseData) {
      // Mappage des anciens niveaux (FR) vers les valeurs ENUM (EN) si nécessaire
      const levelMap: Record<string, any> = {
        'Débutant': 'beginner',
        'Intermédiaire': 'intermediate',
        'Expert': 'expert',
        'Tous niveaux': 'beginner'
      };
      const currentLevel = levelMap[courseData.level] || courseData.level || 'beginner';

      form.reset({
        ...courseData,
        title: courseData.title || "",
        description: courseData.description || "",
        category: courseData.category || "",
        level: currentLevel,
        status: courseData.status || 'draft',
        is_paid: courseData.is_paid || false,
        price: courseData.price ?? 0,
        mode: courseData.mode || 'online',
        learning_objectives: courseData.learning_objectives || [],
        prerequisites: courseData.prerequisites || [],
        target_audience: courseData.target_audience || [],
        full_price: courseData.full_price ?? 0,
        registration_fee: courseData.registration_fee ?? 0,
        promo_end_date: courseData.promo_end_date ? courseData.promo_end_date.slice(0, 16) : "",
        brochure_url: courseData.brochure_url || "",
        allow_installments: courseData.allow_installments || false,
        min_installment_amount: courseData.min_installment_amount ?? 0,
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
        navigate(`/admin/formations/${newCourse.id}/edit`);
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
    // Nettoyage des données pour éviter les erreurs de type SQL (ex: chaînes vides sur des dates)
    const cleanedData = { 
      ...data, 
      price: data.is_paid ? (data.price || 0) : 0,
      promo_end_date: data.promo_end_date === "" ? null : data.promo_end_date,
      brochure_url: data.brochure_url === "" ? null : data.brochure_url,
      min_installment_amount: data.min_installment_amount || null,
      full_price: data.full_price || null,
      registration_fee: data.registration_fee || null
    };
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
            <TabsContent value="general" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* COLONNE 1 & 2 : IDENTITÉ & CONTENU */}
                <div className="lg:col-span-2 space-y-8">
                  <Card className="rounded-[3rem] border-primary/10 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
                    <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                          <Info className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="uppercase tracking-tighter font-black italic text-xl leading-none">Identité du Cursus</CardTitle>
                          <CardDescription className="text-[10px] uppercase font-bold tracking-widest mt-1">Nom et narration pédagogique</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <FormField control={form.control} name="title" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary/60">Titre de la Formation</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: Masterclass Trading Institutionnel" className="rounded-2xl h-14 border-primary/10 font-black text-lg focus-visible:ring-primary/20" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="description" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary/60">Narration & Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Décrivez l'expérience de transformation..." className="min-h-[200px] rounded-[2rem] border-primary/10 font-medium leading-relaxed resize-none" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-8">
                    <Card className="rounded-[2.5rem] border-amber-500/10 shadow-xl overflow-hidden bg-card/50">
                      <CardHeader className="bg-amber-500/5 border-b border-amber-500/10 p-6">
                        <div className="flex items-center gap-3 text-amber-600">
                          <Settings className="w-5 h-5" />
                          <CardTitle className="uppercase tracking-tighter font-black italic text-base">Configuration</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-60">Discipline / Pôle</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl h-11 border-primary/5 font-bold"><SelectValue placeholder="Choisir..." /></SelectTrigger></FormControl><SelectContent>{dbCategories?.map(cat => (<SelectItem key={cat.id} value={cat.name} className="font-bold">{cat.name}</SelectItem>))}</SelectContent></Select></FormItem>)} />
                        <FormField control={form.control} name="level" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-60">Niveau Technique</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="rounded-xl h-11 border-primary/5 font-bold">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="beginner" className="font-bold">Débutant</SelectItem>
                                <SelectItem value="intermediate" className="font-bold">Intermédiaire</SelectItem>
                                <SelectItem value="expert" className="font-bold">Expert</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-blue-500/10 shadow-xl overflow-hidden bg-card/50">
                      <CardHeader className="bg-blue-500/5 border-b border-blue-500/10 p-6">
                        <div className="flex items-center gap-3 text-blue-600">
                          <Compass className="w-5 h-5" />
                          <CardTitle className="uppercase tracking-tighter font-black italic text-base">Format & État</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <FormField control={form.control} name="mode" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-60">Mode d'Apprentissage</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl h-11 border-primary/5 font-bold"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="online" className="font-bold text-blue-600">Digital / VOD</SelectItem><SelectItem value="presentiel" className="font-bold text-amber-600">Présentiel</SelectItem><SelectItem value="hybrid" className="font-bold text-emerald-600">Hybride</SelectItem></SelectContent></Select></FormItem>)} />
                        <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-60">Statut de Publication</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl h-11 border-primary/5 font-bold"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="draft" className="font-bold italic">📝 Brouillon</SelectItem><SelectItem value="published" className="font-bold italic text-emerald-600">🚀 Publiée</SelectItem></SelectContent></Select></FormItem>)} />
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* COLONNE 3 : VISUEL & FINANCE */}
                <div className="space-y-8">
                  <Card className="rounded-[2.5rem] border-primary/10 shadow-xl overflow-hidden bg-card/50">
                    <CardHeader className="bg-primary/5 border-b border-primary/10 p-6 text-center">
                      <CardTitle className="uppercase tracking-tighter font-black italic text-base">Aperçu Visuel</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white group">
                          {thumbnailFile || courseData?.thumbnail_url ? (
                            <img src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : courseData?.thumbnail_url} alt="Aperçu" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center flex-col gap-2 opacity-40">
                                <PlusCircle className="w-8 h-8" />
                                <span className="text-[10px] font-black uppercase">Aucune Image</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Label htmlFor="thumbnail-upload" className="cursor-pointer bg-white text-black px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-2xl">Changer</Label>
                          </div>
                        </div>
                        <FormControl>
                          <Input id="thumbnail-upload" type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} className="hidden" />
                        </FormControl>
                        <FormField control={form.control} name="brochure_url" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-60">Lien Brochure (PDF)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://..." className="rounded-xl h-11 border-primary/5 font-bold text-xs" />
                            </FormControl>
                          </FormItem>
                        )} />
                    </CardContent>
                  </Card>

                  <Card className="rounded-[3rem] border-emerald-500/20 shadow-2xl overflow-hidden bg-emerald-500/5 backdrop-blur-md relative">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><CreditCard className="w-20 h-20" /></div>
                    <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/10 p-8">
                      <CardTitle className="uppercase tracking-tighter font-black italic text-xl text-emerald-700 leading-none">TERMINAL <br /> FINANCIER</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="flex flex-col gap-4">
                          <FormField control={form.control} name="is_paid" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-4 bg-white/40 rounded-2xl border border-emerald-500/10 shadow-sm">
                              <FormLabel className="font-black uppercase text-[10px] tracking-widest text-emerald-700">Accès Premium</FormLabel>
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                          )} />
                          
                          {form.watch('is_paid') && (
                            <FormField control={form.control} name="allow_installments" render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between p-4 bg-emerald-500 text-white rounded-2xl border border-emerald-600 shadow-lg animate-in zoom-in-95 duration-300">
                                <FormLabel className="font-black uppercase text-[10px] tracking-widest">Activer Échelonnement</FormLabel>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="bg-white/20 data-[state=checked]:bg-white" /></FormControl>
                              </FormItem>
                            )} />
                          )}
                        </div>

                        {form.watch('is_paid') && (
                          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="grid gap-4">
                                <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[9px] tracking-[0.2em] text-emerald-700/60">Prix de Vente ($)</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl h-14 font-black text-2xl bg-white border-emerald-500/20 shadow-inner" /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="registration_fee" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[9px] tracking-[0.2em] text-emerald-700/60">Droit d'Inscription ($)</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl h-11 font-bold bg-white/50 border-emerald-500/10" /></FormControl></FormItem>)} />
                            </div>

                            {form.watch('allow_installments') && (
                              <FormField control={form.control} name="min_installment_amount" render={({ field }) => (
                                <FormItem className="p-4 bg-white rounded-2xl border-2 border-emerald-500 shadow-xl">
                                  <FormLabel className="font-black uppercase text-[9px] tracking-widest text-emerald-600 flex items-center gap-2 animate-pulse"><Zap className="w-3 h-3 fill-current" /> Acompte Minimum ($)</FormLabel>
                                  <FormControl><Input type="number" {...field} className="border-none p-0 h-10 font-black text-3xl focus-visible:ring-0" /></FormControl>
                                </FormItem>
                              )} />
                            )}

                            <div className="pt-4 border-t border-emerald-500/10 space-y-4">
                                <FormField control={form.control} name="full_price" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-40 italic">Prix Public / Barré</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl h-10 font-bold bg-white/20 border-emerald-500/5 opacity-50" /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="promo_end_date" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="font-black uppercase text-[9px] tracking-widest text-amber-600">Limite Offre / Promo</FormLabel>
                                    <FormControl>
                                      <div className="relative group">
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                                        <Input type="datetime-local" {...field} className="rounded-xl h-11 pl-10 font-bold bg-amber-500/5 border-amber-500/20 focus-visible:ring-amber-500/20" />
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )} />
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <DynamicFieldArray control={form.control} name="learning_objectives" title="Objectifs" description="La promesse du cursus" placeholder="Ex: Maîtriser React..." Icon={Target} colorClass="primary" />
                </div>
                <div className="lg:col-span-1">
                  <DynamicFieldArray control={form.control} name="prerequisites" title="Prérequis" description="Profil d'entrée" placeholder="Ex: Motivation..." Icon={Zap} colorClass="amber" />
                </div>
                <div className="lg:col-span-1">
                  <DynamicFieldArray control={form.control} name="target_audience" title="Cible" description="Qui va réussir ?" placeholder="Ex: Développeurs débutants..." Icon={Brain} colorClass="blue" />
                </div>
              </div>

              <div className="sticky bottom-8 z-30 pt-8 mt-12 border-t border-border flex justify-end">
                <Button type="submit" disabled={isPending} className="h-20 px-16 rounded-3xl font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_-10px_rgba(var(--primary-rgb),0.5)] transition-all hover:scale-105 active:scale-95 border-2 border-white/10 relative overflow-hidden group">
                  <span className="relative z-10 flex items-center gap-4">
                    {isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                    {isEditMode ? 'Mettre à jour le Masterplan' : 'Initialiser la Formation'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>
            </TabsContent>
          </form>
        </Form>
        
        <TabsContent value="content" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="rounded-[3rem] border-primary/10 shadow-2xl overflow-hidden bg-card/50">
            <CardHeader className="bg-primary/5 border-b border-primary/10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="uppercase tracking-tighter font-black italic text-2xl leading-none">Plan de Déploiement</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest mt-1">Structure modulaire du cursus</CardDescription>
                </div>
              </div>
              <Button 
                onClick={() => { setSelectedLesson(null); setIsLessonDialogOpen(true); }}
                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-glow-primary group overflow-hidden relative border-2 border-white/10"
              >
                <span className="relative z-10 flex items-center gap-3"><PlusCircle className="w-5 h-5" /> Ajouter un module</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </CardHeader>
            <CardContent className="p-8">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary/60">Ordre</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary/60">Titre du Module</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary/60">Type</TableHead>
                    <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-primary/60">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessons && lessons.length > 0 ? lessons.map((lesson) => (
                    <TableRow key={lesson.id} className="border-white/5 hover:bg-primary/[0.02] group transition-colors">
                      <TableCell className="font-black italic text-lg opacity-20">#{lesson.order_index}</TableCell>
                      <TableCell>
                        <p className="font-black uppercase tracking-tight italic text-sm">{lesson.title}</p>
                        {lesson.module_name && <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{lesson.module_name}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-white/5 border-white/10 font-black uppercase text-[8px] tracking-widest px-3 py-1">
                          {lesson.lesson_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setSelectedLesson(lesson); setIsLessonDialogOpen(true); }}
                            className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={async () => {
                                if(confirm("Supprimer ce module ?")) {
                                    const { error } = await supabase.from('lessons').delete().eq('id', lesson.id);
                                    if(error) toast.error(error.message);
                                    else { toast.success("Module supprimé"); queryClient.invalidateQueries({ queryKey: ['courseLessons', courseId] }); }
                                }
                            }}
                            className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 opacity-20">
                            <Book className="w-16 h-16" />
                            <p className="font-black uppercase italic tracking-widest text-xs">Aucun module configuré pour le moment.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logistics" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          <Card className="rounded-[3rem] border-primary/10 shadow-2xl overflow-hidden bg-card/50">
            <CardHeader className="bg-primary/5 border-b border-primary/10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-inner">
                  <CalendarIcon className="w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="uppercase tracking-tighter font-black italic text-2xl leading-none">Cohortes & Sessions</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest mt-1">Gestion du calendrier physique et hybride</CardDescription>
                </div>
              </div>
              <Button 
                onClick={() => { setSelectedSession(null); setIsSessionDialogOpen(true); }}
                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-glow-primary group overflow-hidden relative border-2 border-white/10"
              >
                <span className="relative z-10 flex items-center gap-3"><PlusCircle className="w-5 h-5" /> Planifier une Session</span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </CardHeader>
            <CardContent className="p-8">
                <div className="grid gap-6">
                    {courseSessions && courseSessions.length > 0 ? courseSessions.map((session: any) => (
                        <div key={session.id} className="group relative p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-amber-500/40 transition-all duration-500 overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Badge className="bg-amber-500 text-white font-black text-[9px] uppercase px-4 py-1.5 rounded-full shadow-lg">SESSION ACTIVE</Badge>
                                        <h4 className="text-2xl font-black uppercase tracking-tighter italic leading-none">{session.session_name}</h4>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground italic">
                                        <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-amber-500" /><span>Du {format(new Date(session.start_date), 'dd MMM yyyy', { locale: fr })} au {format(new Date(session.end_date), 'dd MMM yyyy', { locale: fr })}</span></div>
                                        {session.location && (<div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-500" /><span>{session.location}</span></div>)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedSession(session); setIsSessionDialogOpen(true); }} className="w-12 h-12 rounded-xl hover:bg-amber-500/10 hover:text-amber-600"><Edit className="w-5 h-5" /></Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={async () => {
                                            if(confirm("Supprimer cette session ?")) {
                                                const { error } = await supabase.from('course_sessions').delete().eq('id', session.id);
                                                if(error) toast.error(error.message);
                                                else { toast.success("Session supprimée"); queryClient.invalidateQueries({ queryKey: ['courseSessions', courseId] }); }
                                            }
                                        }}
                                        className="w-12 h-12 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                                    ><Trash2 className="w-5 h-5" /></Button>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )) : (
                        <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/5">
                            <CalendarIcon className="w-16 h-16 mx-auto mb-6 opacity-10" />
                            <p className="font-black uppercase italic tracking-widest text-xs opacity-40">Aucune session planifiée pour ce cursus.</p>
                        </div>
                    )}
                </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* DIALOGS DE GESTION [ELITE TERMINALS] */}
      <LessonEditorDialog 
        isOpen={isLessonDialogOpen}
        onClose={() => setIsLessonDialogOpen(false)}
        courseId={courseId!}
        lesson={selectedLesson}
      />

      <CourseSessionEditorDialog
        isOpen={isSessionDialogOpen}
        onClose={() => setIsSessionDialogOpen(false)}
        courseId={courseId!}
        session={selectedSession}
      />
    </div>
  );
};

export default FormationEditor;
