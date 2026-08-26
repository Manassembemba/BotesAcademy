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

  return (
    <div className="min-h-screen">
      <PromoOverlay />
      <Navbar />
      <HeroSection />
      {/* Trust bar removed as requested */}
      
      <StatsSection />

      {/* Philosophy Section - Refined & Sophisticated [QUIETER] */}
      <section className="py-fluid-xl bg-background relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-start gap-fluid-lg">
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight leading-tight">
                Une pédagogie axée sur <br />
                <span className="text-primary italic">la pratique et le résultat.</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                Botes Academy vous offre un cadre d'apprentissage moderne, encadré par des formateurs expérimentés pour vous transmettre des compétences immédiatement applicables.
              </p>
            </div>

            <div className="lg:w-1/2 grid grid-cols-1 gap-8 pt-4">
              {[
                { title: "Formations Pratiques", desc: "Des cours concrets basés sur des projets réels et des cas d'usage professionnels.", icon: <Zap className="w-5 h-5" /> },
                { title: "Encadrement & Suivi", desc: "Des formateurs à votre écoute pour vous accompagner tout au long de votre parcours.", icon: <Shield className="w-5 h-5" /> },
                { title: "Certificat de Réussite", desc: "Obtenez une certification valorisante pour attester de vos acquis et compétences.", icon: <TrendingUp className="w-5 h-5" /> }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6 group"
                >
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-muted border border-border flex items-center justify-center text-primary group-hover:bg-primary/5 transition-all duration-300">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg uppercase tracking-tight mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MethodologySection />

      {/* Popular Courses Section */}
      <section className="py-fluid-xl bg-background border-y border-border/20 relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-fluid-md gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl space-y-4"
            >
              <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight leading-none">
                Nos <span className="text-primary italic">Formations</span>
              </h2>
              <p className="text-lg text-muted-foreground font-medium max-w-xl">
                Découvrez nos programmes disponibles et commencez votre apprentissage dès aujourd'hui.
              </p>
            </motion.div>

            <Link to="/formations" className="group">
              <div className="flex items-center gap-4 px-8 py-3 bg-muted/50 hover:bg-muted border border-border rounded-2xl transition-all">
                <span className="text-[10px] font-bold uppercase tracking-widest">Voir tout le catalogue</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-fluid-sm">
              <div className="flex justify-center">
                <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedCategory}>
                  <div className="flex items-center justify-center mb-fluid-sm overflow-x-auto pb-4 scrollbar-hide">
                     <TabsList className="bg-muted/20 border border-border/40 p-1.5 rounded-2xl h-auto flex-nowrap gap-2 w-max mx-auto">
                       {categories.map((cat) => (
                         <TabsTrigger 
                           key={cat} 
                           value={cat}
                           className="rounded-xl px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-glow-primary-sm transition-all duration-300"
                         >
                           {cat === "all" ? "Toutes les Formations" : cat}
                         </TabsTrigger>
                       ))}
                     </TabsList>
                  </div>

                  <AnimatePresence mode="wait">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid-sm">
                        {filteredCourses && filteredCourses.length > 0 ? (
                          filteredCourses.map((course, index) => (
                            <motion.div
                              key={course.id}
                              initial={{ opacity: 0, scale: 0.98 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: index * 0.05 }}
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
                          <div className="col-span-full py-32 text-center bg-muted/10 rounded-3xl border border-dashed border-border">
                             <p className="text-muted-foreground font-bold italic uppercase tracking-widest text-xs">Aucune formation disponible pour le moment.</p>
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
      <section className="py-fluid-xl bg-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] -z-10" />
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-fluid-lg">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2 space-y-6"
            >
              <h2 className="text-3xl md:text-5xl font-bold leading-tight uppercase tracking-tight">
                Ressources et Outils <span className="text-primary">Pédagogiques</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                Accédez à des supports de cours, guides pratiques et documents complémentaires pour approfondir vos connaissances.
              </p>
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/5 rounded-lg text-primary"><BookOpen className="w-5 h-5" /></div>
                  <p className="font-semibold text-sm">Supports de cours complets et structurés</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/5 rounded-lg text-primary"><GraduationCap className="w-5 h-5" /></div>
                  <p className="font-semibold text-sm">Ressources accessibles aux étudiants inscrits</p>
                </div>
              </div>
              <div className="pt-8">
                <Link to="/marketplace">
                  <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5 rounded-2xl px-10 font-bold">
                    Consulter la bibliothèque
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="lg:w-1/2 grid grid-cols-2 gap-4"
            >
                {[
                  { title: "Guides PDF", icon: <BookOpen className="w-6 h-6" />, label: "Supports de formation" },
                  { title: "Exercices", icon: <Code className="w-6 h-6" />, label: "Travaux pratiques" },
                  { title: "Fiches & Modèles", icon: <FileText className="w-6 h-6" />, label: "Documents de synthèse" },
                  { title: "Certificats", icon: <GraduationCap className="w-6 h-6" />, label: "Validation des compétences" }
                ].map((item, idx) => (
                  <Card key={idx} className="p-6 bg-muted/20 border-border/40 rounded-3xl flex flex-col justify-between group hover:border-primary/20 transition-all">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl mb-6 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">{item.icon}</div>
                    <div>
                      <h4 className="font-bold mb-1 italic text-base uppercase tracking-tight">{item.title}</h4>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{item.label}</p>
                    </div>
                  </Card>
                ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-fluid-xl relative overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
        <div className="container mx-auto px-6 relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight uppercase tracking-tight">
              Prêt à transformer vos <br /> compétences ?
            </h2>
            <p className="text-white/80 text-lg mb-12 font-medium max-w-xl mx-auto">
              Rejoignez des milliers d'étudiants et accédez aux meilleures ressources dès aujourd'hui.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/auth">
                <Button size="xl" className="bg-white text-primary hover:bg-white/90 rounded-2xl px-12 text-lg font-bold shadow-xl">
                  Créer mon compte
                </Button>
              </Link>
              <Link to="/formations" className="text-white font-bold hover:underline flex items-center gap-2 group text-sm">
                Voir toutes les formations <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
