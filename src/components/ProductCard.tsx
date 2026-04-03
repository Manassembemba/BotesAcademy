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
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="h-full"
        >
            <Card className="h-full flex flex-col overflow-hidden border-border/40 bg-card/50 backdrop-blur-xl hover:border-primary/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-500 rounded-[2.5rem] group relative">
                <CardHeader className="p-0 relative aspect-[16/10] overflow-hidden">
                    <img
                        src={product.image || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80"}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
                    
                    <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10">
                        <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 shadow-xl uppercase font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full">
                            {product.type === 'strategy' ? '📚 Ressource' : '⚡ Outil Gold'}
                        </Badge>
                        {hasPurchased && (
                            <Badge className={cn(
                                "text-white border-none shadow-xl font-black text-[10px] uppercase px-4 py-1.5 rounded-full",
                                isExpired ? "bg-destructive animate-pulse" : "bg-green-500"
                            )}>
                                {isExpired ? <AlertCircle className="w-3 h-3 mr-2" /> : <CheckCircle2 className="w-3 h-3 mr-2" />}
                                {isExpired ? 'Abonnement Expiré' : 'Licence Active'}
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-8 flex-1 space-y-6">
                    <div>
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-3 group-hover:text-primary transition-colors">
                            {product.name}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 font-medium">
                            {product.description}
                        </p>
                    </div>

                    {hasPurchased && purchaseDetails && (
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">ID MT5</span>
                                <span className="font-mono font-black text-primary text-xs">{purchaseDetails.mt5_id}</span>
                            </div>
                            {purchaseDetails.expires_at && (
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Expire le</span>
                                    <span className={cn("text-[10px] font-bold", isExpired ? "text-destructive" : "text-primary")}>
                                        {format(new Date(purchaseDetails.expires_at), 'dd MMM yyyy', { locale: fr })}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Compatible :</p>
                        <div className="flex flex-wrap gap-2">
                            {product.compatibility?.map((item) => (
                                <Badge key={item} variant="outline" className="text-[10px] uppercase font-black tracking-tighter bg-primary/5 border-primary/10 px-3 py-1 rounded-lg">
                                    {item}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-8 pt-0 flex items-center justify-between border-t border-border/20 bg-muted/10 mt-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">
                            {product.type === 'indicator' ? 'Dès' : 'Prix unique'}
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-primary italic leading-none">
                                {product.type === 'indicator' ? product.price_1m : product.price}
                            </span>
                            <span className="text-xs font-black text-primary/70">USD</span>
                        </div>
                    </div>

                    {hasPurchased && !isExpired ? (
                        <Button
                            onClick={handleAction}
                            size="lg"
                            disabled={isFetchingSecret}
                            className={cn(
                                "rounded-2xl font-black uppercase tracking-tighter px-8 h-12 shadow-lg transition-all",
                                purchaseDetails?.delivered_file_url 
                                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" 
                                    : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                            )}
                        >
                            {isFetchingSecret ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (purchaseDetails?.delivered_file_url ? <Download className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />)}
                            {purchaseDetails?.delivered_file_url ? 'Télécharger' : 'Configuration...'}
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleBuyClick}
                            size="lg" 
                            className="rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-tighter px-8 h-12 shadow-glow-primary-sm group/btn relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center">
                                <ShoppingCart className="w-4 h-4 mr-3" />
                                {isExpired ? 'Renouveler' : 'Acquérir'}
                                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                            </span>
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </motion.div>
    );
};
