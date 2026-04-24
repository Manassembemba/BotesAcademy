import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ManualPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedPurchase: any;
    selectedStudentId: string | null;
    manualPaymentAmount: number;
    setManualPaymentAmount: (amount: number) => void;
    manualPaymentMethod: string;
    setManualPaymentMethod: (method: string) => void;
    recordManualPaymentMutation: any;
    userId: string | undefined;
}

export const ManualPaymentDialog = ({
    open,
    onOpenChange,
    selectedPurchase,
    selectedStudentId,
    manualPaymentAmount,
    setManualPaymentAmount,
    manualPaymentMethod,
    setManualPaymentMethod,
    recordManualPaymentMutation,
    userId
}: ManualPaymentDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enregistrer un paiement manuel</DialogTitle>
                    <DialogDescription>
                        Enregistrez un versement direct pour la formation <span className="font-bold text-foreground">"{selectedPurchase?.courses?.title}"</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="p-4 bg-muted/30 rounded-2xl border">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground uppercase font-black tracking-widest">Total Formation</span>
                            <span className="font-bold">${selectedPurchase?.total_amount}</span>
                        </div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground uppercase font-black tracking-widest">Déjà Payé</span>
                            <span className="font-bold text-emerald-600">${selectedPurchase?.paid_amount || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t mt-2">
                            <span className="font-black uppercase tracking-tighter italic text-red-600">Solde Restant</span>
                            <span className="font-black italic text-red-600">${(selectedPurchase?.total_amount || 0) - (selectedPurchase?.paid_amount || 0)}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Montant à verser ($)</Label>
                        <Input 
                            type="number" 
                            value={manualPaymentAmount}
                            onChange={(e) => setManualPaymentAmount(Number(e.target.value))}
                            max={(selectedPurchase?.total_amount || 0) - (selectedPurchase?.paid_amount || 0)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Mode de Paiement</Label>
                        <Select 
                            value={manualPaymentMethod}
                            onValueChange={setManualPaymentMethod}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash_deposit">Cash / Espèces</SelectItem>
                                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                <SelectItem value="bank_transfer">Virement</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button 
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => recordManualPaymentMutation.mutate({
                            p_user_id: selectedStudentId!,
                            p_course_id: selectedPurchase.id,
                            p_amount: manualPaymentAmount,
                            p_payment_method: manualPaymentMethod,
                            p_admin_id: userId!
                        })} 
                        disabled={recordManualPaymentMutation.isPending || manualPaymentAmount <= 0}
                    >
                        {recordManualPaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmer le Paiement
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
