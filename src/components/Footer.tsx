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
                <span className="text-xl font-black uppercase tracking-tighter leading-none italic">
                  Botes <span className="text-primary">Academy</span>
                </span>
                <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] mt-1">Elite Intelligence</span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed italic font-medium opacity-80">
              L'excellence académique fusionnée avec l'agilité technologique. Nous forgeons les leaders de l'économie numérique en RDC.
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
              title: "Plateforme",
              links: [
                { name: "Cursus Elite", path: "/formations" },
                { name: "Terminal Market", path: "/marketplace" },
                { name: "Elite Dashboard", path: "/dashboard" },
                { name: "Espace Membre", path: "/auth" }
              ]
            },
            {
              title: "Support Tech",
              links: [
                { name: "Centre d'Aide", path: settings?.academy_info?.support_link || "#" },
                { name: "Assistance Directe", path: `mailto:${settings?.academy_info?.email || "academy@botes.com"}` },
                { name: "Flux Telegram", path: "#" },
                { name: "Documentation", path: "#" }
              ]
            },
            {
              title: "Gouvernance",
              links: [
                { name: "Mentions Légales", path: "#" },
                { name: "Contrats CGV", path: "#" },
                { name: "Data & Privacy", path: "#" },
                { name: "Sécurité", path: "#" }
              ]
            }
          ].map((column, i) => (
            <div key={i}>
              <h4 className="font-black mb-8 text-lg uppercase tracking-tight italic border-l-4 border-primary/20 pl-4">{column.title}</h4>
              <ul className="space-y-4">
                {column.links.map((link, j) => (
                  <li key={j}>
                    <Link to={link.path} className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all duration-300 flex items-center gap-2 group/link">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover/link:bg-primary transition-all scale-0 group-hover/link:scale-100" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-6 text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-black italic opacity-60">
          <p>© 2026 BOTES ACADEMY // PROTOCOLE D'EXCELLENCE</p>
          <div className="flex gap-8">
            <span>DRC // GLOBAL</span>
            <span>SYSTEM STATUS: OPERATIONAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
