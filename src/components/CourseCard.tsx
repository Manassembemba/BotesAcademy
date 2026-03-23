import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Star, Users, ArrowRight, ShieldCheck, Globe, FileText } from "lucide-react";
import { Link } from "react-router-dom";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  duration: string;
  rating: number;
  isPremium: boolean;
  price?: string | number;
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
  category,
  image,
  level = "Débutant",
  mode,
  language,
  isSpecialSession,
  hasBrochure,
}: CourseCardProps) => {
  return (
    <Card className="group h-full flex flex-col overflow-hidden border-border/50 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300">
      <CardHeader className="p-0 relative aspect-video overflow-hidden">
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <Badge className="bg-primary/90 text-white border-none shadow-md">
            {category}
          </Badge>
          {isPremium && (
            <Badge variant="secondary" className="bg-amber-500/90 text-white border-none shadow-md">
              Premium
            </Badge>
          )}
          {isSpecialSession && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive shadow-md font-bold animate-pulse">
              SESSION SPÉCIALE
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 flex-1 space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-foreground">{rating}</span>
          </div>
        </div>

        <h3 className="text-xl font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>

        <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
          {description}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
            {level}
          </Badge>
          {mode && (
            <Badge variant="outline" className="text-[10px] uppercase bg-secondary/30">
              {mode === 'online' ? '💻 VOD' : mode === 'presentiel' ? '🏫 Présentiel' : '🌓 Hybride'}
            </Badge>
          )}
          {language && (
            <Badge variant="outline" className="text-[10px] uppercase bg-secondary/30">
              <Globe className="w-3 h-3 mr-1" />
              {language}
            </Badge>
          )}
          {hasBrochure && (
            <Badge variant="outline" className="text-[10px] uppercase bg-primary/10 text-primary border-primary/20">
              <FileText className="w-3 h-3 mr-1" />
              Brochure
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex items-center justify-between border-t border-border/50 mt-auto">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {isPremium ? "Prix" : "Accès"}
          </span>
          <span className="text-2xl font-black text-primary">
            {isPremium ? (typeof price === 'number' ? `$${price}` : price) : "Gratuit"}
          </span>
        </div>
        <Link to={`/formations/${id}`}>
          <Button variant="hero" size="sm" className="group/btn gap-2 shadow-lg shadow-primary/20">
            Détails
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
