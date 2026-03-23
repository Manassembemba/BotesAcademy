import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    FileText, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Loader2, 
    Search, 
    Eye, 
    MessageSquare,
    User,
    Calendar,
    Phone,
    MoreHorizontal,
    Check,
    X,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const Applications = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [isAdminNotesDialogOpen, setIsAdminNotesDialogOpen] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");

    const { data: applications, isLoading } = useQuery({
        queryKey: ['admin-course-applications'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('course_applications')
                .select(`
                    *,
                    courses (title, mode),
                    profiles:user_id (full_name, avatar_url, email)
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, notes }: { id: string, status: string, notes?: string }) => {
            const updateData: any = { status, updated_at: new Date().toISOString() };
            if (notes !== undefined) updateData.admin_notes = notes;
            
            const { error } = await supabase
                .from('course_applications')
                .update(updateData)
                .eq('id', id);
            
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Candidature mise à jour");
            queryClient.invalidateQueries({ queryKey: ['admin-course-applications'] });
            setIsAdminNotesDialogOpen(false);
            setSelectedApp(null);
        },
        onError: (err: any) => toast.error(`Erreur: ${err.message}`)
    });

    const filteredApps = applications?.filter((app: any) => {
        const matchesSearch = 
            app.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.courses?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.phone?.includes(searchQuery);
        
        const matchesStatus = statusFilter === "all" || app.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5"><Clock className="w-3 h-3" /> En attente</Badge>;
            case 'accepted':
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5"><CheckCircle className="w-3 h-3" /> Acceptée</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1.5"><XCircle className="w-3 h-3" /> Refusée</Badge>;
            case 'cancelled':
                return <Badge variant="outline" className="bg-muted text-muted-foreground gap-1.5"><X className="w-3 h-3" /> Annulée</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const handleOpenNotes = (app: any) => {
        setSelectedApp(app);
        setAdminNotes(app.admin_notes || "");
        setIsAdminNotesDialogOpen(true);
    };

    const handleStatusChange = (app: any, newStatus: string) => {
        updateStatusMutation.mutate({ id: app.id, status: newStatus });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic">Gestion des <span className="text-primary">Candidatures</span></h1>
                    <p className="text-muted-foreground font-medium">Étudiez et gérez les demandes d'inscription aux pôles d'excellence.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-3xl border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total</p>
                                <p className="text-2xl font-black italic">{applications?.length || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">En attente</p>
                                <p className="text-2xl font-black italic">{applications?.filter((a: any) => a.status === 'pending').length || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Acceptées</p>
                                <p className="text-2xl font-black italic">{applications?.filter((a: any) => a.status === 'accepted').length || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
                                <XCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Refusées</p>
                                <p className="text-2xl font-black italic">{applications?.filter((a: any) => a.status === 'rejected').length || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[2.5rem] border-primary/10 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b border-primary/5 pb-8 pt-10 px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Liste des candidats</CardTitle>
                            <CardDescription className="font-medium italic">Filtrez et examinez les motivations des futurs étudiants.</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="Rechercher un candidat..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 w-full sm:w-[250px] rounded-2xl border-primary/10 h-12 bg-background/50 focus-visible:ring-primary/20"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-primary" />
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-[160px] h-12 rounded-2xl border-primary/10 bg-background/50">
                                        <SelectValue placeholder="Tous les statuts" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-primary/10">
                                        <SelectItem value="all">Tous les statuts</SelectItem>
                                        <SelectItem value="pending">En attente</SelectItem>
                                        <SelectItem value="accepted">Acceptée</SelectItem>
                                        <SelectItem value="rejected">Refusée</SelectItem>
                                        <SelectItem value="cancelled">Annulée</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Chargement des dossiers...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-primary/5 bg-primary/5">
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest px-8 py-5">Candidat</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">Formation</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">Date</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">Statut</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 text-right px-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredApps?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <Search className="w-16 h-16" />
                                                <p className="text-xl font-black uppercase italic">Aucune candidature trouvée</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredApps?.map((app: any) => (
                                    <TableRow key={app.id} className="group border-primary/5 hover:bg-primary/5 transition-colors">
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="w-12 h-12 rounded-2xl border-2 border-primary/10 shadow-lg">
                                                    <AvatarImage src={app.profiles?.avatar_url || ""} />
                                                    <AvatarFallback className="bg-primary/10 text-primary font-black italic">{app.full_name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="space-y-0.5">
                                                    <p className="font-black uppercase tracking-tight italic group-hover:text-primary transition-colors">{app.full_name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                        <Phone className="w-3 h-3 text-primary" /> {app.phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="font-black text-sm uppercase italic leading-none">{app.courses?.title}</p>
                                                <Badge variant="outline" className="text-[9px] uppercase font-bold bg-primary/5 border-primary/10 h-5">
                                                    {app.courses?.mode}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                <Calendar className="w-3 h-3 text-primary" />
                                                {format(new Date(app.created_at), 'dd/MM/yyyy', { locale: fr })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(app.status)}
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="rounded-xl hover:bg-primary hover:text-white transition-all shadow-glow-primary-hover"
                                                    onClick={() => handleOpenNotes(app)}
                                                    title="Voir les détails"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="rounded-xl">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl border-primary/10 w-48 p-2">
                                                        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Modifier le statut</div>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleStatusChange(app, 'accepted')}
                                                            className="rounded-xl gap-2 font-bold focus:bg-emerald-500/10 focus:text-emerald-500"
                                                        >
                                                            <Check className="w-4 h-4" /> Accepter
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleStatusChange(app, 'rejected')}
                                                            className="rounded-xl gap-2 font-bold focus:bg-destructive/10 focus:text-destructive"
                                                        >
                                                            <X className="w-4 h-4" /> Refuser
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-primary/5" />
                                                        <DropdownMenuItem 
                                                            onClick={() => handleStatusChange(app, 'pending')}
                                                            className="rounded-xl gap-2 font-bold focus:bg-amber-500/10 focus:text-amber-500"
                                                        >
                                                            <Clock className="w-4 h-4" /> Remettre en attente
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Dialog pour les détails et notes */}
            <Dialog open={isAdminNotesDialogOpen} onOpenChange={setIsAdminNotesDialogOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-primary/10 shadow-3xl bg-card overflow-hidden">
                    <DialogHeader className="pb-6 border-b border-primary/5">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                            <User className="w-6 h-6 text-primary" /> Détails de la Candidature
                        </DialogTitle>
                        <DialogDescription className="font-medium">Examinez le profil du candidat et gérez son dossier.</DialogDescription>
                    </DialogHeader>

                    {selectedApp && (
                        <div className="py-6 space-y-8 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary italic">Candidat</Label>
                                    <p className="font-bold text-lg leading-tight">{selectedApp.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedApp.profiles?.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary italic">Formation</Label>
                                    <p className="font-bold text-lg leading-tight">{selectedApp.courses?.title}</p>
                                    <p className="text-sm text-muted-foreground uppercase font-black text-[10px] tracking-tighter">Mode: {selectedApp.courses?.mode}</p>
                                </div>
                            </div>

                            <div className="space-y-3 p-6 rounded-3xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 transition-transform group-hover:rotate-0">
                                    <MessageSquare className="w-12 h-12" />
                                </div>
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary italic flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" /> Motivation du candidat
                                </Label>
                                <p className="text-sm leading-relaxed font-medium italic whitespace-pre-wrap relative z-10">
                                    "{selectedApp.motivation}"
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary italic flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> Notes administratives
                                </Label>
                                <Textarea 
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Ajouter des observations internes sur ce profil..."
                                    className="rounded-2xl border-primary/10 min-h-[120px] bg-background/50 focus:border-primary transition-all text-sm font-medium"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-3 sm:gap-0 pt-6 border-t border-primary/5">
                        <Button variant="ghost" onClick={() => setIsAdminNotesDialogOpen(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
                            Fermer
                        </Button>
                        <Button 
                            onClick={() => updateStatusMutation.mutate({ 
                                id: selectedApp.id, 
                                status: selectedApp.status, 
                                notes: adminNotes 
                            })}
                            disabled={updateStatusMutation.isPending}
                            className="rounded-2xl px-8 bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest h-12 shadow-glow-primary"
                        >
                            {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Enregistrer les notes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Applications;
