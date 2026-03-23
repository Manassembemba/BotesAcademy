import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface ApplicationModalProps {
  courseId: string;
  courseTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplicationModal = ({ courseId, courseTitle, isOpen, onClose, onSuccess }: ApplicationModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || "",
    phone: "",
    motivation: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('course_applications').insert({
        user_id: user.id,
        course_id: courseId,
        full_name: formData.fullName,
        phone: formData.phone,
        motivation: formData.motivation,
        status: 'pending'
      });

      if (error) {
        if (error.code === '23505') {
          toast.error("Vous avez déjà déposé une candidature pour cette formation.");
        } else {
          throw error;
        }
      } else {
        toast.success("Candidature déposée avec succès ! Nous vous contacterons bientôt.");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-primary/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
            Postuler à : <span className="text-primary">{courseTitle}</span>
          </DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground">
            Remplissez ce formulaire pour soumettre votre candidature au prochain pôle d'excellence en présentiel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-primary italic">Nom Complet</Label>
              <Input 
                id="name" 
                value={formData.fullName} 
                onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                placeholder="Votre nom et prénom" 
                required 
                className="rounded-xl border-primary/10 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-primary italic">Téléphone / WhatsApp</Label>
              <Input 
                id="phone" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                placeholder="+243 ..." 
                required 
                className="rounded-xl border-primary/10 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivation" className="text-xs font-black uppercase tracking-widest text-primary italic">Pourquoi voulez-vous suivre cette formation ?</Label>
              <Textarea 
                id="motivation" 
                value={formData.motivation} 
                onChange={(e) => setFormData({...formData, motivation: e.target.value})} 
                placeholder="Décrivez vos objectifs et votre motivation..." 
                required 
                className="rounded-xl border-primary/10 min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-glow-primary bg-primary hover:bg-primary/90"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Envoyer ma candidature</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
