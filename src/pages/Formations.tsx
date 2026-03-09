import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import CourseCard from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// 1. Fonction pour récupérer les données depuis Supabase
const fetchPublishedCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published');

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const Formations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: 'all',
    level: 'all',
    price: 'all',
    mode: 'all',
  });

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['publishedCourses'],
    queryFn: fetchPublishedCourses,
  });

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ category: 'all', level: 'all', price: 'all', mode: 'all' });
  };

  const categories = useMemo(() => {
    if (!courses) return [];
    return ['all', ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];
  }, [courses]);

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

      <div className="pt-24 pb-12 bg-gradient-hero border-b border-border/50">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">Catalogue <span className="text-gradient-primary">BOTES ACADEMY</span></h1>
            <p className="text-muted-foreground text-lg mb-8">
              Explorez nos pôle d'excellence : Trading, Programmation, Langues et bien plus encore.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto bg-card/30 p-2 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input placeholder="Rechercher une formation (ex: Python, Trading, Anglais...)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-12 bg-background/50 border-none shadow-none focus-visible:ring-1 ring-primary/30" />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="glass" size="lg" className="h-12 px-6 hover:bg-white/10 transition-colors">
                    <Filter className="w-5 h-5 mr-2" />
                    Filtrer
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-6 bg-card/95 backdrop-blur-2xl border-border/50 shadow-2xl rounded-2xl" align="end">
                  <div className="grid gap-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xl">Filtres</h4>
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-muted-foreground hover:text-primary"><X className="mr-2 h-3 w-3" />Reset</Button>
                    </div>
                    <div className="grid gap-4">
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Pôle de Formation</Label>
                        <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                          <SelectTrigger className="h-11 bg-background/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat === 'all' ? 'Tous les pôles' : cat}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Mode d'apprentissage</Label>
                        <Select value={filters.mode} onValueChange={(value) => handleFilterChange('mode', value)}>
                          <SelectTrigger className="h-11 bg-background/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les modes</SelectItem>
                            <SelectItem value="online">💻 En ligne (VOD/Live)</SelectItem>
                            <SelectItem value="presentiel">🏫 Présentiel</SelectItem>
                            <SelectItem value="hybrid">🌓 Hybride</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Niveau requis</Label>
                        <Select value={filters.level} onValueChange={(value) => handleFilterChange('level', value)}>
                          <SelectTrigger className="h-11 bg-background/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les niveaux</SelectItem>
                            <SelectItem value="beginner">Débutant</SelectItem>
                            <SelectItem value="intermediate">Intermédiaire</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3 pt-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Type d'accès</Label>
                        <RadioGroup defaultValue={filters.price} onValueChange={(value) => handleFilterChange('price', value)} className="grid grid-cols-3 gap-2">
                          <Label className={`flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer hover:bg-primary/5 transition-all ${filters.price === 'all' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                            <RadioGroupItem value="all" className="sr-only" />
                            <span className="text-xs font-medium">Tous</span>
                          </Label>
                          <Label className={`flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer hover:bg-primary/5 transition-all ${filters.price === 'free' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                            <RadioGroupItem value="free" className="sr-only" />
                            <span className="text-xs font-medium">Gratuit</span>
                          </Label>
                          <Label className={`flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer hover:bg-primary/5 transition-all ${filters.price === 'paid' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                            <RadioGroupItem value="paid" className="sr-only" />
                            <span className="text-xs font-medium">Payant</span>
                          </Label>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </motion.div>
        </div>
      </div>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <p className="text-muted-foreground">
              Affichage de <span className="font-semibold text-foreground">{filteredCourses?.length || 0}</span> formations
            </p>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <div key={i} className="h-[400px] w-full rounded-2xl bg-card animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
              <p className="text-destructive font-medium">Erreur lors de la récupération des cours: {error.message}</p>
            </div>
          ) : filteredCourses?.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 bg-card/30 rounded-[3rem] border border-dashed border-primary/20 backdrop-blur-sm">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-primary opacity-40" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-2">Aucune formation trouvée</h3>
              <p className="text-muted-foreground max-w-md mx-auto font-medium">
                Nous préparons actuellement de nouveaux pôle d'excellence. Revenez très bientôt ou modifiez vos filtres de recherche.
              </p>
              <Button variant="outline" className="mt-8 rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses?.map((course, index) => (
                <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }}>
                  <CourseCard
                    id={course.id}
                    title={course.title}
                    description={course.description || ""}
                    duration={course.estimated_duration || "N/A"}
                    rating={4.9}
                    isPremium={course.is_paid}
                    price={course.is_paid ? `$${course.price}` : undefined}
                    image={course.thumbnail_url || "/placeholder.svg"}
                    category={course.category || "N/A"}
                    mode={course.mode}
                    isSpecialSession={course.is_special_session}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Formations;
