import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  LogIn, 
  LayoutDashboard, 
  LogOut, 
  User, 
  ShoppingBag, 
  ChevronRight,
  CreditCard,
  GraduationCap
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationCenter } from "./dashboard/NotificationCenter";
import { CommandMenu } from "./CommandMenu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, signOut, role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch profile for avatar
  const { data: profile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("[Navbar] Sign out error:", err);
    }
  };

  const navLinks = [
    { name: "Accueil", path: "/" },
    { name: "Formations", path: "/formations" },
    { name: "Marketplace", path: "/marketplace" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-md border-b border-border/50 shadow-xs transition-all">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* LOGO & BRAND */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 shrink-0 group">
              <img src="/logo.png?v=2" alt="Botes Academy" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-foreground leading-tight">
                  Botes <span className="text-primary">Academy</span>
                </span>
                <span className="text-[10px] font-medium text-muted-foreground tracking-wide leading-none">Centre Professionnel</span>
              </div>
            </Link>

            {/* DESKTOP NAV LINKS */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                      isActive 
                        ? "text-primary bg-primary/10 font-bold" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* SEARCH BAR */}
          <div className="hidden lg:flex flex-1 justify-center max-w-sm mx-4">
            <div className="w-full">
              <CommandMenu />
            </div>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden sm:flex items-center">
              <ThemeToggle />
            </div>
            
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <NotificationCenter />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted/50 transition-colors outline-none cursor-pointer">
                      <Avatar className="w-8 h-8 sm:w-9 sm:h-9 border border-border/80 shadow-xs">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent className="w-56 p-1.5 bg-popover/95 backdrop-blur-xl border border-border/80 rounded-xl shadow-lg mt-2" align="end">
                    <DropdownMenuLabel className="px-3 py-2">
                      <p className="text-xs font-semibold text-foreground truncate">{profile?.full_name || 'Mon Compte'}</p>
                      <p className="text-[11px] text-muted-foreground truncate font-normal">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium">
                      <User className="w-4 h-4 text-muted-foreground" /> Mon Profil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(role === 'admin' ? "/admin/dashboard" : "/dashboard")} className="gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium">
                      <LayoutDashboard className="w-4 h-4 text-primary" /> Tableau de Bord
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/marketplace")} className="gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium">
                      <ShoppingBag className="w-4 h-4 text-muted-foreground" /> Marketplace
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/finance")} className="gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium">
                      <CreditCard className="w-4 h-4 text-muted-foreground" /> Mes Finances
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium text-destructive focus:text-destructive hover:bg-destructive/10">
                      <LogOut className="w-4 h-4" /> Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button size="sm" className="h-9 px-4 rounded-xl font-semibold text-xs shadow-xs">
                    <LogIn className="w-3.5 h-3.5 mr-1.5" />
                    Connexion
                  </Button>
                </Link>
              </div>
            )}

            {/* MOBILE MENU TOGGLE */}
            <button 
              onClick={toggleMenu} 
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-border/60 text-muted-foreground md:hidden hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Menu"
            >
              {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* MOBILE NAVIGATION DRAWER */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border/50 py-4 space-y-4 overflow-hidden"
            >
              <div className="px-1">
                <CommandMenu />
              </div>

              <div className="flex flex-col space-y-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                        isActive ? "text-primary bg-primary/10 font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.name}
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between px-2">
                <span className="text-xs text-muted-foreground font-medium">Thème visuel</span>
                <ThemeToggle />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Navbar;
