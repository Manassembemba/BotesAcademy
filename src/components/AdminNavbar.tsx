import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Home, 
  LogOut, 
  CreditCard, 
  Users, 
  Settings, 
  TrendingUp, 
  CheckCircle2, 
  FileText, 
  Upload, 
  BookOpen, 
  ChevronDown, 
  Menu, 
  X, 
  UserPlus, 
  User, 
  ShoppingBag, 
  Package, 
  Clock, 
  Target, 
  Megaphone,
  CheckCheck
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminNavbar = () => {
  const { user, role, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = role === 'admin';

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ['adminNavbarProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("[AdminNavbar] Sign out error:", err);
    }
  };

  const isPedagogyActive = ["/admin/students", "/admin/attendance", "/admin/formations", "/admin/announcements"].some(p => location.pathname.startsWith(p));
  const isFinanceActive = ["/admin/debts", "/admin/payment-validation", "/admin/accounting"].some(p => location.pathname.startsWith(p));
  const isSystemActive = ["/admin/tools", "/admin/indicator-delivery", "/admin/analytics", "/admin/settings"].some(p => location.pathname.startsWith(p));

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-md border-b border-border/50 shadow-xs">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* GAUCHE : LOGO & BADGE RÔLE */}
          <div className="flex items-center gap-6">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 shrink-0 group">
              <img 
                src="/logo.png?v=2" 
                alt="Botes Academy" 
                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105" 
              />
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
                {role === 'receptionist' ? 'Réception' : role === 'teacher' ? 'Enseignant' : 'Back-Office Admin'}
              </span>
            </Link>

            {/* NAVIGATION DESKTOP GROUPÉE */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Dashboard */}
              <Link
                to="/admin/dashboard"
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors",
                  location.pathname === "/admin/dashboard"
                    ? "text-primary bg-primary/10 font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Tableau de Bord
              </Link>

              {/* Pôle Pédagogie */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors outline-none cursor-pointer",
                    isPedagogyActive
                      ? "text-primary bg-primary/10 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}>
                    <Users className="w-3.5 h-3.5" />
                    Pédagogie
                    <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 p-1.5 rounded-xl border-border/80 shadow-md">
                  <DropdownMenuItem onClick={() => navigate("/admin/students")} className="gap-2.5 text-xs font-medium cursor-pointer">
                    <Users className="w-4 h-4 text-primary" /> Gestion des Étudiants
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin/attendance")} className="gap-2.5 text-xs font-medium cursor-pointer">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Feuille de Présences
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin/formations")} className="gap-2.5 text-xs font-medium cursor-pointer">
                    <BookOpen className="w-4 h-4 text-blue-500" /> Catalogue des Formations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin/announcements")} className="gap-2.5 text-xs font-medium cursor-pointer">
                    <Megaphone className="w-4 h-4 text-amber-500" /> Diffusion des Annonces
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Pôle Finances */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors outline-none cursor-pointer",
                    isFinanceActive
                      ? "text-primary bg-primary/10 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}>
                    <CreditCard className="w-3.5 h-3.5" />
                    Finances
                    <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-54 p-1.5 rounded-xl border-border/80 shadow-md">
                  <DropdownMenuItem onClick={() => navigate("/admin/debts")} className="gap-2.5 text-xs font-medium cursor-pointer">
                    <CreditCard className="w-4 h-4 text-amber-500" /> Dettes & Échéanciers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin/payment-validation")} className="gap-2.5 text-xs font-medium cursor-pointer">
                    <Clock className="w-4 h-4 text-primary" /> Validation des Paiements
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin/accounting")} className="gap-2.5 text-xs font-medium cursor-pointer">
                      <TrendingUp className="w-4 h-4 text-emerald-500" /> Comptabilité & Flux
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Pôle Outils & Système (Admin) */}
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors outline-none cursor-pointer",
                      isSystemActive
                        ? "text-primary bg-primary/10 font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}>
                      <Settings className="w-3.5 h-3.5" />
                      Système
                      <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-54 p-1.5 rounded-xl border-border/80 shadow-md">
                    <DropdownMenuItem onClick={() => navigate("/admin/tools")} className="gap-2.5 text-xs font-medium cursor-pointer">
                      <ShoppingBag className="w-4 h-4 text-primary" /> Gestion du Marketplace
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/admin/indicator-delivery")} className="gap-2.5 text-xs font-medium cursor-pointer">
                      <Upload className="w-4 h-4 text-indigo-500" /> Livraison Outils MT5
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/admin/analytics")} className="gap-2.5 text-xs font-medium cursor-pointer">
                      <Target className="w-4 h-4 text-emerald-500" /> Analytics & KPI
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin/settings")} className="gap-2.5 text-xs font-medium cursor-pointer">
                      <Settings className="w-4 h-4 text-muted-foreground" /> Paramètres Plateforme
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>
          </div>

          {/* DROITE : CTA INSCRIPTION + THEME + PROFIL */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bouton Action Rapide Inscription */}
            <Link to="/admin/enrollment">
              <Button size="sm" className="h-9 px-3 sm:px-4 rounded-xl font-semibold text-xs gap-1.5 shadow-xs">
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nouvelle</span> Inscription
              </Button>
            </Link>

            <ThemeToggle />

            {/* Avatar & Menu Profil Admin */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted/50 transition-colors outline-none cursor-pointer">
                    <Avatar className="w-8 h-8 sm:w-9 sm:h-9 border border-border/80 shadow-xs">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl border-border/80 shadow-lg mt-2">
                  <DropdownMenuLabel className="px-3 py-2">
                    <p className="text-xs font-semibold text-foreground truncate">{profile?.full_name || 'Administrateur'}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-normal">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/")} className="gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium">
                    <Home className="w-4 h-4 text-muted-foreground" /> Retour au site public
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium">
                    <User className="w-4 h-4 text-muted-foreground" /> Mon Compte
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium text-destructive focus:text-destructive hover:bg-destructive/10">
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* HAMBURGER MOBILE */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-border/60 text-muted-foreground lg:hidden hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Menu de navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* MENU MOBILE EXPANDABLE */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border/50 py-4 space-y-4 overflow-hidden"
            >
              {/* LIENS DIRECTS MOBILE */}
              <div className="flex flex-col space-y-1">
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors",
                    location.pathname === "/admin/dashboard" ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" /> Tableau de Bord
                </Link>

                <div className="pt-2">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">Pédagogie</p>
                  <Link to="/admin/students" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50">
                    <Users className="w-4 h-4 text-primary" /> Gestion des Étudiants
                  </Link>
                  <Link to="/admin/attendance" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Feuille de Présences
                  </Link>
                  <Link to="/admin/formations" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50">
                    <BookOpen className="w-4 h-4 text-blue-500" /> Formations
                  </Link>
                  <Link to="/admin/announcements" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50">
                    <Megaphone className="w-4 h-4 text-amber-500" /> Annonces
                  </Link>
                </div>

                <div className="pt-2">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">Finances</p>
                  <Link to="/admin/debts" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50">
                    <CreditCard className="w-4 h-4 text-amber-500" /> Dettes & Échéanciers
                  </Link>
                  <Link to="/admin/payment-validation" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50">
                    <Clock className="w-4 h-4 text-primary" /> Validation des Paiements
                  </Link>
                  {isAdmin && (
                    <Link to="/admin/accounting" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50">
                      <TrendingUp className="w-4 h-4 text-emerald-500" /> Comptabilité & Flux
                    </Link>
                  )}
                </div>

                {isAdmin && (
                  <div className="pt-2">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">Système</p>
                    <Link to="/admin/tools" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50">
                      <ShoppingBag className="w-4 h-4 text-primary" /> Marketplace
                    </Link>
                    <Link to="/admin/indicator-delivery" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50">
                      <Upload className="w-4 h-4 text-indigo-500" /> Livraisons MT5
                    </Link>
                    <Link to="/admin/analytics" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50">
                      <Target className="w-4 h-4 text-emerald-500" /> Analytics
                    </Link>
                    <Link to="/admin/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50">
                      <Settings className="w-4 h-4 text-muted-foreground" /> Paramètres
                    </Link>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-between px-3">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <Home className="w-3.5 h-3.5" /> Site Public
                </Link>
                <button onClick={handleSignOut} className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                  <LogOut className="w-3.5 h-3.5" /> Déconnexion
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default AdminNavbar;
