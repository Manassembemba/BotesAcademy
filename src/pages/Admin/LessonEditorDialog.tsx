import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BookOpen, Video, FileText, HelpCircle, Save, X, PlusCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content?: string;
  video_url?: string;
  pdf_url?: string;
  order_index: number;
  lesson_type: 'video' | 'pdf';
  module_name?: string | null;
}

const lessonSchema = z.object({
  title: z.string().min(3, "Le titre doit faire au moins 3 caractères."),
  order_index: z.coerce.number().min(0, "L'ordre doit être positif."),
  lesson_type: z.enum(['video', 'pdf']),
  video_url: z.string().optional().nullable().or(z.literal('')),
  module_name: z.string().optional().nullable(),
});

type LessonFormValues = z.infer<typeof lessonSchema>;

interface LessonEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  lesson?: Lesson | null;
}

export const LessonEditorDialog = ({ isOpen, onClose, courseId, lesson }: LessonEditorDialogProps) => {
  const queryClient = useQueryClient();
  const isEditMode = Boolean(lesson);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const defaultFormValues = {
    title: "",
    order_index: 0,
    lesson_type: "video" as const,
    video_url: "",
    module_name: "",
  };

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (isOpen) {
      if (lesson) {
        form.reset({
            ...lesson,
            video_url: lesson.video_url || "",
            module_name: lesson.module_name || "",
        });
      } else {
        form.reset(defaultFormValues);
      }
      setPdfFile(null);
    }
  }, [isOpen, lesson, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: LessonFormValues) => {
      let pdf_url = lesson?.pdf_url || null;

      if (data.lesson_type === 'pdf' && pdfFile) {
        const filePath = `lessons/${courseId}/${Date.now()}_${pdfFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('lesson-files')
          .upload(filePath, pdfFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('lesson-files')
          .getPublicUrl(filePath);
        pdf_url = urlData.publicUrl;
      }

      const dataToSave = {
        title: data.title,
        course_id: courseId,
        lesson_type: data.lesson_type,
        order_index: data.order_index,
        video_url: data.video_url || null,
        pdf_url: pdf_url,
        module_name: data.module_name || null,
      };

      if (isEditMode && lesson) {
        const { error } = await supabase.from('lessons').update(dataToSave).eq('id', lesson.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lessons').insert(dataToSave);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Module ${isEditMode ? 'mis à jour' : 'ajouté'} avec succès.`);
      // Harmonisation avec la clé utilisée dans FormationEditor
      queryClient.invalidateQueries({ queryKey: ['courseLessons', courseId] });
      onClose();
    },
    onError: (error) => toast.error(`Erreur: ${error.message}`),
  });

  const onSubmit = (data: LessonFormValues) => {
    mutate(data);
  };

  const currentType = form.watch('lesson_type');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] p-0 rounded-[3rem] overflow-hidden border-primary/20 bg-card/95 backdrop-blur-2xl shadow-2xl">
        <div className="bg-primary/10 p-8 border-b border-white/10 relative">
            <div className="absolute top-0 right-0 p-6 opacity-5"><BookOpen className="w-24 h-24" /></div>
            <DialogHeader className="relative z-10">
                <Badge className="bg-primary text-white border-none w-fit px-4 py-1 rounded-full font-black uppercase text-[9px] tracking-widest mb-3">Module Editor</Badge>
                <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter leading-none text-white">
                    {isEditMode ? "MODIFIER" : "NOUVEAU"} <span className="text-primary">MODULE</span>
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Configuration de l'unité pédagogique</DialogDescription>
            </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">
            <div className="grid md:grid-cols-4 gap-6">
                <FormField control={form.control} name="order_index" render={({ field }) => (
                    <FormItem className="md:col-span-1">
                        <FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-60">Ordre</FormLabel>
                        <FormControl><Input type="number" {...field} className="rounded-xl h-12 border-white/10 font-black text-xl bg-white/5" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem className="md:col-span-3">
                        <FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-60">Titre du module</FormLabel>
                        <FormControl><Input placeholder="Ex: Fondamentaux du marché..." {...field} className="rounded-xl h-12 border-white/10 font-bold bg-white/5" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="module_name" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-60">Chapitre / Section</FormLabel>
                        <FormControl><Input placeholder="Ex: Semaine 01" {...field} value={field.value || ''} className="rounded-xl h-12 border-white/10 font-bold bg-white/5" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="lesson_type" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-60">Type de contenu</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger className="rounded-xl h-12 border-white/10 bg-white/5 font-black uppercase text-[10px] tracking-widest">
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-white/10">
                                <SelectItem value="video" className="font-bold">Vidéo de cours</SelectItem>
                                <SelectItem value="pdf" className="font-bold">Document PDF</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className={cn(
                "p-6 rounded-3xl border-2 transition-all duration-500",
                currentType === 'video' ? "bg-blue-500/5 border-blue-500/20" : "bg-emerald-500/5 border-emerald-500/20"
            )}>
                {currentType === 'video' && (
                    <FormField control={form.control} name="video_url" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-black uppercase text-[9px] tracking-widest text-blue-600 flex items-center gap-2">
                                <Video className="w-3 h-3" /> Lien Source Vidéo
                            </FormLabel>
                            <FormControl><Input placeholder="https://youtube.com/embed/..." {...field} value={field.value || ''} className="rounded-xl h-11 border-blue-500/10 bg-white shadow-inner font-medium text-xs" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                )}

                {currentType === 'pdf' && (
                    <FormItem className="space-y-4">
                        <FormLabel className="font-black uppercase text-[9px] tracking-widest text-emerald-600 flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Fichier de support (PDF)
                        </FormLabel>
                        <div className="flex items-center gap-4">
                            <FormControl><Input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="rounded-xl h-11 border-emerald-500/10 bg-white shadow-inner file:bg-emerald-500 file:text-white file:rounded-lg file:border-none file:px-4 file:mr-4 file:font-bold file:text-[10px] uppercase cursor-pointer" /></FormControl>
                        </div>
                        {lesson?.pdf_url && <p className="text-[10px] text-muted-foreground font-medium italic">Fichier actuel : {lesson.pdf_url.split('/').pop()}</p>}
                    </FormItem>
                )}
            </div>

            <DialogFooter className="gap-4 pt-4">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-12">Annuler</Button>
              <Button type="submit" disabled={isPending} className="flex-1 rounded-[1.5rem] h-14 font-black uppercase text-[10px] tracking-[0.2em] shadow-glow-primary group overflow-hidden relative border-2 border-white/10">
                <span className="relative z-10 flex items-center justify-center gap-3">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isEditMode ? 'Mettre à jour' : 'Enregistrer le module'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
