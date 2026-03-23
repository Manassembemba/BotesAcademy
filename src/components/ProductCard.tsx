import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Download, CheckCircle2, Zap, ArrowRight, BookOpen, FileText, Code, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface Product {
    id: string;
    type: 'strategy' | 'indicator';
    name: string;
    description: string | null;
    price: number | null;
    compatibility: string[];
    image: string;
    content?: string | null;
    file_url?: string | null;
}

interface ProductCardProps {
    product: Product;
    hasPurchased: boolean;
    index: number;
}

export const ProductCard = ({ product, hasPurchased, index }: ProductCardProps) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleBuyClick = () => {
        if (!user) {
            toast.info("Veuillez vous connecter pour acquérir cet outil.");
            navigate("/auth");
            return;
        }

        if (product.price && product.price > 0) {
            // Redirect to checkout for paid products using the same system as courses
            navigate(`/checkout/${product.id}?type=${product.type}`);
        } else {
            // Logic for free products (could be immediate access)
            toast.success("Cet outil est gratuit !");
        }
    };

    const handleAction = () => {
        if (product.file_url) {
            toast.success("Téléchargement de votre outil...");
            window.open(product.file_url, '_blank');
        } else {
            toast.info("Le contenu de cet outil est disponible dans votre tableau de bord.");
            navigate("/dashboard");
        }
    };

    // Determine icon based on product type or content (neutral/multi-discipline)
    const getProductIcon = () => {
        if (product.name.toLowerCase().includes('book') || product.name.toLowerCase().includes('guide')) return <BookOpen className="w-5 h-5" />;
        if (product.name.toLowerCase().includes('script') || product.name.toLowerCase().includes('python')) return <Code className="w-5 h-5" />;
        if (product.name.toLowerCase().includes('pack') || product.name.toLowerCase().includes('admin')) return <FileText className="w-5 h-5" />;
        return <Zap className="w-5 h-5" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -10 }}
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
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                    
                    <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10">
                        <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 shadow-xl uppercase font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full">
                            {product.type === 'strategy' ? '📚 Ressource' : '⚡ Outil Gold'}
                        </Badge>
                        {hasPurchased && (
                            <Badge className="bg-green-500 text-white border-none shadow-xl font-black text-[10px] uppercase px-4 py-1.5 rounded-full animate-bounce">
                                <CheckCircle2 className="w-3 h-3 mr-2" /> Déjà à vous
                            </Badge>
                        )}
                    </div>

                    <div className="absolute bottom-4 right-6 text-white z-10">
                        <div className="p-3 bg-primary/20 backdrop-blur-xl rounded-2xl border border-primary/30 shadow-2xl scale-110 group-hover:rotate-12 transition-transform duration-500">
                            {getProductIcon()}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-8 flex-1 space-y-6">
                    <div>
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-[0.9] group-hover:text-primary transition-colors duration-300 mb-3">
                            {product.name}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed font-medium">
                            {product.description}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Compatible avec :</p>
                        <div className="flex flex-wrap gap-2">
                            {product.compatibility?.map((item) => (
                                <Badge key={item} variant="outline" className="text-[10px] uppercase font-black tracking-tighter bg-primary/5 border-primary/10 px-3 py-1 rounded-lg group-hover:border-primary/30 transition-colors">
                                    {item}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-8 pt-0 flex items-center justify-between border-t border-border/20 bg-muted/10 mt-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Prix de licence</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-primary italic leading-none">
                                {product.price && product.price > 0 ? `${product.price}` : 'FREE'}
                            </span>
                            {product.price && product.price > 0 && <span className="text-xs font-black text-primary/70">USD</span>}
                        </div>
                    </div>

                    {hasPurchased ? (
                        <Button
                            onClick={handleAction}
                            size="lg"
                            className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-tighter px-8 h-12 shadow-lg shadow-blue-500/20"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Accéder
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleBuyClick}
                            size="lg" 
                            className="rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-tighter px-8 h-12 shadow-glow-primary-sm group/btn relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center">
                                <ShoppingCart className="w-4 h-4 mr-3" />
                                Acquérir
                                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                            </span>
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </motion.div>
    );
};
