import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Phone, MapPin, ArrowRight, Loader2, CheckCircle2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    avatar_url: "",
    full_name: user?.user_metadata?.full_name || "",
    phone: "",
    address: "",
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user?.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Photo de profil mise à jour !");
    } catch (error: any) {
      toast.error("Erreur lors de l'upload : " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSkipToEnd = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ profile_completed: true })
        .eq("id", user?.id);
      if (error) throw error;
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const updates: any = { profile_completed: true };
      if (formData.avatar_url) updates.avatar_url = formData.avatar_url;
      if (formData.full_name) updates.full_name = formData.full_name;
      if (formData.phone) updates.phone = formData.phone;
      if (formData.address) updates.address = formData.address;

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user?.id);

      if (error) throw error;
      toast.success("Bienvenue sur Botes Academy !");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-md"
        >
          <Card className="border border-border bg-card shadow-xl rounded-3xl overflow-hidden">
            {/* Barre de progression */}
            <div className="h-1.5 bg-muted w-full">
              <motion.div
                className="h-full bg-primary"
                animate={{ width: `${(step / 2) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <CardHeader className="pt-8 pb-4 px-8 text-center space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                Étape {step} sur 2
              </p>
              <CardTitle className="text-2xl font-black uppercase italic tracking-tight">
                {step === 1 ? "Photo de Profil" : "Vos Coordonnées"}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {step === 1
                  ? "Ajoutez une photo pour que vos formateurs vous reconnaissent."
                  : "Complétez votre dossier étudiant."}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {/* ÉTAPE 1 : PHOTO */}
              {step === 1 && (
                <div className="flex flex-col items-center gap-6 py-2">
                  <div className="relative group">
                    <Avatar className="h-28 w-28 border-4 border-border shadow-lg transition-transform group-hover:scale-105">
                      <AvatarImage src={formData.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-3xl font-black">
                        {(formData.full_name || user?.email || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer shadow-md hover:scale-110 transition-transform"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  <p className="text-xs text-muted-foreground text-center italic">
                    Formats acceptés : JPG, PNG, WebP. Max 5 Mo.
                  </p>

                  <div className="flex flex-col gap-3 w-full pt-2">
                    <Button onClick={() => setStep(2)} className="w-full h-12 rounded-2xl font-black uppercase text-xs tracking-wider">
                      Continuer <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <button
                      onClick={() => setStep(2)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors font-bold uppercase tracking-wider"
                    >
                      Passer cette étape →
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 2 : COORDONNÉES */}
              {step === 2 && (
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <User className="h-3 w-3" /> Nom Complet
                    </Label>
                    <Input
                      placeholder="Ex: Jean Mbemba"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="h-12 rounded-xl font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3 w-3" /> Téléphone / WhatsApp{" "}
                      <span className="font-normal opacity-60">(Optionnel)</span>
                    </Label>
                    <Input
                      placeholder="+243 XXX XXX XXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12 rounded-xl font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> Adresse{" "}
                      <span className="font-normal opacity-60">(Optionnel)</span>
                    </Label>
                    <Input
                      placeholder="Ville, Commune, Quartier..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="h-12 rounded-xl font-bold"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-12 rounded-2xl font-black uppercase text-xs"
                    >
                      Retour
                    </Button>
                    <Button
                      onClick={handleComplete}
                      disabled={loading || !formData.full_name.trim()}
                      className="flex-[2] h-12 rounded-2xl font-black uppercase text-xs gap-2"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><CheckCircle2 className="h-4 w-4" /> Accéder à mon espace</>
                      )}
                    </Button>
                  </div>

                  <button
                    onClick={handleSkipToEnd}
                    disabled={loading}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors font-bold uppercase tracking-wider pt-1"
                  >
                    Compléter mon dossier plus tard
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
