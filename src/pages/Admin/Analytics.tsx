import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingDown, Timer, Target, Users, AlertTriangle, CheckCircle } from "lucide-react";

const Analytics = () => {
  // 1. Churn Data
  const { data: churnData, isLoading: loadingChurn } = useQuery({
    queryKey: ["kpi-churn"],
    queryFn: async () => {
      const { data, error } = await supabase.from("v_kpi_student_churn").select("*");
      if (error) throw error;
      return data;
    },
  });

  // 2. Completion Data
  const { data: completionData, isLoading: loadingCompletion } = useQuery({
    queryKey: ["kpi-completion"],
    queryFn: async () => {
      const { data, error } = await supabase.from("v_kpi_course_completion_time").select("*");
      if (error) throw error;
      return data;
    },
  });

  // 3. Marketing Data
  const { data: marketingData, isLoading: loadingMarketing } = useQuery({
    queryKey: ["kpi-marketing"],
    queryFn: async () => {
      const { data, error } = await supabase.from("v_kpi_marketing_sources").select("*");
      if (error) throw error;
      return data;
    },
  });

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-20 max-w-7xl">
      {/* HEADER UNIFIÉ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
            <Target className="w-3 h-3" /> Pilotage Stratégique
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Analytics & Indicateurs Clés
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Mesurez la performance, le taux d'assiduité et la santé globale de votre académie.
          </p>
        </div>
      </div>

      {/* KPI STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-xs hover:border-destructive/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Taux de Décrochage</p>
              <div className="text-2xl font-bold tracking-tight text-destructive">
                {churnData ? ((churnData.filter(d => d.is_churned).length / (churnData.length || 1)) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">Inactifs +30j en cours</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-xs hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Délai Moyen de Fin</p>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {completionData && completionData.length > 0 ? (completionData.reduce((acc, curr) => acc + curr.avg_days_to_complete, 0) / completionData.length).toFixed(0) : 0} jours
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">Pour finaliser un cursus</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-xs hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Diplômés Certifiés</p>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {completionData?.reduce((acc, curr) => acc + curr.total_graduates, 0) || 0}
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">Étudiants complétés à 100%</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique Marketing */}
        <Card className="rounded-2xl border border-border/50 bg-card shadow-xs overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold">Efficacité Marketing</CardTitle>
            <CardDescription className="text-xs">Revenus générés par canal et source d'acquisition.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="registration_source" axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted)/0.3)'}}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.75rem',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="total_revenue" radius={[6, 6, 0, 0]}>
                    {marketingData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Liste Alerte Churn */}
        <Card className="rounded-2xl border border-border/50 bg-card shadow-xs overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <CardTitle className="text-base font-semibold text-destructive">Alertes Décrochage</CardTitle>
            </div>
            <CardDescription className="text-xs">Étudiants inactifs depuis plus de 30 jours consécutifs.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-border/40 bg-muted/20">
                        <TableHead className="font-semibold text-xs pl-6">Étudiant</TableHead>
                        <TableHead className="font-semibold text-xs">Cours</TableHead>
                        <TableHead className="font-semibold text-xs">Progression</TableHead>
                        <TableHead className="font-semibold text-xs pr-6 text-right">Dernier accès</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {churnData?.filter(d => d.is_churned).length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-xs italic">Aucune alerte de décrochage détectée.</TableCell>
                        </TableRow>
                    ) : (
                        churnData?.filter(d => d.is_churned).map((s) => (
                            <TableRow key={s.user_id} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="pl-6 font-medium text-xs text-foreground">{s.full_name}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{s.course_title}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-destructive" style={{ width: `${s.progress * 100}%` }} />
                                        </div>
                                        <span className="text-[11px] font-semibold">{(s.progress * 100).toFixed(0)}%</span>
                                    </div>
                                </TableCell>
                                <TableCell className="pr-6 text-right text-xs text-muted-foreground">
                                    {s.last_lesson_at ? new Date(s.last_lesson_at).toLocaleDateString() : 'Jamais'}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
