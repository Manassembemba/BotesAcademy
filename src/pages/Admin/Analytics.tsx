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
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 italic">
          <Target className="w-10 h-10 text-primary" />
          ANALYTICS & KPI
        </h1>
        <p className="text-muted-foreground font-medium">Mesurez la performance et la santé de votre académie.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-destructive">Taux d'Atrophie (Churn)</CardTitle>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-destructive">
                {churnData ? ((churnData.filter(d => d.is_churned).length / churnData.length) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">Inactifs +30j (En cours)</p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Délai de Complétion</CardTitle>
            <Timer className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">
                {completionData && completionData.length > 0 ? (completionData.reduce((acc, curr) => acc + curr.avg_days_to_complete, 0) / completionData.length).toFixed(0) : 0} Jours
            </div>
            <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">Moyenne pour finir un cours</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/10 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-600">Diplômés</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">
                {completionData?.reduce((acc, curr) => acc + curr.total_graduates, 0) || 0}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">Étudiants ayant terminé à 100%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Graphique Marketing */}
        <Card className="shadow-xl rounded-[2rem] border-border/40 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle className="text-xl font-black uppercase italic">Efficacité Marketing</CardTitle>
            <CardDescription>Revenus par source d'acquisition.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="registration_source" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="total_revenue" radius={[10, 10, 0, 0]}>
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
        <Card className="shadow-xl rounded-[2rem] border-border/40 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle className="text-xl font-black uppercase italic text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alertes Décrochage
            </CardTitle>
            <CardDescription>Étudiants inactifs depuis plus de 30 jours.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30">
                        <TableHead className="font-black text-[10px] uppercase pl-6">Étudiant</TableHead>
                        <TableHead className="font-black text-[10px] uppercase">Cours</TableHead>
                        <TableHead className="font-black text-[10px] uppercase">Progression</TableHead>
                        <TableHead className="font-black text-[10px] uppercase pr-6 text-right">Dernier accès</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {churnData?.filter(d => d.is_churned).length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">Aucune alerte pour le moment.</TableCell>
                        </TableRow>
                    ) : (
                        churnData?.filter(d => d.is_churned).map((s) => (
                            <TableRow key={s.user_id}>
                                <TableCell className="pl-6 font-bold">{s.full_name}</TableCell>
                                <TableCell className="text-xs uppercase font-black">{s.course_title}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-destructive" style={{ width: `${s.progress * 100}%` }} />
                                        </div>
                                        <span className="text-[10px] font-black">{(s.progress * 100).toFixed(0)}%</span>
                                    </div>
                                </TableCell>
                                <TableCell className="pr-6 text-right text-xs font-medium text-muted-foreground">
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
