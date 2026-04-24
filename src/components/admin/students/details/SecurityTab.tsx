import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface SecurityTabProps {
    editForm: any;
    setEditForm: (form: any) => void;
    userActionMutation: any;
    selectedStudentId: string | null;
    selectedStudent: any;
}

export const SecurityTab = ({
    editForm,
    setEditForm,
    userActionMutation,
    selectedStudentId,
    selectedStudent
}: SecurityTabProps) => {
    return (
        <div className="space-y-10 pt-8 outline-none">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-primary rounded-full" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] italic">Compte Système</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Nom Complet</Label>
                        <Input value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} className="bg-white/5 border-white/5 rounded-2xl h-12 font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Email Principal</Label>
                        <Input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="bg-white/5 border-white/5 rounded-2xl h-12 font-bold" />
                    </div>
                    <Button size="sm" onClick={() => userActionMutation.mutate({ action: 'UPDATE_PROFILE', targetUserId: selectedStudentId!, data: editForm })} disabled={userActionMutation.isPending} className="w-full bg-primary/20 text-primary hover:bg-primary/30 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] mt-4">
                        Mettre à jour les accès
                    </Button>
                </div>
            </div>

            <div className="space-y-4 pt-10 border-t border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-destructive rounded-full" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] italic text-destructive">Zone de Danger</h3>
                </div>
                
                <div className="p-8 bg-destructive/5 border border-destructive/20 rounded-[2.5rem] space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-black uppercase italic tracking-tighter text-lg text-destructive">Suspension Totale</h4>
                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Couper l'accès temporairement</p>
                        </div>
                        <Switch 
                            checked={selectedStudent?.banned_until ? new Date(selectedStudent.banned_until) > new Date() : false}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    userActionMutation.mutate({ action: 'SUSPEND_USER', targetUserId: selectedStudentId!, data: { durationHours: 87600 }});
                                } else {
                                    userActionMutation.mutate({ action: 'RESTORE_USER', targetUserId: selectedStudentId! });
                                }
                            }}
                            disabled={userActionMutation.isPending}
                            className="data-[state=checked]:bg-destructive"
                        />
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full h-16 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-destructive/20 active:scale-95 transition-all">
                                Supprimer définitivement
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] border-destructive border-2 bg-card">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-black uppercase italic text-destructive text-2xl">ACTION IRRÉVERSIBLE</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400 font-bold italic py-4">
                                    La suppression du compte de <span className="text-primary">{selectedStudent?.full_name}</span> entraînera la perte définitive de tous ses accès, paiements et données académiques.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-4">
                                <AlertDialogCancel className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest">Abandonner</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive text-white h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] px-8" onClick={() => userActionMutation.mutate({ action: 'DELETE_USER', targetUserId: selectedStudentId! })}>
                                    Supprimer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );
};
