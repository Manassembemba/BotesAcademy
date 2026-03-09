import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const sessionSchema = z.object({
    session_name: z.string().min(3, "Le nom doit faire au moins 3 caractères."),
    start_date: z.string().min(1, "La date de début est requise."),
    end_date: z.string().min(1, "La date de fin est requise."),
    location: z.string().min(3, "Le lieu est requis."),
    max_students: z.coerce.number().positive("Le nombre d'étudiants doit être positif."),
    is_active: z.boolean().default(true),
}).refine((data) => {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return end > start;
}, {
    message: "La date de fin doit être postérieure à la date de début.",
    path: ["end_date"],
});

type SessionFormValues = z.infer<typeof sessionSchema>;

interface Session {
    id: string;
    course_id: string;
    session_name: string;
    start_date: string;
    end_date: string;
    location: string;
    max_students: number;
    current_students: number;
    is_active: boolean;
}

interface CourseSessionEditorDialogProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    session?: Session | null;
}

export const CourseSessionEditorDialog = ({ isOpen, onClose, courseId, session }: CourseSessionEditorDialogProps) => {
    const queryClient = useQueryClient();
    const isEditMode = Boolean(session);

    const defaultFormValues = {
        session_name: "",
        start_date: "",
        end_date: "",
        location: "Kinshasa, RDC",
        max_students: 20,
        is_active: true,
    };

    const form = useForm<SessionFormValues>({
        resolver: zodResolver(sessionSchema),
        defaultValues: defaultFormValues,
    });

    useEffect(() => {
        if (isOpen) {
            if (session) {
                // Convert dates to local format for datetime-local input
                const formatDate = (dateStr: string) => {
                    const date = new Date(dateStr);
                    return date.toISOString().slice(0, 16);
                };
                form.reset({
                    ...session,
                    start_date: formatDate(session.start_date),
                    end_date: formatDate(session.end_date),
                });
            } else {
                form.reset(defaultFormValues);
            }
        }
    }, [isOpen, session, form]);

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: SessionFormValues) => {
            const dataToSave = {
                ...data,
                course_id: courseId,
                start_date: new Date(data.start_date).toISOString(),
                end_date: new Date(data.end_date).toISOString(),
            };

            if (isEditMode && session) {
                const { error } = await supabase.from('course_sessions').update(dataToSave).eq('id', session.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('course_sessions').insert([dataToSave]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            toast.success(`Session ${isEditMode ? 'mise à jour' : 'créée'} !`);
            queryClient.invalidateQueries({ queryKey: ['courseSessions', courseId] });
            onClose();
        },
        onError: (error) => toast.error(`Erreur: ${error.message}`),
    });

    const onSubmit = (data: SessionFormValues) => {
        mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Modifier la session" : "Ajouter une session"}</DialogTitle>
                    <DialogDescription>Définissez les dates et le lieu pour cette session présentielle.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="session_name" render={({ field }) => (
                            <FormItem><FormLabel>Nom de la session</FormLabel><FormControl><Input placeholder="Session de Mars 2026" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <FormField control={form.control} name="location" render={({ field }) => (
                            <FormItem><FormLabel>Lieu</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="start_date" render={({ field }) => (
                                <FormItem><FormLabel>Début</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="end_date" render={({ field }) => (
                                <FormItem><FormLabel>Fin</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="max_students" render={({ field }) => (
                            <FormItem><FormLabel>Capacité (Max étudiants)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <FormField control={form.control} name="is_active" render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                <FormLabel className="text-sm font-medium">Session Active</FormLabel>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />

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
