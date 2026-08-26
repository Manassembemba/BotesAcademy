import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Landmark, CheckCircle2, Wallet, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UnifiedPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string | null;
    studentName: string;
    allCourses: any[];
    existingPurchases: any[];
    onApply: (data: any) => void;
    isPending: boolean;
}

export const UnifiedPaymentDialog = ({
    open,
    onOpenChange,
    studentId,
    studentName,
    allCourses,
    existingPurchases,
    onApply,
    isPending
}: UnifiedPaymentDialogProps) => {
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedSessionId, setSelectedSessionId] = useState("");
    const [amount, setAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("cash_deposit");

    // État intelligent
    const existingPurchase = existingPurchases?.find(p => p.course_id === selectedCourseId);
    const isNewEnrollment = !existingPurchase;
    const balance = existingPurchase ? (existingPurchase.total_amount - existingPurchase.paid_amount) : 0;

    // Fetch Sessions (incluant vacation_name)
    const { data: sessions } = useQuery({
        queryKey: ['course-sessions', selectedCourseId],
        queryFn: async () => {
            const { data } = await supabase.from('course_sessions').select('*').eq('course_id', selectedCourseId);
            return data || [];
        },
        enabled: !!selectedCourseId && isNewEnrollment
    });

    useEffect(() => {
        if (selectedCourseId) {
            if (isNewEnrollment) {
                const course = allCourses.find(c => c.id === selectedCourseId);
                setAmount(course?.price || 0);
            } else {
                setAmount(balance); // Propose le solde par défaut
            }
        }
    }, [selectedCourseId, isNewEnrollment, balance, allCourses]);

    const handleAction = () => {
        const session = sessions?.find(s => s.id === selectedSessionId);
        onApply({
            courseId: selectedCourseId,
            amount: amount,
            paymentMethod: paymentMethod,
            sessionId: selectedSessionId,
            vacationName: session?.vacation_name || null
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-[2.5rem] bg-card/95 backdrop-blur-3xl border-white/10 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Landmark className="w-6 h-6" />
                        </div>
                        Paiement : {studentName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-6">
                    {/* Sélection du Cours */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Formation concernée</Label>
                        <Select onValueChange={setSelectedCourseId} value={selectedCourseId}>
                            <SelectTrigger className="rounded-2xl h-14 bg-white/5 border-white/10 font-bold">
                                <SelectValue placeholder="Choisir une formation" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-white/10 rounded-2xl">
                                {allCourses.map(c => (
                                    <SelectItem key={c.id} value={c.id} className="rounded-xl font-bold py-3">
                                        <div className="flex items-center justify-between w-full gap-2">
                                            <span>{c.title}</span>
                                            {existingPurchases?.some(p => p.course_id === c.id) && (
                                                <Badge variant="secondary" className="bg-primary/20 text-primary text-[8px]">DÉJÀ INSCRIT</Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedCourseId && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            {/* Affichage État existant */}
                            {!isNewEnrollment && (
                                <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-amber-600 opacity-60">Reste à payer</p>
                                        <p className="text-2xl font-black italic tracking-tighter text-amber-500">${balance}</p>
                                    </div>
                                    <Badge className="bg-amber-500 text-white font-black text-[9px] px-3 py-1 rounded-full">EN TRANCHE</Badge>
                                </div>
                            )}

                            {/* Options Logistique (Seulement si nouveau) */}
                            {isNewEnrollment && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase opacity-40 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Session & Vacation</Label>
                                    <Select onValueChange={setSelectedSessionId} value={selectedSessionId}>
                                        <SelectTrigger className="rounded-2xl h-12 bg-white/5 border-white/10 font-bold">
                                            <SelectValue placeholder="Choisir une session" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl bg-card border-white/10">
                                            {sessions?.map(s => (
                                                <SelectItem key={s.id} value={s.id} className="rounded-xl font-bold py-3">
                                                    {s.session_name} {s.vacation_name ? `(${s.vacation_name})` : ''}
                                                </SelectItem>
                                            ))}
                                            {sessions?.length === 0 && <SelectItem value="none" disabled>Aucune session disponible</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Montant et Mode */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Montant versé ($)</Label>
                                    <div className="relative">
                                        <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
                                        <Input 
                                            type="number" 
                                            value={amount} 
                                            onChange={(e) => setAmount(Number(e.target.value))}
                                            className="pl-12 rounded-2xl h-14 bg-white/10 border-primary/20 font-black text-xl italic tracking-tighter shadow-inner"
                                        />
                                    </div>
                                    {amount >= balance && !isNewEnrollment && (
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase italic ml-1 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Ce versement soldera totalement le compte
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Méthode de paiement</Label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <SelectTrigger className="rounded-2xl h-12 bg-white/5 border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl bg-card border-white/10">
                                            <SelectItem value="cash_deposit">Dépôt Espèces</SelectItem>
                                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                            <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                <DialogFooter className="gap-3 pt-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-14 flex-1">Abandonner</Button>
                    <Button 
                        onClick={handleAction} 
                        disabled={isPending || !selectedCourseId || (isNewEnrollment && !selectedSessionId)}
                        className="rounded-2xl h-14 flex-[2] bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest shadow-glow-primary hover:scale-[1.02] transition-all"
                    >
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : isNewEnrollment ? "Valider l'Inscription" : "Appliquer le Versement"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
