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
  BookOpen, 
  Settings, 
  Loader2, 
  Trash2, 
  CheckCircle2,
  Edit,
  DollarSign,
  Layers,
  ArrowLeft,
  Image as ImageIcon,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Target,
  Users,
  UserCheck,
  Shield
} from "lucide-react";
import { LessonEditorDialog } from "./LessonEditorDialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

const formationSchema = z.object({
  title: z.string().min(3, "Le titre doit comporter au moins 3 caractères"),
  description: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "expert"]).default("beginner"),
  status: z.enum(["draft", "published"]).default("published"),
  mode: z.enum(["presentiel", "online", "hybrid"]).default("presentiel"),
  price: z.coerce.number().min(0, "Le prix ne peut pas être négatif").default(0),
  registration_fee: z.coerce.number().min(0).optional().nullable(),
  allow_installments: z.boolean().default(true),
  min_installment_amount: z.coerce.number().min(0).optional().nullable(),
  learning_objectives: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([])
});

type FormationFormValues = z.infer<typeof formationSchema>;

export default function FormationEditor() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditMode = !!courseId;

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  // 1. Charger les catégories officielles
  const { data: dbCategories = [] } = useQuery({
    queryKey: ["course-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    }
  });

  // 2. Charger la formation en mode édition
  const { data: courseData, isLoading: isLoadingCourse } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditMode
  });

  // 3. Charger les leçons/modules du cours
  const { data: lessons = [] } = useQuery({
    queryKey: ["courseLessons", courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isEditMode
  });

  // 4. Charger tous les formateurs disponibles
  const { data: availableTeachers = [] } = useQuery({
    queryKey: ["available-teachers"],
    queryFn: async () => {
      const { data: teacherRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["teacher", "admin"]);
      if (rolesError) throw rolesError;
      if (!teacherRoles || teacherRoles.length === 0) return [];

      const userIds = Array.from(new Set(teacherRoles.map(r => r.user_id)));
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      if (profError) throw profError;
      return profiles || [];
    }
  });

  // 5. Charger les formateurs déjà assignés à cette formation
  const { data: assignedTeacherIds = [], refetch: refetchAssignedTeachers } = useQuery({
    queryKey: ["course-teachers", courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from("course_teachers")
        .select("teacher_id")
        .eq("course_id", courseId);
      if (error) throw error;
      return (data || []).map(d => d.teacher_id);
    },
    enabled: isEditMode
  });

  // Mutation pour assigner / retirer un formateur
  const toggleTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      if (!courseId) return;
      const isAssigned = assignedTeacherIds.includes(teacherId);
      if (isAssigned) {
        const { error } = await supabase
          .from("course_teachers")
          .delete()
          .eq("course_id", courseId)
          .eq("teacher_id", teacherId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("course_teachers")
          .insert({ course_id: courseId, teacher_id: teacherId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchAssignedTeachers();
      queryClient.invalidateQueries({ queryKey: ["course-teachers", courseId] });
      toast.success("Assignation du formateur mise à jour !");
    },
    onError: (err: any) => {
      toast.error(`Erreur lors de l'assignation : ${err.message}`);
    }
  });

  const form = useForm<FormationFormValues>({
    resolver: zodResolver(formationSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Trading & Marchés Financiers",
      level: "beginner",
      status: "published",
      mode: "presentiel",
      price: 0,
      registration_fee: 0,
      allow_installments: true,
      min_installment_amount: 0,
      learning_objectives: [],
      prerequisites: []
    }
  });

  const { fields: objectiveFields, append: appendObjective, remove: removeObjective } = useFieldArray({
    control: form.control,
    name: "learning_objectives" as any
  });

  useEffect(() => {
    if (courseData) {
      form.reset({
        title: courseData.title || "",
        description: courseData.description || "",
        category: courseData.category || "Trading & Marchés Financiers",
        level: courseData.level || "beginner",
        status: courseData.status || "published",
        mode: courseData.mode || "presentiel",
        price: Number(courseData.price) || 0,
        registration_fee: Number(courseData.registration_fee) || 0,
        allow_installments: courseData.allow_installments ?? true,
        min_installment_amount: Number(courseData.min_installment_amount) || 0,
        learning_objectives: courseData.learning_objectives || [],
        prerequisites: courseData.prerequisites || []
      });
    }
  }, [courseData, form]);

  // Mutation Enregistrement
  const saveMutation = useMutation({
    mutationFn: async (data: FormationFormValues) => {
      if (!user) throw new Error("Non authentifié");

      let finalThumbnailUrl = courseData?.thumbnail_url || null;
      if (thumbnailFile) {
        const filePath = `${user.id}_${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from("course-thumbnails")
          .upload(filePath, thumbnailFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("course-thumbnails")
          .getPublicUrl(filePath);
        finalThumbnailUrl = urlData.publicUrl;
      }

      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        level: data.level,
        status: data.status,
        mode: data.mode,
        price: data.price,
        is_paid: data.price > 0,
        registration_fee: data.registration_fee || 0,
        allow_installments: data.allow_installments,
        min_installment_amount: data.min_installment_amount || 0,
        learning_objectives: data.learning_objectives.filter(Boolean),
        prerequisites: data.prerequisites.filter(Boolean),
        thumbnail_url: finalThumbnailUrl,
        admin_id: user.id
      };

      if (isEditMode) {
        const { error } = await supabase.from("courses").update(payload).eq("id", courseId);
        if (error) throw error;
      } else {
        const { data: newCourse, error } = await supabase
          .from("courses")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        navigate(`/admin/formations/${newCourse.id}/edit`);
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? "Formation mise à jour avec succès !" : "Formation créée avec succès !");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
    onError: (err: any) => {
      toast.error(`Erreur : ${err.message}`);
    }
  });

  const onSubmit = (data: FormationFormValues) => {
    saveMutation.mutate(data);
  };

  if (isLoadingCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-30" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 pb-24 max-w-6xl">
      {/* HEADER ÉPURÉ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/formations">
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl border border-border">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground">
              {isEditMode ? "Modifier la Formation" : "Nouvelle Formation"}
            </h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
              Botes Academy — Paramètres & Programme
            </p>
          </div>
        </div>

        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={saveMutation.isPending}
          className="h-12 px-8 rounded-2xl font-black uppercase text-xs tracking-wider shadow-glow-primary bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          )}
          {isEditMode ? "Enregistrer les modifications" : "Créer la formation"}
        </Button>
      </div>

      {/* TABS SIMPLIFIÉS : 1. INFOS & TARIFS | 2. PROGRAMME */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-muted/40 p-1 rounded-2xl border border-border mb-6">
          <TabsTrigger value="general" className="rounded-xl px-6 font-bold uppercase text-xs tracking-wider">
            <Settings className="w-3.5 h-3.5 mr-2" /> Informations & Tarifs
          </TabsTrigger>
          <TabsTrigger
            value="curriculum"
            className="rounded-xl px-6 font-bold uppercase text-xs tracking-wider"
            disabled={!isEditMode}
          >
            <BookOpen className="w-3.5 h-3.5 mr-2" /> Programme & Modules ({lessons.length})
          </TabsTrigger>
          <TabsTrigger
            value="teachers"
            className="rounded-xl px-6 font-bold uppercase text-xs tracking-wider"
            disabled={!isEditMode}
          >
            <Users className="w-3.5 h-3.5 mr-2" /> Formateurs Assignés ({assignedTeacherIds.length})
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* TAB 1 : INFORMATIONS & TARIFS */}
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLONNE GAUCHE (2 COLONNES) : IDENTITÉ & TARIFICATION */}
                <div className="lg:col-span-2 space-y-6">
                  {/* CARTE 1 : IDENTITÉ */}
                  <Card className="rounded-3xl border-border bg-card shadow-sm">
                    <CardHeader className="p-6 pb-4 border-b border-border/50">
                      <CardTitle className="text-base font-black uppercase italic tracking-tight">
                        Identité de la Formation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                              Titre de la Formation *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="ex: Trading Pro & Gestion des Risques"
                                {...field}
                                className="h-12 rounded-xl text-base font-bold"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                Pôle / Catégorie
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl font-bold">
                                    <SelectValue placeholder="Choisir un pôle" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {dbCategories.map((c) => (
                                    <SelectItem key={c.id} value={c.name} className="font-bold">
                                      {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="mode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                Format
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl font-bold">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="presentiel" className="font-bold">Présentiel</SelectItem>
                                  <SelectItem value="online" className="font-bold">En Ligne</SelectItem>
                                  <SelectItem value="hybrid" className="font-bold">Hybride</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                Visibilité
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl font-bold">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="published" className="font-bold text-emerald-500">
                                    Publiée
                                  </SelectItem>
                                  <SelectItem value="draft" className="font-bold text-amber-500">
                                    Brouillon
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                              Description & Présentation
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Présentez les compétences acquises durant cette formation..."
                                {...field}
                                className="min-h-[120px] rounded-2xl"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* CARTE 2 : TARIFICATION & MODALITÉS DE PAIEMENT */}
                  <Card className="rounded-3xl border-emerald-500/20 bg-card shadow-sm">
                    <CardHeader className="p-6 pb-4 border-b border-border/50">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <DollarSign className="w-5 h-5" />
                        <CardTitle className="text-base font-black uppercase italic tracking-tight text-foreground">
                          Tarifs & Facilités de Paiement
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                Prix de la Formation ($) *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="ex: 150"
                                  {...field}
                                  className="h-12 rounded-xl font-black text-xl text-emerald-500"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="registration_fee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                Frais d'Inscription ($) <span className="text-[10px] text-muted-foreground">(Optionnel)</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="ex: 10"
                                  {...field}
                                  className="h-12 rounded-xl font-bold"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-black uppercase">Autoriser le Paiement par Tranches</p>
                            <p className="text-[11px] text-muted-foreground">
                              Permet à l'étudiant de verser un acompte et de solder en plusieurs fois.
                            </p>
                          </div>
                          <FormField
                            control={form.control}
                            name="allow_installments"
                            render={({ field }) => (
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            )}
                          />
                        </div>

                        {form.watch("allow_installments") && (
                          <div className="pt-2 border-t border-border">
                            <FormField
                              control={form.control}
                              name="min_installment_amount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">
                                    Acompte Minimum Conseillé ($)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      placeholder="ex: 50"
                                      {...field}
                                      className="h-10 rounded-xl font-bold text-xs"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* COLONNE DROITE (1 COLONNE) : IMAGE & CRÉNEAUX */}
                <div className="space-y-6">
                  {/* IMAGE DE COUVERTURE */}
                  <Card className="rounded-3xl border-border bg-card shadow-sm overflow-hidden">
                    <CardHeader className="p-5 pb-3 border-b border-border/50">
                      <CardTitle className="text-xs font-black uppercase italic tracking-wider flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-primary" /> Image de Couverture
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3 text-center">
                      <div className="relative aspect-video rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center">
                        {thumbnailFile || courseData?.thumbnail_url ? (
                          <img
                            src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : courseData?.thumbnail_url}
                            alt="Aperçu"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-muted-foreground space-y-1">
                            <ImageIcon className="w-8 h-8 mx-auto opacity-30" />
                            <p className="text-[10px] font-bold uppercase">Aucune Image</p>
                          </div>
                        )}
                      </div>

                      <Label
                        htmlFor="thumb-upload"
                        className="cursor-pointer inline-flex items-center justify-center w-full h-10 rounded-xl bg-muted/60 hover:bg-muted text-xs font-bold transition-colors"
                      >
                        Changer l'image
                      </Label>
                      <Input
                        id="thumb-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </CardContent>
                  </Card>

                  {/* CRÉNEAUX HORAIRES INTÉGRÉS */}
                  <Card className="rounded-3xl border-border bg-card shadow-sm">
                    <CardHeader className="p-5 pb-3 border-b border-border/50">
                      <CardTitle className="text-xs font-black uppercase italic tracking-wider">
                        Créneaux Horaires Disponibles
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-2.5">
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="font-bold text-foreground leading-none">Matin</p>
                          <p className="text-[10px] text-muted-foreground">08h00 - 11h00</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs">
                        <Sunset className="w-4 h-4 text-orange-500" />
                        <div>
                          <p className="font-bold text-foreground leading-none">Midi</p>
                          <p className="text-[10px] text-muted-foreground">11h30 - 14h30</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
                        <Moon className="w-4 h-4 text-indigo-400" />
                        <div>
                          <p className="font-bold text-foreground leading-none">Soir</p>
                          <p className="text-[10px] text-muted-foreground">16h00 - 19h00</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* SECTION OBJECTIFS (OPTIONNELLE ET ÉPURÉE) */}
              <Card className="rounded-3xl border-border bg-card shadow-sm">
                <CardHeader className="p-6 pb-4 border-b border-border/50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-black uppercase italic tracking-tight">
                      Objectifs Pédagogiques <span className="text-xs font-normal text-muted-foreground">(Optionnel)</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Points clés que les étudiants maîtriseront à l'issue de la formation.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendObjective("")}
                    className="rounded-xl text-xs font-bold"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1" /> Ajouter un objectif
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {objectiveFields.map((field, idx) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <span className="w-6 text-center text-xs font-bold text-primary">{idx + 1}.</span>
                      <FormField
                        control={form.control}
                        name={`learning_objectives.${idx}` as any}
                        render={({ field }) => (
                          <Input
                            placeholder="ex: Savoir exécuter des analyses techniques..."
                            {...field}
                            className="h-10 rounded-xl text-xs font-medium flex-1"
                          />
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeObjective(idx)}
                        className="h-10 w-10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {objectiveFields.length === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center py-2">
                      Aucun objectif spécifique renseigné.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </form>
        </Form>

        {/* TAB 2 : PROGRAMME & MODULES */}
        <TabsContent value="curriculum" className="space-y-6">
          <Card className="rounded-3xl border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-black uppercase italic tracking-tight">
                  Programme & Modules du Cours
                </CardTitle>
                <CardDescription>
                  Définissez les leçons, vidéos ou chapitres suivis par les étudiants.
                </CardDescription>
              </div>

              <Button
                onClick={() => {
                  setSelectedLesson(null);
                  setIsLessonDialogOpen(true);
                }}
                className="rounded-xl font-black uppercase text-xs bg-primary text-primary-foreground"
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Ajouter un Module
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              {lessons.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground space-y-2">
                  <BookOpen className="w-10 h-10 mx-auto opacity-20" />
                  <p className="font-black uppercase text-xs">Aucun module pour le moment</p>
                  <p className="text-xs">Cliquez sur "Ajouter un Module" pour structurer le programme.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="font-black text-[10px] uppercase w-16">Ordre</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Titre du Module</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Type</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/40">
                    {lessons.map((lesson) => (
                      <TableRow key={lesson.id} className="hover:bg-muted/30">
                        <TableCell className="font-black text-sm text-primary">
                          #{lesson.order_index}
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-xs text-foreground uppercase">{lesson.title}</p>
                          {lesson.module_name && (
                            <p className="text-[10px] text-muted-foreground">{lesson.module_name}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] font-black uppercase">
                            {lesson.lesson_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedLesson(lesson);
                                setIsLessonDialogOpen(true);
                              }}
                              className="h-8 w-8 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                if (confirm("Supprimer ce module ?")) {
                                  const { error } = await supabase
                                    .from("lessons")
                                    .delete()
                                    .eq("id", lesson.id);
                                  if (error) toast.error(error.message);
                                  else {
                                    toast.success("Module supprimé");
                                    queryClient.invalidateQueries({
                                      queryKey: ["courseLessons", courseId]
                                    });
                                  }
                                }
                              }}
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3 : FORMATEURS & ÉQUIPE PÉDAGOGIQUE */}
        <TabsContent value="teachers" className="space-y-6">
          <Card className="rounded-3xl border-border bg-card shadow-sm">
            <CardHeader className="p-6 pb-4 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-black uppercase italic tracking-tight">
                    Corps Enseignant & Formateurs Assignés
                  </CardTitle>
                  <CardDescription className="text-xs font-bold text-muted-foreground mt-0.5">
                    Sélectionnez les enseignants autorisés à dispenser ce cours, faire l'appel et suivre les élèves.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-semibold px-3 py-1 self-start sm:self-auto">
                  {assignedTeacherIds.length} formateur(s) assigné(s)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {availableTeachers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs font-bold">
                  Aucun formateur enregistré avec le rôle "teacher" ou "admin" en base.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableTeachers.map((teacher: any) => {
                    const isAssigned = assignedTeacherIds.includes(teacher.id);
                    return (
                      <div
                        key={teacher.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          isAssigned
                            ? "bg-primary/5 border-primary/40 shadow-xs"
                            : "bg-card border-border/60 hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border border-border/80">
                            <AvatarImage src={teacher.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                              {teacher.full_name?.charAt(0) || "F"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {teacher.full_name || "Enseignant sans nom"}
                            </p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Shield className="w-3 h-3 text-primary" /> Formateur Botes Academy
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant={isAssigned ? "default" : "outline"}
                          className={`rounded-xl text-xs font-semibold h-9 px-3 gap-1.5 ${
                            isAssigned 
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                              : "border-border/80 hover:bg-muted"
                          }`}
                          disabled={toggleTeacherMutation.isPending}
                          onClick={() => toggleTeacherMutation.mutate(teacher.id)}
                        >
                          {isAssigned ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Assigné
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3.5 h-3.5" /> Assigner
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG DE MODIFICATION DE MODULE */}
      <LessonEditorDialog
        isOpen={isLessonDialogOpen}
        onClose={() => setIsLessonDialogOpen(false)}
        courseId={courseId!}
        lesson={selectedLesson}
      />
    </div>
  );
}
