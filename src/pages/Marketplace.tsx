import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { AlertCircle } from "lucide-react";
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
    price: item.price,
    file_url: (item as any).file_url,
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

      const [strategyPurchases, indicatorPurchases] = await Promise.all([
        supabase.from('strategy_purchases').select('strategy_id').eq('user_id', user.id),
        supabase.from('indicator_purchases').select('indicator_id').eq('user_id', user.id),
      ]);

      const purchasedIds = new Set<string>();
      strategyPurchases.data?.forEach(p => purchasedIds.add(p.strategy_id));
      indicatorPurchases.data?.forEach(p => purchasedIds.add(p.indicator_id));

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            hasPurchased={purchases?.has(product.id) || false}
            index={index}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20 relative overflow-hidden bg-gradient-hero border-b border-border/50">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full animate-pulse delay-700" />
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] bg-[grid_32px_32px]" />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/30 bg-primary/5 text-primary text-xs font-black uppercase tracking-[0.2em] animate-fade-in">
              Botes Tools & Resources
            </Badge>
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-none italic">
              <span className="text-gradient-primary">MARKET</span>PLACE
            </h1>
            <p className="text-muted-foreground text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
              Équipez-vous des meilleurs outils de <span className="text-foreground font-bold underline decoration-primary/50 decoration-4">Trading</span> et ressources professionnelles pour propulser votre carrière.
            </p>
          </motion.div>
        </div>
      </div>

      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <div className="flex items-center gap-3">
               <div className="w-12 h-1 bg-primary rounded-full" />
               <h2 className="text-3xl font-black uppercase tracking-tighter italic">Catalogue Premium</h2>
            </div>
            <div className="text-muted-foreground font-medium italic">
               Filtrer par type de ressource : 
               <span className="ml-3 inline-flex gap-2">
                  <Badge 
                    onClick={() => setActiveFilter('all')}
                    className={cn(
                      "transition-colors cursor-pointer",
                      activeFilter === 'all' ? "bg-primary text-white" : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                    )}
                  >
                    Tout
                  </Badge>
                  <Badge 
                    variant="outline" 
                    onClick={() => setActiveFilter('indicator')}
                    className={cn(
                      "cursor-pointer transition-colors",
                      activeFilter === 'indicator' ? "bg-primary text-white border-primary" : "hover:bg-primary/10"
                    )}
                  >
                    Outils
                  </Badge>
                  <Badge 
                    variant="outline" 
                    onClick={() => setActiveFilter('strategy')}
                    className={cn(
                      "cursor-pointer transition-colors",
                      activeFilter === 'strategy' ? "bg-primary text-white border-primary" : "hover:bg-primary/10"
                    )}
                  >
                    Stratégies
                  </Badge>
               </span>
            </div>
          </div>
          {renderProductGrid()}
        </div>
      </section>
    </div>
  );
};

export default Marketplace;
