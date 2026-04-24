import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Star, ArrowRight, Zap, GraduationCap, Laptop, Building2, Languages, Car } from "lucide-react";
import { Link } from "react-router-dom";
import { isAfter } from "date-fns";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  duration: string;
  rating: number;
  isPremium: boolean;
  price?: string | number;
  fullPrice?: number;
  promoEndDate?: string;
  category: string;
  image: string;
  level?: string;
  mode?: string;
  language?: string;
  isSpecialSession?: boolean;
  hasBrochure?: boolean;
  registrationFee?: number;
}

const CourseCard = ({
  id,
  title,
  description,
  duration,
  rating,
  isPremium,
  price,
  fullPrice,
  promoEndDate,
  category,
  image,
  level = "Débutant",
  mode,
  isSpecialSession,
  registrationFee = 0,
}: CourseCardProps) => {
  const isPromoActive = promoEndDate ? isAfter(new Date(promoEndDate), new Date()) : false;
  const numericPrice = typeof price === 'string' ? parseFloat(price) : (price || 0);
  const totalPrice = numericPrice + registrationFee;
  
  const discount = (fullPrice && numericPrice && fullPrice > numericPrice) 
    ? Math.round(((fullPrice - numericPrice) / fullPrice) * 100) 
    : 0;

  return (
    <div className="h-full perspective-2000">
      <Link to={`/formations/${id}`} className="block h-full cursor-pointer group">
        <Card className="h-full flex flex-col overflow-hidden border-border/40 bg-card/60 backdrop-blur-2xl group-hover:border-primary/50 group-hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] transition-all duration-700 rounded-[2rem] relative preserve-3d">
          {/* Technical Background Patterns */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

          <CardHeader className="p-0 relative aspect-[16/10] overflow-hidden group/img">
            {/* Main Image with Parallax-like effect */}
            <motion.img
              src={image || "/placeholder.svg"}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-[3000ms] ease-out group-hover/img:scale-110 group-hover/img:rotate-1"
            />
            
            {/* Technical Overlays */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-90 group-hover/img:opacity-70 transition-opacity duration-700" />
            
            {/* Viewfinder Brackets */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-primary/30 rounded-tl-sm pointer-events-none" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-primary/30 rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-primary/30 rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-primary/30 rounded-br-sm pointer-events-none" />

            <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10">
              <Badge className="bg-primary/20 backdrop-blur-xl text-primary border-primary/30 shadow-2xl uppercase font-black text-[9px] tracking-[0.2em] px-4 py-1.5 rounded-full relative overflow-hidden group/badge">
                  <span className="relative z-10">{category}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/badge:translate-x-full transition-transform duration-1000 ease-in-out" />
              </Badge>
              {isPremium && (
                <Badge className="bg-accent/20 backdrop-blur-xl text-accent border-accent/30 shadow-2xl font-black text-[9px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                  Elite
                </Badge>
              )}
            </div>

            {isPromoActive && discount > 0 && (
              <div className="absolute top-6 right-6 z-10">
                <Badge className="bg-emerald-500 text-white font-black uppercase text-[9px] tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/20">
                  -{discount}%
                </Badge>
              </div>
            )}

            <div className="absolute bottom-6 left-6 right-6 z-10 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90 drop-shadow-md">Session Ouverte</span>
               </div>
               {isSpecialSession && (
                  <Badge className="bg-destructive/80 backdrop-blur-md text-white border-none font-black uppercase text-[8px] tracking-[0.3em] px-3 py-1 animate-glow">
                    PROMO LIVE
                  </Badge>
               )}
            </div>
          </CardHeader>

          <CardContent className="p-8 flex-1 space-y-6 relative z-10">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>{duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-primary text-base font-black italic">
                   <span>{totalPrice}$</span>
                   {fullPrice && isPromoActive && (
                     <span className="text-[10px] text-muted-foreground line-through opacity-50 decoration-destructive">{fullPrice + registrationFee}$</span>
                   )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-[1] group-hover:text-primary transition-colors duration-500 line-clamp-2">
                {title}
              </h3>
              <p className="text-muted-foreground text-sm font-medium line-clamp-2 leading-relaxed opacity-80 italic">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="px-3 py-1.5 rounded-xl bg-muted/30 border border-border/40 transition-colors group-hover:bg-muted/50">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{level}</span>
              </div>
              {mode && (
                <div className="px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/20 transition-colors group-hover:bg-primary/10">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                    {mode === 'online' ? 'VOD / Live' : mode === 'presentiel' ? 'Campus' : 'Hybride'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-8 pt-0 flex flex-col mt-auto border-t border-border/10 bg-muted/5 relative z-10">
              <Button className="w-full h-16 rounded-[1.5rem] shadow-glow-primary group/btn bg-primary group-hover:scale-105 active:scale-95 transition-all duration-500 border-2 border-white/10 flex items-center justify-between px-8 mt-8">
                <span className="font-black uppercase tracking-[0.2em] text-[10px] text-white">Rejoindre le Cursus</span>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center transition-transform group-hover/btn:translate-x-2">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </Button>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
};

export default CourseCard;
