import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
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
  Briefcase,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { cn } from "@/lib/utils";
import heroImage1 from "@/assets/hero-trader-student.jpg";
import heroImage2 from "/Banniere.jpeg";

const HeroSection = () => {
  const { settings } = useSiteSettings();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const shouldReduceMotion = useReducedMotion();
  const y1 = useTransform(scrollY, [0, 500], shouldReduceMotion ? [0, 0] : [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], shouldReduceMotion ? [0, 0] : [0, -150]);
  const rotate = useTransform(scrollY, [0, 500], shouldReduceMotion ? [0, 0] : [0, 10]);

  const heroImages = [
    settings?.appearance?.hero_image_url || heroImage1,
    settings?.appearance?.hero_image_url_2 || heroImage2,
    settings?.appearance?.hero_image_url_3 || "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80",
    settings?.appearance?.hero_image_url_4 || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);
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
    <div ref={containerRef} className="relative pt-24 md:pt-fluid-xl pb-fluid-lg overflow-hidden bg-mesh-gradient perspective-2000">
      {/* Dynamic background accents */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute top-0 right-0 w-[70vw] h-[70vw] bg-primary/10 rounded-full blur-[140px] pointer-events-none animate-pulse" 
      />
      <motion.div 
        style={{ y: y2 }}
        className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-accent/10 rounded-full blur-[140px] pointer-events-none animate-glow" 
      />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-fluid-lg">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-[1.2] text-center lg:text-left space-y-6 md:space-y-fluid-sm w-full"
          >
            {/* HERO BADGE (Preuve Sociale) */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-2 group cursor-pointer hover:bg-primary/20 transition-colors mx-auto lg:mx-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary">Académie N°1 en RDC</span>
            </div>
            
            <h1 className="text-[clamp(2.5rem,6vw,6rem)] font-black leading-[0.9] uppercase tracking-tighter italic break-words mt-0">
              {settings?.appearance?.hero_title ? (
                (() => {
                  const parts = settings.appearance.hero_title.split(/[\[\]]/);
                  return (
                    <>
                      {parts[0]}
                      {parts[1] && <span className="text-gradient-primary">{parts[1]}</span>}
                      {parts[2]}
                    </>
                  );
                })()
              ) : (
                <>Architecture de <br /> votre <span className="text-gradient-primary">Succès</span></>
              )}
            </h1>
            
            <p className="text-base md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium italic border-l-4 md:border-l-[12px] border-primary/10 pl-4 md:pl-10 py-4 bg-primary/5 rounded-r-3xl text-left">
              {settings?.appearance?.hero_description || "Botes Academy fusionne la rigueur technologique et l'agilité du marché pour transformer vos ambitions en expertise d'élite."}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 md:gap-12 pt-6 md:pt-10">
              <Link to="/formations" className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="w-full sm:w-auto h-16 md:h-24 px-8 md:px-16 rounded-2xl md:rounded-[2.5rem] text-xs md:text-sm font-black uppercase tracking-widest shadow-glow-primary group relative overflow-hidden transition-all hover:scale-105 active:scale-95 border-2 border-primary/20 bg-white/5 backdrop-blur-xl">
                  <span className="relative z-10 flex items-center justify-center gap-4 md:gap-6">
                    Explorer les pôles
                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center group-hover:rotate-12 transition-all shadow-glow-primary">
                        <ArrowRight className="w-4 h-4 md:w-6 md:h-6 text-white transition-transform group-hover:translate-x-2" />
                    </div>
                  </span>
                </Button>
              </Link>

              <div className="flex -space-x-3 md:-space-x-4">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 md:border-4 border-background bg-muted overflow-hidden shadow-2xl transition-transform hover:-translate-y-2 hover:z-10 cursor-pointer">
                        <img src={`https://i.pravatar.cc/150?u=${i+10}`} alt="Student" />
                    </div>
                 ))}
                 <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 md:border-4 border-background bg-primary flex items-center justify-center text-white text-[8px] md:text-[10px] font-black italic shadow-glow-primary">
                    +2K
                 </div>
                 <div className="ml-4 md:ml-6 flex flex-col justify-center text-left">
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest leading-none mb-1">Élèves actifs</p>
                    <div className="flex gap-0.5 md:gap-1 text-amber-500">
                        {[1,2,3,4,5].map(i => <CheckCircle key={i} className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current" />)}
                    </div>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12 pt-8 md:pt-fluid-md border-t border-border/20 relative">
              {[
                { icon: <Code className="w-6 h-6 md:w-10 md:h-10" />, label: "TECH", sub: "Pôle Info", color: "text-primary", bg: "bg-primary/5" },
                { icon: <Globe className="w-6 h-6 md:w-10 md:h-10" />, label: "MONDE", sub: "Langues", color: "text-accent", bg: "bg-accent/5" },
                { icon: <Briefcase className="w-6 h-6 md:w-10 md:h-10" />, label: "BUSINESS", sub: "Management", color: "text-emerald-500", bg: "bg-emerald-500/5" },
                { icon: <TrendingUp className="w-6 h-6 md:w-10 md:h-10" />, label: "TRADING", sub: "Finance", color: "text-amber-500", bg: "bg-amber-500/5" }
              ].map((pole, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -5 }}
                  className="group cursor-default relative"
                >
                  <div className={cn("p-4 md:p-6 rounded-2xl md:rounded-[2rem] transition-all duration-500 border border-transparent hover:border-white/10 hover:bg-white/5", pole.bg)}>
                    <div className={cn("flex flex-col md:flex-row items-center lg:items-start gap-2 md:gap-4 mb-2 md:mb-4 transition-transform group-hover:scale-105", pole.color)}>
                        {pole.icon}
                        <p className="text-xl md:text-3xl font-black italic tracking-tighter leading-none">{pole.label}</p>
                    </div>
                    <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] md:tracking-[0.4em] opacity-60 group-hover:opacity-100 transition-opacity text-center md:text-left">{pole.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 relative w-full lg:w-auto"
          >
            <div className="relative z-10 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 aspect-[4/5] bg-muted group transition-all duration-700">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={heroImages[currentImageIndex]}
                  alt="Elite Learning"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 1.5 }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              
              <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-between">
                 <div className="flex justify-between items-start">
                    <div className="px-3 md:px-5 py-1.5 md:py-2 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10">
                       <p className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-[0.4em] animate-pulse">Live // Stream</p>
                    </div>
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
                       <Zap className="text-accent w-5 h-5 md:w-7 md:h-7" />
                    </div>
                 </div>

                 <motion.div 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.2, duration: 1 }}
                    className="bg-black/60 backdrop-blur-2xl p-6 md:p-10 rounded-3xl md:rounded-4xl border border-white/10 relative z-30"
                 >
                    <div className="flex items-center gap-4 md:gap-8 mb-4 md:mb-8">
                       <div className="w-12 h-12 md:w-20 md:h-20 bg-primary rounded-2xl md:rounded-3xl flex items-center justify-center">
                          <BookOpen className="text-white w-6 h-6 md:w-10 md:h-10" />
                       </div>
                       <div>
                          <p className="text-white font-black text-xl md:text-3xl tracking-tighter italic uppercase leading-none mb-1">Intelligence Hybride</p>
                          <p className="text-primary font-black text-[9px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.4em]">Status: Excellence Académique</p>
                       </div>
                    </div>
                    <div className="space-y-3 md:space-y-5">
                       <div className="flex items-center justify-between text-[9px] md:text-[11px] text-white font-black uppercase tracking-[0.2em] md:tracking-[0.4em] opacity-80">
                          <span>Transmission</span>
                          <span className="text-primary">98.4%</span>
                       </div>
                       <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "98.4%" }}
                            transition={{ duration: 2.5, delay: 1.8, ease: "circOut" }}
                            className="h-full bg-primary rounded-full" 
                          />
                       </div>
                    </div>
                 </motion.div>
              </div>
            </div>

            {/* Floating Data Nodes (Hidden on mobile) */}
            {floatingCards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: card.delay + 0.8, duration: 1 }}
                className={`absolute ${card.position} z-20 hidden 2xl:flex items-center gap-6 bg-white/80 dark:bg-black/80 p-6 rounded-3xl border border-white/20 backdrop-blur-3xl`}
              >
                <div className="p-3.5 bg-primary/10 rounded-2xl text-primary">
                  {card.icon}
                </div>
                <div className="flex flex-col pr-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 mb-1">Protocole</span>
                  <span className="text-sm font-black uppercase tracking-tighter italic leading-none">{card.text}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
