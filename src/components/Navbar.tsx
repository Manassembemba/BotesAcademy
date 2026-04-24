import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Search, 
  ChevronRight,
  CreditCard
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
    <nav className={cn(
        "fixed z-50 transition-all duration-500",
        "top-0 left-0 right-0 lg:top-4 lg:left-4 lg:right-4",
        "bg-white/80 dark:bg-black/80 lg:rounded-[2rem] border-b lg:border border-white/10 backdrop-blur-xl shadow-lg",
        isOpen ? "h-screen lg:h-auto" : "h-auto"
    )}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 lg:h-24 gap-4">
          
          {/* LOGO SECTION - Adaptative size */}
          <Link to="/" className="flex items-center gap-2 md:gap-4 shrink-0 relative group">
            <img src="/logo.png?v=2" alt="Logo" className="h-8 md:h-12 lg:h-14 w-auto object-contain transition-transform group-hover:scale-110" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm md:text-lg lg:text-xl font-black uppercase tracking-tighter leading-none italic truncate">
                Botes <span className="text-primary">Academy</span>
              </span>
              <span className="text-[7px] lg:text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-0.5 hidden sm:block italic">ON NE FORME PAS ON TRANSFORME</span>
            </div>
          </Link>

          {/* DESKTOP NAV LINKS - Hidden on medium/mobile */}
          <div className="hidden lg:flex items-center gap-8 ml-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-[10px] font-black text-muted-foreground hover:text-primary transition-all uppercase tracking-[0.2em] relative group/link py-2"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover/link:w-full" />
              </Link>
            ))}
          </div>

          {/* SEARCH BAR - Expandable or hidden based on space */}
          <div className="hidden md:flex flex-1 justify-center max-w-md lg:max-w-lg mx-2 lg:mx-8">
            <div className="w-full">
                <CommandMenu />
            </div>
          </div>

          {/* ACTIONS SECTION */}
          <div className="flex items-center gap-2 md:gap-4 lg:gap-6 shrink-0">
            <div className="hidden sm:flex items-center">
                <ThemeToggle />
            </div>
            
            {user ? (
              <div className="flex items-center gap-2 md:gap-4">
                <NotificationCenter />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative group outline-none">
                      <Avatar className="w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 border-2 border-primary/20 group-hover:border-primary transition-all duration-500 shadow-lg">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black uppercase">
                          {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 bg-emerald-500 border-2 border-background rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 shadow-sm" />
                    </button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent className="w-64 p-2 bg-card/95 backdrop-blur-xl border-white/10 rounded-2xl shadow-2xl mt-4" align="end">
                    <DropdownMenuLabel className="p-3">
                        <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest mb-1 italic">Compte Vérifié</p>
                        <p className="text-sm font-black uppercase italic truncate">{profile?.full_name || 'Mon Profil'}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-3 p-3 rounded-xl cursor-pointer text-[10px] font-black uppercase tracking-widest">
                      <User className="w-4 h-4 text-primary" /> Mon Profil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(role === 'admin' ? "/admin/dashboard" : "/dashboard")} className="gap-3 p-3 rounded-xl cursor-pointer text-[10px] font-black uppercase tracking-widest">
                      <LayoutDashboard className="w-4 h-4 text-primary" /> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/marketplace")} className="gap-3 p-3 rounded-xl cursor-pointer text-[10px] font-black uppercase tracking-widest">
                      <ShoppingBag className="w-4 h-4 text-primary" /> Marketplace
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/finance")} className="gap-3 p-3 rounded-xl cursor-pointer text-[10px] font-black uppercase tracking-widest">
                      <CreditCard className="w-4 h-4 text-primary" /> Mes Finances
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem onClick={handleSignOut} className="gap-3 p-3 rounded-xl cursor-pointer text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10">
                      <LogOut className="w-4 h-4" /> Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="hero" size="sm" className="h-9 md:h-11 lg:h-12 px-4 md:px-8 rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] shadow-glow-primary border border-white/10">
                    <LogIn className="w-3.5 h-3.5 mr-2 hidden md:block" />
                    Membre
                  </Button>
                </Link>
              </div>
            )}

            {/* MOBILE MENU TOGGLE */}
            <button 
                onClick={toggleMenu} 
                className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary lg:hidden hover:bg-primary hover:text-white transition-all"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE NAVIGATION OVERLAY */}
        <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lg:hidden flex flex-col pt-4 pb-10 space-y-6 h-full overflow-y-auto"
              >
                {/* Mobile Search */}
                <div className="md:hidden px-2">
                    <CommandMenu />
                </div>

                <div className="flex flex-col space-y-2">
                    <p className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-2 opacity-40 italic">Navigation</p>
                    {navLinks.map((link) => (
                    <Link
                        key={link.name}
                        to={link.path}
                        className="flex items-center justify-between px-6 py-4 text-2xl font-black uppercase tracking-tighter italic text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                        onClick={() => setIsOpen(false)}
                    >
                        {link.name}
                        <ChevronRight className="w-6 h-6 opacity-20" />
                    </Link>
                    ))}
                </div>

                <div className="px-4 pt-6 mt-auto">
                    <div className="p-6 bg-muted/20 rounded-[2rem] border border-white/5 space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">Mode Visuel</span>
                            <ThemeToggle />
                        </div>
                        {!user && (
                            <Link to="/auth" className="block" onClick={() => setIsOpen(false)}>
                                <Button variant="hero" className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-widest shadow-glow-primary">
                                    <LogIn className="w-5 h-5 mr-3" /> Accès Membre
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
