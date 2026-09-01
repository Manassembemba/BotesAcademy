import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, CreditCard, Landmark, Calendar, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InstallmentsHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedPurchase: any;
    installments: any[] | null | undefined;
    isLoadingInstallments: boolean;
}

export const InstallmentsHistoryDialog = ({
    open,
    onOpenChange,
    selectedPurchase,
    installments,
    isLoadingInstallments
}: InstallmentsHistoryDialogProps) => {
    // Robust extraction of course title across different Supabase relation formats
    const courseTitle = Array.isArray(selectedPurchase?.courses)
        ? selectedPurchase?.courses[0]?.title
        : selectedPurchase?.courses?.title || selectedPurchase?.course_title || "Formation Académique";

    const totalAmount = Number(selectedPurchase?.total_amount) || 0;
    const paidAmount = Number(selectedPurchase?.paid_amount) || 0;
    const remainingDebt = Math.max(0, totalAmount - paidAmount);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl rounded-2xl border-border/50 bg-card p-6 shadow-2xl">
                <DialogHeader className="space-y-2 pb-3 border-b border-border/40">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <History className="w-4 h-4" />
                        </div>
                        <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                            Historique des Versements
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Détail des règlements enregistrés pour <span className="font-semibold text-foreground">« {courseTitle} »</span>.
                    </DialogDescription>

                    {/* Synthèse financière rapide */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                        <div className="bg-muted/40 p-2.5 rounded-xl border border-border/40 text-center">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide block">Prix Cursus</span>
                            <span className="text-sm font-bold text-foreground">${totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/15 text-center">
                            <span className="text-[10px] text-emerald-600 uppercase tracking-wide block">Total Réglé</span>
                            <span className="text-sm font-bold text-emerald-500">${paidAmount.toLocaleString()}</span>
                        </div>
                        <div className={`p-2.5 rounded-xl border text-center ${remainingDebt > 0 ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 'bg-muted/40 border-border/40 text-muted-foreground'}`}>
                            <span className={`text-[10px] uppercase tracking-wide block ${remainingDebt > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>Reste Dû</span>
                            <span className="text-sm font-bold">${remainingDebt.toLocaleString()}</span>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="py-2">
                    {isLoadingInstallments ? (
                        <div className="flex flex-col items-center justify-center p-10 gap-2">
                            <Loader2 className="w-7 h-7 animate-spin text-primary opacity-40" />
                            <span className="text-xs text-muted-foreground">Chargement des versements...</span>
                        </div>
                    ) : installments && installments.length > 0 ? (
                        <div className="rounded-xl border border-border/50 overflow-hidden shadow-xs">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="border-border/40">
                                        <TableHead className="text-[11px] font-semibold text-muted-foreground h-9">Date</TableHead>
                                        <TableHead className="text-[11px] font-semibold text-muted-foreground h-9">Montant</TableHead>
                                        <TableHead className="text-[11px] font-semibold text-muted-foreground h-9">Mode</TableHead>
                                        <TableHead className="text-[11px] font-semibold text-muted-foreground h-9">Enregistré par</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {installments.map((inst: any) => (
                                        <TableRow key={inst.id} className="border-border/30 hover:bg-muted/20">
                                            <TableCell className="text-xs font-medium py-3">
                                                {inst.created_at ? format(new Date(inst.created_at), 'dd MMM yyyy HH:mm', { locale: fr }) : '—'}
                                            </TableCell>
                                            <TableCell className="text-xs font-bold text-emerald-600 py-3">
                                                +${Number(inst.amount || 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <Badge variant="outline" className="text-[10px] font-medium border-border/50 capitalize">
                                                    {inst.payment_method === 'cash_deposit' || inst.payment_method === 'cash' ? 'Espèces' : 
                                                     inst.payment_method === 'mobile_money' ? 'Mobile Money' : 
                                                     inst.payment_method === 'bank_transfer' ? 'Virement' : 
                                                     inst.payment_method || 'Direct'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <UserCheck className="w-3.5 h-3.5 text-primary/70" />
                                                    <span>{inst.admin?.full_name || 'Administration'}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8 px-4 bg-muted/20 rounded-xl border border-dashed border-border/60 space-y-2">
                            <Landmark className="w-8 h-8 mx-auto text-muted-foreground/30" />
                            {paidAmount > 0 ? (
                                <div>
                                    <p className="text-xs font-semibold text-foreground">
                                        Paiement initial de ${paidAmount.toLocaleString()} validé
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Enregistré directement lors de la souscription initiale (antérieur à l'échéancier des tranches).
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-xs font-semibold text-foreground">Aucun versement enregistré</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Cette formation est en attente de son premier règlement.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-2 border-t border-border/40">
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="h-9 px-4 rounded-xl text-xs font-semibold"
                        onClick={() => onOpenChange(false)}
                    >
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
