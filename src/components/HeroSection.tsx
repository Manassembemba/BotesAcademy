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
  const y1 = useTransform(scrollY, [0, 500], shouldReduceMotion ? [0, 0] : [0, 60]);
  const y2 = useTransform(scrollY, [0, 500], shouldReduceMotion ? [0, 0] : [0, -40]);

  const heroImages = [
    settings?.appearance?.hero_image_url || heroImage1,
    settings?.appearance?.hero_image_url_2 || heroImage2,
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  return (
    <div ref={containerRef} className="relative pt-24 md:pt-fluid-xl pb-fluid-lg overflow-hidden bg-background">
      {/* Background accents - refined */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[140px] pointer-events-none" 
      />
      <motion.div 
        style={{ y: y2 }}
        className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-accent/5 rounded-full blur-[140px] pointer-events-none" 
      />

      <div className="container relative z-10 mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-fluid-lg">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-[1.2] text-center lg:text-left space-y-fluid-sm w-full"
          >
            {/* HERO BADGE */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted border border-border/50 text-muted-foreground mb-2 mx-auto lg:mx-0">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Excellence Académique</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1] uppercase tracking-tight italic">
              {settings?.appearance?.hero_title ? (
                (() => {
                  const parts = settings.appearance.hero_title.split(/[\[\]]/);
                  return (
                    <>
                      {parts[0]}
                      {parts[1] && <span className="text-primary">{parts[1]}</span>}
                      {parts[2]}
                    </>
                  );
                })()
              ) : (
                <>Architecture de <br /> votre <span className="text-primary">Succès</span></>
              )}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium italic border-l-2 border-primary/20 pl-8 py-2">
              {settings?.appearance?.hero_description || "Botes Academy fusionne la rigueur technologique et l'agilité du marché pour transformer vos ambitions en expertise d'élite."}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 pt-4">
              <Link to="/formations" className="w-full sm:w-auto">
                <Button size="xl" className="w-full sm:w-auto h-14 px-10 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-primary text-white shadow-glow-primary-sm transition-all hover:scale-105 active:scale-95 group">
                  Explorer les pôles
                  <ArrowRight className="ml-3 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <div className="flex -space-x-3 items-center">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden shadow-sm">
                        <img src={`https://i.pravatar.cc/150?u=${i+25}`} alt="Student" />
                    </div>
                 ))}
                 <div className="w-10 h-10 rounded-full border-2 border-background bg-primary flex items-center justify-center text-white text-[8px] font-bold italic shadow-sm">
                    +2K
                 </div>
                 <div className="ml-4 flex flex-col justify-center text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Élèves actifs</p>
                    <div className="flex gap-0.5 text-amber-500">
                        {[1,2,3,4,5].map(i => <CheckCircle key={i} className="w-2.5 h-2.5 fill-current" />)}
                    </div>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-border/10">
              {[
                { icon: <Code className="w-4 h-4" />, label: "TECH", sub: "Info", color: "text-primary" },
                { icon: <Globe className="w-4 h-4" />, label: "MONDE", sub: "Langues", color: "text-accent" },
                { icon: <Briefcase className="w-4 h-4" />, label: "BIZ", sub: "Management", color: "text-emerald-600" },
                { icon: <TrendingUp className="w-4 h-4" />, label: "TRADE", sub: "Finance", color: "text-amber-600" }
              ].map((pole, i) => (
                <div key={i} className="flex flex-col items-center lg:items-start group cursor-default">
                  <div className={cn("flex items-center gap-2 mb-1 transition-colors", pole.color)}>
                      {pole.icon}
                      <p className="text-base font-bold italic tracking-tight leading-none">{pole.label}</p>
                  </div>
                  <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-60">{pole.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 relative w-full lg:max-w-md"
          >
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 aspect-[4/5] bg-muted group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={heroImages[currentImageIndex]}
                  alt="Elite Learning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
              
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                 <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10"
                 >
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                          <BookOpen className="text-white w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-white font-black text-xl tracking-tighter italic uppercase leading-none mb-1">Maîtrise de l'Elite</p>
                          <p className="text-primary font-bold text-[9px] uppercase tracking-[0.2em]">Excellence Académique</p>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center justify-between text-[9px] text-white font-black uppercase tracking-[0.2em] opacity-80">
                          <span>Progression</span>
                          <span className="text-primary">98%</span>
                       </div>
                       <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "98%" }}
                            transition={{ duration: 1.5, delay: 1.2 }}
                            className="h-full bg-primary rounded-full" 
                          />
                       </div>
                    </div>
                 </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
