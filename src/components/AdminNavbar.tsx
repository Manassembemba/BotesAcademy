import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Home, LogOut, GraduationCap, CreditCard, Users, Settings, TrendingUp, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const AdminNavbar = () => {
  const { user, signOut } = useAuth();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-gradient-success rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 glow-success">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold">
            Botes <span className="text-gradient-success">Admin</span>
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
