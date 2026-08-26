import React from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlayCircle, ExternalLink } from "lucide-react";

interface VideoPlayerProps {
  url: string;
  title?: string;
  isPreview?: boolean;
  mode?: 'online' | 'presentiel' | 'hybrid';
  onEnded?: () => void;
}

const getEmbedInfo = (url: string) => {
  if (!url) return { url: "", type: "unknown" };

  // YouTube
  const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return { 
      url: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`, 
      type: "youtube" 
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return { 
      url: `https://player.vimeo.com/video/${vimeoMatch[1]}`, 
      type: "vimeo" 
    };
  }

  // Direct Video Files (MP4, WebM, OGG)
  if (url.match(/\.(mp4|webm|ogg)$/i) || url.includes('supabase.co/storage/v1/object/public/')) {
    return {
      url: url,
      type: "direct"
    };
  }

  return { url: url, type: "external" };
};

export const VideoPlayer = ({ url, title, isPreview = false, mode = 'online' }: VideoPlayerProps) => {
  const { url: embedUrl, type } = getEmbedInfo(url);
  const isOnline = mode === 'online';

  const renderPlayer = () => {
    switch (type) {
      case "youtube":
      case "vimeo":
        return (
          <iframe 
            src={embedUrl} 
            title={title} 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen 
            className="w-full h-full relative z-10"
          ></iframe>
        );
      case "direct":
        return (
          <video 
            src={url} 
            controls 
            controlsList="nodownload"
            className="w-full h-full object-contain bg-black relative z-10"
            poster="/placeholder.svg"
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        );
      default:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-6 bg-gradient-to-b from-card/20 to-black relative z-10">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
             <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center animate-pulse pointer-events-none">
                <PlayCircle className="w-16 h-16 text-primary" />
             </div>
             <div className="text-center space-y-2 relative z-20 pointer-events-none">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Source Externe</h3>
                <p className="text-white/40 font-medium italic text-sm">Ce contenu nécessite une lecture sur la plateforme d'origine.</p>
             </div>
             <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(url, '_blank');
                }}
                className="rounded-2xl h-14 px-10 bg-primary hover:bg-primary/80 text-white font-black uppercase tracking-widest text-xs shadow-glow-primary group transition-all hover:scale-105 active:scale-95 relative z-30"
             >
                <ExternalLink className="w-4 h-4 mr-3" />
                Ouvrir la leçon
             </Button>
          </div>
        );
    }
  };

  return (
    <div className={cn(
      "relative group overflow-hidden rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-500 border-2 transition-all duration-700 h-full",
      isOnline 
        ? "border-primary/20 shadow-primary/10 hover:border-primary/40" 
        : "border-emerald-500/20 shadow-emerald-500/10 hover:border-emerald-500/40"
    )}>
      <AspectRatio ratio={16 / 9} className="bg-black relative overflow-hidden">
        {renderPlayer()}
        
        {/* Dynamic Badge indicator inside the player */}
        <div className="absolute top-6 left-6 z-40 pointer-events-none">
           <Badge className={cn(
             "font-black text-[8px] tracking-[0.2em] px-3 py-1 rounded-full uppercase border shadow-lg",
             isOnline ? "bg-primary/80 border-primary/20 text-white" : "bg-emerald-600/80 border-emerald-400/20 text-white"
           )}>
             {isOnline ? "📡 LIVE VOD" : "🏫 SALLE DE CLASSE"}
           </Badge>
        </div>
        
        {isPreview && (
          <div className="absolute top-4 right-4 z-40">
            <Badge variant="destructive" className="bg-red-600/90 text-[10px] animate-pulse rounded-full px-3">
              MODE APERÇU (30s)
            </Badge>
          </div>
        )}
        
        {(isPreview && type !== 'external') && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-full px-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
             <div className="bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
                <p className="text-white text-xs font-bold uppercase tracking-widest">Version complète disponible après inscription</p>
             </div>
          </div>
        )}
      </AspectRatio>
    </div>
  );
};
