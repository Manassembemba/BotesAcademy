import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const paymentProofSchema = z.object({
    payment_method: z.enum(['mobile_money', 'bank_transfer', 'cash_deposit', 'other']),
    transaction_reference: z.string().optional(),
    amount: z.coerce.number().positive("Le montant doit être positif"),
    vacation_id: z.string().optional(),
});

type PaymentProofFormValues = z.infer<typeof paymentProofSchema>;

interface PaymentProofDialogProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    courseTitle: string;
    coursePrice: number;
}

export const PaymentProofDialog = ({ isOpen, onClose, courseId, courseTitle, coursePrice }: PaymentProofDialogProps) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const { data: vacations } = useQuery({
        queryKey: ['courseVacations', courseId],
        queryFn: async () => {
            if (!courseId) return [];
            const { data, error } = await supabase.from('course_vacations' as any).select('*').eq('course_id', courseId);
            if (error) throw error;
            return data || [];
        },
        enabled: isOpen && !!courseId,
    });

    const form = useForm<PaymentProofFormValues>({
        resolver: zodResolver(paymentProofSchema),
        defaultValues: {
            payment_method: 'mobile_money',
            transaction_reference: '',
            amount: coursePrice,
            vacation_id: '',
        },
    });

    const uploadMutation = useMutation({
        mutationFn: async (data: PaymentProofFormValues) => {
            if (!user) throw new Error("Vous devez être connecté");
            if (!proofFile) throw new Error("Veuillez sélectionner une preuve de paiement");

            // Upload proof image to Supabase Storage
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `${user.id}_${courseId}_${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('payment-proofs')
                .upload(filePath, proofFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('payment-proofs')
                .getPublicUrl(filePath);

            // Create payment proof record
            const { error: insertError } = await supabase
                .from('payment_proofs')
                .insert({
                    user_id: user.id,
                    course_id: courseId,
                    proof_url: urlData.publicUrl,
                    payment_method: data.payment_method,
                    amount: data.amount,
                    transaction_reference: data.transaction_reference || null,
                    status: 'pending',
                    vacation_id: data.vacation_id || null,
                });

            if (insertError) throw insertError;
        },
        onSuccess: () => {
            toast.success("Preuve de paiement envoyée avec succès ! En attente de validation.");
            queryClient.invalidateQueries({ queryKey: ['userAccess', courseId, user?.id] });
            queryClient.invalidateQueries({ queryKey: ['paymentProofs', user?.id] });
            form.reset();
            setProofFile(null);
            onClose();
        },
        onError: (error: Error) => {
            toast.error(`Erreur: ${error.message}`);
        },
    });

    const onSubmit = (data: PaymentProofFormValues) => {
        uploadMutation.mutate(data);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error("Veuillez sélectionner une image");
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("L'image ne doit pas dépasser 5 MB");
                return;
            }
            setProofFile(file);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Soumettre une preuve de paiement</DialogTitle>
                    <DialogDescription>
                        Cours : <span className="font-semibold">{courseTitle}</span>
                        <br />
                        Montant : <span className="font-semibold">{coursePrice} USD</span>
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="payment_method"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Méthode de paiement</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                            <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                                            <SelectItem value="cash_deposit">Dépôt en espèces</SelectItem>
                                            <SelectItem value="other">Autre</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="transaction_reference"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Référence de transaction (optionnel)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: TXN123456789" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Montant payé (USD)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {vacations && vacations.length > 0 && (
                            <FormField
                                control={form.control}
                                name="vacation_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Créneau Horaire (Vacation)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un créneau" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {vacations.map((v: any) => (
                                                    <SelectItem key={v.id} value={v.id}>
                                                        {v.name} ({v.time_range})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormItem>
                            <FormLabel>Preuve de paiement (Screenshot ou Photo)</FormLabel>
                            <FormControl>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="cursor-pointer"
                                    />
                                    {proofFile && (
                                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                    )}
                                </div>
                            </FormControl>
                            {proofFile && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Fichier sélectionné : {proofFile.name}
                                </p>
                            )}
                            <FormMessage />
                        </FormItem>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={uploadMutation.isPending || !proofFile}>
                                {uploadMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Soumettre
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
