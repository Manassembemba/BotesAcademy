import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, BookOpen, Clock, Loader2, Search, TrendingUp, Download, Eye, Plus, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

interface Course {
    id: string;
    title: string;
    price: number;
}

interface Strategy {
    id: string;
    title: string;
    price: number;
}

interface Indicator {
    id: string;
    name: string;
    price: number;
}

interface Vacation {
    id: string;
    name: string;
    time_range: string;
    course_id: string;
}

interface StudentData {
    student_id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    enrolled_courses_count: number;
    purchased_strategies_count: number;
    purchased_indicators_count: number;
    course_titles: string[];
    course_purchase_ids: string[];
    strategy_titles: string[];
    strategy_purchase_ids: string[];
    indicator_titles: string[];
    indicator_purchase_ids: string[];
    total_spent: number;
    last_enrollment_date: string | null;
}

const VacationOptions = ({ courseId }: { courseId: string }) => {
    const { data: vacations } = useQuery({
        queryKey: ['course-vacations-list', courseId],
        queryFn: async () => {
            const { data } = await supabase.from('course_vacations').select('*').eq('course_id', courseId);
            return (data as Vacation[]) || [];
        },
        enabled: !!courseId
    });

    if (!vacations || vacations.length === 0) return <SelectItem value="none" disabled>Aucune vacation disponible</SelectItem>;

    return (
        <>
            {vacations.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                    {v.name} ({v.time_range})
                </SelectItem>
            ))}
        </>
    );
};

const StudentManagement = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [shouldNotify, setShouldNotify] = useState(true);

    // Form states for new student (plus de champ password — Magic Link géré par Supabase Auth)
    const [newStudent, setNewStudent] = useState({
        full_name: "",
        email: "",
        course_id: "",
        session_id: "",
        vacation_id: "",
        amount: 0,
        payment_method: "cash_deposit" as const
    });

    const { data: students, isLoading, error } = useQuery({
        queryKey: ['admin-students'],
        queryFn: async () => {
            // Note: Cette vue 'student_management_view' nécessite l'exécution de la migration SQL
            const { data, error } = await supabase
                .from('student_management_view' as any)
                .select('*');

            if (error) {
                console.error("Erreur StudentManagement:", error);
                throw new Error(error.message);
            }
            return data as StudentData[];
        },
    });

    const { data: allCourses } = useQuery({
        queryKey: ['admin-all-courses'],
        queryFn: async () => {
            const { data } = await supabase.from('courses').select('id, title, price');
            return data || [];
        }
    });

    const { data: allStrategies } = useQuery({
        queryKey: ['admin-all-strategies'],
        queryFn: async () => {
            const { data } = await supabase.from('strategies').select('id, title, price');
            return data || [];
        }
    });

    const { data: allIndicators } = useQuery({
        queryKey: ['admin-all-indicators'],
        queryFn: async () => {
            const { data } = await supabase.from('indicators').select('id, name, price');
            return data || [];
        }
    });

    // Fetch sessions for selected course in the form
    const { data: courseSessions } = useQuery({
        queryKey: ['admin-course-sessions', newStudent.course_id],
        queryFn: async () => {
            if (!newStudent.course_id) return [];
            const { data } = await supabase
                .from('course_sessions')
                .select('id, session_name')
                .eq('course_id', newStudent.course_id);
            return data || [];
        },
        enabled: !!newStudent.course_id
    });

    const queryClient = useQueryClient();

    const addStudentMutation = useMutation({
        mutationFn: async (data: typeof newStudent) => {
            // Appel atomique à la Edge Function (magic link + purchase + proof + audit)
            const { data: response, error } = await supabase.functions.invoke('admin-register-student', {
                body: {
                    email: data.email,
                    fullName: data.full_name,
                    courseId: data.course_id,
                    sessionId: data.session_id || null,
                    vacationId: data.vacation_id && data.vacation_id !== "none" ? data.vacation_id : null,
                    amount: data.amount,
                    paymentMethod: data.payment_method,
                    adminId: user?.id  // Pour le log d'audit
                }
            });

            if (error || response?.error) throw new Error(error?.message || response?.error);

            // Email de bienvenue avec le lien de reset — envoyé si shouldNotify est actif
            if (shouldNotify) {
                const course = allCourses?.find(c => c.id === data.course_id);
                try {
                    await supabase.functions.invoke('welcome-email', {
                        body: {
                            fullName: data.full_name,
                            email: data.email,
                            courseTitle: course?.title,
                            resetLink: response?.resetLink  // ← lien de définition du mot de passe
                        }
                    });
                } catch (emailErr) {
                    console.error("Erreur lors de l'envoi du mail de bienvenue:", emailErr);
                }
            }
        },
        onSuccess: () => {
            toast.success(
                shouldNotify
                    ? "Étudiant inscrit ! Un lien d'invitation a été envoyé par email."
                    : "Étudiant inscrit avec succès.",
                { duration: 8000 }
            );
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
            queryClient.invalidateQueries({ queryKey: ['admin-accounting'] });
            setIsAddStudentOpen(false);
            setNewStudent({ full_name: "", email: "", course_id: "", session_id: "", vacation_id: "", amount: 0, payment_method: "cash_deposit" });
        },
        onError: (err: any) => toast.error(err.message)
    });

    const enrollMutation = useMutation({
        mutationFn: async ({ type, itemId }: { type: 'course' | 'strategy' | 'indicator', itemId: string }) => {
            if (!selectedStudentId) return;

            if (type === 'course') {
                const course = allCourses?.find(c => c.id === itemId);
                const { error } = await supabase.from('purchases').insert({
                    user_id: selectedStudentId,
                    course_id: itemId,
                    amount: course?.price || 0,
                    payment_status: 'completed',
                    validation_status: 'approved',
                    validated_at: new Date().toISOString()
                });
                if (error) throw error;
            } else if (type === 'strategy') {
                const { error } = await supabase.from('strategy_purchases').insert({
                    user_id: selectedStudentId,
                    strategy_id: itemId
                });
                if (error) throw error;
            } else if (type === 'indicator') {
                const { error } = await supabase.from('indicator_purchases').insert({
                    user_id: selectedStudentId,
                    indicator_id: itemId
                });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            toast.success("Ressource ajoutée avec succès");
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
            // Update selectedStudent in state to reflect change immediately if possible,
            // but invalidating query is safer. For now close and let user reopen or just wait
        },
        onError: (err: any) => {
            toast.error(`Erreur: ${err.message}`);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ type, id }: { type: 'course' | 'strategy' | 'indicator', id: string }) => {
            if (type === 'course') {
                const { error } = await supabase.from('purchases').delete().eq('id', id);
                if (error) throw error;
            } else if (type === 'strategy') {
                const { error } = await supabase.from('strategy_purchases').delete().eq('id', id);
                if (error) throw error;
            } else if (type === 'indicator') {
                const { error } = await supabase.from('indicator_purchases').delete().eq('id', id);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            toast.success("Ressource retirée avec succès");
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
        },
        onError: (err: any) => {
            toast.error(`Erreur lors de la suppression: ${err.message}`);
        }
    });

    const filteredStudents = students?.filter(student =>
        student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedStudent = students?.find(s => s.student_id === selectedStudentId);

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Gestion des Étudiants</h1>
                    <p className="text-muted-foreground">
                        Visualisez et gérez les apprenants inscrits à l'académie.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={() => setIsAddStudentOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                        <Plus className="w-4 h-4" />
                        Nouvel Étudiant
                    </Button>
                    <Card className="p-3 bg-primary/10 border-primary/20 flex items-center gap-3">
                        <Users className="w-5 h-5 text-primary" />
                        <div>
                            <div className="text-xl font-bold">{students?.length || 0}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Étudiants</div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Dialog for adding new student */}
            <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Inscrire un étudiant manuellement</DialogTitle>
                        <DialogDescription>
                            Cette action inscrit l'étudiant, enregistre le paiement en comptabilité et lui envoie un lien d'invitation sécurisé.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Bannière d'information sur le Magic Link */}
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
                            <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p className="text-xs font-medium leading-relaxed">
                                L'étudiant recevra un <strong>lien d'invitation sécurisé</strong> pour définir son propre mot de passe. Aucun mot de passe n'est généré par l'admin.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Nom Complet de l'étudiant</Label>
                            <Input 
                                placeholder="ex: Jean Dupont" 
                                value={newStudent.full_name}
                                onChange={(e) => setNewStudent({...newStudent, full_name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email (Sert d'identifiant de connexion)</Label>
                            <Input 
                                type="email"
                                placeholder="exemple@email.com" 
                                value={newStudent.email}
                                onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sélectionner la formation</Label>
                            <Select onValueChange={(val) => {
                                const course = allCourses?.find(c => c.id === val);
                                setNewStudent({...newStudent, course_id: val, amount: course?.price || 0, session_id: "", vacation_id: ""});
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un cours" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allCourses?.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.title} (${c.price})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {newStudent.course_id && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label>Session (Mois / Période)</Label>
                                    <Select 
                                        value={newStudent.session_id} 
                                        onValueChange={(val) => setNewStudent({...newStudent, session_id: val})}
                                    >
                                        <SelectTrigger className="bg-primary/5 border-primary/20">
                                            <SelectValue placeholder="Choisir une session" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courseSessions?.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.session_name}</SelectItem>
                                            ))}
                                            {courseSessions?.length === 0 && <SelectItem value="none" disabled>Aucune session</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Vacation (Créneau horaire)</Label>
                                    <Select 
                                        value={newStudent.vacation_id} 
                                        onValueChange={(val) => setNewStudent({...newStudent, vacation_id: val})}
                                        disabled={!newStudent.session_id}
                                    >
                                        <SelectTrigger className="bg-primary/5 border-primary/20">
                                            <SelectValue placeholder="Choisir une vacation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucune (Par défaut)</SelectItem>
                                            <VacationOptions courseId={newStudent.course_id} />
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Montant Reçu ($)</Label>
                                <Input 
                                    type="number" 
                                    value={newStudent.amount}
                                    onChange={(e) => setNewStudent({...newStudent, amount: Number(e.target.value)})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Mode de Paiement</Label>
                                <Select 
                                    value={newStudent.payment_method}
                                    onValueChange={(val: any) => setNewStudent({...newStudent, payment_method: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash_deposit">Cash / Espèces</SelectItem>
                                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                        <SelectItem value="bank_transfer">Virement</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold">Envoyer un email de bienvenue</Label>
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">Informe l'étudiant de son inscription</p>
                            </div>
                            <Switch 
                                checked={shouldNotify}
                                onCheckedChange={setShouldNotify}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddStudentOpen(false)}>Annuler</Button>
                        <Button 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => addStudentMutation.mutate(newStudent)} 
                            disabled={addStudentMutation.isPending || !newStudent.email || !newStudent.course_id}
                        >
                            {addStudentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Inscrire et Encaisser
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Liste des Apprenants</CardTitle>
                            <CardDescription>Détails des inscriptions et activité récente.</CardDescription>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher un étudiant..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-destructive">
                            <p>Erreur lors du chargement des données. Assurez-vous d'avoir exécuté la migration SQL.</p>
                            <p className="text-sm mt-2">{error.message}</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Étudiant</TableHead>
                                            <TableHead>Formations</TableHead>
                                            <TableHead>Outils</TableHead>
                                            <TableHead>Dernière Inscription</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStudents?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    Aucun étudiant trouvé.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredStudents?.map((student) => (
                                                <TableRow key={student.student_id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar>
                                                                <AvatarImage src={student.avatar_url || ''} />
                                                                <AvatarFallback>{student.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium">{student.full_name}</div>
                                                                <div className="text-xs text-muted-foreground">{student.email}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <Badge variant="secondary" className="gap-1 w-fit">
                                                                <BookOpen className="w-3 h-3" />
                                                                {student.enrolled_courses_count} Formations
                                                            </Badge>
                                                            {student.course_titles?.filter(Boolean).slice(0, 1).map((title, i) => (
                                                                <div key={i} className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                                                    {title} {student.course_titles.length > 1 && `...`}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <Badge variant="outline" className="gap-1 w-fit border-accent/30 text-accent">
                                                                <TrendingUp className="w-3 h-3" />
                                                                {student.purchased_strategies_count} Stratégies
                                                            </Badge>
                                                            <Badge variant="outline" className="gap-1 w-fit border-primary/30 text-primary">
                                                                <Download className="w-3 h-3" />
                                                                {student.purchased_indicators_count} Indicateurs
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Clock className="w-3 h-3 text-muted-foreground" />
                                                            {student.last_enrollment_date
                                                                ? format(new Date(student.last_enrollment_date), 'dd MMM yyyy', { locale: fr })
                                                                : 'Aucune'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="hover:bg-primary/10 hover:text-primary gap-2"
                                                            onClick={() => {
                                                                setSelectedStudentId(student.student_id);
                                                                setIsDetailsOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Détails
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {filteredStudents?.map((student) => (
                                    <Card key={student.student_id} className="p-4 border-primary/10 hover:border-primary/30 transition-all">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={student.avatar_url || ''} />
                                                <AvatarFallback>{student.full_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold truncate">{student.full_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="rounded-full h-8 w-8 p-0"
                                                onClick={() => {
                                                    setSelectedStudentId(student.student_id);
                                                    setIsDetailsOpen(true);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-dashed">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Inscriptions</p>
                                                <p className="font-bold text-sm">{student.enrolled_courses_count} Cours</p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Investi</p>
                                                <p className="font-bold text-sm text-emerald-600">${student.total_spent || 0}</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                {filteredStudents?.length === 0 && (
                                    <p className="text-center py-12 text-muted-foreground italic uppercase text-xs tracking-widest">Aucun résultat.</p>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-primary/20">
                                <AvatarImage src={selectedStudent?.avatar_url || ''} />
                                <AvatarFallback>{selectedStudent?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle className="text-2xl font-bold">{selectedStudent?.full_name}</DialogTitle>
                                <DialogDescription className="flex items-center gap-2">
                                    {selectedStudent?.email}
                                    <span className="text-xs py-0.5 px-2 bg-primary/10 text-primary rounded-full font-bold">
                                        Total investi: {selectedStudent?.total_spent?.toLocaleString()} $
                                    </span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <Tabs defaultValue="courses" className="mt-6">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="courses" className="gap-2">
                                <BookOpen className="w-4 h-4" /> Formations
                            </TabsTrigger>
                            <TabsTrigger value="strategies" className="gap-2">
                                <TrendingUp className="w-4 h-4" /> Stratégies
                            </TabsTrigger>
                            <TabsTrigger value="indicators" className="gap-2">
                                <Download className="w-4 h-4" /> Indicateurs
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="courses" className="space-y-4 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-primary" />
                                    Inscriptions ({selectedStudent?.enrolled_courses_count})
                                </h3>
                                <div className="flex gap-2">
                                    <Select onValueChange={(val) => enrollMutation.mutate({ type: 'course', itemId: val })}>
                                        <SelectTrigger className="w-[200px] h-8 text-xs">
                                            <SelectValue placeholder="Choisir une formation..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allCourses?.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {selectedStudent?.course_titles?.filter(Boolean).length ? (
                                    selectedStudent.course_titles.filter(Boolean).map((title, i) => {
                                        const purchaseId = selectedStudent.course_purchase_ids?.[i];
                                        return (
                                            <div key={purchaseId || i} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 group">
                                                <span className="text-sm font-medium truncate">{title}</span>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Confirmer le retrait</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Êtes-vous sûr de vouloir retirer l'accès à la formation <span className="font-bold text-foreground">"{title}"</span> ? 
                                                                L'étudiant ne pourra plus consulter le contenu.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                            <AlertDialogAction 
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                onClick={() => purchaseId && deleteMutation.mutate({ type: 'course', id: purchaseId })}
                                                            >
                                                                Retirer l'accès
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-muted-foreground italic col-span-2 py-4 text-center">Aucune formation active.</p>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="strategies" className="space-y-4 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-accent" />
                                    Stratégies possédées ({selectedStudent?.purchased_strategies_count})
                                </h3>
                                <div className="flex gap-2">
                                    <Select onValueChange={(val) => enrollMutation.mutate({ type: 'strategy', itemId: val })}>
                                        <SelectTrigger className="w-[200px] h-8 text-xs">
                                            <SelectValue placeholder="Choisir une stratégie..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allStrategies?.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {selectedStudent?.strategy_titles?.filter(Boolean).length ? (
                                    selectedStudent.strategy_titles.filter(Boolean).map((title, i) => {
                                        const purchaseId = selectedStudent.strategy_purchase_ids?.[i];
                                        return (
                                            <div key={purchaseId || i} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 group">
                                                <span className="text-sm font-medium truncate">{title}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => purchaseId && deleteMutation.mutate({ type: 'strategy', id: purchaseId })}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-muted-foreground italic col-span-2 py-4 text-center">Aucune stratégie active.</p>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="indicators" className="space-y-4 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Download className="w-4 h-4 text-primary" />
                                    Indicateurs possédés ({selectedStudent?.purchased_indicators_count})
                                </h3>
                                <div className="flex gap-2">
                                    <Select onValueChange={(val) => enrollMutation.mutate({ type: 'indicator', itemId: val })}>
                                        <SelectTrigger className="w-[200px] h-8 text-xs">
                                            <SelectValue placeholder="Choisir un indicateur..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allIndicators?.map(ind => (
                                                <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {selectedStudent?.indicator_titles?.filter(Boolean).length ? (
                                    selectedStudent.indicator_titles.filter(Boolean).map((title, i) => {
                                        const purchaseId = selectedStudent.indicator_purchase_ids?.[i];
                                        return (
                                            <div key={purchaseId || i} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 group">
                                                <span className="text-sm font-medium truncate">{title}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => purchaseId && deleteMutation.mutate({ type: 'indicator', id: purchaseId })}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-muted-foreground italic col-span-2 py-4 text-center">Aucun indicateur actif.</p>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-8 border-t pt-4">
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Fermer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StudentManagement;
