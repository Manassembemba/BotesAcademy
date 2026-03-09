import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Camera, User, Mail, Shield, Calendar, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Fetch profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Update name when profile loads
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  // Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { full_name?: string; avatar_url?: string }) => {
      if (!user) return;
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profil mis à jour avec succès !");
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // 1. Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Get the proper Public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // 3. Update the profile table with the new URL
      updateProfileMutation.mutate({ avatar_url: publicUrl });
    } catch (error: any) {
      toast.error(`Erreur lors de l'envoi: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!fullName.trim()) {
      toast.error("Le nom ne peut pas être vide");
      return;
    }
    updateProfileMutation.mutate({ full_name: fullName });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Left Column: Avatar & Quick Info */}
            <div className="w-full md:w-1/3 space-y-6">
              <Card className="text-center p-6 border-primary/10 bg-card/50 backdrop-blur-sm shadow-xl">
                <div className="relative mx-auto w-32 h-32 mb-4 group">
                  <Avatar className="w-32 h-32 border-4 border-background shadow-2xl">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-4xl font-black">
                      {fullName?.charAt(0) || user?.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform group-hover:bg-primary-hover">
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                  </label>
                </div>
                <h2 className="text-2xl font-bold truncate">{fullName || "Utilisateur"}</h2>
                <p className="text-sm text-muted-foreground mb-4">{user?.email}</p>
                <div className="flex items-center justify-center gap-2">
                   <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Étudiant Pro</Badge>
                </div>
              </Card>

              <Card className="p-4 space-y-4 border-border/50">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Membre depuis:</span>
                  <span className="font-medium">{new Date(user?.created_at || "").toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Status du compte:</span>
                  <span className="text-green-500 font-bold uppercase text-[10px]">Vérifié</span>
                </div>
              </Card>
            </div>

            {/* Right Column: Edit Form */}
            <div className="w-full md:w-2/3 space-y-6">
              <Card className="shadow-2xl border-primary/5">
                <CardHeader>
                  <CardTitle className="text-2xl font-black">Paramètres du Profil</CardTitle>
                  <CardDescription>Mettez à jour vos informations personnelles pour personnaliser votre expérience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Adresse Email (Non modifiable)
                    </Label>
                    <Input id="email" value={user?.email} disabled className="bg-muted border-none opacity-70" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullname" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Nom Complet
                    </Label>
                    <Input 
                      id="fullname" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Ex: Jean Dupont"
                      className="h-12 border-primary/20 focus:border-primary shadow-sm"
                    />
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={handleSave} 
                      disabled={updateProfileMutation.isPending}
                      className="w-full md:w-auto px-10 h-12 shadow-glow-primary rounded-xl font-bold"
                    >
                      {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Enregistrer les modifications
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 border-destructive/20 bg-destructive/5">
                <h3 className="text-lg font-bold text-destructive mb-2">Zone de sécurité</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Pour changer votre mot de passe ou supprimer votre compte, veuillez nous contacter ou utiliser les options de sécurité de Supabase.
                </p>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => navigate('/update-password')}>
                  Changer le mot de passe
                </Button>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Simple Badge component if not available
const Badge = ({ children, variant = "default", className = "" }: any) => {
  const variants: any = {
    default: "bg-primary text-primary-foreground",
    outline: "border border-border text-foreground",
    secondary: "bg-secondary text-secondary-foreground"
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>{children}</span>;
};

export default Profile;
