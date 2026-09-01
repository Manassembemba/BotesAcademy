import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { AlertCircle, Zap, Search, LayoutGrid, Cpu, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ProductCard, Product } from "@/components/ProductCard";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const fetchMarketplaceProducts = async (): Promise<Product[]> => {
  const [strategiesRes, indicatorsRes] = await Promise.all([
    supabase.from('strategies').select('*'),
    supabase.from('indicators').select('*')
  ]);

  if (strategiesRes.error) throw new Error(strategiesRes.error.message);
  if (indicatorsRes.error) throw new Error(indicatorsRes.error.message);

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
    price: item.price_1m || item.price,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'indicator' | 'strategy'>('all');

  const { data: products, isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['marketplaceProducts'],
    queryFn: fetchMarketplaceProducts,
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const matchesFilter = activeFilter === 'all' || p.type === activeFilter;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [products, activeFilter, searchQuery]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-3xl" />)}
        </div>
      );
    }

    if (productsError) {
      return (
        <div className="text-center text-destructive flex flex-col items-center gap-4 py-16">
          <AlertCircle className="w-12 h-12" />
          <h3 className="text-xl font-bold">Erreur lors du chargement des ressources</h3>
          <p className="text-sm text-muted-foreground">{productsError.message}</p>
        </div>
      );
    }

    if (!filteredProducts || filteredProducts.length === 0) {
      return (
        <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-border/60 max-w-xl mx-auto">
          <p className="text-muted-foreground font-medium text-sm">Aucun produit ne correspond à votre recherche.</p>
        </div>
      );
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
              staggerChildren: 0.1
            }
          }
        }}
        className="bento-grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-3 gap-6"
      >
        {filteredProducts.map((product, index) => (
          <motion.div 
            key={product.id} 
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
            transition={{ duration: 0.5 }}
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

      {/* --- HERO SECTION --- */}
      <section className="relative pt-24 pb-6 overflow-hidden border-b border-border/30">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              Outils & Stratégies Professionnelles
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Market<span className="text-gradient-primary">place</span>
            </h1>
            
            <p className="text-sm md:text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Découvrez des indicateurs techniques et des stratégies validées pour enrichir vos outils de travail.
            </p>

            {/* UNIFIED SEARCH & FILTER TOOLBAR */}
            <div className="flex flex-col sm:flex-row items-center gap-3 max-w-2xl mx-auto pt-4">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Rechercher un indicateur ou une stratégie..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-11 h-12 bg-background/80 backdrop-blur-xl border-border/60 rounded-2xl shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary font-medium text-sm transition-all"
                />
              </div>

              <div className="flex items-center p-1 bg-muted/40 border border-border/50 rounded-2xl shrink-0 w-full sm:w-auto justify-center">
                {[
                  { id: 'all', label: 'Tout' },
                  { id: 'indicator', label: 'Indicateurs' },
                  { id: 'strategy', label: 'Stratégies' }
                ].map((filter) => (
                  <button 
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id as any)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                      activeFilter === filter.id 
                        ? "bg-primary text-white shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- PRODUCT GRID --- */}
      <section className="py-10 md:py-14 relative">
        <div className="container mx-auto px-4 md:px-6">
          {renderProductGrid()}
        </div>
      </section>
    </div>
  );
};

export default Marketplace;
