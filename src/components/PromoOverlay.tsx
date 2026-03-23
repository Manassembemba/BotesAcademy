import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const PromoOverlay = () => {
  const { settings } = useSiteSettings();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show overlay after 3 seconds if active in settings
    if (settings?.promo_overlay?.is_active) {
      const timer = setTimeout(() => {
        const hasSeenPromo = sessionStorage.getItem("promo_dismissed");
        if (!hasSeenPromo) {
          setIsVisible(true);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [settings?.promo_overlay?.is_active]);

  const dismissPromo = () => {
    setIsVisible(false);
    sessionStorage.setItem("promo_dismissed", "true");
  };

  if (!settings?.promo_overlay?.is_active) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl overflow-hidden bg-card border-2 border-primary/20 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <button 
              onClick={dismissPromo}
              className="absolute top-6 right-6 p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row h-full">
              <div className="w-full md:w-2/5 relative h-48 md:h-auto">
                <img 
                  src={settings.promo_overlay.image_url || "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80"} 
                  alt="Promotion" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-card via-transparent to-transparent" />
              </div>

              <div className="w-full md:w-3/5 p-8 md:p-12 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Offre Exceptionnelle</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-black leading-tight uppercase tracking-tighter">
                  {settings.promo_overlay.title || "Lancez votre Transformation"}
                </h2>

                <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                  {settings.promo_overlay.description || "Rejoignez l'élite aujourd'hui."} {settings.promo_overlay.promo_code && (
                    <>Utilisez le code <span className="px-2 py-1 bg-primary/5 border border-primary/10 rounded text-primary font-mono font-bold italic text-xs">{settings.promo_overlay.promo_code}</span>.</>
                  )}
                </p>

                <div className="flex items-center gap-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Expire dans : <span className="text-primary">{settings.promo_overlay.countdown_hours || 48} heures</span></span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link to="/formations" onClick={dismissPromo} className="flex-1">
                    <Button className="w-full h-12 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                      En profiter
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <button 
                    onClick={dismissPromo}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PromoOverlay;
