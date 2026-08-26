import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  BookOpen,
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Award,
  Package,
  Mail,
  Clock,
  LayoutDashboard,
  Target,
  Zap,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Calendar,
  Settings,
  Bell,
  Wallet
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const fetchStats = async (role: string, userId: string) => {
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';

  let courseQuery = supabase.from('courses').select('id', { count: 'exact' });
  let userQuery = supabase.from('profiles').select('id', { count: 'exact' });
  
  if (isTeacher) {
    const { data: assignments } = await supabase
      .from('course_teachers')
      .select('course_id')
      .eq('teacher_id', userId);
    const courseIds = assignments?.map(a => a.course_id) || [];
    courseQuery = courseQuery.in('id', courseIds);
    const { data: studentIds } = await supabase.from('purchases').select('user_id').in('course_id', courseIds);
    const uniqueStudentIds = Array.from(new Set(studentIds?.map(s => s.user_id) || []));
    userQuery = userQuery.in('id', uniqueStudentIds);
  }

  const { count: courseCount } = await courseQuery;
  const { count: userCount } = await userQuery;

  let todayRevenue = 0;
  if (isAdmin || role === 'receptionist') {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: installments } = await supabase
      .from('payment_installments')
      .select('amount')
      .gte('created_at', todayStart.toISOString());
    todayRevenue = installments?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;
  }

  let pendingPayments = 0;
  if (role === 'admin' || role === 'receptionist') {
    const { count } = await supabase.from('payment_proofs').select('id', { count: 'exact' }).eq('status', 'pending');
    pendingPayments = count || 0;
  }

  return { courseCount, userCount, todayRevenue, pendingPayments };
};

const AdminDashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-stats', role, user?.id],
    queryFn: () => fetchStats(role || '', user?.id || ''),
  });

  const commandCenterItems = [
    { title: "Nouvelle Inscription", desc: "Admission étudiant & tranches", icon: Users, path: "/admin/enrollment", color: "text-primary", bg: "bg-primary/10" },
    { title: "Feuille de Présence", desc: "Pointage Matin / Midi / Soir", icon: Clock, path: "/admin/attendance", color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { title: "Paiements & Tranches", desc: "Suivi des dettes & relances", icon: CreditCard, path: "/admin/debts", color: "text-amber-600", bg: "bg-amber-500/10" },
    { title: "Formations & Cours", desc: "Catalogue & Programmes", icon: BookOpen, path: "/admin/formations", color: "text-blue-600", bg: "bg-blue-500/10", count: stats?.courseCount },
    { title: "Gestion Étudiants", desc: "Profils & Dossiers scolaires", icon: Users, path: "/admin/students", color: "text-indigo-600", bg: "bg-indigo-500/10", count: stats?.userCount },
    { title: "Validation Paiements", desc: "Preuves et bordereaux", icon: Wallet, path: "/admin/payments", color: "text-orange-500", bg: "bg-orange-500/10", count: stats?.pendingPayments, alert: !!stats?.pendingPayments },
    { title: "Comptabilité & Caisse", desc: "Recettes, flux & analytique", icon: BarChart3, path: "/admin/accounting", color: "text-purple-600", bg: "bg-purple-500/10", adminOnly: true },
    { title: "Boutique & Marketplace", desc: "Outils de trading & licences", icon: Package, path: "/admin/tools", color: "text-pink-600", bg: "bg-pink-500/10", adminOnly: true },
    { title: "Annonces & Infos", desc: "Communications aux élèves", icon: Bell, path: "/admin/announcements", color: "text-teal-600", bg: "bg-teal-500/10" },
    { title: "Paramètres", desc: "Configuration du système", icon: Settings, path: "/admin/settings", color: "text-slate-600", bg: "bg-slate-500/10", adminOnly: true },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-12 pb-20">
      {/* HEADER STRATÉGIQUE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-[0.4em] px-4 py-1.5 rounded-full italic">Statut Opérationnel : Optimal</Badge>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
            TABLEAU DE BORD <span className="text-primary">ADMIN</span>
          </h1>
          <p className="text-muted-foreground font-medium text-sm md:text-lg italic opacity-60">Pilotage pédagogique et financier de Botes Academy.</p>
        </div>
        <div className="flex items-center gap-4">
            <Link to="/admin/formations/new">
                <Button className="h-16 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-glow-primary group overflow-hidden relative border-2 border-white/10">
                    <span className="relative z-10 flex items-center gap-3"><PlusCircle className="w-5 h-5" /> Nouvelle Formation</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
            </Link>
        </div>
      </div>

      {/* KPI TOP BAR [PLATINUM] */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[2.5rem] border-white/5 bg-card/40 backdrop-blur-md shadow-2xl overflow-hidden group hover:border-primary/30 transition-all duration-500">
            <CardContent className="p-8 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-glow-primary transition-transform group-hover:rotate-12">
                    <BookOpen className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Cursus Actifs</p>
                    <p className="text-4xl font-black italic tracking-tighter">{stats?.courseCount || 0}</p>
                </div>
            </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-white/5 bg-card/40 backdrop-blur-md shadow-2xl overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
            <CardContent className="p-8 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-glow-blue transition-transform group-hover:rotate-12">
                    <Users className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Population</p>
                    <p className="text-4xl font-black italic tracking-tighter">{stats?.userCount || 0}</p>
                </div>
            </CardContent>
        </Card>

        {(isAdmin || role === 'receptionist') && (
            <Card className="rounded-[2.5rem] border-white/5 bg-card/40 backdrop-blur-md shadow-2xl overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
                <CardContent className="p-8 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-glow-emerald transition-transform group-hover:rotate-12">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">
                          Encaissé Aujourd'hui
                        </p>
                        <p className="text-4xl font-black italic tracking-tighter text-foreground">${stats?.todayRevenue || 0}</p>
                    </div>
                </CardContent>
            </Card>
        )}

        <Card className={cn(
            "rounded-[2.5rem] border-white/5 bg-card/40 backdrop-blur-md shadow-2xl overflow-hidden group hover:border-orange-500/30 transition-all duration-500",
            stats?.pendingPayments ? "ring-2 ring-orange-500/50 animate-glow" : ""
        )}>
            <CardContent className="p-8 flex items-center gap-6">
                <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center text-white transition-transform group-hover:rotate-12 shadow-glow-orange",
                    stats?.pendingPayments ? "bg-orange-500 animate-pulse" : "bg-orange-500/40"
                )}>
                    <CreditCard className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Alertes Flux</p>
                    <p className="text-4xl font-black italic tracking-tighter">{stats?.pendingPayments || 0}</p>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* BENTO COMMAND GRID */}
      <div className="space-y-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic ml-4">Terminal de Pilotage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {commandCenterItems.filter(item => !item.adminOnly || isAdmin).map((item, idx) => (
                <Link key={idx} to={item.path} className="group relative perspective-1000">
                    <Card className={cn(
                        "h-full rounded-[2.5rem] border-white/5 bg-card/60 backdrop-blur-xl p-8 transition-all duration-500 overflow-hidden preserve-3d group-hover:rotate-y-1 group-hover:border-primary/40 shadow-xl",
                        item.alert && "border-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.1)]"
                    )}>
                        {/* Background Patterns */}
                        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px:16px] pointer-events-none" />
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />

                        <div className="relative z-10 flex flex-col h-full space-y-6">
                            <div className="flex justify-between items-start">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110", item.bg, item.color)}>
                                    <item.icon className="w-7 h-7" />
                                </div>
                                {item.count !== undefined && (
                                    <Badge className={cn(
                                        "font-black italic px-3 py-1 rounded-lg text-lg tracking-tighter shadow-2xl",
                                        item.alert ? "bg-orange-500 text-white animate-bounce" : "bg-white/5 text-foreground"
                                    )}>
                                        {item.count}
                                    </Badge>
                                )}
                            </div>
                            
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight italic leading-none mb-2">{item.title}</h3>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{item.desc}</p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center justify-between text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Ouvrir le module</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
      </div>

      {/* OPERATIONS CRITIQUES */}
      {stats?.pendingPayments ? (
        <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="bg-orange-500/10 border-2 border-orange-500/20 p-8 rounded-[3rem] backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-orange-500/10">
                <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center text-white shadow-glow-orange animate-pulse">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Opérations en Attente</h3>
                        <p className="text-muted-foreground font-medium italic">Vous avez <span className="text-orange-500 font-black">{stats.pendingPayments} paiements</span> à valider pour débloquer l'accès aux élèves.</p>
                    </div>
                </div>
                <Link to="/admin/payments" className="w-full md:w-auto">
                    <Button size="xl" className="w-full md:w-auto h-16 px-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-[11px] shadow-glow-orange border-2 border-white/10">
                        Accéder au Terminal de Validation
                    </Button>
                </Link>
            </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 opacity-40 grayscale pointer-events-none italic">
            <ShieldCheck className="w-5 h-5 mr-3 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Système de flux stabilisé. Aucune action critique requise.</span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
