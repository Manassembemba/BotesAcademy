import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";

const studentSchema = z.object({
    full_name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
    email: z.string().email("Format d'email invalide"),
    mt5_id: z.string().optional(),
    course_id: z.string().min(1, "Veuillez choisir une formation"),
    session_id: z.string().optional(),
    vacation_name: z.string().default("MATIN"),
    amount: z.coerce.number().min(0, "Le montant ne peut pas être négatif"),
    payment_method: z.enum(["cash_deposit", "mobile_money", "bank_transfer"]),
    shouldNotify: z.boolean().default(true)
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface AddStudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    allCourses: any[];
    courseSessions: any[];
    addStudentMutation: any;
}

export const AddStudentDialog = ({
    open,
    onOpenChange,
    allCourses,
    courseSessions,
    addStudentMutation
}: AddStudentDialogProps) => {
    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            full_name: "",
            email: "",
            mt5_id: "",
            course_id: "",
            session_id: "",
            vacation_name: "MATIN",
            amount: 0,
            payment_method: "cash_deposit",
            shouldNotify: true
        }
    });

    const selectedCourseId = form.watch("course_id");
    const selectedSessionId = form.watch("session_id");

    // Update amount and filter sessions when course changes
    const filteredSessions = courseSessions?.filter(s => s.course_id === selectedCourseId) || [];

    useEffect(() => {
        if (selectedCourseId) {
            const course = allCourses.find(c => c.id === selectedCourseId);
            if (course) {
                form.setValue("amount", course.price);
            }
        }
    }, [selectedCourseId, allCourses, form]);

    // Update vacation_name when session changes
    useEffect(() => {
        if (selectedSessionId) {
            const session = courseSessions?.find(s => s.id === selectedSessionId);
            if (session) {
                form.setValue("vacation_name", session.vacation_name || "");
            }
        }
    }, [selectedSessionId, courseSessions, form]);

    const onSubmit = (values: StudentFormValues) => {
        const { shouldNotify, ...studentData } = values;
        addStudentMutation.mutate({ student: studentData, shouldNotify }, {
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) form.reset();
            onOpenChange(val);
        }}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-black uppercase italic tracking-tighter text-2xl">Inscrire un étudiant</DialogTitle>
                    <DialogDescription className="text-xs font-medium italic">
                        Inscrit l'étudiant, enregistre le paiement et envoie une invitation par email.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
                            <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p className="text-xs font-medium leading-relaxed">
                                L'étudiant recevra un <strong>lien d'invitation sécurisé</strong> pour définir son propre mot de passe.
                            </p>
                        </div>

                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-[10px] font-black uppercase opacity-60">Nom Complet</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ex: Jean Dupont" className="bg-primary/5 border-primary/10 h-12 rounded-xl" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="mt5_id"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-[10px] font-black uppercase opacity-60 flex items-center gap-1.5">Compte MT5 <Badge variant="outline" className="text-[8px] py-0 h-4 border-primary/20 text-primary uppercase">Optionnel</Badge></FormLabel>
                                    <FormControl>
                                        <Input placeholder="ex: 12345678" className="bg-primary/5 border-primary/10 h-12 rounded-xl font-mono" {...field} />
                                    </FormControl>
                                    <p className="text-[9px] text-muted-foreground italic font-medium">Nécessaire pour l'activation des outils trading.</p>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-[10px] font-black uppercase opacity-60">Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="exemple@email.com" className="bg-primary/5 border-primary/10 h-12 rounded-xl" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="course_id"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-[10px] font-black uppercase opacity-60">Formation</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-primary/5 border-primary/10 h-12 rounded-xl">
                                                <SelectValue placeholder="Choisir un cours" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl border-primary/10">
                                            {allCourses?.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.title} (${c.price})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="vacation_name"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-[10px] font-black uppercase opacity-60">Horaire de Cours Souhaité</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || "MATIN"}>
                                        <FormControl>
                                            <SelectTrigger className="bg-primary/5 border-primary/20 h-12 rounded-xl">
                                                <SelectValue placeholder="Choisir un horaire" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl border-primary/10">
                                            <SelectItem value="MATIN">Matin (08h00 - 11h00)</SelectItem>
                                            <SelectItem value="MIDI">Midi (11h30 - 14h30)</SelectItem>
                                            <SelectItem value="SOIR">Soir (16h00 - 19h00)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-[10px] font-black uppercase opacity-60">Montant Reçu ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" className="bg-primary/5 border-primary/10 h-12 rounded-xl" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="payment_method"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-[10px] font-black uppercase opacity-60">Mode Paiement</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-primary/5 border-primary/10 h-12 rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-primary/10">
                                                <SelectItem value="cash_deposit">Cash / Espèces</SelectItem>
                                                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                                <SelectItem value="bank_transfer">Virement</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="shouldNotify"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-0">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-sm font-bold">Email de bienvenue</FormLabel>
                                        <p className="text-[9px] text-muted-foreground uppercase font-black opacity-60">Envoyer une notification</p>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2 pt-4">
                            <Button type="button" variant="ghost" className="rounded-xl font-bold uppercase text-xs" onClick={() => onOpenChange(false)}>Annuler</Button>
                            <Button
                                type="submit"
                                disabled={addStudentMutation.isPending}
                                className="bg-emerald-600 hover:bg-emerald-700 shadow-glow-primary rounded-xl px-8 font-black uppercase tracking-widest text-xs h-12"
                            >
                                {addStudentMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Inscription...
                                    </>
                                ) : "Valider l'inscription"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
