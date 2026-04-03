import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const Footer = () => {
  const { settings } = useSiteSettings();

  return (
    <footer className="py-16 bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <img src="/logo.png" alt="Botes Academy Logo" className="h-64 w-auto object-contain mb-6" />
            <p className="text-muted-foreground text-sm leading-relaxed italic font-medium">
              Première académie multi-disciplines en RDC. On ne forme pas, on transforme votre avenir par l'expertise.
            </p>
            <div className="flex gap-4">
              <a href={settings?.social_links?.facebook || "#"} target="_blank" rel="noopener noreferrer" className="p-2 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-all"><Facebook className="w-5 h-5" /></a>
              <a href={settings?.social_links?.instagram || "#"} target="_blank" rel="noopener noreferrer" className="p-2 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-all"><Instagram className="w-5 h-5" /></a>
              <a href={settings?.social_links?.twitter || "#"} target="_blank" rel="noopener noreferrer" className="p-2 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-all"><Twitter className="w-5 h-5" /></a>
              <a href={settings?.social_links?.youtube || "#"} target="_blank" rel="noopener noreferrer" className="p-2 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-all"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-black mb-6 text-lg uppercase tracking-tighter italic">Plateforme</h4>
            <ul className="space-y-4 text-sm text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
              <li><Link to="/formations" className="hover:text-primary transition-colors">Formations</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Tableau de bord</Link></li>
              <li><Link to="/auth" className="hover:text-primary transition-colors">Connexion / Inscription</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black mb-6 text-lg uppercase tracking-tighter italic">Support</h4>
            <ul className="space-y-4 text-sm text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
              <li><a href={settings?.academy_info?.support_link || "#"} className="hover:text-primary transition-colors">Centre d'aide</a></li>
              <li><a href={`mailto:${settings?.academy_info?.email || "academy@botes.com"}`} className="hover:text-primary transition-colors">Contactez-nous</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Canal Telegram</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black mb-6 text-lg uppercase tracking-tighter italic">Légal</h4>
            <ul className="space-y-4 text-sm text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
              <li><a href="#" className="hover:text-primary transition-colors">Mentions Légales</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Conditions Générales (CGV)</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Politique de Confidentialité</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black italic">
          <p>© 2026 Botes Academy. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
