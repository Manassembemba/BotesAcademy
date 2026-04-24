import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

export const SupportCard = () => {
  const handleWhatsApp = () => {
    window.open("https://wa.me/243000000000", "_blank"); // À remplacer par le vrai numéro
    toast.info("Redirection vers WhatsApp...");
  };

  return (
    <Card className="p-6 border-none bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 group h-full flex flex-col justify-between">
      <div className="space-y-4">
        <div className="p-3 bg-indigo-500/20 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500">
          <MessageSquare className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h4 className="font-bold text-lg mb-1 leading-tight">Besoin d'aide ?</h4>
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            Une question sur vos cours ou vos paiements ? Notre équipe est là pour vous accompagner.
          </p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-6">
        <Button 
          size="sm" 
          className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 h-10 font-black uppercase text-[9px] tracking-widest gap-2"
          onClick={handleWhatsApp}
        >
          <Phone className="w-3 h-3" />
          WhatsApp
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-10 font-black uppercase text-[9px] tracking-widest"
          onClick={() => window.location.href = "mailto:support@nguma.academy"}
        >
          <Mail className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
};
