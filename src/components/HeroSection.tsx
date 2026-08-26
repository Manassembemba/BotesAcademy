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
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] uppercase tracking-tight italic">
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
                <>Apprenez des compétences <br /> pour votre <span className="text-primary">Avenir</span></>
              )}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              {settings?.appearance?.hero_description || "Botes Academy vous accompagne dans votre montée en compétences avec des formations pratiques et certifiantes adaptées aux besoins du marché."}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link to="/formations" className="w-full sm:w-auto">
                <Button size="xl" className="w-full sm:w-auto h-14 px-10 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary text-white shadow-md transition-all hover:scale-105 active:scale-95 group">
                  Découvrir les formations
                  <ArrowRight className="ml-3 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
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
                          <p className="text-white font-bold text-lg tracking-tight uppercase leading-none mb-1">Botes Academy</p>
                          <p className="text-primary font-bold text-[10px] uppercase tracking-wider">Formations Certifiantes</p>
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
