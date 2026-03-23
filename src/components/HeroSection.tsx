import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Play, 
  GraduationCap, 
  Code, 
  Globe, 
  Laptop, 
  BookOpen, 
  CheckCircle, 
  Award,
  Users,
  ShieldCheck,
  TrendingUp,
  Briefcase
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const HeroSection = () => {
  const { settings } = useSiteSettings();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroImages = [
    settings?.appearance?.hero_image_url || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80",
    settings?.appearance?.hero_image_url_2 || "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80",
    settings?.appearance?.hero_image_url_3 || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80",
    settings?.appearance?.hero_image_url_4 || "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  const floatingCards = [
    { 
      icon: <Award className="w-5 h-5 text-amber-500" />, 
      text: "Certification d'Excellence", 
      position: "top-10 -left-10",
      delay: 0.5
    },
    { 
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />, 
      text: "Accompagnement 24/7", 
      position: "bottom-20 -right-10",
      delay: 0.7
    },
    { 
      icon: <Users className="w-5 h-5 text-primary" />, 
      text: "Communauté d'Élite", 
      position: "top-1/2 -left-16",
      delay: 0.9
    }
  ];

  return (
    <div className="relative pt-32 pb-20 overflow-hidden bg-background">
      {/* Background patterns - enhanced */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none opacity-50" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 mb-8 rounded-full bg-primary/5 border border-primary/10 text-primary">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-xs font-black tracking-widest uppercase">
                {settings?.global_banner?.is_active ? settings.global_banner.text : "ON NE FORME PAS ON TRANSFORME"}
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] mb-8 uppercase tracking-tighter">
              {settings?.appearance?.hero_title ? (
                <span dangerouslySetInnerHTML={{ __html: settings.appearance.hero_title.replace('[', '<span class="text-gradient-primary">').replace(']', '</span>') }} />
              ) : (
                <>L'Excellence dans chaque <span className="text-gradient-primary">Discipline</span></>
              )}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              {settings?.appearance?.hero_description || "Botes Academy fusionne la rigueur académique et l'agilité du terrain pour propulser votre potentiel. Plus qu'une formation, une pépinière de talents d'élite en RDC."}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
              <Link to="/formations">
                <Button variant="hero" size="xl" className="group rounded-2xl h-16 px-12 text-lg shadow-glow-primary">
                  Découvrir nos pôles
                  <ArrowRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <div className="flex items-center gap-4 px-4">
                <div className="flex -space-x-4">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Student" />
                     </div>
                   ))}
                </div>
                <div className="text-left">
                   <p className="text-sm font-black">+2,500 Alumni</p>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest italic text-primary">Professionnels certifiés</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-10 border-t border-border/50 relative">
              <div className="absolute -top-[1px] left-0 w-24 h-[2px] bg-primary" />
              <div className="text-center lg:text-left group cursor-default">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 text-primary transition-transform group-hover:scale-110 origin-left">
                   <Code className="w-5 h-5" />
                   <p className="text-2xl font-black">Tech</p>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Pôle Informatique</p>
                <div className="flex items-center justify-center lg:justify-start gap-1 text-[9px] font-black text-primary/60">
                   <TrendingUp className="w-3 h-3" /> 15+ PARCOURS
                </div>
              </div>
              <div className="text-center lg:text-left group cursor-default">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 text-accent transition-transform group-hover:scale-110 origin-left">
                   <Globe className="w-5 h-5" />
                   <p className="text-2xl font-black">Monde</p>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Pôle Langues</p>
                <div className="flex items-center justify-center lg:justify-start gap-1 text-[9px] font-black text-accent/60">
                   <TrendingUp className="w-3 h-3" /> EXPERTS NATIFS
                </div>
              </div>
              <div className="text-center lg:text-left group cursor-default">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 text-emerald-500 transition-transform group-hover:scale-110 origin-left">
                   <Briefcase className="w-5 h-5" />
                   <p className="text-2xl font-black">Business</p>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Pôle Management</p>
                <div className="flex items-center justify-center lg:justify-start gap-1 text-[9px] font-black text-emerald-500/60">
                   <TrendingUp className="w-3 h-3" /> INCUBATEUR
                </div>
              </div>
              <div className="text-center lg:text-left group cursor-default">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 text-amber-500 transition-transform group-hover:scale-110 origin-left">
                   <TrendingUp className="w-5 h-5" />
                   <p className="text-2xl font-black">Trading</p>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Pôle Finance</p>
                <div className="flex items-center justify-center lg:justify-start gap-1 text-[9px] font-black text-amber-500/60">
                   <TrendingUp className="w-3 h-3" /> SIGNAUX PRO
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 relative"
          >
            {/* Main Image Container with Carousel */}
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border-[12px] border-primary/5 aspect-square md:aspect-[4/5] bg-muted group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={heroImages[currentImageIndex]}
                  alt="Students learning together"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
              
              {/* Overlay Content */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10">
                 <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="bg-white/10 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/20 shadow-2xl relative z-30"
                 >
                    <div className="flex items-center gap-5 mb-5">
                       <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
                          <BookOpen className="text-white w-7 h-7" />
                       </div>
                       <div>
                          <p className="text-white font-black text-xl tracking-tight">Formation Hybride</p>
                          <p className="text-white/70 text-[10px] uppercase font-black tracking-[0.2em]">Présentiel & Digital</p>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <div className="flex items-center justify-between text-[10px] text-white/60 font-black uppercase tracking-widest">
                          <span>Progression Pédagogique</span>
                          <span>92%</span>
                       </div>
                       <div className="h-2 bg-white/10 rounded-full overflow-hidden p-[2px]">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "92%" }}
                            transition={{ duration: 1.5, delay: 1.2 }}
                            className="h-full bg-gradient-to-r from-primary to-primary-foreground rounded-full" 
                          />
                       </div>
                    </div>
                 </motion.div>
              </div>
            </div>

            {/* Floating Information Cards */}
            {floatingCards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: card.delay, duration: 0.6 }}
                className={`absolute ${card.position} z-20 hidden xl:flex items-center gap-3 bg-card p-4 rounded-2xl shadow-2xl border border-border/50 backdrop-blur-sm transform hover:scale-105 transition-transform cursor-default`}
              >
                <div className="p-2 bg-muted rounded-xl">
                  {card.icon}
                </div>
                <span className="text-xs font-black uppercase tracking-tight pr-2">{card.text}</span>
              </motion.div>
            ))}

            {/* Decorative background elements */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/20 rounded-full blur-[80px] pointer-events-none animate-pulse" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
