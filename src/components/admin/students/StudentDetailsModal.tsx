import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    User, CreditCard, LayoutDashboard, FileText, Shield, Loader2, 
    MapPin, Phone, AlertCircle, GraduationCap, BookOpen, Trash2, 
    TrendingUp, Download, Mail, Plus
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

interface StudentDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedStudent: any;
    isLoadingProfile: boolean;
    fullProfile: any;
    academicForm: any;
    setAcademicForm: (form: any) => void;
    updateProfileFieldsMutation: any;
    isLoadingCourses: boolean;
    studentCoursesDetails: any[] | null;
    studentStrategiesDetails: any[] | null;
    studentIndicatorsDetails: any[] | null;
    allCourses: any[] | undefined;
    allStrategies: any[] | undefined;
    allIndicators: any[] | undefined;
    enrollMutation: any;
    deleteMutation: any;
    editForm: any;
    setEditForm: (form: any) => void;
    userActionMutation: any;
    selectedStudentId: string | null;
    setSelectedPurchase: (purchase: any) => void;
    setIsInstallmentsOpen: (open: boolean) => void;
    setManualPaymentAmount: (amount: number) => void;
    setIsManualPaymentOpen: (open: boolean) => void;
    setIsEnrollDialogOpen: (open: boolean) => void;
}

export const StudentDetailsModal = ({
    open,
    onOpenChange,
    selectedStudent,
    isLoadingProfile,
    fullProfile,
    academicForm,
    setAcademicForm,
    updateProfileFieldsMutation,
    isLoadingCourses,
    studentCoursesDetails,
    studentStrategiesDetails,
    studentIndicatorsDetails,
    allCourses,
    allStrategies,
    allIndicators,
    enrollMutation,
    deleteMutation,
    editForm,
    setEditForm,
    userActionMutation,
    selectedStudentId,
    setSelectedPurchase,
    setIsInstallmentsOpen,
    setManualPaymentAmount,
    setIsManualPaymentOpen,
    setIsEnrollDialogOpen
}: StudentDetailsModalProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/20 relative">
                            <AvatarImage src={selectedStudent?.avatar_url || ''} />
                            <AvatarFallback>{selectedStudent?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                {selectedStudent?.full_name}
                                {selectedStudent?.banned_until && new Date(selectedStudent.banned_until) > new Date() && (
                                    <Badge variant="destructive" className="text-[10px] uppercase">Banni</Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription className="flex items-center gap-2">
                                {selectedStudent?.email}
                                <span className="text-xs py-0.5 px-2 bg-primary/10 text-primary rounded-full font-bold">
                                    Total investi: {selectedStudent?.total_spent?.toLocaleString()} $
                                </span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="academic" className="mt-6">
                    <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50 p-1">
                        <TabsTrigger value="academic" className="gap-2 text-[10px] uppercase font-bold tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <User className="w-3.5 h-3.5" /> Académique
                        </TabsTrigger>
                        <TabsTrigger value="finance" className="gap-2 text-[10px] uppercase font-bold tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <CreditCard className="w-3.5 h-3.5" /> Finances
                        </TabsTrigger>
                        <TabsTrigger value="resources" className="gap-2 text-[10px] uppercase font-bold tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <LayoutDashboard className="w-3.5 h-3.5" /> Outils
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="gap-2 text-[10px] uppercase font-bold tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <FileText className="w-3.5 h-3.5" /> Docs
                        </TabsTrigger>
                        <TabsTrigger value="security" className="gap-2 text-[10px] uppercase font-bold tracking-wider data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm">
                            <Shield className="w-3.5 h-3.5" /> Sécurité
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="academic" className="space-y-6 py-6 animate-in fade-in slide-in-from-bottom-2">
                        {isLoadingProfile ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest border-b pb-2">
                                            <User className="w-4 h-4" /> Identification Civile
                                        </div>
                                        
                                        <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border border-dashed border-primary/20">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground mr-1">Matricule</Label>
                                                    <div className="h-9 px-3 flex items-center bg-white border rounded-lg font-mono text-sm font-bold text-primary">
                                                        {fullProfile?.matricule || 'BA-XXXX-XXXX'}
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground mr-1">Genre</Label>
                                                    <Select value={academicForm.gender} onValueChange={(val) => setAcademicForm({...academicForm, gender: val})}>
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue placeholder="Genre" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="M">Masculin</SelectItem>
                                                            <SelectItem value="F">Féminin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground mr-1">Date de naissance</Label>
                                                <Input 
                                                    type="date" 
                                                    className="bg-white"
                                                    value={academicForm.birth_date}
                                                    onChange={(e) => setAcademicForm({...academicForm, birth_date: e.target.value})}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground mr-1">Adresse Domicile</Label>
                                                <div className="relative">
                                                    <Input 
                                                        className="pl-3 bg-white"
                                                        placeholder="ex: Q/ Lubumbashi, Av. ..." 
                                                        value={academicForm.address}
                                                        onChange={(e) => setAcademicForm({...academicForm, address: e.target.value})}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground mr-1">Numéro Téléphone</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        className="pl-9 bg-white"
                                                        placeholder="+243 ..." 
                                                        value={academicForm.phone}
                                                        onChange={(e) => setAcademicForm({...academicForm, phone: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-amber-600 font-black uppercase text-xs tracking-widest border-b pb-2">
                                            <Shield className="w-4 h-4" /> Contact d'Urgence
                                        </div>
                                        
                                        <div className="space-y-4 bg-amber-50/30 p-4 rounded-2xl border border-dashed border-amber-200">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-amber-600 mr-1">Nom du répondant</Label>
                                                <Input 
                                                    className="bg-white"
                                                    placeholder="Père, Mère, Tuteur..." 
                                                    value={academicForm.emergency_contact_name}
                                                    onChange={(e) => setAcademicForm({...academicForm, emergency_contact_name: e.target.value})}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-amber-600 mr-1">Téléphone répondant</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-amber-400" />
                                                    <Input 
                                                        className="pl-9 bg-white"
                                                        placeholder="+243 ..." 
                                                        value={academicForm.emergency_contact_phone}
                                                        onChange={(e) => setAcademicForm({...academicForm, emergency_contact_phone: e.target.value})}
                                                    />
                                                </div>
                                            </div>

                                            {(!fullProfile?.profile_completed) && (
                                                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-100/50 border border-amber-200 mt-4">
                                                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                                                    <p className="text-[10px] font-bold text-amber-800 leading-tight">
                                                        PROFIL INCOMPLET : Cet étudiant n'a pas encore validé ses informations académiques.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <Button 
                                                onClick={() => updateProfileFieldsMutation.mutate(academicForm)}
                                                disabled={updateProfileFieldsMutation.isPending}
                                                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                            >
                                                {updateProfileFieldsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Enregistrer le Dossier
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="finance" className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black flex items-center gap-2 uppercase text-xs tracking-widest text-primary">
                                <GraduationCap className="w-4 h-4" /> Inscriptions actives ({selectedStudent?.enrolled_courses_count})
                            </h3>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    Total Payé: ${selectedStudent?.total_spent || 0}
                                </Badge>
                                <Button 
                                    size="sm" 
                                    className="h-8 text-[10px] uppercase font-black tracking-widest bg-primary"
                                    onClick={() => setIsEnrollDialogOpen(true)}
                                >
                                    <Plus className="w-3 h-3 mr-2" /> Inscrire
                                </Button>
                                </div>                        </div>

                        {isLoadingCourses ? (
                            <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {studentCoursesDetails?.length ? (
                                    studentCoursesDetails.map((purchase: any) => {
                                        const balance = (purchase.total_amount || 0) - (purchase.paid_amount || 0);
                                        const progress = purchase.total_amount > 0 ? (purchase.paid_amount / purchase.total_amount) * 100 : 0;
                                        
                                        return (
                                            <div key={purchase.id} className="flex flex-col p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all group border-slate-100">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                            <BookOpen className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-black block text-slate-800">{purchase.courses?.title || 'Cours Inconnu'}</span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="outline" className="text-[9px] font-bold uppercase border-primary/20 text-primary bg-primary/5 rounded-md px-1.5 h-5">
                                                                    Session: {purchase.course_sessions?.session_name || 'N/A'}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-[9px] font-bold uppercase border-amber-500/20 text-amber-600 bg-amber-500/5 rounded-md px-1.5 h-5">
                                                                    Vacation: {purchase.course_vacations?.name || 'Standard'}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {balance > 0 ? (
                                                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-2 py-0 h-5 text-[9px] font-black uppercase tracking-widest animate-pulse">
                                                                Paiement Partiel
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2 py-0 h-5 text-[9px] font-black uppercase tracking-widest">
                                                                Paiement Complet
                                                            </Badge>
                                                        )}
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Retirer l'accès ?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        L'étudiant perdra l'accès immédiat à <strong>{purchase.courses?.title}</strong>.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                    <AlertDialogAction className="bg-red-600" onClick={() => deleteMutation.mutate({ type: 'course', id: purchase.id })}>Confirmer</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 mb-4">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] font-black uppercase text-slate-500">Progression Paiement</span>
                                                        <span className="text-xs font-black text-primary">{Math.round(progress)}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
                                                            style={{ width: `${progress}%` }} 
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                        <span className="text-[9px] font-black text-muted-foreground uppercase block mb-1">Total Due</span>
                                                        <span className="text-sm font-black text-slate-700">${purchase.total_amount || purchase.amount}</span>
                                                    </div>
                                                    <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                                                        <span className="text-[9px] font-black text-emerald-600 uppercase block mb-1">Encaissé</span>
                                                        <span className="text-sm font-black text-emerald-700">${purchase.paid_amount || 0}</span>
                                                    </div>
                                                    <div className={`p-2.5 rounded-xl border ${balance > 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                                                        <span className="text-[9px] font-black text-amber-600 uppercase block mb-1">Reste</span>
                                                        <span className={`text-sm font-black ${balance > 0 ? 'text-amber-700' : 'text-slate-400'}`}>${balance}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                                                    <div className="flex gap-2 ml-auto">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-7 text-[10px] font-bold uppercase tracking-wider"
                                                            onClick={() => { setSelectedPurchase(purchase); setIsInstallmentsOpen(true); }}
                                                        >
                                                            Historique
                                                        </Button>
                                                        {balance > 0 && (
                                                            <Button 
                                                                size="sm" 
                                                                className="h-7 bg-primary text-[10px] font-bold uppercase tracking-wider shadow-sm"
                                                                onClick={() => {
                                                                    setSelectedPurchase(purchase);
                                                                    setManualPaymentAmount(balance);
                                                                    setIsManualPaymentOpen(true);
                                                                }}
                                                            >
                                                                Encaisser
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-muted/5 opacity-60">
                                        <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
                                        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Aucun parcours actif</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="resources" className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="font-black flex items-center gap-2 uppercase text-xs tracking-widest text-accent">
                                    <TrendingUp className="w-4 h-4" /> Stratégies de trading
                                </h3>
                                <Select onValueChange={(val) => enrollMutation.mutate({ type: 'strategy', itemId: val })}>
                                    <SelectTrigger className="w-[160px] h-8 text-[10px] uppercase font-bold">
                                        <SelectValue placeholder="+ Stratégie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allStrategies?.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {studentStrategiesDetails?.map((s: any) => (
                                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border bg-accent/5 group hover:bg-accent/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="w-4 h-4 text-accent" />
                                            <span className="text-xs font-bold">{s.strategies?.title}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500" onClick={() => deleteMutation.mutate({ type: 'strategy', id: s.id })}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ))}
                                {!studentStrategiesDetails?.length && <p className="text-[10px] text-muted-foreground italic col-span-2">Aucune stratégie.</p>}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="font-black flex items-center gap-2 uppercase text-xs tracking-widest text-primary">
                                    <Download className="w-4 h-4" /> Indicateurs techniques
                                </h3>
                                <Select onValueChange={(val) => enrollMutation.mutate({ type: 'indicator', itemId: val })}>
                                    <SelectTrigger className="w-[160px] h-8 text-[10px] uppercase font-bold">
                                        <SelectValue placeholder="+ Indicateur" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allIndicators?.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {studentIndicatorsDetails?.map((i: any) => (
                                    <div key={i.id} className="flex items-center justify-between p-3 rounded-xl border bg-primary/5 group hover:bg-primary/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <Download className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-bold">{i.indicators?.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500" onClick={() => deleteMutation.mutate({ type: 'indicator', id: i.id })}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ))}
                                {!studentIndicatorsDetails?.length && <p className="text-[10px] text-muted-foreground italic col-span-2">Aucun indicateur.</p>}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-3xl bg-muted/5">
                            <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                            <h4 className="text-sm font-black uppercase tracking-widest mb-2 text-slate-500">Gestion des justificatifs</h4>
                            <p className="text-xs text-muted-foreground max-w-[280px] text-center px-4">
                                L'interface de vérification des contrats et pièces d'identité sera disponible après le déploiement du Storage Supabase.
                            </p>
                            <Button variant="outline" className="mt-6 h-8 text-[10px] uppercase font-bold" disabled>
                                <Plus className="w-3 h-3 mr-2" /> Ajouter un document
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6 py-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 border-b pb-2 flex items-center gap-2">
                                <User className="w-4 h-4" /> Paramètres du compte
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Nom Administratif</Label>
                                    <Input value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Email Système</Label>
                                    <Input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button size="sm" onClick={() => userActionMutation.mutate({ action: 'UPDATE_PROFILE', targetUserId: selectedStudentId!, data: editForm })} disabled={userActionMutation.isPending} className="h-8 text-xs font-bold">
                                    Appliquer les changements
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-100">
                            <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                                <Mail className="w-4 h-4" /> Assistance Connexion
                            </h3>
                            <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-blue-900 text-xs">Magic Link de Récupération</h4>
                                    <p className="text-[10px] text-blue-700 leading-tight">Envoie un email permettant à l'étudiant de réinitialiser son mot de passe en toute autonomie.</p>
                                </div>
                                <Button variant="outline" size="sm" className="bg-white text-xs h-8 font-bold border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => userActionMutation.mutate({ action: 'SEND_RECOVERY', targetUserId: selectedStudentId! })} disabled={userActionMutation.isPending}>
                                    Envoyer le lien
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-red-50 mt-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Contrôle d'accès & Sanctions
                            </h3>
                            
                            <div className="flex items-center justify-between p-4 bg-red-50/20 rounded-2xl border border-red-100/50">
                                <div className="space-y-0.5">
                                    <h4 className="font-bold text-sm text-slate-900">Statut de Suspension</h4>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Bannit l'accès sans supprimer les données</p>
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
                                    className="data-[state=checked]:bg-red-600 shadow-sm"
                                />
                            </div>

                            <div className="p-4 bg-red-500/5 border border-red-200 rounded-2xl space-y-4">
                                <div>
                                    <h4 className="font-bold text-xs text-red-700 uppercase tracking-widest mb-1">Zone de Danger Maximale</h4>
                                    <p className="text-[10px] text-red-600 leading-relaxed font-medium">La suppression d'un compte est une action destructive et irréversible qui purgera l'étudiant des effectifs de l'académie.</p>
                                </div>
                                
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full text-[10px] uppercase font-black tracking-widest h-9 shadow-lg shadow-red-500/20">
                                            Désinscrire & Supprimer Définitivement
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="border-red-500 border-2">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-red-500">ATTENTION : ACTION FATALE</AlertDialogTitle>
                                            <AlertDialogDescription className="text-slate-900 font-medium">
                                                Cette opération va effacer <span className="font-black underline">{selectedStudent?.full_name}</span>. 
                                                Données de paiements, accès aux cours et statistiques seront <span className="text-red-600 font-black">PERDUS À JAMAIS</span>.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="font-bold">Annuler l'action</AlertDialogCancel>
                                            <AlertDialogAction className="bg-red-600 text-white font-black px-8" onClick={() => userActionMutation.mutate({ action: 'DELETE_USER', targetUserId: selectedStudentId! })}>
                                                CONFIRMER LA SUPPRESSION
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
