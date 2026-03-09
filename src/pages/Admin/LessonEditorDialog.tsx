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

const lessonSchema = z.object({
  title: z.string().min(3, "Le titre doit faire au moins 3 caractères."),
  order_index: z.coerce.number().min(0, "L'ordre doit être positif."),
  lesson_type: z.enum(['video', 'pdf']),
  video_url: z.string().url("URL de vidéo invalide").optional().or(z.literal('')),
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
  };

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (isOpen) {
      if (lesson) {
        form.reset(lesson);
      } else {
        form.reset(defaultFormValues);
      }
      setPdfFile(null); // Toujours réinitialiser le fichier
    }
  }, [isOpen, lesson, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: LessonFormValues) => {
      let pdf_url = lesson?.pdf_url || null;

      if (data.lesson_type === 'pdf' && pdfFile) {
        const filePath = `${courseId}/${pdfFile.name}-${Date.now()}`;
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
      toast.success(`Leçon ${isEditMode ? 'mise à jour' : 'créée'} !`);
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      onClose();
    },
    onError: (error) => toast.error(`Erreur: ${error.message}`),
  });

  const onSubmit = (data: LessonFormValues) => {
    mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modifier la leçon" : "Ajouter une nouvelle leçon"}</DialogTitle>
          <DialogDescription>Remplissez les détails de la leçon ci-dessous.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="order_index" render={({ field }) => (<FormItem><FormLabel>Ordre</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="lesson_type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="video">Vidéo</SelectItem><SelectItem value="pdf">PDF</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />

            {form.watch('lesson_type') === 'video' && (
              <FormField control={form.control} name="video_url" render={({ field }) => (<FormItem><FormLabel>URL de la vidéo</FormLabel><FormControl><Input placeholder="https://youtube.com/embed/..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            )}

            {form.watch('lesson_type') === 'pdf' && (
              <FormItem>
                <FormLabel>Fichier PDF</FormLabel>
                <FormControl>
                  <Input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Sauvegarde...' : 'Sauvegarder'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
