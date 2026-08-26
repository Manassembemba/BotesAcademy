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

                <CardHeader className="p-0 relative aspect-[16/10] overflow-hidden">
                    <img
                        src={product.image || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80"}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />
                    
                    <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10">
                        <Badge className="bg-primary/20 backdrop-blur-md text-primary border-primary/20 font-bold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                            {product.type === 'strategy' ? 'Ressource' : 'Outil Gold'}
                        </Badge>
                        {hasPurchased && (
                            <Badge className={cn(
                                "text-white border-none font-bold text-[9px] uppercase px-4 py-1.5 rounded-full shadow-lg",
                                isExpired ? "bg-destructive" : "bg-emerald-600"
                            )}>
                                {isExpired ? 'Expiré' : 'Actif'}
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-6 flex-1 space-y-6 relative z-10">
                    <div>
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2 group-hover:text-primary transition-colors leading-tight">
                            {product.name}
                        </h3>
                        <p className="text-muted-foreground text-xs line-clamp-2 font-medium">
                            {product.description}
                        </p>
                    </div>

                    {hasPurchased && purchaseDetails && (
                        <div className="p-4 bg-muted/50 rounded-2xl border border-border/50 space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-muted-foreground uppercase tracking-widest">ID MT5</span>
                                <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{purchaseDetails.mt5_id}</span>
                            </div>
                            {purchaseDetails.expires_at && (
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-muted-foreground uppercase tracking-widest">Expire le</span>
                                    <span className={cn("font-bold", isExpired ? "text-destructive" : "text-foreground")}>
                                        {format(new Date(purchaseDetails.expires_at), 'dd MMM yyyy', { locale: fr })}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        {product.compatibility?.map((item) => (
                            <div key={item} className="text-[9px] font-bold uppercase tracking-widest bg-muted px-3 py-1 rounded-lg text-muted-foreground border border-border/20">
                                {item}
                            </div>
                        ))}
                    </div>
                </CardContent>

                <CardFooter className="p-6 pt-0 flex items-center justify-between mt-auto relative z-10">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Tarif</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-primary italic tracking-tighter leading-none">
                                {product.type === 'indicator' ? product.price_1m : product.price}
                            </span>
                            <span className="text-[10px] font-bold text-primary/40 uppercase">USD</span>
                        </div>
                    </div>

                    {hasPurchased && !isExpired ? (
                        <Button
                            onClick={handleAction}
                            size="default"
                            disabled={isFetchingSecret}
                            className={cn(
                                "rounded-xl font-bold uppercase tracking-widest px-6 h-12 transition-all",
                                purchaseDetails?.delivered_file_url 
                                    ? "bg-emerald-600 hover:bg-emerald-700" 
                                    : "bg-amber-500 hover:bg-amber-600"
                            )}
                        >
                            {isFetchingSecret ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (purchaseDetails?.delivered_file_url ? <Download className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />)}
                            {purchaseDetails?.delivered_file_url ? 'Télécharger' : 'En cours...'}
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleBuyClick}
                            size="default" 
                            className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest px-6 h-12 group/btn relative overflow-hidden transition-all shadow-glow-primary-sm"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4" />
                                {isExpired ? 'Renouveler' : 'Acheter'}
                            </span>
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};
