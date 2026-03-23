import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, TrendingUp, Info } from "lucide-react";
import { motion } from "framer-motion";

interface StrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: {
    title: string;
    content: string;
    category?: string;
  } | null;
}

export const StrategyModal = ({ isOpen, onClose, strategy }: StrategyModalProps) => {
  if (!strategy) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden rounded-[2.5rem] bg-background/95 backdrop-blur-2xl border-primary/20 shadow-2xl">
        <div className="relative h-48 bg-gradient-to-br from-primary/20 via-primary/5 to-accent/20 overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[grid_24px_24px]" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="p-4 bg-primary/10 rounded-3xl mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none">
              {strategy.title}
            </DialogTitle>
            <div className="mt-3">
              <Badge className="bg-primary/20 text-primary border-primary/30 uppercase font-black text-[10px] tracking-widest px-4 py-1 rounded-full">
                Documentation Stratégique
              </Badge>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-8">
          <div className="flex items-center gap-3 mb-6 p-4 bg-muted/30 rounded-2xl border border-border/50">
            <Info className="w-5 h-5 text-accent" />
            <p className="text-sm font-medium italic text-muted-foreground">
              Cette stratégie est réservée aux membres de la Botes Academy. Ne partagez pas ce contenu.
            </p>
          </div>

          <ScrollArea className="flex-1 pr-4">
            <div className="prose prose-invert prose-gold max-w-none">
                <div className="whitespace-pre-wrap font-medium leading-relaxed text-foreground/90">
                    {strategy.content}
                </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
