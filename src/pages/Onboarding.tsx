import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Phone, MapPin, Landmark, BookOpen, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    avatar_url: "",
    phone: "",
    address: "",
    mt5_id: "",
    interests: [] as string[]
  });

  const availableInterests = [
    "Trading Forex", "Cryptomonnaies", "Indices Synthétiques", 
    "Scalping", "Day Trading", "Investissement Long Terme"
  ];

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/avatar-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, avatar_url: publicUrl });
      toast.success("Photo de profil mise à jour !");
    } catch (error: any) {
      toast.error("Erreur lors de l'upload : " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: formData.avatar_url,
          phone: formData.phone,
          address: formData.address,
          mt5_id: formData.mt5_id,
          interests: formData.interests,
          profile_completed: true
        })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success("Bienvenue sur Botes Academy !");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="min-h-screen bg-mesh-gradient flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-lg"
        >
          <Card className="border-none bg-card/60 backdrop-blur-3xl shadow-2xl rounded-[3rem] overflow-hidden">
            <div className="h-2 bg-muted w-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
            
            <CardHeader className="pt-10 pb-6 text-center">
                <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">
                  {step === 1 ? "Identité Visuelle" : step === 2 ? "Coordonnées & Trading" : "Vos Intérêts"}
                </CardTitle>
                <CardDescription className="italic font-medium">
                  {step === 1 ? "Commençons par votre photo de profil." : step === 2 ? "Ces informations sont nécessaires pour vos accès MT5." : "Dites-nous ce qui vous passionne."}
                </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-10">
              {step === 1 && (
                <div className="flex flex-col items-center gap-8 py-4">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-2xl transition-transform group-hover:scale-105">
                      <AvatarImage src={formData.avatar_url} />
                      <AvatarFallback className="bg-primary/5 text-primary text-3xl font-black">
                        {user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                      {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                      <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-center opacity-40">Une photo professionnelle aide les formateurs à vous identifier.</p>
                  <Button onClick={() => setStep(2)} className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest gap-2">
                    Continuer <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60 flex items-center gap-2"><Phone className="h-3 w-3" /> Numéro WhatsApp</Label>
                    <Input 
                      placeholder="+243 XXX XXX XXX" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="h-12 rounded-xl bg-white/5 border-white/10 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60 flex items-center gap-2"><MapPin className="h-3 w-3" /> Adresse Physique</Label>
                    <Input 
                      placeholder="Ville, Quartier, Avenue..." 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="h-12 rounded-xl bg-white/5 border-white/10 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60 flex items-center gap-2"><Landmark className="h-3 w-3" /> ID Compte MT5 (Traders)</Label>
                    <Input 
                      placeholder="Ex: 12345678" 
                      value={formData.mt5_id} 
                      onChange={e => setFormData({...formData, mt5_id: e.target.value})}
                      className="h-12 rounded-xl bg-white/5 border-white/10 font-mono"
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest">Retour</Button>
                    <Button onClick={() => setStep(3)} className="flex-[2] h-14 rounded-2xl font-black uppercase text-xs tracking-widest gap-2">Suivant <ArrowRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 text-center">
                  <p className="text-sm font-medium italic opacity-60">Quels sont les domaines qui vous intéressent le plus ?</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {availableInterests.map(interest => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                          formData.interests.includes(interest)
                            ? "bg-primary text-white shadow-glow-primary"
                            : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-4 pt-8">
                    <Button 
                      onClick={handleComplete} 
                      disabled={loading}
                      className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Terminer l'inscription"}
                    </Button>
                    <button onClick={() => setStep(2)} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Retour aux coordonnées</button>
                  </div>
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
