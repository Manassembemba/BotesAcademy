import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Home, LogOut, CreditCard, Users, Settings, TrendingUp, CheckCircle2, FileText, Upload } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const AdminNavbar = () => {
  const { user, role, signOut } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="Botes Academy Logo" className="h-[200px] w-auto object-contain" />
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
            {role === 'receptionist' ? 'Réception' : 'Admin'}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            to="/admin/payments"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Paiements
          </Link>
          <Link
            to="/admin/delivery"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Upload className="w-4 h-4" />
            Livraisons
          </Link>
          <Link
            to="/admin/applications"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText className="w-4 h-4" />
            Candidatures
          </Link>
          <Link
            to="/admin/students"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users className="w-4 h-4" />
            Étudiants
          </Link>
          <Link
            to="/admin/attendance"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Émargement
          </Link>
          
          {isAdmin && (
            <>
              <Link
                to="/admin/accounting"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                Comptabilité
              </Link>
              <Link
                to="/admin/settings"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="w-4 h-4" />
                Paramètres
              </Link>
            </>
          )}

          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
            Retour au site
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && (
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default AdminNavbar;
