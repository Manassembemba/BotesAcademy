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
              className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover/img:scale-105"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />
            
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <Badge className="bg-primary/90 backdrop-blur-md text-white font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-lg border-0 shadow-sm">
                {category}
              </Badge>
            </div>

            {isPromoActive && discount > 0 && (
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-emerald-500 text-white font-bold uppercase text-[10px] tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                  -{discount}%
                </Badge>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-6 flex-1 space-y-4 relative z-10">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{duration}</span>
              </div>
              <div className="flex items-center gap-1.5 text-primary text-base font-bold">
                 <span>{totalPrice}$</span>
                 {fullPrice && isPromoActive && (
                   <span className="text-xs text-muted-foreground line-through opacity-50 font-normal">{fullPrice + registrationFee}$</span>
                 )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl md:text-2xl font-bold uppercase tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {title}
              </h3>
              <p className="text-muted-foreground text-sm font-normal line-clamp-2 leading-relaxed">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="px-3 py-1 rounded-lg bg-muted/50 border border-border/40 text-xs font-medium text-muted-foreground">
                {level}
              </div>
              {mode && (
                <div className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                  {mode === 'online' ? 'En ligne' : mode === 'presentiel' ? 'Présentiel' : 'Hybride'}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-6 md:p-8 pt-0 flex flex-col mt-auto border-t border-border/10 bg-muted/5 relative z-10">
              <Button className="w-full h-12 rounded-xl shadow-sm bg-primary text-white hover:bg-primary/90 font-bold uppercase tracking-wider text-xs flex items-center justify-between px-6 mt-6 group/btn">
                <span>Voir la formation</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
};

export default CourseCard;
