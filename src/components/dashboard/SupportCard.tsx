import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export const SupportCard = () => {
  const { settings } = useSiteSettings();

  const handleWhatsApp = () => {
    const supportLink = settings?.academy_info?.support_link;
    const phone = settings?.academy_info?.phone;

    if (supportLink && supportLink.trim().length > 0) {
      if (supportLink.startsWith("http://") || supportLink.startsWith("https://")) {
        window.open(supportLink, "_blank");
      } else {
        const cleanNumber = supportLink.replace(/\D/g, "");
        window.open(`https://wa.me/${cleanNumber}?text=Bonjour%2C%20j%27ai%20une%20question%20concernant%20Botes%20Academy`, "_blank");
      }
      toast.info("Redirection vers WhatsApp...");
      return;
    }

    if (phone && phone.trim().length > 0) {
      const cleanNumber = phone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanNumber}?text=Bonjour%2C%20j%27ai%20une%20question%20concernant%20Botes%20Academy`, "_blank");
      toast.info("Redirection vers WhatsApp...");
      return;
    }

    toast.error("Le contact WhatsApp n'a pas encore été configuré par l'administration.");
  };

  const handleEmail = () => {
    const email = settings?.academy_info?.email || "contact@botesacademy.com";
    window.location.href = `mailto:${email}?subject=Demande%20d%27assistance%20-%20Botes%20Academy`;
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
          className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 h-10 font-black uppercase text-[9px] tracking-widest gap-2 text-white shadow-sm"
          onClick={handleWhatsApp}
        >
          <Phone className="w-3 h-3" />
          WhatsApp
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 rounded-xl border-indigo-200/40 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 h-10 font-black uppercase text-[9px] tracking-widest gap-1"
          onClick={handleEmail}
          title={settings?.academy_info?.email || "Email de support"}
        >
          <Mail className="w-3 h-3" /> Email
        </Button>
      </div>
    </Card>
  );
};
