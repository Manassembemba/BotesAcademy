import React from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, User, Phone, MapPin, ShieldAlert, HeartHandshake } from "lucide-react";

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
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-6 pb-12">
      {/* INFORMATIONS PRINCIPALES */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
            Identité & Coordonnées
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Matricule
            </Label>
            <Input
              readOnly
              value={fullProfile?.matricule || "BA-AUTO"}
              className="bg-muted/40 border-border rounded-xl h-11 font-mono font-bold text-primary text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Genre
            </Label>
            <Select
              value={academicForm.gender || ""}
              onValueChange={(val) => setAcademicForm({ ...academicForm, gender: val })}
            >
              <SelectTrigger className="bg-card border-border rounded-xl h-11 font-bold text-xs">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculin</SelectItem>
                <SelectItem value="F">Féminin</SelectItem>
                <SelectItem value="Other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Date de Naissance <span className="text-[9px] font-normal text-muted-foreground">(Optionnel)</span>
            </Label>
            <Input
              type="date"
              value={academicForm.birth_date || ""}
              onChange={(e) => setAcademicForm({ ...academicForm, birth_date: e.target.value })}
              className="bg-card border-border rounded-xl h-11 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Téléphone Principal
            </Label>
            <Input
              placeholder="+243..."
              value={academicForm.phone || ""}
              onChange={(e) => setAcademicForm({ ...academicForm, phone: e.target.value })}
              className="bg-card border-border rounded-xl h-11 text-xs font-bold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Adresse de Résidence <span className="text-[9px] font-normal text-muted-foreground">(Optionnel)</span>
          </Label>
          <Input
            placeholder="Ville, Commune, Quartier..."
            value={academicForm.address || ""}
            onChange={(e) => setAcademicForm({ ...academicForm, address: e.target.value })}
            className="bg-card border-border rounded-xl h-11 text-xs"
          />
        </div>
      </div>

      {/* CONTACT D'URGENCE (FACULTATIF ET ÉPURÉ) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
            Personne de Contact / Répondant <span className="text-[10px] font-normal text-muted-foreground">(Optionnel)</span>
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-muted/20 border border-border">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">
              Nom du Répondant
            </Label>
            <Input
              placeholder="ex: Parent, Tuteur..."
              value={academicForm.emergency_contact_name || ""}
              onChange={(e) => setAcademicForm({ ...academicForm, emergency_contact_name: e.target.value })}
              className="bg-card border-border rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">
              Téléphone Répondant
            </Label>
            <Input
              placeholder="ex: +243..."
              value={academicForm.emergency_contact_phone || ""}
              onChange={(e) => setAcademicForm({ ...academicForm, emergency_contact_phone: e.target.value })}
              className="bg-card border-border rounded-xl h-10 text-xs"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={() => updateMutation.mutate(academicForm)}
        disabled={updateMutation.isPending}
        className="w-full bg-primary hover:bg-primary/90 h-12 rounded-xl font-black uppercase tracking-wider text-xs shadow-md"
      >
        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Enregistrer les modifications"}
      </Button>
    </motion.div>
  );
};
