import React from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ProfileTabProps {
    isLoading: boolean;
    fullProfile: any;
    academicForm: any;
    setAcademicForm: (form: any) => void;
    updateMutation: any;
}

export const ProfileTab = ({
    isLoading,
    fullProfile,
    academicForm,
    setAcademicForm,
    updateMutation
}: ProfileTabProps) => {
    if (isLoading) {
        return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pt-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-primary rounded-full" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] italic">Informations Civiles</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Matricule</Label>
                        <Input readOnly value={fullProfile?.matricule || 'BA-XXXX'} className="bg-white/5 border-white/5 rounded-2xl h-12 font-mono font-bold text-primary" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Genre</Label>
                        <Select value={academicForm.gender} onValueChange={(val) => setAcademicForm({...academicForm, gender: val})}>
                            <SelectTrigger className="bg-white/5 border-white/5 rounded-2xl h-12 font-bold">
                                <SelectValue placeholder="Sexe" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-white/10">
                                <SelectItem value="M">Masculin</SelectItem>
                                <SelectItem value="F">Féminin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Date de Naissance</Label>
                    <Input type="date" value={academicForm.birth_date} onChange={(e) => setAcademicForm({...academicForm, birth_date: e.target.value})} className="bg-white/5 border-white/5 rounded-2xl h-12 font-bold" />
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Adresse Complète</Label>
                    <Input value={academicForm.address} onChange={(e) => setAcademicForm({...academicForm, address: e.target.value})} className="bg-white/5 border-white/5 rounded-2xl h-12 font-bold" />
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Téléphone Principal</Label>
                    <Input value={academicForm.phone} onChange={(e) => setAcademicForm({...academicForm, phone: e.target.value})} className="bg-white/5 border-white/5 rounded-2xl h-12 font-bold" />
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] italic">Contact d'Urgence</h3>
                </div>
                
                <div className="space-y-4 bg-amber-500/5 p-6 rounded-[2rem] border border-amber-500/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-amber-500/10 transition-all" />
                    <div className="space-y-4 relative z-10">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase opacity-40 ml-1 text-amber-600">Nom du répondant</Label>
                            <Input value={academicForm.emergency_contact_name} onChange={(e) => setAcademicForm({...academicForm, emergency_contact_name: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-12 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase opacity-40 ml-1 text-amber-600">Téléphone répondant</Label>
                            <Input value={academicForm.emergency_contact_phone} onChange={(e) => setAcademicForm({...academicForm, emergency_contact_phone: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-12 font-bold" />
                        </div>
                    </div>
                </div>
            </div>

            <Button 
                onClick={() => updateMutation.mutate(academicForm)}
                disabled={updateMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90 h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
            >
                {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Mettre à jour le dossier"}
            </Button>
        </motion.div>
    );
};
