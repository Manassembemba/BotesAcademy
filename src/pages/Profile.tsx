import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Camera, User, Mail, Shield, Calendar, Save, Award, Download, BookOpen } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateBadge } from "@/lib/pdfService";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [emergencyContactName, setEmergencyContactName] = useState<string>("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Fetch profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      console.log("Profile: Tentative de récupération du profil...");
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

  // Fetch completed courses for certificates
  const { data: completedCourses, isLoading: isLoadingCertificates } = useQuery({
    queryKey: ['completed-courses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_enrolled_courses_with_progress');
      if (error) throw error;
      return (data as any[]).filter(c => Math.round(c.progress) >= 100);
    },
    enabled: !!user,
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setGender(profile.gender || "");
      setBirthDate(profile.birth_date || "");
      setAddress(profile.address || "");
      setPhone(profile.phone || "");
      setEmergencyContactName(profile.emergency_contact_name || "");
      setEmergencyContactPhone(profile.emergency_contact_phone || "");
    }
  }, [profile]);

  // Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!user) return;
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          profile_completed: true // Mark as completed when saved
        })
        .eq('id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dossier académique mis à jour !");
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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      updateProfileMutation.mutate({ avatar_url: data.publicUrl });
    } catch (error: any) {
      toast.error(`Erreur lors de l'envoi: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!fullName.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    updateProfileMutation.mutate({ 
      full_name: fullName,
      gender,
      birth_date: birthDate || null,
      address,
      phone,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bento-grid !grid-cols-1 md:!grid-cols-3 mb-16">
            {/* Left Column: Avatar & Quick Info */}
            <div className="md:col-span-1 space-y-6">
              <div className="bento-card text-center p-8 bg-card border-none shadow-2xl flex flex-col items-center">
                <div className="relative w-40 h-40 mb-6 group">
                  <Avatar className="w-40 h-40 border-8 border-background shadow-2xl transition-transform duration-500 group-hover:scale-105">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-5xl font-black italic">
                      {fullName?.charAt(0) || user?.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-1 right-1 p-3 bg-primary text-white rounded-2xl cursor-pointer shadow-glow-primary hover:scale-110 transition-transform active:scale-95 group-hover:bg-primary/90">
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                  </label>
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter italic truncate leading-none mb-2 w-full">{fullName || "Utilisateur"}</h2>
                <p className="text-[10px] text-muted-foreground mb-4 font-black uppercase tracking-widest leading-none px-2">
                  {profile?.matricule || "Matricule en attente"}
                </p>
                <p className="text-[10px] text-muted-foreground mb-6 font-medium italic break-all px-2">{user?.email}</p>
                <div className="flex items-center justify-center gap-2">
                   <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full shadow-sm">Étudiant Pro</Badge>
                </div>
              </div>

              <div className="bento-card p-6 space-y-4 bg-muted/30 border-none">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground font-medium italic">Inscrit en</span>
                  </div>
                  <span className="font-black italic uppercase text-xs text-right">{new Date(user?.created_at || "").toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span className="text-muted-foreground font-medium italic">Compte</span>
                  </div>
                  <span className="text-emerald-500 font-black uppercase text-[10px] tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">Vérifié</span>
                </div>
              </div>
            </div>

            {/* Right Column: Edit Form */}
            <div className="md:col-span-2 space-y-6">
              <div className="bento-card p-8 bg-card border-none shadow-2xl h-full">
                <div className="mb-8">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-2">Paramètres du Profil</h3>
                  <p className="italic font-medium text-sm text-muted-foreground">Personnalisez votre identité académique.</p>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      Identifiant de connexion
                    </Label>
                    <Input id="email" value={user?.email} disabled className="bg-muted/50 border-none h-14 rounded-2xl font-black italic text-foreground/50 px-6 cursor-not-allowed" />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="fullname" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Nom d'affichage complet
                    </Label>
                    <Input 
                      id="fullname" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Ex: Jean Dupont"
                      className="h-14 border-2 border-border/50 focus:border-primary/50 bg-background shadow-inner rounded-2xl font-black italic px-6 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Genre</Label>
                      <Select onValueChange={setGender} value={gender}>
                        <SelectTrigger className="h-14 border-2 border-border/50 rounded-2xl font-black italic px-6 shadow-small">
                          <SelectValue placeholder="Séléctionner" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                          <SelectItem value="M" className="rounded-xl font-bold italic py-3">Masculin</SelectItem>
                          <SelectItem value="F" className="rounded-xl font-bold italic py-3">Féminin</SelectItem>
                          <SelectItem value="O" className="rounded-xl font-bold italic py-3">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date de naissance</Label>
                      <Input 
                        type="date" 
                        value={birthDate} 
                        onChange={(e) => setBirthDate(e.target.value)} 
                        className="h-14 border-2 border-border/50 rounded-2xl font-black italic px-6"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Téléphone Personnel</Label>
                      <Input 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        placeholder="+243 ..."
                        className="h-14 border-2 border-border/50 rounded-2xl font-black italic px-6"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Adresse Résidentielle</Label>
                      <Input 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                        placeholder="Quartier, Commune, Ville"
                        className="h-14 border-2 border-border/50 rounded-2xl font-black italic px-6"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 italic">
                      <Shield className="w-3 h-3" /> Contact d'Urgence
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom du Contact</Label>
                        <Input 
                          value={emergencyContactName} 
                          onChange={(e) => setEmergencyContactName(e.target.value)} 
                          placeholder="Ex: Tuteur / Parent"
                          className="h-12 border-none bg-background shadow-inner rounded-xl font-bold italic px-4"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Téléphone Urgence</Label>
                        <Input 
                          value={emergencyContactPhone} 
                          onChange={(e) => setEmergencyContactPhone(e.target.value)} 
                          placeholder="+243 ..."
                          className="h-12 border-none bg-background shadow-inner rounded-xl font-bold italic px-4"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-border/50">
                    <div className="text-[10px] font-black uppercase text-muted-foreground/60 italic tracking-widest max-w-[200px]">
                      Vos modifications seront visibles sur vos certificats.
                    </div>
                    <Button 
                      onClick={handleSave} 
                      disabled={updateProfileMutation.isPending}
                      className="w-full sm:w-auto px-12 h-16 shadow-2xl shadow-primary/20 rounded-2xl font-black uppercase text-xs tracking-widest bg-primary text-white hover:shadow-primary/40 active:scale-95 transition-all italic"
                    >
                      {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Sauvegarder l'excellence
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bento-card p-8 bg-destructive/5 border-2 border-dashed border-destructive/20 mb-16">
                <div className="flex items-start gap-4">
                   <div className="p-3 bg-destructive/10 rounded-xl text-destructive"><Shield className="w-5 h-5" /></div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black uppercase italic tracking-tighter text-destructive leading-none">Sécurité avancée</h3>
                      <p className="text-xs text-muted-foreground italic font-medium leading-relaxed">
                        Protégez vos acquis. Changez régulièrement votre mot de passe pour garantir la sûreté de vos ressources.
                      </p>
                      <Button variant="outline" className="mt-2 border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl font-black uppercase text-[10px] tracking-widest px-6 h-10 italic" onClick={() => navigate('/update-password')}>
                        Réinitialiser le mot de passe
                      </Button>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Certificates Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-amber-500/10 rounded-2xl"><Award className="w-6 h-6 text-amber-600" /></div>
               <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Mes Certificats</h2>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Vos réussites académiques</p>
               </div>
            </div>

             {isLoadingCertificates ? (
                <div className="bento-grid !grid-cols-1 md:!grid-cols-2">
                   <div className="h-40 bg-muted animate-pulse rounded-[2.5rem]" />
                   <div className="h-40 bg-muted animate-pulse rounded-[2.5rem]" />
                </div>
             ) : completedCourses && completedCourses.length > 0 ? (
                <div className="bento-grid !grid-cols-1 md:!grid-cols-2">
                   {completedCourses.map((course) => (
                      <div key={course.course_id} className="bento-card p-8 bg-gradient-to-br from-amber-500/10 to-primary/5 border-none shadow-xl flex items-center justify-between group hover:shadow-2xl transition-all">
                        <div className="space-y-3">
                           <Badge className="bg-amber-500 text-white border-none text-[9px] font-black uppercase tracking-widest px-4 py-1 shadow-glow-primary-sm">Excellence</Badge>
                           <h3 className="text-xl font-black uppercase italic tracking-tighter leading-tight line-clamp-1">{course.course_title}</h3>
                           <p className="text-[10px] font-black italic text-muted-foreground uppercase opacity-60 tracking-widest">{course.course_category}</p>
                        </div>
                        <Button 
                           size="icon" 
                           className="w-16 h-16 rounded-2xl bg-amber-500 text-white shadow-2xl hover:bg-amber-600 active:scale-95 transition-all shrink-0"
                           onClick={() => {
                              toast.success("Validation des acquis...");
                              generateBadge({
                                 studentName: fullName || user?.user_metadata.full_name || 'Étudiant',
                                 courseTitle: course.course_title
                              });
                           }}
                        >
                           <Download className="w-7 h-7" />
                        </Button>
                      </div>
                   ))}
                </div>
            ) : (
               <Card className="p-12 text-center border-dashed border-2 rounded-[3rem] bg-muted/10 group">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-10 group-hover:opacity-20 transition-all" />
                  <p className="text-muted-foreground font-medium italic mb-4">Vous n'avez pas encore terminé de formation.</p>
                  <Button variant="outline" className="rounded-2xl border-primary/20 text-primary font-bold px-8" onClick={() => navigate('/formations')}>
                     Continuer mes cours
                  </Button>
               </Card>
            )}
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
