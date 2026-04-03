import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import CourseCard from "@/components/CourseCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, GraduationCap, Laptop, BookOpen, ChevronRight, LayoutGrid, Building2, Languages, Car } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-16 overflow-hidden bg-muted/30">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] italic"
            >
              Nos <span className="text-primary">Formations</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed italic"
            >
              Développez vos compétences avec nos programmes d'excellence conçus pour votre réussite.
            </motion.p>

            {/* BARRE DE RECHERCHE ET FILTRES RAPIDES */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto pt-8"
            >
              <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Quelle formation recherchez-vous ?" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-14 h-16 bg-background border-2 border-border/50 rounded-2xl shadow-2xl focus-visible:ring-primary/20 focus-visible:border-primary font-bold text-lg transition-all"
                />
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-glow-primary gap-3 border-2 border-primary">
                    <Filter className="w-4 h-4" />
                    Filtrer
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-6 bg-card rounded-[2.5rem] border-primary/10 shadow-2xl" align="end">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border/50 pb-4">
                      <h4 className="font-black uppercase tracking-tighter italic text-xl">Filtres</h4>
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-[10px] font-black uppercase tracking-widest hover:text-destructive transition-colors">Reset</Button>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Domaine de Formation</Label>
                        <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
                          <SelectTrigger className="h-12 rounded-xl font-bold border-primary/10 bg-muted/20"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les domaines</SelectItem>
                            {dbCategories?.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Format</Label>
                        <Select value={filters.mode} onValueChange={(v) => handleFilterChange('mode', v)}>
                          <SelectTrigger className="h-12 rounded-xl font-bold border-primary/10 bg-muted/20"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les formats</SelectItem>
                            <SelectItem value="online">💻 VOD (En ligne)</SelectItem>
                            <SelectItem value="presentiel">🏫 Présentiel</SelectItem>
                            <SelectItem value="hybrid">🌓 Hybride</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3 pt-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Type d'Accès</Label>
                        <RadioGroup defaultValue={filters.price} onValueChange={(v) => handleFilterChange('price', v)} className="grid grid-cols-3 gap-2">
                          {['all', 'free', 'paid'].map((p) => (
                            <Label key={p} className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all",
                              filters.price === p ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5" : "border-border/50 bg-muted/10 hover:border-primary/30"
                            )}>
                              <RadioGroupItem value={p} className="sr-only" />
                              <span className="text-[10px] font-black uppercase">{p === 'all' ? 'Tous' : p === 'free' ? 'Gratuit' : 'Payant'}</span>
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

      {/* --- SECTION DOMAINES DE FORMATION --- */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
                Domaines de <span className="text-primary">Formation</span>
              </h2>
              <p className="text-muted-foreground text-lg font-medium italic max-w-xl leading-relaxed">
                Explorez nos cursus spécialisés et choisissez la voie qui transformera votre avenir professionnel.
              </p>
            </motion.div>
            <Button variant="ghost" className="text-[11px] font-black uppercase tracking-[0.2em] gap-3 group px-0 hover:bg-transparent hover:text-primary transition-all">
              Catalogue complet <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-primary" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* BOUTON "TOUS" */}
            <motion.button 
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFilterChange('category', 'all')}
              className={cn(
                "relative p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-6 group overflow-hidden shadow-sm",
                filters.category === 'all' 
                  ? "border-primary bg-primary text-white shadow-xl shadow-primary/20" 
                  : "border-border/50 bg-card hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5"
              )}
            >
              <div className={cn(
                "p-5 rounded-2xl transition-all duration-500", 
                filters.category === 'all' ? "bg-white/20 text-white" : "bg-muted text-primary group-hover:bg-primary/10"
              )}>
                <LayoutGrid className="w-7 h-7" />
              </div>
              <span className="font-black uppercase text-[10px] tracking-widest italic text-center leading-tight">Tous les domaines</span>
              {filters.category === 'all' && (
                <motion.div layoutId="activeCat" className="absolute bottom-3 w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </motion.button>

            {/* LISTE DES CATÉGORIES */}
            {dbCategories?.map((cat) => (
              <motion.button 
                key={cat.id}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFilterChange('category', cat.name)}
                className={cn(
                  "relative p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-6 group overflow-hidden shadow-sm",
                  filters.category === cat.name 
                    ? "border-primary bg-primary text-white shadow-xl shadow-primary/20" 
                    : "border-border/50 bg-card hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5"
                )}
              >
                <div className={cn(
                  "p-5 rounded-2xl transition-all duration-500", 
                  filters.category === cat.name ? "bg-white/20 text-white" : "bg-muted text-primary group-hover:bg-primary/10"
                )}>
                  {categoryIcons[cat.name] || categoryIcons.default}
                </div>
                <span className="font-black uppercase text-[10px] tracking-widest italic text-center leading-tight">Formation {cat.name}</span>
                {filters.category === cat.name && (
                  <motion.div layoutId="activeCat" className="absolute bottom-3 w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* --- CATALOGUE GRID --- */}
      <section className="py-24 bg-muted/10 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 mb-16">
            <div className="h-px flex-1 bg-border/50" />
            <div className="flex items-center gap-4 bg-background px-8 py-3 rounded-full border border-border/50 shadow-sm">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">
                {filteredCourses.length} <span className="text-primary">Programmes</span> Actifs
              </h2>
            </div>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          {isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[480px] w-full rounded-[3rem] bg-muted animate-pulse border-2 border-border/50" />
              ))}
            </div>
          ) : filteredCourses?.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-card/30 rounded-[4rem] border-2 border-dashed border-primary/10 backdrop-blur-sm mx-auto max-w-4xl shadow-inner">
              <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-12">
                <Search className="w-12 h-12 text-primary opacity-40" />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Aucune formation trouvée</h3>
              <p className="text-muted-foreground max-w-md mx-auto font-medium italic">
                Ajustez vos filtres ou tentez une autre recherche pour trouver votre prochaine formation d'excellence.
              </p>
              <Button onClick={resetFilters} variant="outline" className="mt-10 rounded-2xl h-14 px-10 font-black uppercase tracking-[0.2em] text-[10px] border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-glow-primary-sm">
                Réinitialiser les filtres
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              <AnimatePresence mode="popLayout">
                {filteredCourses?.map((course, index) => (
                  <motion.div 
                    key={course.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
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
      <section className="py-28 relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-primary/[0.03]" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-10">
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-[0.9]">
              Besoin d'une <span className="text-primary">orientation ?</span>
            </h2>
            <p className="text-muted-foreground text-xl font-medium italic leading-relaxed">
              Nos conseillers pédagogiques vous accompagnent dans le choix de la formation la plus adaptée à votre profil.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <Button className="h-16 px-12 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-glow-primary">
                Contacter un conseiller
              </Button>
              <Button variant="outline" className="h-16 px-12 rounded-2xl font-black uppercase tracking-widest text-[11px] border-primary/20 text-primary hover:bg-primary/5 transition-all">
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
