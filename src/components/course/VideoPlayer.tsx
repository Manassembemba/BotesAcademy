import React from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  url: string;
  title: string;
  isPreview?: boolean;
  mode?: 'online' | 'presentiel' | 'hybrid';
}

const getEmbedUrl = (url: string) => {
  if (!url) return "";

  // YouTube
  const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return url;
};

export const VideoPlayer = ({ url, title, isPreview = false, mode = 'online' }: VideoPlayerProps) => {
  const embedUrl = getEmbedUrl(url);
  const isOnline = mode === 'online';

  return (
    <div className={cn(
      "relative group overflow-hidden rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-500 border-2 transition-all duration-700",
      isOnline 
        ? "border-primary/20 shadow-primary/10 hover:border-primary/40" 
        : "border-emerald-500/20 shadow-emerald-500/10 hover:border-emerald-500/40"
    )}>
      <AspectRatio ratio={16 / 9} className={cn(
        "bg-black relative",
        !isOnline && "after:absolute after:inset-0 after:border-[12px] after:border-emerald-950/20 after:pointer-events-none"
      )}>
        <iframe 
          src={embedUrl} 
          title={title} 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen 
          className="w-full h-full"
        ></iframe>
      </AspectRatio>
      
      {/* Dynamic Badge indicator inside the player */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
         <Badge className={cn(
           "font-black text-[8px] tracking-[0.2em] px-3 py-1 rounded-full uppercase border shadow-lg",
           isOnline ? "bg-primary/80 border-primary/20 text-white" : "bg-emerald-600/80 border-emerald-400/20 text-white"
         )}>
           {isOnline ? "📡 LIVE VOD" : "🏫 SALLE DE CLASSE"}
         </Badge>
      </div>
      
      {isPreview && (
        <div className="absolute top-4 right-4 z-20">
          <Badge variant="destructive" className="bg-red-600/90 text-[10px] animate-pulse rounded-full px-3">
            MODE APERÇU (30s)
          </Badge>
        </div>
      )}
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full px-8 opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
            <p className="text-white text-xs font-bold uppercase tracking-widest">Version complète disponible après inscription</p>
         </div>
      </div>
    </div>
  );
};
