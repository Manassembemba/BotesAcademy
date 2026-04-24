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
import { Card } from "@/components/ui/card";
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
      {/* Trust bar removed as requested */}
      
      <StatsSection />

      {/* Philosophy Section - Intellectual enrichment [ELITE REDESIGN] */}
      <section className="py-fluid-xl bg-mesh-gradient relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-start gap-fluid-lg">
            <div className="lg:w-1/2 space-y-fluid-xs">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-accent/5 border border-accent/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Manifeste Elite
              </motion.div>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95]">
                On ne forme pas, <br />
                <span className="text-gradient-accent italic">On Transforme.</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium italic border-l-4 border-accent/30 pl-8 py-2">
                "Dans un monde en mutation constante, le savoir statique est obsolète. Botes Academy a été fondée sur l'idée que l'éducation doit être un moteur de transformation radicale."
              </p>
            </div>

            <div className="lg:w-1/2 grid grid-cols-1 gap-8 pt-12">
              {[
                { title: "Éducation Agile", desc: "Programmes synchronisés avec les exigences des marchés mondiaux en temps réel.", icon: <Zap /> },
                { title: "Discipline d'Élite", desc: "Nous forgeons l'esprit critique et la rigueur, socles de toute réussite pérenne.", icon: <Shield /> },
                { title: "Impact Radical", desc: "Démocratiser l'excellence technique pour propulser les leaders de demain.", icon: <TrendingUp /> }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6 group"
                >
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-card border border-border/50 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/5 transition-all duration-500 shadow-sm">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-black text-xl uppercase tracking-tight mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MethodologySection />

      {/* Popular Courses Section [BENTO 2.0] */}
      <section className="py-fluid-xl bg-background border-y border-border/40 relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl space-y-4"
            >
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                Pôles <span className="text-gradient-primary italic">d'Excellence</span>
              </h2>
              <p className="text-lg text-muted-foreground font-medium max-w-xl">
                Une sélection rigoureuse de cursus conçus pour les bâtisseurs du futur. Choisissez votre voie vers l'élite.
              </p>
            </motion.div>

            <Link to="/formations" className="group">
              <div className="flex items-center gap-4 px-8 py-4 bg-muted/30 hover:bg-primary/10 border border-border/50 rounded-2xl transition-all duration-500">
                <span className="text-xs font-black uppercase tracking-widest group-hover:text-primary">Tout le catalogue</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
              </div>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-12">
              <div className="flex justify-center">
                <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedCategory}>
                  <div className="flex items-center justify-center mb-16 overflow-x-auto pb-4 scrollbar-hide">
                     <TabsList className="bg-muted/20 border border-border/40 p-1.5 rounded-2xl h-auto flex-nowrap gap-2 w-max mx-auto">
                       {categories.map((cat) => (
                         <TabsTrigger 
                           key={cat} 
                           value={cat}
                           className="rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-glow-primary transition-all duration-500"
                         >
                           {cat === "all" ? "Toutes les Disciplines" : cat}
                         </TabsTrigger>
                       ))}
                     </TabsList>
                  </div>

                  <AnimatePresence mode="wait">
                      <div className="bento-grid">
                        {filteredCourses.length > 0 ? (
                          filteredCourses.map((course, index) => (
                            <motion.div
                              key={course.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                              className={index === 0 ? "md:col-span-2 md:row-span-2 lg:col-span-2" : ""}
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
                          <div className="col-span-full py-32 text-center bg-muted/10 rounded-4xl border-2 border-dashed border-border/40">
                             <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">Contenu en cours de synchronisation...</p>
                          </div>
                        )}
                      </div>
                  </AnimatePresence>
                </Tabs>
              </div>
            </div>
          )}
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
              className="lg:w-1/2 bento-grid !grid-cols-2"
            >
                <Card className="bento-card bg-primary/5 border-none p-8 flex flex-col justify-between group">
                   <div className="w-14 h-14 bg-primary/20 rounded-2xl mb-6 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><BookOpen className="w-7 h-7" /></div>
                   <div>
                    <h4 className="font-black mb-1 italic text-lg uppercase tracking-tight">Trading Master</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Guide Complet PDF</p>
                   </div>
                </Card>
                <Card className="bento-card bg-accent/5 border-none p-8 flex flex-col justify-between group">
                   <div className="w-14 h-14 bg-accent/20 rounded-2xl mb-6 flex items-center justify-center text-accent group-hover:rotate-12 transition-transform"><Code className="w-7 h-7" /></div>
                   <div>
                    <h4 className="font-black mb-1 italic text-lg uppercase tracking-tight">Scripts Python</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Automatisation Web</p>
                   </div>
                </Card>
                <Card className="bento-card bg-emerald-500/5 border-none p-8 flex flex-col justify-between group">
                   <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl mb-6 flex items-center justify-center text-emerald-500 group-hover:-rotate-12 transition-transform"><Shield className="w-7 h-7" /></div>
                   <div>
                    <h4 className="font-black mb-1 italic text-lg uppercase tracking-tight">Pack RH & Admin</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Modèles de Documents</p>
                   </div>
                </Card>
                <Card className="bento-card bg-amber-500/5 border-none p-8 flex flex-col justify-between group">
                   <div className="w-14 h-14 bg-amber-500/20 rounded-2xl mb-6 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><Laptop className="w-7 h-7" /></div>
                   <div>
                    <h4 className="font-black mb-1 italic text-lg uppercase tracking-tight">Logiciels Pro</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Installateurs & Licences</p>
                   </div>
                </Card>
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
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-primary via-primary to-blue-700">
        <div className="absolute inset-0 opacity-[0.08] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/20 rounded-full blur-[100px]" />
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
