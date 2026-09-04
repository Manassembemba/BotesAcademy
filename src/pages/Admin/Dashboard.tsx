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
  Wallet,
  CheckCircle2
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

    // Sum installments paid today
    const { data: installments } = await supabase
      .from('payment_installments')
      .select('amount')
      .gte('created_at', todayStart.toISOString());

    // Sum approved direct proofs from today
    const { data: approvedProofs } = await supabase
      .from('payment_proofs')
      .select('amount')
      .eq('status', 'approved')
      .gte('validated_at', todayStart.toISOString());

    const instTotal = installments?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;
    const proofTotal = approvedProofs?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;
    todayRevenue = Math.max(instTotal, proofTotal, (instTotal + proofTotal > 0 ? instTotal : 0));
    if (todayRevenue === 0 && proofTotal > 0) todayRevenue = proofTotal;
  }

  let pendingPayments = 0;
  if (role === 'admin' || role === 'receptionist') {
    const { count } = await supabase.from('payment_proofs').select('id', { count: 'exact' }).eq('status', 'pending');
    pendingPayments = count || 0;
  }

  // Today attendance
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: todayAttendance } = await supabase
    .from('attendance' as any)
    .select('status')
    .eq('date', todayStr);

  let attendanceRateToday = 100;
  if (todayAttendance && todayAttendance.length > 0) {
    const present = todayAttendance.filter((a: any) => a.status === 'present').length;
    const late = todayAttendance.filter((a: any) => a.status === 'late').length;
    attendanceRateToday = Math.round(((present + late * 0.5) / todayAttendance.length) * 100);
  }

  return { courseCount, userCount, todayRevenue, pendingPayments, attendanceRateToday, todayAttendanceCount: todayAttendance?.length || 0 };
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

  const commandCenterItems = isTeacher ? [
    { title: "Feuille de Présence", desc: "Pointage Matin / Midi / Soir", icon: Clock, path: "/admin/attendance", color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { title: "Mes Formations", desc: "Catalogue & Programmes assignés", icon: BookOpen, path: "/admin/formations", color: "text-blue-600", bg: "bg-blue-500/10", count: stats?.courseCount },
    { title: "Mes Étudiants", desc: "Profils & Progression académique", icon: Users, path: "/admin/students", color: "text-indigo-600", bg: "bg-indigo-500/10", count: stats?.userCount },
    { title: "Annonces & Devoirs", desc: "Communications aux apprenants", icon: Bell, path: "/admin/announcements", color: "text-teal-600", bg: "bg-teal-500/10" },
  ] : [
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
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8 pb-16">
      {/* HEADER STRATÉGIQUE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            {isTeacher ? "Espace Formateur Actif" : "Système Opérationnel"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {isTeacher ? "Tableau de Bord Pédagogique" : "Tableau de Bord Administrateur"}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {isTeacher 
              ? "Pilotage des classes, assiduité et progression académique de vos apprenants."
              : "Pilotage pédagogique, financier et académique de Botes Academy."
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isTeacher ? (
            <Link to="/admin/attendance">
              <Button size="sm" className="h-10 px-4 rounded-xl font-semibold text-xs gap-2 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                <Clock className="w-4 h-4" /> Faire l'Appel du Jour
              </Button>
            </Link>
          ) : (
            <Link to="/admin/formations/new">
              <Button size="sm" className="h-10 px-4 rounded-xl font-semibold text-xs gap-2 shadow-xs">
                <PlusCircle className="w-4 h-4" /> Nouvelle Formation
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI TOP BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-border/50 bg-card p-5 shadow-xs hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{isTeacher ? "Mes Formations" : "Cursus Actifs"}</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">{stats?.courseCount || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-border/50 bg-card p-5 shadow-xs hover:border-blue-500/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{isTeacher ? "Mes Apprenants" : "Étudiants Inscrits"}</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">{stats?.userCount || 0}</p>
            </div>
          </div>
        </Card>

        {isTeacher ? (
          <>
            <Card className="rounded-2xl border border-border/50 bg-card p-5 shadow-xs hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-600">Assiduité Aujourd'hui</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{stats?.attendanceRateToday || 100}%</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-border/50 bg-card p-5 shadow-xs hover:border-teal-500/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Séances Pointées</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{stats?.todayAttendanceCount || 0}</p>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            {(isAdmin || role === 'receptionist') && (
              <Card className="rounded-2xl border border-border/50 bg-card p-5 shadow-xs hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-600">Encaissé Aujourd'hui</p>
                    <p className="text-2xl font-bold tracking-tight text-foreground">${stats?.todayRevenue || 0}</p>
                  </div>
                </div>
              </Card>
            )}

            <Card className={cn(
              "rounded-2xl border border-border/50 bg-card p-5 shadow-xs hover:border-orange-500/30 transition-colors",
              stats?.pendingPayments ? "border-orange-500/40 bg-orange-500/5 ring-1 ring-orange-500/20" : ""
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  stats?.pendingPayments ? "bg-orange-500 text-white shadow-xs animate-pulse" : "bg-orange-500/10 text-orange-600"
                )}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Paiements à Valider</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{stats?.pendingPayments || 0}</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* TERMINAL DE PILOTAGE */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground tracking-tight">
          {isTeacher ? "Modules Formateur" : "Terminal de Pilotage"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {commandCenterItems.filter(item => !(item as any).adminOnly || isAdmin).map((item, idx) => (
            <Link key={idx} to={item.path} className="group">
              <Card className={cn(
                "h-full rounded-2xl border border-border/50 bg-card/60 p-4 sm:p-5 transition-all duration-200 hover:border-primary/40 hover:bg-card hover:shadow-xs",
                (item as any).alert && "border-orange-500/40 bg-orange-500/5"
              )}>
                <div className="flex flex-col h-full space-y-3">
                  <div className="flex justify-between items-start">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105", item.bg, item.color)}>
                      <item.icon className="w-4.5 h-4.5" />
                    </div>
                    {item.count !== undefined && (
                      <Badge className={cn(
                        "font-semibold px-2 py-0.5 rounded-md text-xs",
                        (item as any).alert ? "bg-orange-500 text-white animate-bounce" : "bg-muted text-muted-foreground"
                      )}>
                        {item.count}
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">{item.desc}</p>
                  </div>

                  <div className="mt-auto pt-2 flex items-center justify-between text-primary text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Accéder au module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* OPERATIONS CRITIQUES (Admin uniquement) */}
      {!isTeacher && (
        stats?.pendingPayments ? (
          <div className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shrink-0 animate-pulse">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Vérification de Paiements en Attente</h3>
                <p className="text-xs text-muted-foreground">
                  Vous avez <span className="text-orange-600 font-bold">{stats.pendingPayments} reçu(s)</span> à vérifier pour activer les accès étudiants.
                </p>
              </div>
            </div>
            <Link to="/admin/payments" className="w-full sm:w-auto shrink-0">
              <Button size="sm" className="w-full sm:w-auto h-10 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-xs">
                Valider les reçus
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 text-muted-foreground text-xs font-medium gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Tous les paiements et flux administratifs sont à jour.</span>
          </div>
        )
      )}
    </div>
  );
};

export default AdminDashboard;
