import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { AlertCircle, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ProductCard, Product } from "@/components/ProductCard";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const fetchMarketplaceProducts = async (): Promise<Product[]> => {
  console.log("Marketplace: Tentative de récupération des produits...");
  
  const [strategiesRes, indicatorsRes] = await Promise.all([
    supabase.from('strategies').select('*'),
    supabase.from('indicators').select('*')
  ]);

  if (strategiesRes.error) {
    console.error("Marketplace Error (Strategies):", strategiesRes.error);
    throw new Error(strategiesRes.error.message);
  }
  
  if (indicatorsRes.error) {
    console.error("Marketplace Error (Indicators):", indicatorsRes.error);
    throw new Error(indicatorsRes.error.message);
  }

  console.log(`Marketplace: ${strategiesRes.data.length} stratégies et ${indicatorsRes.data.length} indicateurs reçus.`);

  const strategies: Product[] = strategiesRes.data.map(item => ({
    id: item.id,
    type: 'strategy',
    name: item.title,
    description: item.description,
    price: item.price,
    content: item.content,
    compatibility: ['TradingView'],
    image: (item as any).image_url || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  }));

  const indicators: Product[] = indicatorsRes.data.map(item => ({
    id: item.id,
    type: 'indicator',
    name: item.name,
    description: item.description,
    category: item.category || 'Indicateur',
    price: item.price_1m || item.price, // Utiliser price_1m comme prix de départ
    price_1m: item.price_1m,
    price_3m: item.price_3m,
    price_lifetime: item.price_lifetime,
    compatibility: (item as any).compatibility || ['MT4', 'MT5'],
    image: (item as any).image_url || "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80",
  }));

  return [...strategies, ...indicators].sort((a, b) => (a.name > b.name ? 1 : -1));
};

const Marketplace = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'indicator' | 'strategy'>('all');

  const { data: products, isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['marketplaceProducts'],
    queryFn: fetchMarketplaceProducts,
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (activeFilter === 'all') return products;
    return products.filter(p => p.type === activeFilter);
  }, [products, activeFilter]);

  const { data: purchases } = useQuery({
    queryKey: ['productPurchases', user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();

      const { data: unifiedPurchases } = await supabase
        .from('purchases')
        .select('strategy_id, indicator_id, product_type')
        .eq('user_id', user.id)
        .in('product_type', ['indicator', 'strategy'])
        .eq('validation_status', 'approved');

      const purchasedIds = new Set<string>();
      unifiedPurchases?.forEach(p => {
        if (p.strategy_id) purchasedIds.add(p.strategy_id);
        if (p.indicator_id) purchasedIds.add(p.indicator_id);
      });

      return purchasedIds;
    },
    enabled: !!user,
  });

  const renderProductGrid = () => {
    if (isLoadingProducts) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
        </div>
      );
    }

    if (productsError) {
      return (
        <div className="text-center text-red-500 flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12" />
          <h3 className="text-xl font-semibold">Erreur lors du chargement des produits</h3>
          <p>{productsError.message}</p>
        </div>
      );
    }

    if (!filteredProducts || filteredProducts.length === 0) {
      return <p className="text-center text-muted-foreground py-20">Aucun produit trouvé dans cette catégorie.</p>;
    }

    return (
      <motion.div 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15
            }
          }
        }}
        className="bento-grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-3"
      >
        {filteredProducts.map((product, index) => (
          <motion.div 
            key={product.id} 
            variants={{
              hidden: { opacity: 0, y: 30, scale: 0.95 },
              show: { opacity: 1, y: 0, scale: 1 }
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={index === 0 ? "md:col-span-2 md:row-span-1 lg:col-span-2" : ""}
          >
            <ProductCard
              product={product}
              hasPurchased={purchases?.has(product.id) || false}
              index={index}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-mesh-gradient">
      <Navbar />

      <div className="pt-fluid-xl pb-fluid-lg relative overflow-hidden border-b border-border/40">
        {/* Dynamic background accents */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-accent/5 rounded-full blur-[120px] pointer-events-none animate-glow" />

        <div className="container relative z-10 mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl mx-auto text-center space-y-fluid-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <Zap className="w-3 h-3" />
              Elite Terminal & Tools
            </motion.div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 tracking-tighter leading-[0.85] uppercase italic">
              <span className="text-gradient-primary">MARKET</span><br />
              <span className="opacity-20">PLACE</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed border-t-2 border-primary/10 pt-8">
              Équipez votre setup avec les outils de <span className="text-foreground font-black underline decoration-primary/40 decoration-8 underline-offset-4">Trading</span> les plus avancés du marché.
            </p>
          </motion.div>
        </div>
      </div>

      <section className="py-fluid-md relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between mb-16 gap-12">
            <div className="flex flex-col gap-2">
               <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Catalogue <span className="text-primary">Premium</span></h2>
               <div className="w-24 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-primary" />
               </div>
            </div>

            <div className="flex items-center gap-6 p-2 bg-muted/20 backdrop-blur-xl border border-border/40 rounded-3xl">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4 hidden md:block">Filtrage :</span>
               <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'Tout' },
                    { id: 'indicator', label: 'Outils Tech' },
                    { id: 'strategy', label: 'Stratégies' }
                  ].map((filter) => (
                    <button 
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id as any)}
                      className={cn(
                        "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                        activeFilter === filter.id 
                          ? "bg-primary text-white shadow-glow-primary" 
                          : "hover:bg-primary/10 text-muted-foreground"
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
               </div>
            </div>
          </div>
          {renderProductGrid()}
        </div>
      </section>
    </div>
  );
};

export default Marketplace;
