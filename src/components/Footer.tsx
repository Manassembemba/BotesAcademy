import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const Footer = () => {
  const { settings } = useSiteSettings();

  return (
    <footer className="py-fluid-lg bg-card border-t border-border/40 mt-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none bg-[grid_40px_40px]" />
      
      <div className="container relative z-10 mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-fluid-md mb-fluid-md">
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-4 group">
              <img src="/logo.png?v=2" alt="Botes Academy Logo" className="h-12 w-auto object-contain transition-transform group-hover:scale-110" />
              <div className="flex flex-col">
                <span className="text-xl font-bold uppercase tracking-tight leading-none italic">
                  Botes <span className="text-primary">Academy</span>
                </span>
                <span className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest mt-1">Académie Professionnelle</span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Centre de formation professionnelle, pratique et certifiante pour développer vos compétences en RDC.
            </p>
            <div className="flex gap-4">
              {[
                { icon: <Facebook />, link: settings?.social_links?.facebook },
                { icon: <Instagram />, link: settings?.social_links?.instagram },
                { icon: <Twitter />, link: settings?.social_links?.twitter },
                { icon: <Youtube />, link: settings?.social_links?.youtube }
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.link || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-3 bg-muted/30 border border-border/50 rounded-2xl hover:bg-primary/10 hover:text-primary hover:border-primary/20 hover:-translate-y-1 transition-all duration-500"
                >
                  <div className="w-5 h-5">{social.icon}</div>
                </a>
              ))}
            </div>
          </div>
          
          {[
            {
              title: "Formations",
              links: [
                { name: "Nos Formations", path: "/formations" },
                { name: "Bibliothèque", path: "/marketplace" },
                { name: "Espace Étudiant", path: "/dashboard" },
                { name: "Connexion", path: "/auth" }
              ]
            },
            {
              title: "Assistance",
              links: [
                { name: "Centre d'Aide", path: settings?.academy_info?.support_link || "#" },
                { name: "Contact", path: `mailto:${settings?.academy_info?.email || "academy@botes.com"}` },
                { name: "Documentation", path: "#" }
              ]
            },
            {
              title: "Informations",
              links: [
                { name: "Mentions Légales", path: "#" },
                { name: "Conditions Générales", path: "#" },
                { name: "Confidentialité", path: "#" }
              ]
            }
          ].map((column, i) => (
            <div key={i}>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-wider border-l-2 border-primary/40 pl-3">{column.title}</h4>
              <ul className="space-y-3">
                {column.links.map((link, j) => (
                  <li key={j}>
                    <Link to={link.path} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 BOTES ACADEMY. Tous droits réservés.</p>
          <p>République Démocratique du Congo</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
