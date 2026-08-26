import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useRef } from "react";
import Navbar from "@/components/Navbar";
import CourseCard from "@/components/CourseCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, GraduationCap, Laptop, BookOpen, LayoutGrid, Building2, Languages, Car } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const fetchPublishedCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const fetchCategories = async () => {
  const { data, error } = await supabase.from('course_categories').select('*').order('name');
  if (error) throw error;
  return data || [];
};

const categoryIcons: Record<string, any> = {
  "Trading": <Laptop className="w-4 h-4" />,
  "Informatique": <Laptop className="w-4 h-4" />,
  "Auto-école": <Car className="w-4 h-4" />,
  "Langues": <Languages className="w-4 h-4" />,
  "Management": <Building2 className="w-4 h-4" />,
  "default": <GraduationCap className="w-4 h-4" />
};

const Formations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: 'all',
    level: 'all',
    price: 'all',
    mode: 'all',
  });

  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['publishedCourses'],
    queryFn: fetchPublishedCourses,
  });

  const { data: dbCategories } = useQuery({
    queryKey: ['courseCategories'],
    queryFn: fetchCategories,
  });

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ category: 'all', level: 'all', price: 'all', mode: 'all' });
    setSearchQuery("");
  };

  const gridRef = useRef<HTMLDivElement>(null);
  
  const handleCategoryClick = (category: string) => {
    handleFilterChange('category', category);
  };

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter(course => {
      const searchMatch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMatch = filters.category === 'all' || course.category === filters.category;
      const levelMatch = filters.level === 'all' || course.level === filters.level;
      const priceMatch = filters.price === 'all' || (filters.price === 'free' && !course.is_paid) || (filters.price === 'paid' && course.is_paid);
      const modeMatch = filters.mode === 'all' || course.mode === filters.mode;
      return searchMatch && categoryMatch && levelMatch && priceMatch && modeMatch;
    });
  }, [courses, searchQuery, filters]);

  return (
    <div className="min-h-screen bg-mesh-gradient overflow-x-hidden">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 md:pt-40 pb-8 md:pb-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-[70vw] h-[70vw] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-wider"
            >
              <GraduationCap className="w-4 h-4" />
              Catalogue des Formations
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold uppercase tracking-tight italic"
            >
              NOS <span className="text-gradient-primary">FORMATIONS</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed"
            >
              Des programmes structurés et pratiques pour développer des compétences immédiatement valorisables sur le marché.
            </motion.p>

            {/* SEARCH & FILTERS */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto pt-6"
            >
              <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Rechercher une formation..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-14 h-14 bg-background/80 backdrop-blur-xl border-border/60 rounded-2xl shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary font-medium text-base transition-all"
                />
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="h-14 px-8 rounded-2xl font-bold uppercase tracking-wider text-xs bg-primary text-white shadow-sm hover:bg-primary/90 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtres
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-6 bg-card/95 backdrop-blur-2xl rounded-2xl border-border shadow-2xl" align="end">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border/40 pb-3">
                      <h4 className="font-bold text-sm uppercase tracking-wider">Filtres</h4>
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs font-semibold text-muted-foreground hover:text-destructive">Réinitialiser</Button>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground">Mode d'apprentissage</Label>
                        <Select value={filters.mode} onValueChange={(v) => handleFilterChange('mode', v)}>
                          <SelectTrigger className="h-11 rounded-xl font-medium"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="all">Tous les modes</SelectItem>
                            <SelectItem value="online">En ligne</SelectItem>
                            <SelectItem value="presentiel">Présentiel</SelectItem>
                            <SelectItem value="hybrid">Hybride</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3 pt-1">
                        <Label className="text-xs font-semibold text-muted-foreground">Frais de formation</Label>
                        <RadioGroup defaultValue={filters.price} onValueChange={(v) => handleFilterChange('price', v)} className="grid grid-cols-3 gap-2">
                          {['all', 'free', 'paid'].map((p) => (
                            <Label key={p} className={cn(
                              "flex flex-col items-center justify-center p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-semibold",
                              filters.price === p ? "border-primary bg-primary/10 text-primary" : "border-border/50 bg-background/50 hover:bg-muted/50"
                            )}>
                              <RadioGroupItem value={p} className="sr-only" />
                              <span>{p === 'all' ? 'Toutes' : p === 'free' ? 'Gratuite' : 'Payante'}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </motion.div>

            {/* COMPACT CATEGORIES HORIZONTAL LIST */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto pt-4 pb-2 scrollbar-hide max-w-4xl mx-auto flex-wrap">
              <button
                onClick={() => handleCategoryClick('all')}
                className={cn(
                  "px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 border",
                  filters.category === 'all'
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-card/70 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Toutes
              </button>
              {dbCategories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={cn(
                    "px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 border",
                    filters.category === cat.name
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-card/70 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {categoryIcons[cat.name] || categoryIcons.default}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- CATALOGUE GRID --- */}
      <section ref={gridRef} className="py-10 md:py-16 scroll-mt-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
                {filteredCourses.length} {filteredCourses.length > 1 ? "Formations Disponibles" : "Formation Disponible"}
              </h2>
            </div>
            {filters.category !== 'all' && (
              <Button variant="ghost" size="sm" onClick={() => handleCategoryClick('all')} className="text-xs text-primary font-semibold">
                Afficher tout
              </Button>
            )}
          </div>

          {isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[1, 2, 3, 4, 5, 6].map(i => (
                 <div key={i} className="h-full min-h-[400px] rounded-[2rem] bg-card/60 backdrop-blur-2xl border border-border/40 overflow-hidden flex flex-col">
                   <div className="h-48 bg-muted/20 animate-pulse border-b border-white/5" />
                   <div className="p-6 space-y-4 flex-1">
                     <div className="h-6 bg-muted/20 animate-pulse rounded-md w-3/4 mb-4" />
                     <div className="space-y-2">
                       <div className="h-4 bg-muted/20 animate-pulse rounded-md w-full" />
                       <div className="h-4 bg-muted/20 animate-pulse rounded-md w-5/6" />
                       <div className="h-4 bg-muted/20 animate-pulse rounded-md w-4/6" />
                     </div>
                     <div className="pt-4 mt-auto border-t border-white/5 flex gap-2">
                       <div className="h-8 w-16 bg-muted/20 animate-pulse rounded-full" />
                       <div className="h-8 w-20 bg-muted/20 animate-pulse rounded-full" />
                     </div>
                   </div>
                 </div>
              ))}
            </div>
          ) : filteredCourses?.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 md:py-32 bg-white/5 rounded-[3rem] md:rounded-[4rem] border-2 border-dashed border-primary/10 mx-auto max-w-4xl shadow-inner px-6">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-12">
                <Search className="w-10 h-10 md:w-12 md:h-12 text-primary opacity-40" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic mb-4">Aucune formation trouvée</h3>
              <p className="text-muted-foreground max-w-md mx-auto font-medium italic text-sm md:text-base">
                Ajustez vos filtres ou tentez une autre recherche pour trouver votre prochaine formation d'excellence.
              </p>
              <Button onClick={resetFilters} variant="outline" className="mt-10 rounded-2xl h-14 md:h-16 px-10 font-black uppercase tracking-[0.2em] text-[10px] border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-glow-primary-sm">
                Réinitialiser les filtres
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              <AnimatePresence mode="popLayout">
                {filteredCourses?.map((course, index) => (
                  <motion.div 
                    key={course.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 30 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full"
                  >
                    <CourseCard
                      id={course.id}
                      title={course.title}
                      description={course.description || ""}
                      duration={course.estimated_duration || "Contenu illimité"}
                      rating={4.9}
                      isPremium={course.is_paid}
                      price={course.price}
                      fullPrice={course.full_price}
                      promoEndDate={course.promo_end_date}
                      image={course.thumbnail_url || "/placeholder.svg"}
                      category={course.category || "Technologie"}
                      mode={course.mode}
                      level={course.level}
                      registrationFee={course.registration_fee}
                      isSpecialSession={course.is_special_session}
                      hasBrochure={!!course.brochure_url}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/[0.03]" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-10">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic leading-[0.9]">
              Besoin d'une <span className="text-gradient-primary">orientation ?</span>
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl font-medium italic leading-relaxed px-4">
              Nos conseillers pédagogiques vous accompagnent dans le choix de la formation la plus adaptée à votre profil.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 pt-4 px-6">
              <Button className="h-16 md:h-20 px-12 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest text-xs shadow-glow-primary border-2 border-white/10 group overflow-hidden relative">
                <span className="relative z-10">Contacter un conseiller</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
              <Button variant="outline" className="h-16 md:h-20 px-12 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest text-xs border-white/10 hover:bg-white/5 transition-all">
                Questions Fréquentes
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Formations;
