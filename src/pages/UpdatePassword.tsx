import { useState } from "react";
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

const passwordSchema = z.object({
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").max(100, "Mot de passe trop long"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      passwordSchema.parse({ password, confirmPassword });

      const { data: userData, error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error("Le lien de réinitialisation est invalide ou a expiré.");
        return;
      }

      // Notification de sécurité par email (Non bloquant)
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.functions.invoke('notification-service', {
            body: {
              type: 'PASSWORD_CHANGED',
              email: user.email,
              fullName: user.user_metadata?.full_name || 'Étudiant'
            }
          });
        }
      });

      toast.success("Votre mot de passe a été mis à jour avec succès !");
      navigate("/auth");

    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Une erreur est survenue lors de la mise à jour.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md border-success/20 bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <Link to="/" className="flex items-center gap-2 mb-4 justify-center">
            <TrendingUp className="h-6 w-6 text-success" />
            <span className="text-xl font-bold">Botes Academy</span>
          </Link>
          <CardTitle className="text-2xl text-center">
            Réinitialiser le mot de passe
          </CardTitle>
          <CardDescription className="text-center">
            Entrez votre nouveau mot de passe ci-dessous.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-success hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePassword;
