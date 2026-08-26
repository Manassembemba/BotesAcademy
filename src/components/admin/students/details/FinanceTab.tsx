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
    
    // Calculs financiers robustes
    const realTotalCollected = studentCoursesDetails?.reduce((acc, curr) => acc + (Number(curr.paid_amount) || 0), 0) || 0;
    const totalRemainingDebt = studentCoursesDetails?.reduce((acc, curr) => {
        const total = Number(curr.total_amount) || 0;
        const paid = Number(curr.paid_amount) || 0;
        const debt = total - paid;
        return acc + (debt > 0 ? debt : 0);
    }, 0) || 0;

    if (isLoading) {
        return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;
    }

    return (
        <div className="space-y-8 pt-8 outline-none pb-12">
            {/* Header de Santé Financière */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-inner">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 opacity-60 mb-2">Total Recouvré</div>
                    <div className="text-4xl font-black italic tracking-tighter text-emerald-500 leading-none">
                        ${realTotalCollected}
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-emerald-500/10 w-24 h-24 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
                </div>
                
                <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-inner">
                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-600 opacity-60 mb-2">Dette Actuelle</div>
                    <div className="text-4xl font-black italic tracking-tighter text-amber-500 leading-none">
                        ${totalRemainingDebt}
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-amber-500/10 w-24 h-24 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
                </div>

                <div className="bg-primary/5 border border-primary/10 p-4 rounded-[2.5rem] flex items-center justify-center">
                    <Button 
                        onClick={() => setIsEnrollDialogOpen(true)} 
                        className="w-full h-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-3xl font-black uppercase text-xs tracking-[0.1em] shadow-[0_10px_30px_-10px_rgba(var(--primary),0.5)] transition-all hover:scale-[1.02] active:scale-95 py-6"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Inscrire
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] italic opacity-80">Portefeuille Académique</h3>
            </div>

            <div className="space-y-6">
                {studentCoursesDetails?.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                        <Landmark className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">Aucun engagement financier</p>
                    </div>
                ) : (
                    studentCoursesDetails?.map((purchase: any) => {
                        const total = Number(purchase.total_amount) || 0;
                        const paid = Number(purchase.paid_amount) || 0;
                        const balance = total - paid;
                        
                        // Progression plafonnée à 100%
                        const progress = total > 0 ? Math.min((paid / total) * 100, 100) : (paid > 0 ? 100 : 0);
                        const isOverdue = purchase.due_date && new Date(purchase.due_date) < new Date() && balance > 0;
                        
                        return (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                key={purchase.id} 
                                className={`p-8 rounded-[3rem] border transition-all hover:shadow-2xl ${balance <= 0 ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : 'border-amber-500/20 bg-amber-500/[0.03]'} group relative overflow-hidden`}
                            >
                                {/* Statut Visuel Principal */}
                                <div className="absolute top-0 right-0 overflow-hidden rounded-bl-[2.5rem]">
                                    {purchase.is_disputed ? (
                                        <div className="bg-purple-600 text-white px-8 py-2 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 animate-pulse">
                                            <AlertTriangle className="w-3 h-3" /> ⚖️ Litige Financier ({purchase.dispute_reason || 'En cours'})
                                        </div>
                                    ) : purchase.enrollment_status === 'graduated' ? (
                                        <div className="bg-purple-600 text-white px-8 py-2 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                            <CheckCircle2 className="w-3 h-3" /> 🎓 Formation Terminée & Diplômé
                                        </div>
                                    ) : balance === 0 ? (
                                        <div className="bg-emerald-500 text-white px-8 py-2 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                            <CheckCircle2 className="w-3 h-3" /> Dossier Soldé
                                        </div>
                                    ) : balance < 0 ? (
                                        <div className="bg-blue-600 text-white px-8 py-2 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Landmark className="w-3 h-3" /> Trop-Perçu (${Math.abs(balance)})
                                        </div>
                                    ) : isOverdue ? (
                                        <div className="bg-destructive text-white px-8 py-2 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 animate-pulse">
                                            <AlertTriangle className="w-3 h-3" /> En Retard
                                        </div>
                                    ) : (
                                        <div className="bg-amber-500 text-white px-8 py-2 text-[9px] font-black uppercase tracking-[0.2em]">
                                            Versement en cours
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 mt-2">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl transition-all group-hover:scale-110 ${balance <= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            <Landmark className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h4 className="font-black uppercase italic tracking-tighter text-2xl leading-none group-hover:text-primary transition-colors">{purchase.courses?.title}</h4>
                                            <div className="flex items-center gap-3 mt-3">
                                                <Badge variant="outline" className="text-[8px] font-black tracking-widest border-white/10 uppercase bg-white/5">{purchase.course_sessions?.session_name}</Badge>
                                                <div className="flex items-center gap-1.5 opacity-40">
                                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest italic">
                                                        {purchase.due_date ? format(new Date(purchase.due_date), 'dd MMM yyyy', { locale: fr }) : 'Sans échéance'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Recouvrement</div>
                                        <div className="text-4xl font-black italic tracking-tighter text-primary">{Math.round(progress)}%</div>
                                    </div>
                                </div>

                                {/* Panneau de Vision Financière */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shadow-inner">
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Valeur Formation</div>
                                        <div className="text-3xl font-black italic tracking-tighter">${total}</div>
                                    </div>
                                    <div className="bg-emerald-500/5 backdrop-blur-md p-6 rounded-[2rem] border border-emerald-500/10 shadow-inner">
                                        <div className="text-[10px] font-black uppercase text-emerald-600 opacity-60 mb-2">Montant Perçu</div>
                                        <div className="text-3xl font-black italic tracking-tighter text-emerald-500">${paid}</div>
                                    </div>
                                    <div className={`${balance > 0 ? 'bg-amber-500/10 border-amber-500/20' : balance < 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/5 border-white/5'} backdrop-blur-md p-6 rounded-[2rem] border shadow-inner transition-colors`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${balance > 0 ? 'text-amber-600 opacity-80' : balance < 0 ? 'text-blue-600' : 'text-emerald-600 opacity-60'}`}>
                                            {balance < 0 ? 'Surplus (Trop-perçu)' : 'Reste à Payer'}
                                        </div>
                                        <div className={`text-3xl font-black italic tracking-tighter ${balance > 0 ? 'text-amber-500' : balance < 0 ? 'text-blue-500' : 'text-emerald-500 opacity-40'}`}>
                                            ${Math.abs(balance)}
                                        </div>
                                    </div>
                                </div>

                                {/* Barre de Progression Stylisée */}
                                <div className="mt-8 px-2">
                                    <Progress value={progress} className={`h-2.5 rounded-full ${balance > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10'} overflow-hidden shadow-inner`} />
                                </div>

                                {/* Actions Spécifiques */}
                                <div className="flex items-center gap-4 mt-10 pt-8 border-t border-white/5 relative z-10">
                                    <Button 
                                        variant="ghost" 
                                        className="flex-1 rounded-[1.5rem] h-14 font-black uppercase tracking-widest text-[10px] hover:bg-white/5 gap-3 border border-white/5" 
                                        onClick={() => { setSelectedPurchase(purchase); setIsInstallmentsOpen(true); }}
                                    >
                                        <FileText className="w-4 h-4 opacity-60" /> Historique Tranches
                                    </Button>
                                    
                                    {purchase.is_disputed ? (
                                        <Button 
                                            className="flex-1 rounded-[1.5rem] h-14 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg gap-2" 
                                            onClick={async () => {
                                                const notes = prompt("Note de régularisation / Accord amiable :", "Régularisation litige validée par la direction");
                                                if (notes !== null) {
                                                    const { error } = await supabase.rpc('resolve_student_dispute_and_pay', { 
                                                        p_purchase_id: purchase.id,
                                                        p_payment_amount: balance > 0 ? balance : 0,
                                                        p_payment_method: 'cash',
                                                        p_resolution_notes: notes
                                                    });
                                                    if (error) toast.error(error.message);
                                                    else toast.success("Litige régularisé et dossier remis en règle !");
                                                }
                                            }}
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Régulariser le Litige
                                        </Button>
                                    ) : balance > 0 ? (
                                        <Button 
                                            className="flex-1 rounded-[1.5rem] h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] shadow-glow-primary gap-3 hover:scale-[1.02] transition-transform" 
                                            onClick={() => {
                                                setSelectedPurchase(purchase);
                                                setManualPaymentAmount(balance);
                                                setIsManualPaymentOpen(true);
                                            }}
                                        >
                                            <Landmark className="w-4 h-4" /> Solder (${balance})
                                        </Button>
                                    ) : purchase.enrollment_status !== 'graduated' ? (
                                        <Button 
                                            className="flex-1 rounded-[1.5rem] h-14 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg gap-2" 
                                            onClick={async () => {
                                                if (confirm(`Confirmer la réussite et la fin de formation de cet étudiant pour ${purchase.courses?.title} ?`)) {
                                                    const { error } = await supabase.rpc('graduate_student', { p_purchase_id: purchase.id });
                                                    if (error) toast.error(error.message);
                                                    else toast.success("Étudiant diplômé et formation clôturée !");
                                                }
                                            }}
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Clôturer & Diplômer
                                        </Button>
                                    ) : null}

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl text-white/10 hover:text-destructive hover:bg-destructive/10 transition-colors">
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-[2.5rem] bg-card border-white/10 shadow-2xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="font-black uppercase italic text-2xl">Résilier le contrat ?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-muted-foreground italic font-medium py-4">
                                                    Cette action retirera l'étudiant de la formation <span className="text-primary font-bold">{purchase.courses?.title}</span>. Les versements déjà effectués seront conservés en historique mais l'accès sera coupé.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="gap-4">
                                                <AlertDialogCancel className="rounded-2xl h-14 font-bold border-white/5 uppercase text-xs tracking-widest">Garder l'engagement</AlertDialogCancel>
                                                <AlertDialogAction className="bg-destructive text-white rounded-2xl h-14 font-black uppercase tracking-widest text-xs px-8" onClick={() => deleteMutation.mutate({ type: 'course', id: purchase.id })}>Résilier l'accès</AlertDialogAction>
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
