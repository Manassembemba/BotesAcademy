import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CourseCard from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Index = () => {
  // Fetch courses from database
  const { data: courses, isLoading } = useQuery({
    queryKey: ['popularCourses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .limit(3)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

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
      <Navbar />
      <HeroSection />

      {/* Popular Courses Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-black mb-4 uppercase">
              Formations <span className="text-gradient-primary">Populaires</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Maîtrisez les compétences les plus demandées du marché avec nos experts.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {courses?.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
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
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
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
      <section className="py-24 bg-muted/30 border-y border-border/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] -z-10" />
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2 space-y-6"
            >
              <Badge variant="outline" className="text-accent border-accent/30 bg-accent/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Ressources & Outils</Badge>
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
      <section className="py-24 bg-background">
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

      {/* Footer */}
      <footer className="py-16 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-primary uppercase">Botes Academy</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Première académie multi-disciplines en RDC. On ne forme pas, on transforme votre avenir par l'expertise.
              </p>
              <div className="flex gap-4">
                <a href="#" className="p-2 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-all"><Facebook className="w-5 h-5" /></a>
                <a href="#" className="p-2 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-all"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="p-2 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-all"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="p-2 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-all"><Youtube className="w-5 h-5" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-lg uppercase">Plateforme</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium">
                <li><Link to="/formations" className="hover:text-primary transition-colors">Formations</Link></li>
                <li><Link to="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary transition-colors">Tableau de bord</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">Connexion / Inscription</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg uppercase">Support</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium">
                <li><a href="#" className="hover:text-primary transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contactez-nous</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Canal Telegram</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg uppercase">Légal</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium">
                <li><a href="#" className="hover:text-primary transition-colors">Mentions Légales</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Conditions Générales (CGV)</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Politique de Confidentialité</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground uppercase tracking-widest font-bold">
            <p>© 2026 Botes Academy. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
