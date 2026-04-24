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
import { Calendar, MapPin, Users, Save, Loader2, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
                const formatDate = (dateStr: string) => {
                    const date = new Date(dateStr);
                    // Handle offset to get local string for datetime-local
                    const offset = date.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
                    return localISOTime;
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
            toast.success(`Cohorte ${isEditMode ? 'mise à jour' : 'planifiée'} avec succès.`);
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
            <DialogContent className="sm:max-w-[500px] p-0 rounded-[3rem] overflow-hidden border-amber-500/20 bg-card/95 backdrop-blur-2xl shadow-2xl">
                <div className="bg-amber-500/10 p-8 border-b border-white/10 relative">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><Calendar className="w-24 h-24" /></div>
                    <DialogHeader className="relative z-10">
                        <Badge className="bg-amber-500 text-white border-none w-fit px-4 py-1 rounded-full font-black uppercase text-[9px] tracking-widest mb-3">Logistics Terminal</Badge>
                        <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter leading-none text-white">
                            {isEditMode ? "MODIFIER" : "PLANIFIER"} <span className="text-amber-500">SESSION</span>
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Gestion temporelle et logistique de la cohorte</DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">
                        <FormField control={form.control} name="session_name" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-60">Intitulé de la session</FormLabel>
                                <FormControl><Input placeholder="Ex: Promotion Elite - Mars 2026" {...field} className="rounded-xl h-12 border-white/10 font-bold bg-white/5" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="location" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-60 flex items-center gap-2"><MapPin className="w-3 h-3" /> Lieu / Campus</FormLabel>
                                <FormControl><Input {...field} className="rounded-xl h-12 border-white/10 font-bold bg-white/5" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-6">
                            <FormField control={form.control} name="start_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-60">Ouverture</FormLabel>
                                    <FormControl><Input type="datetime-local" {...field} className="rounded-xl h-12 border-white/10 font-bold bg-white/5" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="end_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-60">Clôture</FormLabel>
                                    <FormControl><Input type="datetime-local" {...field} className="rounded-xl h-12 border-white/10 font-bold bg-white/5" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 items-center">
                            <FormField control={form.control} name="max_students" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-black uppercase text-[9px] tracking-widest opacity-60 flex items-center gap-2"><Users className="w-3 h-3" /> Capacité Max.</FormLabel>
                                    <FormControl><Input type="number" {...field} className="rounded-xl h-12 border-white/10 font-black text-xl bg-white/5" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="is_active" render={({ field }) => (
                                <FormItem className="flex items-center justify-between p-4 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 mt-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Statut Actif</FormLabel>
                                        <p className="text-[8px] text-muted-foreground uppercase font-bold italic">Visible par les élèves</p>
                                    </div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <DialogFooter className="gap-4 pt-4">
                            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-12">Annuler</Button>
                            <Button type="submit" disabled={isPending} className="flex-1 rounded-[1.5rem] h-14 font-black uppercase text-[10px] tracking-[0.2em] shadow-glow-amber group overflow-hidden relative border-2 border-white/10">
                                <span className="relative z-10 flex items-center justify-center gap-3 text-white">
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                                    {isEditMode ? 'Actualiser' : 'Planifier la Cohorte'}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
