import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrustBar from "@/components/TrustBar";
import StatsSection from "@/components/StatsSection";
import PromoOverlay from "@/components/PromoOverlay";
import MethodologySection from "@/components/MethodologySection";
import CourseCard from "@/components/CourseCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  Users, 
  TrendingUp, 
  Shield, 
  Loader2, 
  Quote, 
  Star, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  Download,
  Zap,
  BookOpen,
  Code,
  Laptop,
  GraduationCap,
  FileText,
  Lightbulb,
  CheckCircle2,
  Filter
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const Index = () => {
  const { settings } = useSiteSettings();
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch courses from database
  const { data: allCourses, isLoading } = useQuery({
    queryKey: ['allPublishedCourses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  // Extract unique categories
  const categories = useMemo(() => {
    if (!allCourses) return [];
    const cats = allCourses.map(c => c.category).filter(Boolean);
    return ["all", ...Array.from(new Set(cats))];
  }, [allCourses]);

  // Filter courses based on selected category
  const filteredCourses = useMemo(() => {
    if (!allCourses) return [];
    if (selectedCategory === "all") return allCourses.slice(0, 6);
    return allCourses.filter(c => c.category === selectedCategory);
  }, [allCourses, selectedCategory]);

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Trader Débutante",
      content: "Grâce à Botes Academy, j'ai enfin compris comment gérer mon risque. Le mentorat est exceptionnel !",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80"
    },
    {
      name: "Marc L.",
      role: "Développeur Fullstack",
      content: "Le cours MERN m'a permis de décrocher mon premier job en 4 mois. Les projets sont très concrets.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
    },
    {
      name: "Idriss K.",
      role: "Trader Indépendant",
      content: "Les indicateurs du Marketplace sont d'une précision redoutable. Indispensable pour mon setup quotidien.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80"
    }
  ];

  return (
    <div className="min-h-screen">
      <PromoOverlay />
      <Navbar />
      <HeroSection />
      <TrustBar />
      
      <StatsSection />

      {/* Philosophy Section - Intellectual enrichment */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10" />
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent mb-4"
            >
              <Lightbulb className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Notre Vision</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-tight">
              On ne forme pas, <br /> <span className="text-gradient-primary italic">on transforme votre avenir.</span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed font-medium italic">
              "Dans un monde en mutation constante, le savoir statique est obsolète. Botes Academy a été fondée sur l'idée que l'éducation doit être un moteur de transformation radicale, alliant la rigueur académique à l'agilité du terrain."
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12">
              <div className="text-left space-y-3">
                <CheckCircle2 className="text-primary w-6 h-6" />
                <h4 className="font-bold text-lg">Éducation Agile</h4>
                <p className="text-sm text-muted-foreground">Des programmes mis à jour en temps réel selon les besoins du marché mondial.</p>
              </div>
              <div className="text-left space-y-3">
                <CheckCircle2 className="text-primary w-6 h-6" />
                <h4 className="font-bold text-lg">Savoir-Être</h4>
                <p className="text-sm text-muted-foreground">Nous développons l'esprit critique et la discipline, piliers de la réussite professionnelle.</p>
              </div>
              <div className="text-left space-y-3">
                <CheckCircle2 className="text-primary w-6 h-6" />
                <h4 className="font-bold text-lg">Impact Social</h4>
                <p className="text-sm text-muted-foreground">Démocratiser l'excellence technique pour les talents de demain en RDC.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MethodologySection />

      {/* Popular Courses Section */}
      <section className="py-24 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-black mb-4 uppercase">
              Des programmes <span className="text-gradient-primary">pour tout le monde</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explorez nos formations phares conçues pour propulser votre carrière au niveau supérieur.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-12">
              <div className="flex justify-center">
                <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedCategory}>
                  <div className="flex items-center justify-center mb-12 overflow-x-auto pb-4 scrollbar-hide">
                     <div className="flex items-center gap-2 mr-6 text-muted-foreground hidden lg:flex">
                        <Filter className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Filtrer par :</span>
                     </div>
                     <TabsList className="bg-background/50 border border-border p-1.5 rounded-2xl h-auto flex-nowrap md:flex-wrap justify-start md:justify-center gap-1.5">
                       {categories.map((cat) => (
                         <TabsTrigger 
                           key={cat} 
                           value={cat}
                           className="rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                         >
                           {cat === "all" ? "Tous les pôles" : cat}
                         </TabsTrigger>
                       ))}
                     </TabsList>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedCategory}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                      {filteredCourses.length > 0 ? (
                        filteredCourses.map((course, index) => (
                          <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                          >
                            <CourseCard 
                              id={course.id}
                              title={course.title}
                              description={course.description || ""}
                              duration={course.estimated_duration || "N/A"}
                              rating={4.9}
                              isPremium={course.is_paid || false}
                              price={course.is_paid ? (course.price || 0) : undefined}
                              category={course.category || "Général"}
                              image={course.thumbnail_url || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80"}
                              mode={course.mode || "En ligne"}
                              isSpecialSession={course.is_special_session || false}
                            />
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-full py-20 text-center">
                           <p className="text-muted-foreground italic">Aucun cours disponible dans ce pôle pour le moment.</p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Tabs>
              </div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link to="/formations">
              <Button variant="hero" size="xl" className="rounded-full px-10">
                Explorer tout le catalogue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Marketplace Preview Section */}
      <section className="py-24 bg-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] -z-10" />
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2 space-y-6"
            >
              <Badge variant="outline" className="text-accent border-accent/30 bg-accent/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Écosystème Numérique</Badge>
              <h2 className="text-4xl font-black leading-tight uppercase">
                Optimisez votre apprentissage avec notre <span className="text-gradient-accent">Marketplace</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                Accédez à une bibliothèque exclusive d'E-books, de logiciels professionnels, de templates de gestion et d'outils techniques pour booster vos compétences.
              </p>
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg text-accent"><Zap className="w-5 h-5" /></div>
                  <p className="font-bold">Téléchargement immédiat après achat</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg text-accent"><Download className="w-5 h-5" /></div>
                  <p className="font-bold">Accès illimité et mises à jour</p>
                </div>
              </div>
              <div className="pt-6">
                <Link to="/marketplace">
                  <Button variant="outline" size="xl" className="border-accent text-accent hover:bg-accent/10 rounded-full px-10 border-2 font-bold">
                    Explorer la bibliothèque
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="space-y-4 pt-12">
                <div className="bg-card p-6 rounded-3xl border border-border shadow-xl transform hover:-translate-y-2 transition-transform">
                   <div className="w-12 h-12 bg-primary/10 rounded-xl mb-4 flex items-center justify-center text-primary"><BookOpen className="w-6 h-6" /></div>
                   <h4 className="font-black mb-1 italic text-sm">E-book : Trading Master</h4>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold">Guide Complet PDF</p>
                </div>
                <div className="bg-card p-6 rounded-3xl border border-border shadow-xl transform hover:-translate-y-2 transition-transform">
                   <div className="w-12 h-12 bg-accent/10 rounded-xl mb-4 flex items-center justify-center text-accent"><Code className="w-6 h-6" /></div>
                   <h4 className="font-black mb-1 italic text-sm">Scripts Python</h4>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold">Automatisation Web</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-card p-6 rounded-3xl border border-border shadow-xl transform hover:-translate-y-2 transition-transform">
                   <div className="w-12 h-12 bg-emerald-500/10 rounded-xl mb-4 flex items-center justify-center text-emerald-500"><Shield className="w-6 h-6" /></div>
                   <h4 className="font-black mb-1 italic text-sm">Pack RH & Admin</h4>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold">Modèles de Documents</p>
                </div>
                <div className="bg-card p-6 rounded-3xl border border-border shadow-xl transform hover:-translate-y-2 transition-transform">
                   <div className="w-12 h-12 bg-amber-500/10 rounded-xl mb-4 flex items-center justify-center text-amber-500"><Laptop className="w-6 h-6" /></div>
                   <h4 className="font-black mb-1 italic text-sm">Logiciels Pro</h4>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold">Installateurs & Licences</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-black mb-4 uppercase">
              Ce que disent nos <span className="text-gradient-primary">Étudiants</span>
            </h2>
            <p className="text-muted-foreground text-lg">Rejoignez une communauté de passionnés qui transforment leur vie.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, index) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card p-8 rounded-3xl border border-border/50 shadow-lg relative group hover:border-primary/30 transition-all"
              >
                <Quote className="absolute top-6 right-8 w-10 h-10 text-primary/10 group-hover:text-primary/20 transition-colors" />
                <div className="flex items-center gap-1 mb-6 text-amber-500">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-lg italic mb-8 leading-relaxed text-muted-foreground">"{t.content}"</p>
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarImage src={t.avatar} />
                    <AvatarFallback>{t.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold">{t.name}</h4>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center text-white"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight uppercase">
              Prêt à transformer tes <br /> compétences aujourd'hui ?
            </h2>
            <p className="text-primary-foreground/80 text-xl mb-12 max-w-2xl mx-auto">
              Rejoignez des milliers d'étudiants et accédez aux meilleures ressources de trading et technologie.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/auth">
                <Button size="xl" className="bg-white text-primary hover:bg-white/90 rounded-full px-12 text-lg font-bold shadow-2xl">
                  Créer mon compte
                </Button>
              </Link>
              <Link to="/formations" className="text-white font-bold hover:underline flex items-center gap-2">
                Voir toutes les formations <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
