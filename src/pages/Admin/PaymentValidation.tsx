import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PaymentProof {
    id: string;
    user_id: string;
    course_id: string | null;
    strategy_id: string | null;
    indicator_id: string | null;
    proof_url: string;
    payment_method: string;
    amount: number;
    transaction_reference: string | null;
    status: 'pending' | 'approved' | 'rejected';
    admin_notes: string | null;
    created_at: string;
    validated_at: string | null;
    validated_by: string | null;
    session_id?: string | null;
    profiles?: { full_name?: string };
    courses?: { title: string };
    strategies?: { title: string };
    indicators?: { name: string };
    course_sessions?: {
        start_date: string;
        location: string;
    } | null;
}

const PaymentValidation = () => {
    const queryClient = useQueryClient();
    const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
    const [adminNotes, setAdminNotes] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Fetch payment proofs
    const { data: paymentProofs, isLoading, error: queryError } = useQuery({
        queryKey: ['adminPaymentProofs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('payment_proofs')
                .select(`
                    *,
                    profiles!payment_proofs_user_id_fkey (full_name),
                    courses (title),
                    strategies (title),
                    indicators (name),
                    course_sessions!session_id (start_date, location)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as PaymentProof[];
        },
    });

    const validateMutation = useMutation({
        mutationFn: async ({ proofId, notes }: { proofId: string; admin_notes_text?: string; notes?: string }) => {
            const { data, error } = await supabase.rpc('validate_payment', {
                proof_id: proofId,
                admin_notes_text: notes || ""
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast.success("Paiement approuvé et accès débloqué !");
            queryClient.invalidateQueries({ queryKey: ['adminPaymentProofs'] });
            setIsDialogOpen(false);
            setSelectedProof(null);
            setAdminNotes("");
        },
        onError: (error: any) => {
            toast.error(`Erreur lors de la validation: ${error.message}`);
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ proofId, notes }: { proofId: string; admin_notes_text: string; notes: string }) => {
            const { data, error } = await supabase.rpc('reject_payment', {
                proof_id: proofId,
                admin_notes_text: notes
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast.success("Paiement rejeté.");
            queryClient.invalidateQueries({ queryKey: ['adminPaymentProofs'] });
            setIsDialogOpen(false);
            setSelectedProof(null);
            setAdminNotes("");
        },
        onError: (error: any) => {
            toast.error(`Erreur lors du rejet: ${error.message}`);
        },
    });

    const handleViewProof = (proof: PaymentProof) => {
        setSelectedProof(proof);
        setAdminNotes(proof.admin_notes || "");
        setIsDialogOpen(true);
    };

    const handleValidate = () => {
        if (!selectedProof) return;
        validateMutation.mutate({ proofId: selectedProof.id, notes: adminNotes });
    };

    const handleReject = () => {
        if (!selectedProof) return;
        if (!adminNotes) {
            toast.error("Veuillez saisir un motif de rejet dans les notes.");
            return;
        }
        rejectMutation.mutate({ proofId: selectedProof.id, notes: adminNotes });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Approuvé</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejeté</Badge>;
            default: return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200">En attente</Badge>;
        }
    };

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            'mobile_money': 'Mobile Money',
            'bank_transfer': 'Virement bancaire',
            'cash_deposit': 'Dépôt Cash',
            'other': 'Autre'
        };
        return labels[method] || method;
    };

    const getProductName = (proof: PaymentProof) => {
        if (proof.courses?.title) return proof.courses.title;
        if (proof.strategies?.title) return `[Stratégie] ${proof.strategies.title}`;
        if (proof.indicators?.name) return `[Outil] ${proof.indicators.name}`;
        return 'Produit inconnu';
    };

    const renderProofsList = (proofs: PaymentProof[]) => (
        <div className="space-y-4">
            {proofs.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground border-dashed border-2">
                    Aucune preuve de paiement dans cette catégorie.
                </Card>
            ) : (
                proofs.map((proof) => (
                    <Card key={proof.id} className="p-5 border-primary/5 hover:border-primary/20 transition-all shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-lg">{getProductName(proof)}</h3>
                                    {getStatusBadge(proof.status)}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-8 text-sm">
                                    <p className="flex items-center gap-2"><span className="font-black text-[10px] uppercase text-muted-foreground w-20">Étudiant:</span> <span className="font-bold">{proof.profiles?.full_name || 'Inconnu'}</span></p>
                                    <p className="flex items-center gap-2"><span className="font-black text-[10px] uppercase text-muted-foreground w-20">Montant:</span> <span className="font-black text-emerald-600">{proof.amount} USD</span></p>
                                    <p className="flex items-center gap-2"><span className="font-black text-[10px] uppercase text-muted-foreground w-20">Méthode:</span> <span className="font-medium">{getPaymentMethodLabel(proof.payment_method)}</span></p>
                                    {proof.transaction_reference && (
                                        <p className="flex items-center gap-2"><span className="font-black text-[10px] uppercase text-muted-foreground w-20">Référence:</span> <span className="font-mono bg-muted px-1.5 rounded text-[11px]">{proof.transaction_reference}</span></p>
                                    )}
                                    {proof.course_sessions && (
                                        <p className="flex items-center gap-2 text-primary"><span className="font-black text-[10px] uppercase text-muted-foreground w-20">Session:</span> <span className="font-bold">{format(new Date(proof.course_sessions.start_date), 'dd/MM/yyyy')}</span></p>
                                    )}
                                    <p className="flex items-center gap-2"><span className="font-black text-[10px] uppercase text-muted-foreground w-20">Soumis le:</span> <span>{format(new Date(proof.created_at), 'dd MMM à HH:mm', { locale: fr })}</span></p>
                                </div>
                                {proof.admin_notes && (
                                    <div className="mt-2 p-3 bg-muted/50 rounded-xl text-xs italic border-l-4 border-primary/20">
                                        "{proof.admin_notes}"
                                    </div>
                                )}
                            </div>
                            <Button variant="hero" size="sm" onClick={() => handleViewProof(proof)} className="rounded-xl shadow-lg">
                                <Eye className="w-4 h-4 mr-2" />
                                Examiner
                            </Button>
                        </div>
                    </Card>
                ))
            )}
        </div>
    );

    return (
        <div className="container mx-auto p-6 space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-primary">Validation</h1>
                    <p className="text-muted-foreground font-medium">Contrôle financier des inscriptions et achats.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Card className="px-4 py-2 bg-amber-50 border-amber-200 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <div>
                            <div className="text-xl font-black text-amber-700">{paymentProofs?.filter(p => p.status === 'pending').length || 0}</div>
                            <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">À Traiter</div>
                        </div>
                    </Card>
                </div>
            </div>

            {queryError && (
                <div className="bg-destructive/10 p-6 rounded-2xl border-2 border-destructive/20 text-destructive space-y-2">
                    <p className="font-bold">Erreur de chargement des données.</p>
                    <p className="text-xs">{(queryError as any).message}</p>
                </div>
            )}

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="bg-muted/50 p-1 rounded-2xl border border-border/50 mb-8">
                    <TabsTrigger value="pending" className="rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest data-[state=active]:shadow-lg">
                        En attente
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest data-[state=active]:shadow-lg">
                        Approuvés
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest data-[state=active]:shadow-lg">
                        Rejetés
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                    {isLoading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div> : renderProofsList(paymentProofs?.filter(p => p.status === 'pending') || [])}
                </TabsContent>
                <TabsContent value="approved">
                    {isLoading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div> : renderProofsList(paymentProofs?.filter(p => p.status === 'approved') || [])}
                </TabsContent>
                <TabsContent value="rejected">
                    {isLoading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div> : renderProofsList(paymentProofs?.filter(p => p.status === 'rejected') || [])}
                </TabsContent>
            </Tabs>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Examen du paiement</DialogTitle>
                    </DialogHeader>

                    {selectedProof && (
                        <div className="grid md:grid-cols-2 gap-8 py-4">
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 p-4 bg-muted/30 rounded-2xl border border-border/50">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Produit</p>
                                        <p className="font-black text-primary text-lg leading-tight uppercase italic">{getProductName(selectedProof)}</p>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Étudiant</p>
                                        <p className="font-bold">{selectedProof.profiles?.full_name || 'Inconnu'}</p>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Montant</p>
                                        <p className="text-xl font-black text-emerald-600">{selectedProof.amount} USD</p>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Méthode</p>
                                        <p className="font-bold">{getPaymentMethodLabel(selectedProof.payment_method)}</p>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Date</p>
                                        <p className="font-bold">{format(new Date(selectedProof.created_at), 'dd/MM/yyyy')}</p>
                                    </div>
                                    {selectedProof.mt5_id && (
                                        <div className="col-span-2 p-4 bg-primary/10 rounded-2xl border border-primary/20 animate-pulse">
                                            <p className="text-[10px] font-black uppercase text-primary mb-1 tracking-widest">Compte MT5 à Configurer</p>
                                            <p className="text-2xl font-black font-mono tracking-widest text-primary">{selectedProof.mt5_id}</p>
                                            <p className="text-[10px] text-primary/70 italic mt-1 font-bold">L'indicateur doit être verrouillé sur cet ID.</p>
                                        </div>
                                    )}
                                </div>

                                {selectedProof.status === 'pending' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="font-black uppercase text-[10px] tracking-widest">Notes de validation (obligatoire pour rejet)</Label>
                                            <Textarea
                                                value={adminNotes}
                                                onChange={(e) => setAdminNotes(e.target.value)}
                                                placeholder="Ex: Reçu validé / Montant incorrect / Transaction non reçue..."
                                                className="rounded-2xl border-primary/10 min-h-[100px] resize-none text-sm font-medium"
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <Button
                                                variant="destructive"
                                                onClick={handleReject}
                                                disabled={rejectMutation.isPending || validateMutation.isPending}
                                                className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-xs"
                                            >
                                                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                                Rejeter
                                            </Button>
                                            <Button
                                                onClick={handleValidate}
                                                disabled={rejectMutation.isPending || validateMutation.isPending}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-glow-primary"
                                            >
                                                {validateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                                Approuver
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-2">Preuve de paiement (Screenshot / Reçu)</p>
                                <div className="rounded-3xl border-4 border-muted overflow-hidden shadow-2xl bg-muted">
                                    <img
                                        src={selectedProof.proof_url}
                                        alt="Preuve de paiement"
                                        className="w-full h-auto cursor-zoom-in transition-transform hover:scale-105 duration-500"
                                        onClick={() => window.open(selectedProof.proof_url, '_blank')}
                                    />
                                </div>
                                <p className="text-center text-[10px] text-muted-foreground italic mt-2">Cliquez sur l'image pour l'agrandir</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PaymentValidation;
