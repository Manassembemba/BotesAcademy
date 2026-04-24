import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Download, CheckCircle2, Zap, ArrowRight, BookOpen, FileText, Code, Loader2, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface Product {
    id: string;
    type: 'strategy' | 'indicator';
    name: string;
    description: string | null;
    category?: string | null;
    price: number | null;
    price_1m?: number | null;
    price_3m?: number | null;
    price_lifetime?: number | null;
    compatibility: string[];
    image: string;
}

interface ProductCardProps {
    product: Product;
    hasPurchased: boolean;
    index: number;
}

export const ProductCard = ({ product, hasPurchased, index }: ProductCardProps) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isFetchingSecret, setIsFetchingSecret] = useState(false);
    const [purchaseDetails, setPurchaseDetails] = useState<{
        delivered_file_url: string | null;
        expires_at: string | null;
        subscription_type: string | null;
        mt5_id: string | null;
    } | null>(null);

    // Fetch purchase details if owned
    useEffect(() => {
        const fetchDetails = async () => {
            if (!hasPurchased || !user || product.type !== 'indicator') return;
            
            const { data, error } = await supabase
                .from('indicator_purchases')
                .select('delivered_file_url, expires_at, subscription_type, mt5_id')
                .eq('indicator_id', product.id)
                .eq('user_id', user.id)
                .maybeSingle();
            
            if (data) setPurchaseDetails(data);
        };
        fetchDetails();
    }, [hasPurchased, user, product.id, product.type]);

    const handleBuyClick = () => {
        if (!user) {
            toast.info("Veuillez vous connecter pour acquérir cet outil.");
            navigate("/auth");
            return;
        }
        navigate(`/checkout/${product.id}?type=${product.type}`);
    };

    const handleAction = async () => {
        if (!hasPurchased) return;
        
        setIsFetchingSecret(true);
        try {
            if (product.type === 'indicator') {
                const { data, error } = await supabase
                    .from('indicator_purchases')
                    .select('delivered_file_url, expires_at')
                    .eq('indicator_id', product.id)
                    .eq('user_id', user.id)
                    .single();
                
                if (error) throw error;

                if (data.expires_at && new Date(data.expires_at) < new Date()) {
                    toast.error("Votre abonnement a expiré. Veuillez le renouveler.");
                    navigate(`/checkout/${product.id}?type=${product.type}`);
                    return;
                }

                if (data?.delivered_file_url) {
                    toast.success("Téléchargement de votre outil configuré...");
                    window.open(data.delivered_file_url, '_blank');
                } else {
                    toast.info("Votre outil est en cours de configuration par nos experts. Revenez d'ici peu !");
                }
            } else {
                // For strategies, we might redirect to a specific view or just dashboard
                toast.info("Accès à la stratégie activé dans votre tableau de bord !");
                navigate("/dashboard");
            }
        } catch (error: any) {
            console.error("Erreur accès:", error);
            toast.error("Impossible de récupérer l'accès.");
        } finally {
            setIsFetchingSecret(false);
        }
    };

    const getProductIcon = () => {
        if (product.name.toLowerCase().includes('book') || product.name.toLowerCase().includes('guide')) return <BookOpen className="w-5 h-5" />;
        if (product.name.toLowerCase().includes('script') || product.name.toLowerCase().includes('python')) return <Code className="w-5 h-5" />;
        return <Zap className="w-5 h-5" />;
    };

    const isExpired = purchaseDetails?.expires_at && new Date(purchaseDetails.expires_at) < new Date();

    return (
        <div className="h-full perspective-2000">
            <Card className="h-full flex flex-col overflow-hidden border-border/40 bg-card/60 backdrop-blur-2xl hover:border-primary/50 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] transition-all duration-700 rounded-[3rem] group relative preserve-3d">
                {/* Patterns and Glints */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <CardHeader className="p-0 relative aspect-[16/11] overflow-hidden">
                    <img
                        src={product.image || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80"}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 group-hover:rotate-1"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-90" />
                    
                    <div className="absolute top-8 left-8 flex flex-wrap gap-3 z-10">
                        <Badge className="bg-primary/20 backdrop-blur-xl text-primary border-primary/30 shadow-2xl uppercase font-black text-[10px] tracking-[0.3em] px-5 py-2 rounded-full relative overflow-hidden group/badge">
                            <span className="relative z-10 flex items-center gap-2">
                                <Zap className="w-3 h-3 fill-current" />
                                {product.type === 'strategy' ? 'Ressource' : 'Outil Gold'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/badge:translate-x-full transition-transform duration-1000 ease-in-out" />
                        </Badge>
                        {hasPurchased && (
                            <Badge className={cn(
                                "text-white border-none shadow-2xl font-black text-[10px] uppercase px-5 py-2 rounded-full",
                                isExpired ? "bg-destructive animate-pulse" : "bg-emerald-500"
                            )}>
                                {isExpired ? <AlertCircle className="w-3 h-3 mr-2" /> : <CheckCircle2 className="w-3 h-3 mr-2" />}
                                {isExpired ? 'Expiré' : 'Actif'}
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-10 flex-1 space-y-8 relative z-10">
                    <div>
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-4 group-hover:text-primary transition-colors leading-none">
                            {product.name}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 font-medium leading-relaxed">
                            {product.description}
                        </p>
                    </div>

                    {hasPurchased && purchaseDetails && (
                        <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 space-y-3 relative overflow-hidden group/details">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
                            <div className="flex justify-between items-center relative z-10">
                                <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em]">Identifiant MT5</span>
                                <span className="font-mono font-black text-primary text-sm bg-primary/10 px-3 py-1 rounded-lg">{purchaseDetails.mt5_id}</span>
                            </div>
                            {purchaseDetails.expires_at && (
                                <div className="flex justify-between items-center relative z-10">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em]">Fin de licence</span>
                                    <span className={cn("text-xs font-black italic", isExpired ? "text-destructive" : "text-foreground")}>
                                        {format(new Date(purchaseDetails.expires_at), 'dd MMM yyyy', { locale: fr })}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-3">
                        <p className="text-[10px] uppercase font-black tracking-[0.4em] text-muted-foreground/40 ml-1">Ecosystème :</p>
                        <div className="flex flex-wrap gap-3">
                            {product.compatibility?.map((item) => (
                                <Badge key={item} variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-muted/30 border-border/40 px-4 py-1.5 rounded-xl hover:bg-primary/10 hover:border-primary/20 transition-colors">
                                    {item}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-10 pt-0 flex items-center justify-between border-t border-border/10 bg-muted/5 mt-auto relative z-10">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground/60 uppercase font-black tracking-[0.4em] mb-2">
                            {product.type === 'indicator' ? 'Abonnement' : 'Acquisition'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-primary italic leading-none tracking-tighter">
                                {product.type === 'indicator' ? product.price_1m : product.price}
                            </span>
                            <span className="text-sm font-black text-primary/40 uppercase">USD</span>
                        </div>
                    </div>

                    {hasPurchased && !isExpired ? (
                        <Button
                            onClick={handleAction}
                            size="lg"
                            disabled={isFetchingSecret}
                            className={cn(
                                "rounded-3xl font-black uppercase tracking-widest px-10 h-14 shadow-2xl transition-all hover:scale-105 active:scale-95",
                                purchaseDetails?.delivered_file_url 
                                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" 
                                    : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                            )}
                        >
                            {isFetchingSecret ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : (purchaseDetails?.delivered_file_url ? <Download className="w-5 h-5 mr-3" /> : <Clock className="w-5 h-5 mr-3" />)}
                            {purchaseDetails?.delivered_file_url ? 'Télécharger' : 'En attente...'}
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleBuyClick}
                            size="lg" 
                            className="rounded-3xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest px-10 h-14 shadow-glow-primary group/btn relative overflow-hidden transition-all hover:scale-110 active:scale-95 border-2 border-white/10"
                        >
                            <span className="relative z-10 flex items-center">
                                <ShoppingCart className="w-5 h-5 mr-4" />
                                {isExpired ? 'Renouveler' : 'Acheter'}
                                <ArrowRight className="w-5 h-5 ml-3 transition-transform group-hover/btn:translate-x-2" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};
