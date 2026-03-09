import React, { useState } from "react";
import { Document, Page } from 'react-pdf';
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfPlayerProps {
  url: string;
  mode?: 'online' | 'presentiel' | 'hybrid';
}

export const PdfPlayer = ({ url, mode = 'online' }: PdfPlayerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isOnline = mode === 'online';

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));

  return (
    <div className={cn(
      "w-full border-2 rounded-[2rem] overflow-hidden transition-all duration-500 shadow-2xl",
      isFullscreen ? "fixed inset-0 z-[100] h-screen bg-black/95 rounded-none border-0" : "bg-muted/20",
      isOnline ? "border-primary/20 shadow-primary/10" : "border-emerald-500/20 shadow-emerald-500/10"
    )}>
      <div className={cn(
        "overflow-auto flex justify-center p-4 scrollbar-thin bg-black/5 relative",
        isFullscreen ? "h-[calc(100vh-70px)]" : "h-[75vh]"
      )}>
        {/* Context Badge */}
        {!isFullscreen && (
          <div className="absolute top-4 left-4 z-10 opacity-50">
             <Badge className={cn(
               "text-[8px] font-black uppercase tracking-widest",
               isOnline ? "bg-primary text-white" : "bg-emerald-600 text-white"
             )}>PDF DOCUMENT</Badge>
          </div>
        )}
        <Document 
          file={url} 
          onLoadSuccess={onDocumentLoadSuccess} 
          loading={<div className="flex items-center gap-2 py-20 text-white"><Loader2 className="animate-spin" /> Chargement du PDF...</div>}
        > 
          <Page pageNumber={pageNumber} scale={scale} /> 
        </Document>
      </div>
      
      {numPages && (
        <div className="flex flex-wrap items-center justify-center gap-4 p-3 bg-card border-t border-border/50">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-[10px] font-black w-12 text-center bg-background/50 py-1 rounded-md border">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setScale(prev => Math.min(prev + 0.2, 3.0))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="hidden sm:block w-px h-6 bg-border/50 mx-2" />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 px-3 rounded-xl font-bold" onClick={goToPrevPage} disabled={pageNumber <= 1}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Préc.
            </Button>
            <p className="text-xs font-black uppercase px-3">Page {pageNumber} / {numPages}</p>
            <Button variant="outline" size="sm" className="h-8 px-3 rounded-xl font-bold" onClick={goToNextPage} disabled={pageNumber >= numPages}>
              Suiv. <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="hidden sm:block w-px h-6 bg-border/50 mx-2" />

          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-8 rounded-xl font-bold gap-2", isFullscreen && "text-primary")}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize className="h-4 w-4" />
            {isFullscreen ? "Quitter" : "Plein écran"}
          </Button>
        </div>
      )}
    </div>
  );
};
