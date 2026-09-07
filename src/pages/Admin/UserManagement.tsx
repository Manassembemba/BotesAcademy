import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  GraduationCap, 
  Headphones, 
  UserPlus, 
  Search, 
  KeyRound, 
  Ban, 
  RotateCcw, 
  Trash2, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Mail, 
  Phone, 
  MoreVertical,
  Layers,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export interface AdminUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  matricule: string | null;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  role: 'admin' | 'teacher' | 'receptionist' | 'student';
  assigned_courses: { id: string; title: string }[];
  courses_enrolled_count: number;
}

export interface CourseOption {
  id: string;
  title: string;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("accounts");

  // Modales d'action
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'receptionist' | 'student'>('student');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const [isNewStaffOpen, setIsNewStaffOpen] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "teacher" as 'admin' | 'teacher' | 'receptionist',
    courseIds: [] as string[]
  });
  const [createdStaffResult, setCreatedStaffResult] = useState<{ email: string; pass: string; link?: string } | null>(null);

  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Charger tous les utilisateurs via la fonction RPC sécurisée
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_users');
      if (error) throw error;
      return (data || []) as AdminUser[];
    }
  });

  // 2. Charger les formations pour les affectations formateurs
  const { data: courses = [] } = useQuery({
    queryKey: ['admin-courses-selection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .order('title', { ascending: true });
      if (error) throw error;
      return (data || []) as CourseOption[];
    }
  });

  // 3. Mutation pour modifier le rôle & les cours
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role, courseIds }: { userId: string; role: 'admin' | 'teacher' | 'receptionist' | 'student'; courseIds: string[] }) => {
      const { data, error } = await supabase.rpc('admin_set_user_role', {
        p_target_user_id: userId,
        p_role: role,
        p_course_ids: role === 'teacher' ? courseIds : []
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Rôle et affectations mis à jour avec succès !");
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      setEditingUser(null);
    },
    onError: (err: any) => {
      toast.error(`Erreur : ${err.message}`);
    }
  });

  // 4. Mutation pour suspendre / réactiver
  const toggleSuspendMutation = useMutation({
    mutationFn: async ({ userId, isSuspended }: { userId: string; isSuspended: boolean }) => {
      const action = isSuspended ? 'RESTORE_USER' : 'SUSPEND_USER';
      const { data, error } = await supabase.functions.invoke('admin-user-actions', {
        body: { action, targetUserId: userId }
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.isSuspended ? "Compte réactivé avec succès." : "Compte suspendu.");
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  // 5. Mutation pour envoyer un lien de récupération
  const sendRecoveryMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-user-actions', {
        body: { action: 'SEND_RECOVERY', targetUserId: userId }
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      return data;
    },
    onSuccess: (data) => {
      if (data?.recoveryLink) {
        navigator.clipboard.writeText(data.recoveryLink);
        toast.success("Lien de réinitialisation généré et copié dans le presse-papier !");
      } else {
        toast.success("Email de réinitialisation envoyé.");
      }
    },
    onError: (err: any) => toast.error(err.message)
  });

  // 6. Mutation pour supprimer un utilisateur
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-user-actions', {
        body: { action: 'DELETE_USER', targetUserId: userId }
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Utilisateur supprimé définitivement.");
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      setUserToDelete(null);
      setDeleteConfirmationInput("");
    },
    onError: (err: any) => toast.error(err.message)
  });

  // 7. Mutation pour créer un membre du staff
  const createStaffMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-user-actions', {
        body: {
          action: 'CREATE_STAFF_USER',
          targetUserId: 'new',
          data: {
            email: newStaffData.email,
            fullName: newStaffData.fullName,
            phone: newStaffData.phone || null,
            password: newStaffData.password || undefined,
            role: newStaffData.role,
            courseIds: newStaffData.courseIds
          }
        }
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      return data;
    },
    onSuccess: (res) => {
      toast.success("Nouveau membre du staff créé !");
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      setCreatedStaffResult({
        email: newStaffData.email,
        pass: res?.initialPassword || newStaffData.password,
        link: res?.resetLink
      });
      setNewStaffData({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        role: "teacher",
        courseIds: []
      });
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Calcul des statistiques
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const teachers = users.filter(u => u.role === 'teacher').length;
    const receptionists = users.filter(u => u.role === 'receptionist').length;
    const students = users.filter(u => u.role === 'student').length;
    const suspended = users.filter(u => u.banned_until && new Date(u.banned_until) > new Date()).length;
    return { total, admins, teachers, receptionists, students, suspended };
  }, [users]);

  // Filtrage des utilisateurs
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const search = searchTerm.toLowerCase();
      const matchSearch = 
        (u.full_name && u.full_name.toLowerCase().includes(search)) ||
        (u.email && u.email.toLowerCase().includes(search)) ||
        (u.matricule && u.matricule.toLowerCase().includes(search)) ||
        (u.phone && u.phone.includes(search));

      if (!matchSearch) return false;

      if (roleFilter !== "all" && u.role !== roleFilter) return false;

      const isSuspended = u.banned_until && new Date(u.banned_until) > new Date();
      if (statusFilter === "active" && isSuspended) return false;
      if (statusFilter === "suspended" && !isSuspended) return false;

      return true;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleOpenEditRole = (u: AdminUser) => {
    setEditingUser(u);
    setSelectedRole(u.role);
    setSelectedCourseIds(u.assigned_courses?.map(c => c.id) || []);
  };

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const handleToggleNewStaffCourse = (courseId: string) => {
    setNewStaffData(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId) 
        ? prev.courseIds.filter(id => id !== courseId) 
        : [...prev.courseIds, courseId]
    }));
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Administrateur</Badge>;
      case 'teacher':
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Formateur</Badge>;
      case 'receptionist':
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1.5"><Headphones className="w-3.5 h-3.5" /> Réceptionniste</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1.5"><Users className="w-3.5 h-3.5 text-muted-foreground" /> Étudiant</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER AVEC TITRE ET ACTION CREATION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Gestion des Utilisateurs & Rôles
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Administration globale des accès, attributions pédagogiques et matrice de sécurité
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={() => {
              setCreatedStaffResult(null);
              setIsNewStaffOpen(true);
            }} 
            className="rounded-xl font-semibold gap-2 shadow-xs bg-primary hover:bg-primary/90"
          >
            <UserPlus className="w-4 h-4" />
            Nouveau Membre Staff
          </Button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-card p-4 rounded-xl border border-border/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Comptes</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{stats.total}</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-purple-500/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-xs font-medium">Admins</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.admins}</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-emerald-500/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-medium">Formateurs</span>
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.teachers}</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-blue-500/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-medium">Réception</span>
            <Headphones className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.receptionists}</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Étudiants</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{stats.students}</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-destructive/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-destructive">
            <span className="text-xs font-medium">Suspendus</span>
            <Ban className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-destructive">{stats.suspended}</div>
        </div>
      </div>

      {/* ONGLETS PRINCIPAUX */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="accounts" className="rounded-lg text-xs font-semibold gap-2">
            <Users className="w-3.5 h-3.5" />
            Annuaire des Comptes ({filteredUsers.length})
          </TabsTrigger>
          <TabsTrigger value="matrix" className="rounded-lg text-xs font-semibold gap-2">
            <Layers className="w-3.5 h-3.5" />
            Matrice des Permissions & Rôles
          </TabsTrigger>
        </TabsList>

        {/* ONGLET 1 : ANNUAIRE */}
        <TabsContent value="accounts" className="space-y-4 outline-none">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border/60">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Rechercher nom, email, matricule..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9 text-xs w-full sm:w-36 rounded-lg">
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tous les Rôles</SelectItem>
                  <SelectItem value="admin">Administrateurs</SelectItem>
                  <SelectItem value="teacher">Formateurs</SelectItem>
                  <SelectItem value="receptionist">Réceptionnistes</SelectItem>
                  <SelectItem value="student">Étudiants</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs w-full sm:w-36 rounded-lg">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tous les Statuts</SelectItem>
                  <SelectItem value="active">Actifs uniquement</SelectItem>
                  <SelectItem value="suspended">Suspendus uniquement</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setSearchTerm(""); setRoleFilter("all"); setStatusFilter("all"); }}
                className="h-9 px-2 text-xs rounded-lg text-muted-foreground"
              >
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* TABLEAU DES UTILISATEURS */}
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Email & Contact</th>
                    <th className="py-3 px-4">Rôle</th>
                    <th className="py-3 px-4">Formations Liées</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Inscription</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        Chargement des utilisateurs en cours...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        Aucun utilisateur ne correspond à vos critères.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSuspended = u.banned_until && new Date(u.banned_until) > new Date();
                      const isSelf = u.id === currentUser?.id;

                      return (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9 border border-border/80">
                                <AvatarImage src={u.avatar_url || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                  {u.full_name?.charAt(0) || u.email?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-foreground flex items-center gap-1.5">
                                  {u.full_name || "Sans Nom"}
                                  {isSelf && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-primary/5 text-primary border-primary/20">
                                      Vous
                                    </Badge>
                                  )}
                                </div>
                                {u.matricule && (
                                  <div className="text-[11px] text-muted-foreground font-mono">
                                    {u.matricule}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <div className="font-medium text-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="truncate max-w-[190px]">{u.email || "Non renseigné"}</span>
                              </div>
                              {u.phone && (
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                                  <span>{u.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {getRoleBadge(u.role)}
                          </td>

                          <td className="py-3 px-4">
                            {u.role === 'teacher' ? (
                              <div className="space-y-1">
                                {u.assigned_courses && u.assigned_courses.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 max-w-xs">
                                    {u.assigned_courses.map(c => (
                                      <Badge key={c.id} variant="secondary" className="text-[10px] py-0 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        <BookOpen className="w-2.5 h-2.5 mr-1" />
                                        {c.title}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-amber-500 italic flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Aucun cours assigné
                                  </span>
                                )}
                              </div>
                            ) : u.role === 'student' ? (
                              <span className="text-muted-foreground font-medium">
                                {u.courses_enrolled_count || 0} formation(s) suivie(s)
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Accès global plateforme</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {isSuspended ? (
                              <Badge variant="destructive" className="gap-1 text-[11px]">
                                <Ban className="w-3 h-3" /> Suspendu
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 text-[11px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                                <CheckCircle2 className="w-3 h-3" /> Actif
                              </Badge>
                            )}
                          </td>

                          <td className="py-3 px-4 text-muted-foreground">
                            <div>{new Date(u.created_at).toLocaleDateString('fr-FR')}</div>
                            <div className="text-[10px] opacity-70">
                              {u.last_sign_in_at ? `Connecté le ${new Date(u.last_sign_in_at).toLocaleDateString('fr-FR')}` : "Jamais connecté"}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-lg border-border/80">
                                <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground px-2 py-1.5">
                                  Actions Utilisateur
                                </DropdownMenuLabel>
                                
                                <DropdownMenuItem 
                                  onClick={() => handleOpenEditRole(u)}
                                  className="gap-2 text-xs font-medium cursor-pointer"
                                >
                                  <Shield className="w-4 h-4 text-primary" /> Modifier Rôle & Formations
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                  onClick={() => sendRecoveryMutation.mutate(u.id)}
                                  className="gap-2 text-xs font-medium cursor-pointer"
                                >
                                  <KeyRound className="w-4 h-4 text-amber-500" /> Réinitialiser Mot de passe
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {!isSelf && (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={() => toggleSuspendMutation.mutate({ userId: u.id, isSuspended: !!isSuspended })}
                                      className={isSuspended ? "gap-2 text-xs font-medium text-emerald-600 cursor-pointer" : "gap-2 text-xs font-medium text-amber-600 cursor-pointer"}
                                    >
                                      {isSuspended ? (
                                        <>
                                          <RotateCcw className="w-4 h-4" /> Réactiver le Compte
                                        </>
                                      ) : (
                                        <>
                                          <Ban className="w-4 h-4" /> Suspendre l'Accès
                                        </>
                                      )}
                                    </DropdownMenuItem>

                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setUserToDelete(u);
                                        setDeleteConfirmationInput("");
                                      }}
                                      className="gap-2 text-xs font-medium text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                                    >
                                      <Trash2 className="w-4 h-4" /> Supprimer Définitivement
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ONGLET 2 : MATRICE */}
        <TabsContent value="matrix" className="space-y-4 outline-none">
          <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Gouvernance & Matrice des Permissions</h2>
              <p className="text-xs text-muted-foreground">
                Visualisation claire et étanche des droits accordés à chaque profil au sein du système Botes Academy
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-border/60 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-muted/60 text-foreground font-bold border-b border-border/60">
                    <th className="py-3 px-4">Domaine & Fonctionnalité</th>
                    <th className="py-3 px-4 text-center text-purple-600 dark:text-purple-400">Administrateur</th>
                    <th className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400">Formateur</th>
                    <th className="py-3 px-4 text-center text-blue-600 dark:text-blue-400">Réceptionniste</th>
                    <th className="py-3 px-4 text-center text-muted-foreground">Étudiant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-foreground">Feuille d'Appel & Présences journalières</td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> (Ses cours uniquement)</td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-foreground">Export Rapports PDF de Présence (Officiel)</td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-foreground">Encaissement, Dettes & Validation Paiements</td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-rose-500 mx-auto" /> <span className="text-[10px] text-muted-foreground">Étanche</span></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-foreground">Comptabilité, Revenus & Bénéfices</td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-rose-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-rose-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-foreground">Inscription Manuelle d'Étudiant</td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-rose-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-foreground">Gestion des Rôles & Comptes Staff</td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-rose-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-rose-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-foreground">Accès aux Vidéos & Contenus Pédagogiques</td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> (Ses cours assignés)</td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> (Si inscrit)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-foreground">Intervention sur le Chat & Forum du Cours</td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> (Badge Formateur Certifié)</td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODALE 1 : MODIFIER ROLE ET COURS */}
      <Dialog open={!!editingUser} onOpenChange={(val) => !val && setEditingUser(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              Modifier le Rôle & Affectations
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mise à jour des privilèges système pour <strong>{editingUser?.full_name || editingUser?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Rôle Système</Label>
              <Select 
                value={selectedRole} 
                onValueChange={(val: any) => setSelectedRole(val)}
                disabled={editingUser?.id === currentUser?.id}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="student">Étudiant (Apprenant standard)</SelectItem>
                  <SelectItem value="teacher">Formateur (Pédagogie & Présences)</SelectItem>
                  <SelectItem value="receptionist">Réceptionniste (Accueil & Encaissement)</SelectItem>
                  <SelectItem value="admin">Administrateur (Contrôle total)</SelectItem>
                </SelectContent>
              </Select>
              {editingUser?.id === currentUser?.id && (
                <p className="text-[11px] text-amber-500 italic">
                  Vous ne pouvez pas modifier votre propre rôle administrateur.
                </p>
              )}
            </div>

            {selectedRole === 'teacher' && (
              <div className="space-y-2.5 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                    Formations Assignées
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedCourseIds.length} sélectionnée(s)
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 border border-border/60 p-3 rounded-xl bg-muted/20">
                  {courses.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-2">Aucun cours trouvé.</div>
                  ) : (
                    courses.map(course => (
                      <label 
                        key={course.id}
                        className="flex items-center gap-2.5 text-xs p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors"
                      >
                        <Checkbox 
                          checked={selectedCourseIds.includes(course.id)}
                          onCheckedChange={() => handleToggleCourse(course.id)}
                        />
                        <span className="font-medium text-foreground">{course.title}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Le formateur aura accès uniquement aux feuilles d'appel et aux étudiants de ces cours.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditingUser(null)} className="rounded-xl">
              Annuler
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                if (editingUser) {
                  updateRoleMutation.mutate({
                    userId: editingUser.id,
                    role: selectedRole,
                    courseIds: selectedCourseIds
                  });
                }
              }}
              disabled={updateRoleMutation.isPending}
              className="rounded-xl font-semibold bg-primary hover:bg-primary/90"
            >
              {updateRoleMutation.isPending ? "Enregistrement..." : "Enregistrer les Modifications"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODALE 2 : NOUVEAU MEMBRE STAFF */}
      <Dialog open={isNewStaffOpen} onOpenChange={setIsNewStaffOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5 text-primary" />
              Créer un Membre du Staff
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ajout d'un formateur, réceptionniste ou administrateur avec accès sécurisé.
            </DialogDescription>
          </DialogHeader>

          {createdStaffResult ? (
            <div className="space-y-4 py-3">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Compte créé avec succès !
                </div>
                <p className="text-xs text-muted-foreground">
                  Transmettez ces identifiants provisoires au collaborateur :
                </p>
                <div className="bg-background/80 p-2.5 rounded-lg border border-border/60 text-xs space-y-1 font-mono">
                  <div><strong>Email :</strong> {createdStaffResult.email}</div>
                  <div><strong>Mot de passe :</strong> {createdStaffResult.pass}</div>
                </div>
              </div>

              {createdStaffResult.link && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Lien d'activation directe (Magic Link) :</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      readOnly 
                      value={createdStaffResult.link} 
                      className="text-[11px] h-9 rounded-lg font-mono bg-muted/40"
                    />
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-9 px-3 shrink-0 rounded-lg"
                      onClick={() => {
                        navigator.clipboard.writeText(createdStaffResult.link!);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button 
                  className="w-full rounded-xl" 
                  onClick={() => {
                    setCreatedStaffResult(null);
                    setIsNewStaffOpen(false);
                  }}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nom Complet *</Label>
                <Input 
                  placeholder="Ex: Professeur Jean-Paul"
                  value={newStaffData.fullName}
                  onChange={(e) => setNewStaffData({ ...newStaffData, fullName: e.target.value })}
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email Professionnel *</Label>
                <Input 
                  type="email"
                  placeholder="Ex: jeanpaul@botes.academy"
                  value={newStaffData.email}
                  onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Téléphone</Label>
                  <Input 
                    placeholder="+243..."
                    value={newStaffData.phone}
                    onChange={(e) => setNewStaffData({ ...newStaffData, phone: e.target.value })}
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Rôle Attribué *</Label>
                  <Select 
                    value={newStaffData.role} 
                    onValueChange={(val: any) => setNewStaffData({ ...newStaffData, role: val })}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="teacher">Formateur</SelectItem>
                      <SelectItem value="receptionist">Réceptionniste</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Mot de passe provisoire (optionnel)</Label>
                <Input 
                  type="password"
                  placeholder="Laisser vide pour mot de passe auto"
                  value={newStaffData.password}
                  onChange={(e) => setNewStaffData({ ...newStaffData, password: e.target.value })}
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              {newStaffData.role === 'teacher' && (
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> Formations à assigner
                  </Label>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 border border-border/60 p-2.5 rounded-xl bg-muted/20">
                    {courses.map(course => (
                      <label key={course.id} className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox 
                          checked={newStaffData.courseIds.includes(course.id)}
                          onCheckedChange={() => handleToggleNewStaffCourse(course.id)}
                        />
                        <span className="truncate">{course.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="pt-3">
                <Button variant="outline" size="sm" onClick={() => setIsNewStaffOpen(false)} className="rounded-xl">
                  Annuler
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => createStaffMutation.mutate()}
                  disabled={!newStaffData.fullName || !newStaffData.email || createStaffMutation.isPending}
                  className="rounded-xl font-semibold bg-primary hover:bg-primary/90"
                >
                  {createStaffMutation.isPending ? "Création en cours..." : "Créer le Compte Staff"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODALE 3 : CONFIRMATION DE SUPPRESSION */}
      <Dialog open={!!userToDelete} onOpenChange={(val) => !val && setUserToDelete(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 border-destructive/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Supprimer Définitivement l'Utilisateur
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cette action est <strong>irréversible</strong>. Le compte auth, le profil et tous les droits associés à <strong>{userToDelete?.full_name || userToDelete?.email}</strong> seront détruits.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Pour confirmer la destruction définitive, tapez <strong className="text-foreground">SUPPRIMER</strong> ci-dessous :
            </p>
            <Input 
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              placeholder="SUPPRIMER"
              className="h-9 text-xs rounded-lg border-destructive/40 focus-visible:ring-destructive"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setUserToDelete(null)} className="rounded-xl">
              Annuler
            </Button>
            <Button 
              variant="destructive"
              size="sm" 
              onClick={() => {
                if (userToDelete) {
                  deleteUserMutation.mutate(userToDelete.id);
                }
              }}
              disabled={deleteConfirmationInput !== "SUPPRIMER" || deleteUserMutation.isPending}
              className="rounded-xl font-semibold"
            >
              {deleteUserMutation.isPending ? "Suppression..." : "Confirmer la Suppression"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


