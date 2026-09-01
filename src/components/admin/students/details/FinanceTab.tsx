import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Clock, FileText, Loader2, Landmark, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface FinanceTabProps {
    selectedStudent: any;
    studentCoursesDetails: any[] | null;
    isLoading: boolean;
    setIsEnrollDialogOpen: (open: boolean) => void;
    setSelectedPurchase: (purchase: any) => void;
    setIsInstallmentsOpen: (open: boolean) => void;
    setManualPaymentAmount: (amount: number) => void;
    setIsManualPaymentOpen: (open: boolean) => void;
    deleteMutation: any;
}

export const FinanceTab = ({
    selectedStudent,
    studentCoursesDetails,
    isLoading,
    setIsEnrollDialogOpen,
    setSelectedPurchase,
    setIsInstallmentsOpen,
    setManualPaymentAmount,
    setIsManualPaymentOpen,
    deleteMutation
}: FinanceTabProps) => {
    const queryClient = useQueryClient();
    
    // Calculs financiers
    const realTotalCollected = studentCoursesDetails?.reduce((acc, curr) => acc + (Number(curr.paid_amount) || 0), 0) || 0;
    const totalRemainingDebt = studentCoursesDetails?.reduce((acc, curr) => {
        const total = Number(curr.total_amount) || 0;
        const paid = Number(curr.paid_amount) || 0;
        const debt = total - paid;
        return acc + (debt > 0 ? debt : 0);
    }, 0) || 0;

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary opacity-40" /></div>;
    }

    return (
        <div className="space-y-5 pt-1">
            {/* KPI Financiers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl">
                    <div className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider mb-1">Total Recouvré</div>
                    <div className="text-2xl font-bold text-emerald-500">${realTotalCollected.toLocaleString()}</div>
                </div>
                
                <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl">
                    <div className="text-[10px] font-medium text-amber-600 uppercase tracking-wider mb-1">Dette Actuelle</div>
                    <div className="text-2xl font-bold text-amber-500">${totalRemainingDebt.toLocaleString()}</div>
                </div>

                <div className="flex items-center justify-center bg-primary/5 border border-primary/20 p-3 rounded-2xl">
                    <Button 
                        onClick={() => setIsEnrollDialogOpen(true)} 
                        size="sm"
                        className="w-full h-9 font-semibold text-xs rounded-xl gap-2"
                    >
                        <Plus className="w-3.5 h-3.5" /> Inscrire / Payer
                    </Button>
                </div>
            </div>

            {/* Titre section */}
            <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Portefeuille Académique</h3>
            </div>

            {/* Liste des formations */}
            <div className="space-y-3">
                {studentCoursesDetails?.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border/60">
                        <Landmark className="w-8 h-8 mx-auto mb-2.5 text-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground">Aucun engagement financier</p>
                    </div>
                ) : (
                    studentCoursesDetails?.map((purchase: any) => {
                        const total = Number(purchase.total_amount) || 0;
                        const paid = Number(purchase.paid_amount) || 0;
                        const balance = total - paid;
                        
                        const progress = total > 0 ? Math.min((paid / total) * 100, 100) : (paid > 0 ? 100 : 0);
                        const isOverdue = purchase.due_date && new Date(purchase.due_date) < new Date() && balance > 0;
                        
                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 8 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                key={purchase.id} 
                                className={`p-4 rounded-2xl border transition-colors ${balance <= 0 ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : isOverdue ? 'border-destructive/20 bg-destructive/[0.02]' : 'border-amber-500/20 bg-amber-500/[0.02]'}`}
                            >
                                {/* Header formation */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${balance <= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            <Landmark className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-foreground leading-tight">{purchase.courses?.title}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {purchase.course_sessions?.session_name && (
                                                    <Badge variant="outline" className="text-[9px] font-medium h-4 px-1.5">{purchase.course_sessions.session_name}</Badge>
                                                )}
                                                {purchase.due_date && (
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(purchase.due_date), 'dd MMM yyyy', { locale: fr })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs text-muted-foreground">Recouvrement</div>
                                        <div className="text-lg font-bold text-primary">{Math.round(progress)}%</div>
                                    </div>
                                </div>

                                {/* Barre de progression */}
                                <Progress value={progress} className="h-1.5 mb-3" />

                                {/* Chiffres clés */}
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="bg-muted/40 p-2.5 rounded-xl text-center border border-border/40">
                                        <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Total</div>
                                        <div className="text-sm font-bold">${total.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-emerald-500/5 p-2.5 rounded-xl text-center border border-emerald-500/15">
                                        <div className="text-[9px] text-emerald-600 uppercase tracking-wide mb-0.5">Perçu</div>
                                        <div className="text-sm font-bold text-emerald-500">${paid.toLocaleString()}</div>
                                    </div>
                                    <div className={`p-2.5 rounded-xl text-center border ${balance > 0 ? 'bg-amber-500/5 border-amber-500/15' : balance < 0 ? 'bg-blue-500/5 border-blue-500/15' : 'bg-muted/40 border-border/40'}`}>
                                        <div className={`text-[9px] uppercase tracking-wide mb-0.5 ${balance > 0 ? 'text-amber-600' : balance < 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                                            {balance < 0 ? 'Surplus' : 'Reste'}
                                        </div>
                                        <div className={`text-sm font-bold ${balance > 0 ? 'text-amber-500' : balance < 0 ? 'text-blue-500' : 'text-muted-foreground'}`}>
                                            ${Math.abs(balance).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Badge statut */}
                                <div className="mb-3">
                                    {purchase.is_disputed ? (
                                        <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px] gap-1"><AlertTriangle className="w-3 h-3" /> Litige financier</Badge>
                                    ) : purchase.enrollment_status === 'graduated' ? (
                                        <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px] gap-1"><CheckCircle2 className="w-3 h-3" /> Diplômé</Badge>
                                    ) : balance === 0 ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] gap-1"><CheckCircle2 className="w-3 h-3" /> Soldé</Badge>
                                    ) : isOverdue ? (
                                        <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1"><AlertTriangle className="w-3 h-3" /> En retard</Badge>
                                    ) : (
                                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Versement en cours</Badge>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-3 border-t border-border/30">
                                    <Button 
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-8 rounded-xl text-xs font-medium gap-1.5 border-border/60" 
                                        onClick={() => { setSelectedPurchase(purchase); setIsInstallmentsOpen(true); }}
                                    >
                                        <FileText className="w-3.5 h-3.5" /> Historique
                                    </Button>
                                    
                                    {purchase.is_disputed ? (
                                        <Button 
                                            size="sm"
                                            className="flex-1 h-8 rounded-xl text-xs font-medium gap-1.5 bg-purple-600 hover:bg-purple-700 text-white" 
                                            onClick={async () => {
                                                const notes = prompt("Note de régularisation :", "Régularisation validée par la direction");
                                                if (notes !== null) {
                                                    const { error } = await supabase.rpc('resolve_student_dispute_and_pay', { 
                                                        p_purchase_id: purchase.id,
                                                        p_payment_amount: balance > 0 ? balance : 0,
                                                        p_payment_method: 'cash',
                                                        p_resolution_notes: notes
                                                    });
                                                    if (error) {
                                                        toast.error(error.message);
                                                    } else {
                                                        toast.success("Litige régularisé !");
                                                        queryClient.invalidateQueries({ queryKey: ['student-courses'] });
                                                        queryClient.invalidateQueries({ queryKey: ['admin-students'] });
                                                    }
                                                }
                                            }}
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Régulariser
                                        </Button>
                                    ) : balance > 0 ? (
                                        <Button 
                                            size="sm"
                                            className="flex-1 h-8 rounded-xl text-xs font-medium gap-1.5" 
                                            onClick={() => {
                                                setSelectedPurchase(purchase);
                                                setManualPaymentAmount(balance);
                                                setIsManualPaymentOpen(true);
                                            }}
                                        >
                                            <Landmark className="w-3.5 h-3.5" /> Solder (${balance.toLocaleString()})
                                        </Button>
                                    ) : purchase.enrollment_status !== 'graduated' ? (
                                        <Button 
                                            size="sm"
                                            className="flex-1 h-8 rounded-xl text-xs font-medium gap-1.5 bg-purple-600 hover:bg-purple-700 text-white" 
                                            onClick={async () => {
                                                if (confirm(`Confirmer la réussite et délivrer le diplôme à cet étudiant pour ${purchase.courses?.title} ?`)) {
                                                    const { error } = await supabase.rpc('graduate_student', { p_purchase_id: purchase.id });
                                                    if (error) {
                                                        toast.error(error.message);
                                                    } else {
                                                        toast.success("Étudiant diplômé et certificat délivré avec succès !");
                                                        queryClient.invalidateQueries({ queryKey: ['student-courses'] });
                                                        queryClient.invalidateQueries({ queryKey: ['admin-students'] });
                                                    }
                                                }
                                            }}
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Diplômer
                                        </Button>
                                    ) : null}

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-2xl border-border/50">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="font-bold text-lg">Résilier le contrat ?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-sm text-muted-foreground pt-1">
                                                    Cette action retirera l'étudiant de la formation <span className="font-semibold text-foreground">{purchase.courses?.title}</span>. Les versements effectués seront conservés en historique.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="gap-2">
                                                <AlertDialogCancel className="rounded-xl h-9 text-xs font-semibold">Garder l'engagement</AlertDialogCancel>
                                                <AlertDialogAction className="bg-destructive text-destructive-foreground rounded-xl h-9 text-xs font-semibold px-6 hover:bg-destructive/90" onClick={() => deleteMutation.mutate({ type: 'course', id: purchase.id })}>
                                                    Résilier l'accès
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
