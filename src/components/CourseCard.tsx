import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Star, Users, ArrowRight, ShieldCheck, Globe, FileText, Layout } from "lucide-react";
import { Link } from "react-router-dom";
import { isAfter } from "date-fns";

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
  language,
  isSpecialSession,
  hasBrochure,
}: CourseCardProps) => {
  const isPromoActive = promoEndDate ? isAfter(new Date(promoEndDate), new Date()) : false;
  const discount = (fullPrice && price && typeof price === 'number') 
    ? Math.round(((fullPrice - price) / fullPrice) * 100) 
    : 0;

  return (
    <Card className="group h-full flex flex-col overflow-hidden border-border/50 bg-card hover:border-primary/50 hover:shadow-2xl transition-all duration-500 rounded-[2rem]">
      <CardHeader className="p-0 relative aspect-video overflow-hidden">
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
          <Badge className="bg-primary/90 backdrop-blur-md text-white border-none shadow-lg font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-full">
            {category}
          </Badge>
          {isPremium && (
            <Badge variant="secondary" className="bg-amber-500/90 backdrop-blur-md text-white border-none shadow-lg font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-full">
              Premium
            </Badge>
          )}
        </div>

        {isPromoActive && discount > 0 && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-full animate-pulse shadow-lg shadow-emerald-500/20">
              -{discount}%
            </Badge>
          </div>
        )}

        {isSpecialSession && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <Badge variant="outline" className="w-full justify-center bg-destructive/20 backdrop-blur-md text-destructive border-destructive/30 shadow-xl font-black uppercase text-[9px] tracking-[0.2em] py-1.5">
              SESSION SPÉCIALE
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6 flex-1 space-y-4">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-foreground">{rating}</span>
          </div>
        </div>

        <h3 className="text-xl font-black uppercase tracking-tighter italic leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2">
          {title}
        </h3>

        <p className="text-muted-foreground text-xs font-medium line-clamp-3 leading-relaxed italic">
          {description}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-black bg-muted/30 border-none rounded-lg px-2">
            {level}
          </Badge>
          {mode && (
            <Badge variant="outline" className="text-[9px] font-black uppercase bg-secondary/30 border-none rounded-lg px-2">
              {mode === 'online' ? '💻 VOD' : mode === 'presentiel' ? '🏫 Présentiel' : '🌓 Hybride'}
            </Badge>
          )}
          {hasBrochure && (
            <Badge variant="outline" className="text-[9px] font-black uppercase bg-primary/5 text-primary border border-primary/10 rounded-lg px-2">
              <FileText className="w-3 h-3 mr-1" />
              Brochure
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex items-center justify-between border-t border-border/50 mt-auto bg-muted/5">
        <div className="flex flex-col">
          <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mb-1">
            Investissement
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary italic leading-none">
              {isPremium ? (typeof price === 'number' ? `$${price}` : price) : "Gratuit"}
            </span>
            {isPromoActive && fullPrice && (
              <span className="text-xs font-bold text-muted-foreground line-through opacity-50">
                ${fullPrice}
              </span>
            )}
          </div>
        </div>
        <Link to={`/formations/${id}`}>
          <Button className="rounded-xl h-10 font-black uppercase text-[10px] tracking-widest shadow-glow-primary-sm group/btn px-6">
            Explorer
            <ArrowRight className="ml-2 w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
