import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

type AuthMode = "login" | "register" | "forgotPassword";

const authSchema = z.object({
  email: z.string().trim().email("Email invalide").max(255, "Email trop long"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").max(100, "Mot de passe trop long").optional(),
  fullName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Nom trop long").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Redirection intelligente si déjà connecté
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (roleData?.role === 'admin') {
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
      const validationData = mode === 'login'
        ? { email, password }
        : { email, password, fullName };

      authSchema.pick(mode === 'login' ? { email: true, password: true } : { email: true, password: true, fullName: true }).parse(validationData);

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
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (roleData?.role === 'admin') {
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
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Une erreur est survenue");
      }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md border-success/20 bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <Link to="/" className="flex items-center gap-2 mb-4 justify-center">
            <TrendingUp className="h-6 w-6 text-success" />
            <span className="text-xl font-bold">Botes Academy</span>
          </Link>
          <CardTitle className="text-2xl text-center">{getTitle()}</CardTitle>
          <CardDescription className="text-center">{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'forgotPassword' ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="vous@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              </div>
              <Button type="submit" className="w-full bg-gradient-success hover:opacity-90" disabled={loading}>
                {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input id="fullName" type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={loading} maxLength={100} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="vous@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} minLength={6} maxLength={100} />
              </div>
              <Button type="submit" className="w-full bg-gradient-success hover:opacity-90" disabled={loading}>
                {loading ? "Chargement..." : mode === 'login' ? "Se connecter" : "S'inscrire"}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm space-y-2">
            {mode === 'login' && (
              <button type="button" onClick={() => setMode('forgotPassword')} className="text-success hover:underline" disabled={loading}>
                Mot de passe oublié ?
              </button>
            )}
            <button type="button" onClick={() => setMode(mode === 'login' || mode === 'forgotPassword' ? 'register' : 'login')} className="text-success hover:underline block w-full" disabled={loading}>
              {mode === 'login' || mode === 'forgotPassword' ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
