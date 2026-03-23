import React from "react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Megaphone, ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

const GlobalBanner = () => {
  const { settings } = useSiteSettings();
  const [isVisible, setIsVisible] = useState(true);

  if (!settings?.global_banner?.is_active || !isVisible) return null;

  return (
    <div className="bg-primary px-4 py-3 text-white relative animate-in fade-in slide-in-from-top duration-500">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 text-center">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-white/20 rounded-md">
            <Megaphone className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight">
            {settings.global_banner.text}
          </span>
        </div>
        
        {settings.global_banner.link && (
          <Link 
            to={settings.global_banner.link}
            className="group flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-white text-primary px-3 py-1 rounded-full hover:bg-white/90 transition-all"
          >
            En savoir plus
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      <button 
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors"
        aria-label="Fermer la bannière"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default GlobalBanner;
