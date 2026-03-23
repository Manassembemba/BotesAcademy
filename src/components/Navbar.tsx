import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, LayoutDashboard, LogOut, User, ShoppingBag } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "./NotificationBell";

const Navbar = () => {
  const { user, signOut, role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Log auth state changes
  useEffect(() => {
    console.log("[Navbar] Auth state changed:", {
      user: user?.email || null,
      role,
      userId: user?.id,
    });
  }, [user, role]);

  // Fetch profile for avatar
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log("[Navbar] No user, skipping profile fetch");
        return null;
      }
      console.log("[Navbar] Fetching profile for user:", user.id);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error("[Navbar] Profile fetch error:", error);
          return null;
        }
        console.log("[Navbar] Profile fetched successfully:", data);
        return data;
      } catch (err) {
        console.error("[Navbar] Profile fetch exception:", err);
        return null;
      }
    },
    enabled: !!user,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Log profile errors
  useEffect(() => {
    if (profileError) {
      console.error("[Navbar] Profile query error:", profileError);
    }
  }, [profileError]);

  const toggleMenu = () => {
    console.log("[Navbar] Toggling menu, new state:", !isOpen);
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    console.log("[Navbar] Sign out clicked");
    try {
      await signOut();
      console.log("[Navbar] Sign out successful");
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-32">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Botes Academy Logo" className="h-32 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const handleClick = () => {
                console.log("[Navbar] Navigation link clicked:", link.name);
              };
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={handleClick}
                  className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors duration-200 uppercase tracking-widest"
                >
                  {link.name}
                </Link>
              );
            })}
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <Link to="/profile">
                  <Avatar className="w-9 h-9 border-2 border-primary/20 hover:border-primary transition-colors cursor-pointer">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-black">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Link to={role === 'admin' ? "/admin/dashboard" : "/dashboard"}>
                  <Button variant="outline" size="sm" className="gap-2 font-bold rounded-xl">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-destructive hover:bg-destructive/10 rounded-xl">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/auth">
                  <Button variant="hero" size="sm" className="gap-2 rounded-full px-6 font-bold shadow-glow-primary">
                    <LogIn className="w-4 h-4" />
                    Connexion
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            {user && (
              <Link to="/profile">
                <Avatar className="w-8 h-8 border-2 border-primary/20">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="text-[10px] font-black">{profile?.full_name?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
            )}
            <ThemeToggle />
            {user && <NotificationBell />}
            <button onClick={toggleMenu} className="text-foreground">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-6 space-y-4 border-t border-border animate-in fade-in slide-in-from-top-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="block px-4 py-2 text-lg font-black uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-xl"
                onClick={() => {
                  console.log("[Navbar Mobile] Navigation link clicked:", link.name);
                  setIsOpen(false);
                }}
              >
                {link.name}
              </Link>
            ))}
            <div className="px-4 pt-4 flex flex-col gap-3">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => {
                      console.log("[Navbar Mobile] Profile clicked");
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10"
                  >
                    <Avatar className="w-10 h-10 border-2 border-primary/20">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-black text-sm">{profile?.full_name || 'Mon Profil'}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Voir mon profil</p>
                    </div>
                  </Link>
                  <Link
                    to={role === 'admin' ? "/admin/dashboard" : "/dashboard"}
                    onClick={() => {
                      console.log("[Navbar Mobile] Dashboard clicked, role:", role);
                      setIsOpen(false);
                    }}
                  >
                    <Button variant="outline" className="w-full gap-2 rounded-xl h-12 font-bold">
                      <LayoutDashboard className="w-4 h-4" />
                      Tableau de bord
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full gap-2 text-destructive hover:bg-destructive/10 h-12 font-bold"
                    onClick={() => {
                      console.log("[Navbar Mobile] Sign out clicked");
                      handleSignOut();
                      setIsOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => {
                  console.log("[Navbar Mobile] Auth link clicked");
                  setIsOpen(false);
                }}>
                  <Button variant="hero" className="w-full gap-2 h-14 rounded-xl text-lg font-bold">
                    <LogIn className="w-4 h-4" />
                    S'inscrire / Connexion
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

