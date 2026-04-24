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
  "Trading": <Laptop className="w-6 h-6" />,
  "Informatique": <Laptop className="w-6 h-6" />,
  "Auto-école": <Car className="w-6 h-6" />,
  "Langues": <Languages className="w-6 h-6" />,
  "Management": <Building2 className="w-6 h-6" />,
  "default": <GraduationCap className="w-6 h-6" />
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
    // Add small delay to let state update and render before scrolling
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
      <section className="relative pt-32 md:pt-48 pb-16 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[70vw] h-[70vw] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.4em] shadow-sm"
            >
              <GraduationCap className="w-4 h-4" />
              Écosystème d'Excellence
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(2.5rem,8vw,7rem)] font-black uppercase tracking-tighter leading-[0.85] italic break-words"
            >
              NOS <span className="text-gradient-primary">CURSUS</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed border-t border-white/10 pt-8 italic"
            >
              Propulsez votre carrière avec des parcours immersifs conçus pour l'impact. <span className="text-foreground font-black underline decoration-primary/30 underline-offset-8">On ne forme pas, on transforme.</span>
            </motion.p>

            {/* SEARCH & FILTERS */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto pt-12"
            >
              <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-500" />
                <Input 
                  placeholder="Quelle expertise recherchez-vous ?" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-16 h-16 md:h-20 bg-white/5 backdrop-blur-2xl border-white/10 rounded-2xl md:rounded-3xl shadow-2xl focus-visible:ring-primary/20 focus-visible:border-primary font-bold text-lg md:text-xl transition-all placeholder:text-muted-foreground/40"
                />
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="h-16 md:h-20 px-10 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest text-xs shadow-glow-primary group relative overflow-hidden border-2 border-white/10">
                    <span className="relative z-10 flex items-center gap-4">
                      <Filter className="w-5 h-5" />
                      Filtres
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-6 md:p-8 bg-black/80 backdrop-blur-3xl rounded-[2rem] border-white/10 shadow-2xl" align="end">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <h4 className="font-black uppercase tracking-tighter italic text-xl">Paramètres</h4>
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-[9px] font-black uppercase tracking-widest hover:text-destructive">Reset</Button>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Format d'apprentissage</Label>
                        <Select value={filters.mode} onValueChange={(v) => handleFilterChange('mode', v)}>
                          <SelectTrigger className="h-12 rounded-xl font-medium border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl border-white/10">
                            <SelectItem value="all" className="font-bold">Tous</SelectItem>
                            <SelectItem value="online" className="font-bold">Digital / VOD</SelectItem>
                            <SelectItem value="presentiel" className="font-bold">Campus Physique</SelectItem>
                            <SelectItem value="hybrid" className="font-bold">Hybride</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4 pt-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Niveau d'investissement</Label>
                        <RadioGroup defaultValue={filters.price} onValueChange={(v) => handleFilterChange('price', v)} className="grid grid-cols-3 gap-2">
                          {['all', 'free', 'paid'].map((p) => (
                            <Label key={p} className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-500",
                              filters.price === p ? "border-primary bg-primary/10 text-primary shadow-glow-primary/10" : "border-white/5 bg-white/5 hover:bg-white/10"
                            )}>
                              <RadioGroupItem value={p} className="sr-only" />
                              <span className="text-xs font-semibold tracking-wide">{p === 'all' ? 'Tout' : p === 'free' ? 'Libre' : 'Elite'}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- CATEGORY SELECTOR --- */}
      <section className="py-12 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">
                POLES DE <span className="text-gradient-primary">TRANSFORMATION</span>
              </h2>
              <div className="w-24 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                 <div className="w-1/2 h-full bg-primary animate-glow" />
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
            {/* ALL DISCIPLINES NODE */}
            <motion.button 
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryClick('all')}
              className={cn(
                "group relative p-8 flex flex-col items-center gap-6 rounded-[2.5rem] transition-all duration-700 border overflow-hidden",
                filters.category === 'all' 
                  ? "bg-primary border-primary shadow-[0_20px_50px_-10px_rgba(var(--primary-rgb),0.5)]" 
                  : "bg-card/40 border-white/10 text-foreground hover:border-primary/40 shadow-xl backdrop-blur-md"
              )}
            >
              {/* Active Glow Aura */}
              {filters.category === 'all' && (
                <motion.div 
                  layoutId="activeAura"
                  className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50"
                />
              )}
              
              <div className={cn(
                "relative z-10 w-20 h-20 flex items-center justify-center rounded-[1.5rem] transition-all duration-500 shadow-2xl", 
                filters.category === 'all' ? "bg-white text-primary rotate-12" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:-rotate-12"
              )}>
                <LayoutGrid className="w-10 h-10" />
                <div className="absolute inset-0 rounded-[1.5rem] bg-current opacity-0 group-hover:opacity-20 animate-ping" />
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <span className={cn(
                    "font-black uppercase text-[10px] tracking-[0.3em] italic mb-1 transition-colors",
                    filters.category === 'all' ? "text-white" : "text-muted-foreground group-hover:text-primary"
                )}>
                    Catalogue
                </span>
                <span className={cn(
                    "font-black uppercase text-xs tracking-tighter italic leading-none transition-colors",
                    filters.category === 'all' ? "text-white" : "text-foreground"
                )}>
                    GLOBAL
                </span>
              </div>

              {filters.category === 'all' && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute bottom-4 w-12 h-1.5 bg-white rounded-full shadow-glow-primary"
                />
              )}
            </motion.button>

            {/* CATEGORY NODES */}
            {dbCategories?.map((cat) => (
              <motion.button 
                key={cat.id}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(cat.name)}
                className={cn(
                  "group relative p-8 flex flex-col items-center gap-6 rounded-[2.5rem] transition-all duration-700 border overflow-hidden",
                  filters.category === cat.name 
                    ? "bg-primary border-primary shadow-[0_20px_50px_-10px_rgba(var(--primary-rgb),0.5)]" 
                    : "bg-card/40 border-white/10 text-foreground hover:border-primary/40 shadow-xl backdrop-blur-md"
                )}
              >
                {filters.category === cat.name && (
                  <motion.div 
                    layoutId="activeAura"
                    className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50"
                  />
                )}

                <div className={cn(
                  "relative z-10 w-20 h-20 flex items-center justify-center rounded-[1.5rem] transition-all duration-500 shadow-2xl", 
                  filters.category === cat.name ? "bg-white text-primary rotate-12" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:-rotate-12"
                )}>
                  {categoryIcons[cat.name] || categoryIcons.default}
                  <div className="absolute inset-0 rounded-[1.5rem] bg-current opacity-0 group-hover:opacity-20 animate-ping" />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <span className={cn(
                        "font-black uppercase text-[10px] tracking-[0.3em] italic mb-1 transition-colors",
                        filters.category === cat.name ? "text-white" : "text-muted-foreground group-hover:text-primary"
                    )}>
                        Discipline
                    </span>
                    <span className={cn(
                        "font-black uppercase text-xs tracking-tighter italic leading-none text-center transition-colors",
                        filters.category === cat.name ? "text-white" : "text-foreground"
                    )}>
                        {cat.name}
                    </span>
                </div>

                {filters.category === cat.name && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute bottom-4 w-12 h-1.5 bg-white rounded-full shadow-glow-primary"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* --- CATALOGUE GRID --- */}
      <section ref={gridRef} className="py-16 md:py-24 bg-muted/5 border-t border-white/5 scroll-mt-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center gap-6 mb-12 md:mb-16">
            <div className="h-px flex-1 bg-white/5" />
            <div className="flex items-center gap-4 bg-background px-6 md:px-10 py-3 md:py-4 rounded-full border border-white/10 shadow-2xl">
              <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              <h2 className="text-lg md:text-3xl font-black uppercase tracking-tighter italic">
                {filteredCourses.length} <span className="text-primary">Expériences</span> d'Élite
              </h2>
            </div>
            <div className="h-px flex-1 bg-white/5" />
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
