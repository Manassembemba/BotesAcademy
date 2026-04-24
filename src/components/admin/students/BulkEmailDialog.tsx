import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Loader2, SendHorizontal, Users } from "lucide-react";

interface BulkEmailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCount: number;
    onSend: (subject: string, message: string) => void;
    isPending: boolean;
}

export const BulkEmailDialog = ({
    open,
    onOpenChange,
    selectedCount,
    onSend,
    isPending
}: BulkEmailDialogProps) => {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !message) return;
        onSend(subject, message);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg rounded-[2.5rem] bg-card/95 backdrop-blur-3xl border-white/10 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Mail className="w-6 h-6" />
                        </div>
                        Communication de masse
                    </DialogTitle>
                    <DialogDescription className="font-medium italic opacity-60">
                        Vous allez envoyer un email à <span className="text-primary font-bold">{selectedCount} apprenants</span>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Objet du message</Label>
                        <Input 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Ex: Rappel important - Session de formation"
                            className="rounded-2xl h-12 bg-white/5 border-white/10 font-bold"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Corps du message</Label>
                        <Textarea 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Écrivez votre message ici..."
                            className="rounded-2xl min-h-[200px] bg-white/5 border-white/10 font-medium leading-relaxed resize-none"
                            required
                        />
                    </div>

                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center gap-3">
                        <Users className="w-5 h-5 text-primary opacity-60" />
                        <p className="text-[9px] font-bold uppercase tracking-widest leading-tight opacity-60">
                            Les emails seront envoyés individuellement. Chaque destinataire verra uniquement son propre nom.
                        </p>
                    </div>

                    <DialogFooter className="gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-14 flex-1">
                            Annuler
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isPending || !subject || !message}
                            className="rounded-2xl h-14 flex-[2] bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest shadow-glow-primary hover:scale-[1.02] transition-all gap-2"
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                            Envoyer le message
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
