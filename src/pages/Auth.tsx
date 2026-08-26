import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

type AuthMode = "login" | "register" | "forgotPassword";

const authSchema = z.object({
  email: z.string().trim().email("Email invalide").max(255, "Email trop long"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").max(100, "Mot de passe trop long").optional(),
  firstName: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères").max(50, "Prénom trop long").optional(),
  lastName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(50, "Nom trop long").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Redirection intelligente si déjà connecté
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (roleData?.role === 'admin' || roleData?.role === 'receptionist' || roleData?.role === 'teacher') {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: password!,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou mot de passe incorrect");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("Connexion réussie !");

        // Récupérer le rôle pour la redirection immédiate
        const userRes = await supabase.auth.getUser();
        const userId = userRes.data.user?.id;
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        if (roleData?.role === 'admin' || roleData?.role === 'receptionist' || roleData?.role === 'teacher') {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else { // mode === 'register'
        const redirectUrl = `${window.location.origin}/`;

        const { error } = await supabase.auth.signUp({
          email,
          password: password!,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
              first_name: firstName,
              last_name: lastName,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Cet email est déjà utilisé");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("Inscription réussie ! Vous pouvez maintenant vous connecter.");
        setMode("login");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      authSchema.pick({ email: true }).parse({ email });
      const redirectUrl = `${window.location.origin}/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Un email de réinitialisation a été envoyé. Veuillez vérifier votre boîte de réception.");
      setMode("login");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Une erreur est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === 'login') return "Connexion";
    if (mode === 'register') return "Créer un compte";
    return "Mot de passe oublié";
  }

  const getDescription = () => {
    if (mode === 'login') return "Ravi de vous revoir ! Connectez-vous pour continuer l'aventure.";
    if (mode === 'register') return "Créez votre compte pour commencer l'aventure et accéder à nos formations.";
    return "Entrez votre email pour recevoir un lien de réinitialisation";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-none bg-card/60 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-4 pt-12 pb-8">
            <Link to="/" className="flex flex-col items-center gap-4 mb-4 justify-center group">
              <div className="p-2 bg-primary/5 rounded-[2rem] group-hover:scale-105 transition-transform duration-500 shadow-inner flex flex-col items-center">
                <img 
                  src="/logo.png?v=2" 
                  alt="Botes Academy Logo" 
                  className="h-24 w-auto object-contain"
                />
              </div>
              <div className="flex flex-col items-center -mt-2">
                <span className="text-2xl font-black uppercase tracking-tighter leading-none">
                  Botes <span className="text-primary">Academy</span>
                </span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1 italic">On ne forme pas, on transforme</span>
              </div>
            </Link>
            <div className="text-center space-y-2">
              <CardTitle className="text-4xl font-black uppercase italic tracking-tighter leading-none">{getTitle()}</CardTitle>
              <CardDescription className="text-muted-foreground font-medium italic text-sm px-6">{getDescription()}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-12">
            {mode === 'forgotPassword' ? (
              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email académique</Label>
                  <Input id="email" type="email" placeholder="votre@excellence.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className="h-14 rounded-2xl border-2 border-border/50 bg-background/50 font-bold italic px-6 focus:border-primary/50 transition-all" />
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-glow-primary active:scale-95 transition-all italic" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Envoyer le lien d'accès"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-6">
                {mode === 'register' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prénom</Label>
                        <Input id="firstName" type="text" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={loading} className="h-14 rounded-2xl border-2 border-border/50 bg-background/50 font-bold italic px-6 focus:border-primary/50 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom</Label>
                        <Input id="lastName" type="text" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={loading} className="h-14 rounded-2xl border-2 border-border/50 bg-background/50 font-bold italic px-6 focus:border-primary/50 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{mode === 'login' ? "Identifiant Académique (Email)" : "Email de contact"}</Label>
                  <Input id="email" type="email" placeholder="votre@excellence.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className="h-14 rounded-2xl border-2 border-border/50 bg-background/50 font-bold italic px-6 focus:border-primary/50 transition-all" maxLength={255} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mot de passe sécurisé</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} className="h-14 rounded-2xl border-2 border-border/50 bg-background/50 font-bold italic px-6 focus:border-primary/50 transition-all" minLength={6} maxLength={100} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all italic" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : mode === 'login' ? "Se connecter à son espace" : "Rejoindre l'académie"}
                </Button>
              </form>
            )}

            <div className="mt-8 flex flex-col gap-3 text-center">
              {mode === 'login' && (
                <button type="button" onClick={() => setMode('forgotPassword')} className="text-[10px] font-black uppercase tracking-widest text-primary/70 hover:text-primary transition-colors italic" disabled={loading}>
                  Accès perdu ? Récupérer le mot de passe
                </button>
              )}
              <button type="button" onClick={() => setMode(mode === 'login' || mode === 'forgotPassword' ? 'register' : 'login')} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors italic" disabled={loading}>
                {mode === 'login' || mode === 'forgotPassword' ? "Pas encore membre ? Devenir étudiant" : "Déjà un compte ? S'identifier ici"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
