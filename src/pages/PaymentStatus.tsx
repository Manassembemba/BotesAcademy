import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, CheckCircle, XCircle, ArrowRight, Home, FileDown, Award, Calendar, Timer, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { generateInvoice, generateBadge } from "@/lib/pdfService";
import { useEffect } from "react";
import { motion } from "framer-motion";

const PaymentStatus = () => {
    const { proofId } = useParams<{ proofId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Fetch payment proof details
    const { data: paymentProof, isLoading } = useQuery({
        queryKey: ['paymentProof', proofId],
        queryFn: async () => {
            if (!proofId) throw new Error("ID de preuve manquant");
            const { data, error } = await supabase
                .from('payment_proofs')
                .select(`
                    *,
                    courses:course_id (id, title, thumbnail_url, mode),
                    profiles:user_id (full_name),
                    sessions:session_id (session_name, start_date),
                    vacations:vacation_id (name, time_range)
                `)
                .eq('id', proofId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!proofId,
    });

    // Realtime subscription for status changes
    useEffect(() => {
        if (!proofId) return;

        const channel = supabase
            .channel('payment-status-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'payment_proofs',
                    filter: `id=eq.${proofId}`
                },
                (payload) => {
                    console.log('Payment status updated:', payload.new);
                    queryClient.invalidateQueries({ queryKey: ['paymentProof', proofId] });
                    queryClient.invalidateQueries({ queryKey: ['userAccess'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [proofId, queryClient]);

    // Redirect if not logged in
    if (!user) {
        navigate('/auth');
        return null;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!paymentProof) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Dossier introuvable</h1>
                    <Button onClick={() => navigate('/dashboard')} variant="hero">
                        Retour au tableau de bord
                    </Button>
                </div>
            </div>
        );
    }

    const getStatusConfig = () => {
        switch (paymentProof.status) {
            case 'pending':
                return {
                    icon: <Clock className="w-12 h-12 text-warning" />,
                    title: "Vérification en cours",
                    description: "Votre reçu est entre les mains de nos experts. Cela prend généralement moins de 24h.",
                    badge: <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 font-black uppercase text-[10px] tracking-widest px-4 py-1">En attente d'approbation</Badge>,
                    colorClass: "from-warning/20 to-transparent",
                    borderClass: "border-warning/20",
                    glowClass: "shadow-warning/20",
                };
            case 'approved':
                return {
                    icon: <CheckCircle className="w-12 h-12 text-emerald-500" />,
                    title: "Paiement Validé",
                    description: "Félicitations ! Votre accès a été activé. Vous pouvez commencer votre apprentissage dès maintenant.",
                    badge: <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black uppercase text-[10px] tracking-widest px-4 py-1">Accès Débloqué 🚀</Badge>,
                    colorClass: "from-emerald-500/20 to-transparent",
                    borderClass: "border-emerald-500/20",
                    glowClass: "shadow-emerald-500/20",
                };
            case 'rejected':
                return {
                    icon: <XCircle className="w-12 h-12 text-destructive" />,
                    title: "Reçu non conforme",
                    description: "Malheureusement, votre preuve de paiement n'a pas pu être validée par nos services.",
                    badge: <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-black uppercase text-[10px] tracking-widest px-4 py-1">Action Requise ⚠️</Badge>,
                    colorClass: "from-destructive/20 to-transparent",
                    borderClass: "border-destructive/20",
                    glowClass: "shadow-destructive/20",
                };
            default:
                return {
                    icon: <Loader2 className="w-12 h-12 text-muted-foreground" />,
                    title: "Statut Inconnu",
                    description: "Une erreur est survenue lors de la récupération du statut.",
                    badge: <Badge variant="outline">Inconnu</Badge>,
                    colorClass: "from-muted/20 to-transparent",
                    borderClass: "border-border",
                    glowClass: "shadow-none",
                };
        }
    };

    const statusConfig = getStatusConfig();
    const course = paymentProof.courses as any;
    const session = paymentProof.sessions as any;
    const vacation = paymentProof.vacations as any;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />
            
            {/* Background Decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className={`absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-primary/10 transition-colors duration-1000 ${statusConfig.glowClass}`} />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-accent/5" />
            </div>

            <div className="container relative z-10 mx-auto px-4 pt-24 sm:pt-32">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl mx-auto"
                >
                    <Card className={`overflow-hidden rounded-[2.5rem] border-2 ${statusConfig.borderClass} bg-card/50 backdrop-blur-2xl shadow-2xl transition-all duration-1000`}>
                        <div className={`h-2 w-full bg-gradient-to-r ${statusConfig.colorClass.replace('/20', '')}`} />
                        
                        <CardHeader className="text-center pt-10 pb-6 space-y-6">
                            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                                <div className={`absolute inset-0 rounded-3xl blur-2xl opacity-20 ${statusConfig.glowClass} bg-current`} />
                                <div className="relative z-10 bg-background/50 backdrop-blur-md rounded-3xl border border-white/5 p-4 shadow-xl">
                                    {statusConfig.icon}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-center mb-4">{statusConfig.badge}</div>
                                <CardTitle className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter text-foreground drop-shadow-sm">
                                    {statusConfig.title}
                                </CardTitle>
                                <CardDescription className="text-sm sm:text-base font-medium text-muted-foreground max-w-md mx-auto leading-relaxed">
                                    {statusConfig.description}
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="px-6 sm:px-12 pb-12 space-y-8">
                            {/* Summary Box */}
                            <div className="grid md:grid-cols-2 gap-6 items-center p-6 bg-muted/30 rounded-3xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                                    <ShieldCheck className="w-24 h-24" />
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/10 shadow-lg bg-muted shrink-0">
                                        <img
                                            src={course?.thumbnail_url || "/placeholder.svg"}
                                            alt={course?.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-sm sm:text-base uppercase tracking-tight italic leading-tight mb-1">{course?.title}</h3>
                                        <p className="text-primary font-black text-xl italic">{paymentProof.amount} USD</p>
                                    </div>
                                </div>

                                <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                                    {session && (
                                        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            <Calendar className="w-3.5 h-3.5 text-primary" />
                                            <span>Session : <span className="text-foreground">{session.session_name}</span></span>
                                        </div>
                                    )}
                                    {vacation && (
                                        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            <Timer className="w-3.5 h-3.5 text-primary" />
                                            <span>Créneau : <span className="text-foreground">{vacation.name} ({vacation.time_range})</span></span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                                        <span>Méthode : <span className="text-foreground">{paymentProof.payment_method.replace('_', ' ')}</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Table */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 ml-2">Détails de la transaction</h4>
                                <div className="bg-background/40 rounded-2xl p-6 border border-white/5 space-y-4 shadow-inner">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-medium uppercase">Soumis le</span>
                                        <span className="font-black text-foreground">
                                            {format(new Date(paymentProof.created_at), 'PPP', { locale: fr })}
                                        </span>
                                    </div>
                                    {paymentProof.transaction_reference && (
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground font-medium uppercase">Réf. Transaction</span>
                                            <span className="font-mono bg-primary/10 text-primary px-3 py-1 rounded-lg font-bold">{paymentProof.transaction_reference}</span>
                                        </div>
                                    )}
                                    {paymentProof.validated_at && (
                                        <div className="flex justify-between items-center text-xs border-t border-white/5 pt-4">
                                            <span className="text-emerald-500 font-black uppercase">Validé le</span>
                                            <span className="font-black text-foreground">
                                                {format(new Date(paymentProof.validated_at), 'PPP', { locale: fr })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Rejection Note */}
                            {payment_proof_status === 'rejected' && paymentProof.admin_notes && (
                                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="p-6 bg-destructive/10 border-2 border-destructive/20 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-[-20px] left-[-20px] w-16 h-16 bg-destructive/10 rounded-full blur-xl" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-destructive mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-3 h-3" /> Note de l'administration :
                                    </p>
                                    <p className="text-sm text-destructive font-bold italic leading-relaxed">
                                        "{paymentProof.admin_notes}"
                                    </p>
                                </motion.div>
                            )}

                            {/* Welcome Section for Pending Status */}
                            {payment_proof_status === 'pending' && (
                                <div className="space-y-6">
                                    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 space-y-4">
                                        <h4 className="text-lg font-black uppercase italic tracking-tighter">🚀 Rejoignez l'élite en attendant</h4>
                                        <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                                            Votre accès sera activé sous peu. Profitez de ce temps pour rejoindre notre communauté exclusive et commencer à networker avec d'autres traders.
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                            <Button variant="outline" className="h-12 rounded-xl border-primary/20 gap-2 font-bold uppercase text-[10px] tracking-widest" onClick={() => window.open('https://t.me/botesacademy', '_blank')}>
                                                <MessageSquare className="w-4 h-4 text-blue-500" /> Canal Telegram
                                            </Button>
                                            <Button variant="outline" className="h-12 rounded-xl border-primary/20 gap-2 font-bold uppercase text-[10px] tracking-widest" onClick={() => window.open('https://instagram.com/botesacademy', '_blank')}>
                                                <Instagram className="w-4 h-4 text-pink-500" /> Instagram
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-6 bg-muted/20 rounded-2xl border border-dashed border-border">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">Garantie Botes Academy</p>
                                            <p className="text-xs text-muted-foreground italic">Votre transaction est sécurisée. Une notification vous sera envoyée dès validation.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col gap-4 pt-6">
                                {paymentProof.status === 'approved' && course && (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <Button
                                            className="h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-widest shadow-glow-primary group"
                                            onClick={() => navigate(`/formations/${course.id}`)}
                                        >
                                            Commencer la formation
                                            <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant="outline"
                                                className="h-16 rounded-2xl border-primary/20 hover:border-primary/50 font-bold uppercase text-[10px] tracking-widest gap-2 bg-background/50"
                                                onClick={() => generateInvoice({
                                                    studentName: (paymentProof.profiles as any)?.full_name || user.email || 'Étudiant',
                                                    courseTitle: course.title,
                                                    amount: paymentProof.amount,
                                                    paymentMethod: paymentProof.payment_method,
                                                    transactionRef: paymentProof.transaction_reference || undefined,
                                                    date: paymentProof.validated_at || paymentProof.created_at,
                                                    invoiceNumber: paymentProof.id.slice(0, 8).toUpperCase()
                                                })}
                                            >
                                                <FileDown className="w-5 h-5 text-primary" /> Facture
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="h-16 rounded-2xl border-primary/20 hover:border-primary/50 font-bold uppercase text-[10px] tracking-widest gap-2 bg-background/50"
                                                onClick={() => generateBadge({
                                                    studentName: (paymentProof.profiles as any)?.full_name || user.email || 'Étudiant',
                                                    courseTitle: course.title,
                                                    date: paymentProof.validated_at || paymentProof.created_at
                                                })}
                                            >
                                                <Award className="w-5 h-5 text-primary" /> Badge
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {paymentProof.status === 'rejected' && course && (
                                    <Button
                                        className="h-16 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-black uppercase italic tracking-widest shadow-glow-destructive"
                                        onClick={() => navigate(`/checkout/${course.id}`)}
                                    >
                                        Soumettre à nouveau
                                    </Button>
                                )}

                                <div className="flex gap-4">
                                    <Button
                                        variant="ghost"
                                        className="flex-1 h-14 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-white/5 border border-white/5"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        <Home className="mr-3 w-4 h-4" /> Retour Dashboard
                                    </Button>
                                    
                                    {paymentProof.status === 'pending' && (
                                        <div className="flex-1 flex items-center justify-center gap-3 px-6 rounded-2xl bg-primary/5 border border-primary/10 animate-pulse">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Mise à jour en direct...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default PaymentStatus;
