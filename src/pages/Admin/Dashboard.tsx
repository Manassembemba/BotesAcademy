import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  BookOpen, 
  Users, 
  Trash2, 
  Loader2, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  Award,
  Package,
  ArrowUpRight,
  Mail,
  Settings,
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

const fetchCourses = async () => {
  const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const fetchStats = async () => {
  const { count: courseCount } = await supabase.from('courses').select('id', { count: 'exact' });
  const { count: userCount } = await supabase.from('profiles').select('id', { count: 'exact' });
  
  const { count: strategyCount } = await supabase.from('strategies').select('id', { count: 'exact' });
  const { count: indicatorCount } = await supabase.from('indicators').select('id', { count: 'exact' });
  const toolCount = (strategyCount || 0) + (indicatorCount || 0);

  // Revenus Totaux
  const { data: payments } = await supabase
    .from('payment_proofs')
    .select('amount')
    .eq('status', 'approved');

  const totalRevenue = payments?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

  // Paiements en attente
  const { count: pendingPayments } = await supabase
    .from('payment_proofs')
    .select('id', { count: 'exact' })
    .eq('status', 'pending');

  // Nouveaux inscrits sur les 7 derniers jours
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { count: recentUsers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .gte('created_at', sevenDaysAgo.toISOString());

  return { courseCount, userCount, totalRevenue, pendingPayments, toolCount, recentUsers };
};

const fetchPopularCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select('title, category, price, id')
    .limit(5);
  if (error) throw error;
  return data;
};

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  const { data: courses, isLoading: isLoadingCourses, error: coursesError } = useQuery({
    queryKey: ['all-courses'],
    queryFn: fetchCourses,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchStats,
  });

  const { data: popularCourses } = useQuery({
    queryKey: ['admin-popular-courses'],
    queryFn: fetchPopularCourses,
  });

  const draftCoursesCount = courses?.filter(c => c.status === 'draft').length || 0;

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string, currentStatus: string }) => {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      const { error } = await supabase
        .from('courses')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      toast.success(`Formation ${newStatus === 'published' ? 'publiée 🚀' : 'mise en brouillon 📝'}`);
      queryClient.invalidateQueries({ queryKey: ['all-courses'] });
      queryClient.invalidateQueries({ queryKey: ['publishedCourses'] });
    },
    onError: (error: any) => toast.error(`Erreur: ${error.message}`),
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Formation supprimée avec succès.");
      queryClient.invalidateQueries({ queryKey: ['all-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
    onSettled: () => {
      setCourseToDelete(null);
    }
  });

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Tableau de bord Administrateur</h1>
        <div className="flex items-center gap-4">
          <Link to="/admin/formations/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Créer une formation
            </Button>
          </Link>
          <Link to="/admin/tools">
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Gérer le Marketplace
            </Button>
          </Link>
        </div>
      </div>

      {/* Draft Warning Alert */}
      {draftCoursesCount > 0 && (
        <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="font-black uppercase text-xs tracking-widest text-orange-600">Action Requise : Visibilité</p>
            <p className="text-sm font-medium text-orange-700/80">
              Vous avez <span className="font-black">{draftCoursesCount} formation(s)</span> en mode brouillon. Elles ne sont pas visibles pour les étudiants sur le catalogue public.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-orange-600 font-bold hover:bg-orange-500/10 rounded-xl" onClick={() => document.getElementById('courses-management')?.scrollIntoView({ behavior: 'smooth' })}>Voir les cours</Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.courseCount || 0}</p>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Formations</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.toolCount || 0}</p>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Outils Market</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{stats?.userCount || 0}</p>
                {stats?.recentUsers ? (
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-none mb-1 text-[10px] px-1.5 h-4">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    {stats.recentUsers} cette semaine
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Apprenants</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${stats?.totalRevenue || 0}</p>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Revenus Totaux</p>
            </div>
          </div>
        </Card>

        <Card className={`p-6 bg-gradient-to-br from-warning/10 to-transparent border-warning/20 ${stats?.pendingPayments ? 'animate-pulse' : ''}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.pendingPayments || 0}</p>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Paiements</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/payments" className="group">
            <Card className="p-4 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all text-center">
              <CreditCard className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="text-sm font-medium">Valider Paiements</p>
            </Card>
          </Link>
          <Link to="/admin/students" className="group">
            <Card className="p-4 border-dashed hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-center">
              <Mail className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              <p className="text-sm font-medium">Contacter Étudiants</p>
            </Card>
          </Link>
          <Link to="/admin/comments" className="group">
            <Card className="p-4 border-dashed hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-center">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-purple-500 transition-colors" />
              <p className="text-sm font-medium">Modérer les Avis</p>
            </Card>
          </Link>
          <Link to="/admin/settings" className="group">
            <Card className="p-4 border-dashed hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-center">
              <Settings className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
              <p className="text-sm font-medium">Paramètres Site</p>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-warning" />
              Impact & Popularité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularCourses?.map((course) => (
                <div key={course.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium truncate text-sm">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.category}</p>
                  </div>
                  <Badge variant="outline" className="ml-2 font-bold">${course.price}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Dernières Alertes</CardTitle>
            <CardDescription>Actions requises immédiatement.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.pendingPayments ? (
              <div className="flex items-center gap-4 p-4 bg-warning/5 border border-warning/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-warning" />
                <div className="flex-1">
                  <p className="font-bold">Paiements en attente</p>
                  <p className="text-sm text-muted-foreground">{stats.pendingPayments} nouvelles preuves à vérifier.</p>
                </div>
                <Link to="/admin/payments">
                  <Button size="sm" variant="outline" className="border-warning text-warning hover:bg-warning/10">Valider</Button>
                </Link>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4 italic">Aucune action urgente.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card id="courses-management">
        <CardHeader>
          <CardTitle>Gestion des Formations</CardTitle>
          <CardDescription>Créez, modifiez et gérez toutes les formations de Botes Academy.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCourses ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : coursesError ? (
            <p className="text-destructive">Erreur: {coursesError.message}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses?.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={course.status === 'published' ? 'default' : 'secondary'}
                        className={cn(
                          "uppercase font-black text-[9px] tracking-widest px-3",
                          course.status === 'published' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                        )}
                      >
                        {course.status === 'published' ? 'Publiée 🚀' : 'Brouillon 📝'}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{course.level}</TableCell>
                    <TableCell>{course.is_paid ? `$${course.price}` : 'Gratuit'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant={course.status === 'published' ? "outline" : "hero"} 
                        size="sm"
                        className={cn(
                          "font-bold text-[10px] uppercase tracking-widest h-8 px-3 transition-all",
                          course.status === 'published' ? "border-orange-500/50 text-orange-600 hover:bg-orange-500/10" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-glow-primary-sm"
                        )}
                        onClick={() => toggleStatusMutation.mutate({ id: course.id, currentStatus: course.status })}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {toggleStatusMutation.isPending && toggleStatusMutation.variables?.id === course.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          course.status === 'published' ? 'Dépublier' : 'Publier'
                        )}
                      </Button>
                      <Link to={`/admin/formations/${course.id}/edit`}>
                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase">Modifier</Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" onClick={() => setCourseToDelete(course.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer la formation ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. Toutes les données associées seront perdues.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => courseToDelete && deleteCourseMutation.mutate(courseToDelete)}
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
