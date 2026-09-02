import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Download, Zap, BookOpen, Code, Loader2, Clock } from "lucide-react";
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

export const ProductCard = ({ product, hasPurchased }: ProductCardProps) => {
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
            
            const { data } = await supabase
                .from('purchases')
                .select('delivered_file_url, expires_at, subscription_duration, mt5_id')
                .eq('indicator_id', product.id)
                .eq('user_id', user.id)
                .eq('product_type', 'indicator')
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
                    .from('purchases')
                    .select('delivered_file_url, expires_at')
                    .eq('indicator_id', product.id)
                    .eq('user_id', user.id)
                    .eq('product_type', 'indicator')
                    .maybeSingle();
                
                if (error) throw error;

                if (data?.expires_at && new Date(data.expires_at) < new Date()) {
                    toast.error("Votre abonnement a expiré. Veuillez le renouveler.");
                    navigate(`/checkout/${product.id}?type=${product.type}`);
                    return;
                }

                if (data?.delivered_file_url) {
                    toast.success("Téléchargement de votre outil...");
                    window.open(data.delivered_file_url, '_blank');
                } else {
                    toast.info("Votre outil est en cours de configuration par nos experts. Revenez d'ici peu !");
                }
            } else {
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

    const isExpired = purchaseDetails?.expires_at && new Date(purchaseDetails.expires_at) < new Date();

    return (
        <Card className="h-full flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-xs hover:border-primary/30 transition-all duration-300 group">
            {/* Header Image */}
            <CardHeader className="p-0 relative aspect-[16/10] overflow-hidden bg-muted">
                <img
                    src={product.image || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80"}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-50" />
                
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    <Badge className="bg-background/80 backdrop-blur-md text-foreground border border-border/50 font-semibold text-[10px] rounded-full px-2.5 py-0.5">
                        {product.type === 'strategy' ? 'Stratégie' : 'Indicateur MT4/MT5'}
                    </Badge>
                    {hasPurchased && (
                        <Badge className={cn(
                            "text-white border-none font-semibold text-[10px] px-2.5 py-0.5 rounded-full",
                            isExpired ? "bg-destructive" : "bg-emerald-600"
                        )}>
                            {isExpired ? 'Expiré' : 'Acquis'}
                        </Badge>
                    )}
                </div>
            </CardHeader>

            {/* Content */}
            <CardContent className="p-4 sm:p-5 flex-1 space-y-3">
                <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                    </h3>
                    <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
                        {product.description || "Outil d'analyse et stratégie de trading."}
                    </p>
                </div>

                {hasPurchased && purchaseDetails && (
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/40 space-y-1.5 text-[11px]">
                        {purchaseDetails.mt5_id && (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">ID MT5</span>
                                <span className="font-mono font-semibold text-primary">{purchaseDetails.mt5_id}</span>
                            </div>
                        )}
                        {purchaseDetails.expires_at && (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Expire le</span>
                                <span className={cn("font-medium", isExpired ? "text-destructive" : "text-foreground")}>
                                    {format(new Date(purchaseDetails.expires_at), 'dd MMM yyyy', { locale: fr })}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                    {product.compatibility?.map((item) => (
                        <span key={item} className="text-[10px] font-medium bg-muted px-2 py-0.5 rounded-md text-muted-foreground border border-border/30">
                            {item}
                        </span>
                    ))}
                </div>
            </CardContent>

            {/* Footer */}
            <CardFooter className="p-4 sm:p-5 pt-0 flex items-center justify-between mt-auto border-t border-border/30 pt-3">
                <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-medium">Prix</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-foreground">
                            ${product.type === 'indicator' ? (product.price_1m || product.price) : product.price}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">USD</span>
                    </div>
                </div>

                {hasPurchased && !isExpired ? (
                    <Button
                        onClick={handleAction}
                        size="sm"
                        disabled={isFetchingSecret}
                        className={cn(
                            "h-9 px-4 rounded-xl font-semibold text-xs gap-1.5 shadow-xs transition-colors",
                            purchaseDetails?.delivered_file_url 
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                                : "bg-amber-500 hover:bg-amber-600 text-white"
                        )}
                    >
                        {isFetchingSecret ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (purchaseDetails?.delivered_file_url ? <Download className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />)}
                        {purchaseDetails?.delivered_file_url ? 'Télécharger' : 'En configuration'}
                    </Button>
                ) : (
                    <Button 
                        onClick={handleBuyClick}
                        size="sm" 
                        className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5 shadow-xs"
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {isExpired ? 'Renouveler' : 'Commander'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};
