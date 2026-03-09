import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, GraduationCap, Code, Globe, Laptop, BookOpen, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <div className="relative pt-32 pb-20 overflow-hidden bg-background">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-sm font-semibold tracking-wide uppercase">ON NE FORME PAS MAIS ON TRANSFORME</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-8 uppercase tracking-tighter">
              L'Excellence dans chaque <span className="text-gradient-primary">Discipline</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Informatique, Business, Langues et Trading. Apprenez avec des experts passionnés et obtenez les compétences concrètes pour réussir votre carrière.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/formations">
                <Button variant="hero" size="xl" className="group rounded-2xl h-14 px-10">
                  Découvrir nos pôles
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button variant="outline" size="xl" className="group rounded-2xl h-14 px-10 border-2">
                  Ressources & Outils
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-8 border-t border-border/50">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1 text-primary">
                   <Code className="w-4 h-4" />
                   <p className="text-2xl font-black">Tech</p>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Pôle Informatique</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1 text-accent">
                   <Globe className="w-4 h-4" />
                   <p className="text-2xl font-black">Langues</p>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Pôle International</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1 text-emerald-500">
                   <GraduationCap className="w-4 h-4" />
                   <p className="text-2xl font-black">Business</p>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Pôle Management</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1 text-amber-500">
                   <Laptop className="w-4 h-4" />
                   <p className="text-2xl font-black">Design</p>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Pôle Créatif</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 relative"
          >
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-primary/5 aspect-square md:aspect-[4/5] bg-muted group">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80"
                alt="Students learning together"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8">
                 <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                          <BookOpen className="text-white w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-white font-black text-lg">Formation Hybride</p>
                          <p className="text-white/70 text-xs uppercase font-bold tracking-widest">En ligne & Présentiel</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       {[1,2,3,4,5].map(i => <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-primary w-2/3" /></div>)}
                    </div>
                 </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/20 rounded-2xl rotate-12 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
