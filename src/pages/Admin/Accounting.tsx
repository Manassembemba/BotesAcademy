
/**
 * Accounting page - Forced reload to fix Vite cache issues.
 */
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfToday, endOfToday, startOfYesterday, endOfYesterday, startOfWeek, startOfMonth, subDays, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Calendar, Filter, Download, ArrowUpRight, DollarSign, Users, BookOpen } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';

type DateFilter = "today" | "yesterday" | "week" | "month" | "custom";

const Accounting = () => {
    const [filter, setFilter] = useState<DateFilter>("month");
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();

    const { data: payments, isLoading } = useQuery({
        queryKey: ['admin-accounting', filter, dateRange],
        queryFn: async () => {
            let query = supabase
                .from('payment_proofs')
                .select(`
                    *,
                    profiles!user_id (full_name),
                    courses (title),
                    strategies (title),
                    indicators (name)
                `)
                .eq('status', 'approved')
                .order('created_at', { ascending: true });

            const { data, error } = await query;
            if (error) throw error;

            const filteredData = data.filter(payment => {
                const pDate = new Date(payment.created_at);
                if (filter === "today") return isWithinInterval(pDate, { start: startOfToday(), end: endOfToday() });
                if (filter === "yesterday") return isWithinInterval(pDate, { start: startOfYesterday(), end: endOfYesterday() });
                if (filter === "week") return pDate >= startOfWeek(new Date(), { weekStartsOn: 1 });
                if (filter === "month") return pDate >= startOfMonth(new Date());
                if (filter === "custom" && dateRange?.from && dateRange?.to) {
                    return isWithinInterval(pDate, { start: dateRange.from, end: dateRange.to });
                }
                return true;
            });

            return filteredData;
        }
    });

    const totalRevenue = payments?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
    const paymentCount = payments?.length || 0;

    // Données pour le graphique de tendance (Revenus par jour)
    const chartData = useMemo(() => {
        if (!payments) return [];
        const dailyMap: Record<string, number> = {};
        
        payments.forEach(p => {
            const dateStr = format(new Date(p.created_at), 'dd MMM');
            dailyMap[dateStr] = (dailyMap[dateStr] || 0) + p.amount;
        });

        return Object.entries(dailyMap).map(([name, total]) => ({ name, total }));
    }, [payments]);

    // Calcul des statistiques par produit (Cours ou Outils)
    const productStats = payments?.reduce((acc: any, curr) => {
        const title = curr.courses?.title || curr.strategies?.title || curr.indicators?.name || 'Produit Spécial';
        if (!acc[title]) {
            acc[title] = { count: 0, revenue: 0 };
        }
        acc[title].count += 1;
        acc[title].revenue += curr.amount;
        return acc;
    }, {});

    const renderSummaryCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">Entrées Cash</CardTitle>
                    <div className="p-2 bg-emerald-500/20 rounded-lg"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-emerald-600">${totalRevenue.toLocaleString()}</div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">Total Encaissé</p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">Souscriptions</CardTitle>
                    <div className="p-2 bg-blue-500/20 rounded-lg"><Users className="w-4 h-4 text-blue-600" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-blue-600">{paymentCount}</div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">Nouveaux Apprenants</p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">Panier Moyen</CardTitle>
                    <div className="p-2 bg-purple-500/20 rounded-lg"><TrendingUp className="w-4 h-4 text-purple-600" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-purple-600">
                        ${paymentCount > 0 ? (totalRevenue / paymentCount).toFixed(0) : 0}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">Valeur / Étudiant</p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">Top Vente</CardTitle>
                    <div className="p-2 bg-amber-500/20 rounded-lg"><BookOpen className="w-4 h-4 text-amber-600" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-black text-amber-600 truncate">
                        {Object.keys(productStats || {}).length > 0 
                            ? Object.entries(productStats).sort((a: any, b: any) => b[1].count - a[1].count)[0][0] 
                            : 'N/A'}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">Produit Phare</p>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 italic">
                        <div className="w-2 h-10 bg-emerald-500 rounded-full" />
                        COMPTABILITÉ
                    </h1>
                    <p className="text-muted-foreground font-medium">Suivi des flux financiers (Cours & Marketplace).</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                    <Button
                        variant={filter === "today" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
                        onClick={() => setFilter("today")}
                    >Aujourd'hui</Button>
                    <Button
                        variant={filter === "yesterday" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
                        onClick={() => setFilter("yesterday")}
                    >Hier</Button>
                    <Button
                        variant={filter === "week" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
                        onClick={() => setFilter("week")}
                    >Semaine</Button>
                    <Button
                        variant={filter === "month" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
                        onClick={() => setFilter("month")}
                    >Mois</Button>
                    
                    <div className="w-[1px] h-6 bg-border/50 mx-1" />

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={filter === "custom" ? "default" : "ghost"}
                                size="sm"
                                className="gap-2 rounded-xl font-bold uppercase text-[10px] tracking-widest"
                                onClick={() => setFilter("custom")}
                            >
                                <Calendar className="w-3 h-3" />
                                {filter === "custom" && dateRange?.from ? (
                                    dateRange.to ? (
                                        <>{format(dateRange.from, "dd/MM")} - {format(dateRange.to, "dd/MM")}</>
                                    ) : format(dateRange.from, "dd/MM")
                                ) : "Perso"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <CalendarComponent
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={{ from: dateRange?.from, to: dateRange?.to }}
                                onSelect={(range: any) => setDateRange(range)}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {renderSummaryCards()}

            {/* Daily Trend Chart */}
            <Card className="shadow-xl rounded-[2rem] border-border/40 overflow-hidden mb-8">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                    <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Performance des Ventes</CardTitle>
                    <CardDescription className="font-medium">Évolution du chiffre d'affaires sur la période.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 'bold'}} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 'bold'}}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--card))', 
                                        borderRadius: '16px', 
                                        border: '1px solid hsl(var(--border))',
                                        fontWeight: 'bold',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ color: '#10b981' }}
                                    cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="total" 
                                    stroke="#10b981" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorTotal)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 shadow-xl rounded-[2rem] overflow-hidden border-border/40">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <CardTitle className="text-lg font-black uppercase tracking-tighter">Répartition par Produit</CardTitle>
                        <CardDescription className="font-medium">Volume de ventes et souscriptions.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {productStats && Object.entries(productStats).length > 0 ? (
                                Object.entries(productStats).map(([title, data]: [string, any]) => (
                                    <div key={title} className="p-4 rounded-2xl bg-muted/20 border border-border/20 flex items-center justify-between group hover:bg-primary/5 transition-colors">
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate uppercase tracking-tighter">{title}</p>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase">{data.count} Ventes</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-emerald-600">${data.revenue.toLocaleString()}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Chiffre</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-8 text-muted-foreground italic">Aucune donnée.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 shadow-xl rounded-[2rem] overflow-hidden border-border/40">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-black uppercase tracking-tighter">Flux de Trésorerie</CardTitle>
                                <CardDescription className="font-medium">Historique détaillé des entrées d'argent.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-xl border-primary/20 text-primary font-bold gap-2">
                                <Download className="w-4 h-4" /> Export CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-8 space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest pl-6">Date & Heure</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Client</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Produit</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-right pr-6">Montant</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">
                                                Aucune transaction sur cette période.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        payments?.map((payment) => {
                                            const productName = payment.courses?.title || payment.strategies?.title || payment.indicators?.name || 'Produit Spécial';
                                            return (
                                                <TableRow key={payment.id} className="hover:bg-primary/5 transition-colors border-b border-border/50">
                                                    <TableCell className="pl-6">
                                                        <p className="text-sm font-bold">{format(new Date(payment.created_at), 'dd/MM/yyyy')}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium">{format(new Date(payment.created_at), 'HH:mm')}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-sm font-black uppercase tracking-tighter">{payment.profiles?.full_name || 'Inconnu'}</p>
                                                        <Badge variant="outline" className="text-[9px] h-4 font-bold bg-muted/50 border-none capitalize">{payment.payment_method.replace('_', ' ')}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1 h-4 bg-primary/30 rounded-full" />
                                                            <span className="text-xs font-bold uppercase tracking-tighter">{productName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <span className="text-lg font-black text-emerald-600">${payment.amount.toLocaleString()}</span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Accounting;
