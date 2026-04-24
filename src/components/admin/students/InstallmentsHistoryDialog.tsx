import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, History } from "lucide-react";
import { format } from "date-fns";

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
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        Historique des Versements
                    </DialogTitle>
                    <DialogDescription>
                        Détail de tous les paiements effectués pour <span className="font-bold text-foreground">"{selectedPurchase?.courses?.title}"</span>.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                    {isLoadingInstallments ? (
                        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : installments && installments.length > 0 ? (
                        <div className="rounded-xl border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="text-[10px] uppercase font-black">Date</TableHead>
                                        <TableHead className="text-[10px] uppercase font-black">Montant</TableHead>
                                        <TableHead className="text-[10px] uppercase font-black">Méthode</TableHead>
                                        <TableHead className="text-[10px] uppercase font-black">Reçu par</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {installments.map((inst: any) => (
                                        <TableRow key={inst.id}>
                                            <TableCell className="text-xs font-medium">
                                                {format(new Date(inst.created_at), 'dd/MM/yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="text-sm font-black text-emerald-600">
                                                ${inst.amount}
                                            </TableCell>
                                            <TableCell className="text-xs uppercase font-bold text-muted-foreground">
                                                {inst.payment_method === 'cash_deposit' ? 'Espèces' : 
                                                 inst.payment_method === 'mobile_money' ? 'Mobile Money' : 'Virement'}
                                            </TableCell>
                                            <TableCell className="text-xs italic">
                                                {inst.admin?.full_name || 'Système'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed">
                            <p className="text-muted-foreground italic">Aucun versement enregistré pour cette formation.</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
