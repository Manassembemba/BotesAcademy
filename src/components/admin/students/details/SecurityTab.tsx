import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, Loader2 } from "lucide-react";

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
    const isBanned = selectedStudent?.banned_until && new Date(selectedStudent.banned_until) > new Date();

    return (
        <div className="space-y-6 pt-2">
            {/* Compte Système */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Compte Système</h3>
                </div>
                <div className="grid grid-cols-1 gap-3 bg-muted/40 p-4 rounded-xl border border-border/50">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-medium text-muted-foreground">Nom Complet</Label>
                        <Input
                            value={editForm.fullName}
                            onChange={e => setEditForm({...editForm, fullName: e.target.value})}
                            className="h-9 rounded-xl text-sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-medium text-muted-foreground">Email Principal</Label>
                        <Input
                            value={editForm.email}
                            onChange={e => setEditForm({...editForm, email: e.target.value})}
                            className="h-9 rounded-xl text-sm"
                        />
                    </div>
                    <Button
                        size="sm"
                        onClick={() => userActionMutation.mutate({ action: 'UPDATE_PROFILE', targetUserId: selectedStudentId!, data: editForm })}
                        disabled={userActionMutation.isPending}
                        className="h-9 rounded-xl font-semibold text-xs mt-1"
                    >
                        {userActionMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                        Mettre à jour les accès
                    </Button>
                </div>
            </div>

            {/* Zone de Danger */}
            <div className="space-y-3 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-destructive rounded-full" />
                    <h3 className="text-xs font-semibold text-destructive uppercase tracking-wide">Zone de Danger</h3>
                </div>
                
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl space-y-4">
                    {/* Suspension */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <h4 className="text-sm font-semibold text-destructive">Suspension de l'accès</h4>
                            <p className="text-[11px] text-muted-foreground">Couper temporairement l'accès à la plateforme</p>
                        </div>
                        <Switch 
                            checked={isBanned}
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

                    {/* Suppression définitive */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="w-full h-9 rounded-xl font-semibold text-xs gap-2">
                                <Shield className="w-3.5 h-3.5" />
                                Supprimer définitivement
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl border-destructive/30">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-bold text-destructive text-lg">Action irréversible</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm text-muted-foreground pt-1">
                                    La suppression du compte de <span className="font-semibold text-foreground">{selectedStudent?.full_name}</span> entraînera la perte définitive de tous ses accès, paiements et données académiques.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel className="h-9 rounded-xl font-semibold text-xs">Abandonner</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground h-9 rounded-xl font-semibold text-xs px-6 hover:bg-destructive/90"
                                    onClick={() => userActionMutation.mutate({ action: 'DELETE_USER', targetUserId: selectedStudentId! })}
                                >
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
