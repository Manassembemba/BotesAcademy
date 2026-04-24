
/**
 * Accounting page - Enhanced with Expenses management and Profit Tracking.
 */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfToday, endOfToday, startOfYesterday, endOfYesterday, startOfWeek, startOfMonth, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Calendar, Filter, Download, ArrowUpRight, DollarSign, Users, BookOpen, Wallet, PlusCircle, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

type DateFilter = "today" | "yesterday" | "week" | "month" | "custom" | "all";

const Accounting = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"revenue" | "installments" | "expenses" | "history">("revenue");
    const [filter, setFilter] = useState<DateFilter>("today");
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();

    // Expense Form State
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseCategory, setExpenseCategory] = useState("autre");
    const [expenseDescription, setExpenseDescription] = useState("");

    // Query for Revenue (Payments)
    const { data: payments, isLoading } = useQuery({
        queryKey: ['admin-accounting-payments', filter, dateRange],
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
                .order('created_at', { ascending: true });

            if (filter !== "all") {
                let startDate: Date | null = null;
                let endDate: Date | null = null;
                
                if (filter === "today") {
                    startDate = startOfToday();
                    endDate = endOfToday();
                } else if (filter === "yesterday") {
                    startDate = startOfYesterday();
                    endDate = endOfYesterday();
                } else if (filter === "week") {
                    startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
                } else if (filter === "month") {
                    startDate = startOfMonth(new Date());
                } else if (filter === "custom" && dateRange?.from) {
                    startDate = dateRange.from;
                    if (dateRange.to) endDate = dateRange.to;
                }

                if (startDate) query = query.gte('created_at', startDate.toISOString());
                if (endDate) query = query.lte('created_at', endDate.toISOString());
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as any[];
        }
    });

    // Query for Expenses
    const { data: expenses, isLoading: loadingExpenses } = useQuery({
        queryKey: ['admin-accounting-expenses', filter, dateRange],
        queryFn: async () => {
            let query = supabase
                .from('expenses')
                .select('*')
                .order('date', { ascending: false });

            if (filter !== "all") {
                let startDate: Date | null = null;
                let endDate: Date | null = null;
                
                if (filter === "today") startDate = startOfToday();
                else if (filter === "yesterday") startDate = startOfYesterday();
                else if (filter === "week") startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
                else if (filter === "month") startDate = startOfMonth(new Date());
                else if (filter === "custom" && dateRange?.from) {
                    startDate = dateRange.from;
                    if (dateRange.to) endDate = dateRange.to;
                }

                if (startDate) query = query.gte('date', format(startDate, 'yyyy-MM-dd'));
                if (endDate) query = query.lte('date', format(endDate, 'yyyy-MM-dd'));
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as any[];
        }
    });

    // Query for Installments (Balance due)
    const { data: installmentsCases, isLoading: loadingInstallments } = useQuery({
        queryKey: ['admin-accounting-installments'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('purchases')
                .select(`
                    *,
                    profiles:user_id (id, full_name, avatar_url),
                    courses (title, price)
                `)
                // On utilise un filtre de comparaison de colonnes via PostgREST
                .filter('paid_amount', 'lt', 'total_amount')
                .order('due_date', { ascending: true });
            
            if (error) throw error;
            return data as any[];
        }
    });

    const sendReminderMutation = useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase.from('notifications').insert({
                user_id: userId,
                title: "Rappel de Paiement",
                message: "Ceci est un rappel concernant votre solde restant pour votre formation Botes Academy.",
                type: 'warning'
            });
            if (error) throw error;
        },
        onSuccess: () => toast.success("Rappel envoyé avec succès !"),
        onError: (err: any) => toast.error(err.message)
    });

    const addExpenseMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.from('expenses').insert({
                amount: parseFloat(expenseAmount),
                category: expenseCategory,
                description: expenseDescription,
                date: format(new Date(), 'yyyy-MM-dd')
            });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Dépense enregistrée !");
            setExpenseAmount("");
            setExpenseDescription("");
            queryClient.invalidateQueries({ queryKey: ['admin-accounting-expenses'] });
        },
        onError: (error) => toast.error("Erreur: " + error.message)
    });

    const deleteExpenseMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Dépense supprimée");
            queryClient.invalidateQueries({ queryKey: ['admin-accounting-expenses'] });
        }
    });

    const approvedPayments = payments?.filter(p => p.status === 'approved') || [];
    const totalRevenue = approvedPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
    const totalExpenses = expenses?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
    const latentRevenue = installmentsCases?.reduce((acc, curr) => acc + ((curr.total_amount || 0) - (curr.paid_amount || 0)), 0) || 0;
    const netProfit = totalRevenue - totalExpenses;
    const paymentCount = approvedPayments.length || 0;
    const conversionRate = payments?.length ? (approvedPayments.length / payments.length) * 100 : 0;

    const chartData = useMemo(() => {
        if (!approvedPayments.length) return [];
        const dailyMap: Record<string, number> = {};
        approvedPayments.forEach(p => {
            const dateStr = format(new Date(p.created_at), 'dd MMM');
            dailyMap[dateStr] = (dailyMap[dateStr] || 0) + p.amount;
        });
        return Object.entries(dailyMap).map(([name, total]) => ({ name, total }));
    }, [approvedPayments]);

    const productStats = approvedPayments.reduce((acc: any, curr) => {
        const title = curr.courses?.title || curr.strategies?.title || curr.indicators?.name || 'Produit Spécial';
        if (!acc[title]) acc[title] = { count: 0, revenue: 0 };
        acc[title].count += 1;
        acc[title].revenue += curr.amount;
        return acc;
    }, {});

    const paymentMethodsStats = useMemo(() => {
        if (!approvedPayments.length) return [];
        const methodsMap: Record<string, number> = {};
        approvedPayments.forEach(p => {
            const method = p.payment_method || 'Autre';
            methodsMap[method] = (methodsMap[method] || 0) + p.amount;
        });
        return Object.entries(methodsMap).map(([name, value]) => ({ name: name.replace('_', ' ').toUpperCase(), value }));
    }, [approvedPayments]);
    
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

    const exportToPDF = () => {
        const doc = new jsPDF();
        const tableData = approvedPayments.map(p => [
            format(new Date(p.created_at), 'dd/MM/yyyy'),
            p.profiles?.full_name || 'Inconnu',
            p.courses?.title || 'Produit',
            `$${p.amount}`
        ]);

        doc.text("Rapport des Revenus - Botes Academy", 14, 15);
        autoTable(doc, {
            head: [['Date', 'Client', 'Produit', 'Montant']],
            body: tableData,
            startY: 20
        });
        doc.save(`finance-revenus-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    const exportToCSV = () => {
        const headers = ["Date", "Client", "Produit", "Montant", "Statut"];
        const rows = approvedPayments.map(p => [
            format(new Date(p.created_at), 'yyyy-MM-dd'),
            p.profiles?.full_name || 'Inconnu',
            p.courses?.title || 'Produit',
            p.amount,
            p.status
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `finance-data-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderSummaryCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-card/40 backdrop-blur-xl border-emerald-500/20 shadow-premium rounded-[2.5rem] overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">Revenus</CardTitle>
                    <div className="p-2 bg-emerald-500/20 rounded-lg"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-emerald-600">${totalRevenue.toLocaleString()}</div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">Total Encaissé</p>
                </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-xl border-amber-500/20 shadow-premium rounded-[2.5rem] overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">Impayés</CardTitle>
                    <div className="p-2 bg-amber-500/20 rounded-lg"><Wallet className="w-4 h-4 text-amber-600" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-amber-600">${latentRevenue.toLocaleString()}</div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase italic">Solde à percevoir</p>
                </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-xl border-primary/20 shadow-premium rounded-[2.5rem] overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">Profit Net</CardTitle>
                    <div className="p-2 bg-primary/20 rounded-lg"><TrendingUp className={cn("w-4 h-4", netProfit >= 0 ? "text-primary" : "text-destructive")} /></div>
                </CardHeader>
                <CardContent>
                    <div className={cn("text-3xl font-black", netProfit >= 0 ? "text-primary" : "text-destructive")}>
                        ${netProfit.toLocaleString()}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase italic">Bénéfice Réel</p>
                </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-xl border-red-500/20 shadow-premium rounded-[2.5rem] overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">Dépenses</CardTitle>
                    <div className="p-2 bg-red-500/20 rounded-lg"><ArrowUpRight className="w-4 h-4 text-red-600" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-red-600">${totalExpenses.toLocaleString()}</div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase italic">Charges</p>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-mesh-gradient relative overflow-hidden flex flex-col pb-20">
            <div className="container mx-auto p-4 md:p-8 space-y-12 relative z-10 pt-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                <div className="space-y-2">
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-[0.85]">
                        Global <span className="text-gradient-primary">Finance</span>
                    </h1>
                    <p className="text-muted-foreground font-medium italic text-lg ml-1">Bilan de santé et pilotage stratégique de l'académie.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-card/30 backdrop-blur-3xl p-2 rounded-2xl border border-white/5">
                        <Button 
                            variant={activeTab === "revenue" ? "default" : "ghost"} 
                            size="sm" 
                            className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4"
                            onClick={() => setActiveTab("revenue")}
                        >
                            <DollarSign className="w-3 h-3 mr-2" />
                            Revenus
                        </Button>
                        <Button 
                            variant={activeTab === "installments" ? "default" : "ghost"} 
                            size="sm" 
                            className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4"
                            onClick={() => setActiveTab("installments")}
                        >
                            <Users className="w-3 h-3 mr-2" />
                            Tranches
                        </Button>
                        <Button 
                            variant={activeTab === "expenses" ? "default" : "ghost"} 
                            size="sm" 
                            className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4"
                            onClick={() => setActiveTab("expenses")}
                        >
                            <Wallet className="w-3 h-3 mr-2" />
                            Dépenses
                        </Button>
                        <Button 
                            variant={activeTab === "history" ? "default" : "ghost"} 
                            size="sm" 
                            className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4"
                            onClick={() => setActiveTab("history")}
                        >
                            <BookOpen className="w-3 h-3 mr-2" />
                            Historique
                        </Button>
                    </div>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="rounded-xl font-black uppercase tracking-widest gap-2">
                                <PlusCircle className="w-4 h-4" />
                                Enregistrer Frais
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl border-primary/20 shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Enregistrer une Dépense</DialogTitle>
                                <CardDescription>Ajoutez un frais de fonctionnement (loyer, salaire, etc).</CardDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-black uppercase tracking-widest">Montant ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={expenseAmount} 
                                        onChange={(e) => setExpenseAmount(e.target.value)}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-black uppercase tracking-widest">Catégorie</Label>
                                    <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="loyer">Loyer</SelectItem>
                                            <SelectItem value="salaire">Salaires</SelectItem>
                                            <SelectItem value="electricite">Électricité / Internet</SelectItem>
                                            <SelectItem value="marketing">Marketing / Ads</SelectItem>
                                            <SelectItem value="materiel">Matériel / Local</SelectItem>
                                            <SelectItem value="autre">Autre</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-black uppercase tracking-widest">Description</Label>
                                    <Input 
                                        value={expenseDescription} 
                                        onChange={(e) => setExpenseDescription(e.target.value)}
                                        placeholder="Ex: Loyer mois de Mars"
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>
                            <Button 
                                onClick={() => addExpenseMutation.mutate()} 
                                disabled={!expenseAmount || addExpenseMutation.isPending}
                                className="w-full rounded-xl font-black uppercase tracking-widest"
                            >
                                Valider la Dépense
                            </Button>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50 w-fit">
                {["all", "today", "yesterday", "week", "month"].map((f) => (
                    <Button
                        key={f}
                        variant={filter === f ? "default" : "ghost"}
                        size="sm"
                        className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
                        onClick={() => setFilter(f as DateFilter)}
                    >
                        {f === "all" ? "Tout" : f === "today" ? "Aujourd'hui" : f === "yesterday" ? "Hier" : f === "week" ? "Semaine" : "Mois"}
                    </Button>
                ))}
            </div>

            {renderSummaryCards()}

            {activeTab === "revenue" ? (
                <>
                    <div className="flex justify-end gap-3 mb-6">
                        <Button variant="outline" size="sm" onClick={exportToCSV} className="rounded-xl border-emerald-500/20 text-emerald-600 hover:bg-emerald-50">
                            <Download className="w-4 h-4 mr-2" /> CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportToPDF} className="rounded-xl border-red-500/20 text-red-600 hover:bg-red-50">
                            <Download className="w-4 h-4 mr-2" /> PDF
                        </Button>
                    </div>

                    <Card className="shadow-premium rounded-[2.5rem] border-white/5 bg-card/30 backdrop-blur-xl overflow-hidden mb-8">
                        <CardHeader className="bg-muted/30 border-b border-white/5 pb-6">
                            <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Analyse de Performance</CardTitle>
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
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} tickFormatter={(val) => `$${val}`} />
                                        <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid hsl(var(--border))' }} />
                                        <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="shadow-xl rounded-[2rem] overflow-hidden border-border/40">
                            <CardHeader className="bg-muted/30 border-b border-border/50">
                                <CardTitle className="text-lg font-black uppercase tracking-tighter">Flux de Trésorerie</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="pl-6 text-[10px] font-black uppercase">Date</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Client</TableHead>
                                            <TableHead className="text-right pr-6 text-[10px] font-black uppercase">Montant</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments?.map((payment) => (
                                            <TableRow key={payment.id} className="hover:bg-primary/5">
                                                <TableCell className="pl-6">
                                                    <p className="text-xs font-bold">{format(new Date(payment.created_at), 'dd/MM/yy')}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm font-black uppercase">{payment.profiles?.full_name || 'Inconnu'}</p>
                                                    <p className="text-[9px] text-muted-foreground uppercase">{payment.courses?.title || 'Produit'}</p>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <span className="text-emerald-600 font-black">${payment.amount}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        
                        <Card className="shadow-xl rounded-[2rem] overflow-hidden border-border/40">
                            <CardHeader className="bg-muted/30 border-b border-border/50">
                                <CardTitle className="text-lg font-black uppercase tracking-tighter">Canaux de Paiement</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex items-center justify-center">
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={paymentMethodsStats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {paymentMethodsStats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : activeTab === "installments" ? (
                <Card className="shadow-xl rounded-[2rem] overflow-hidden border-border/40">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Suivi des Tranches & Soldes</CardTitle>
                        <CardDescription>Étudiants avec un paiement partiel en cours.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="pl-6 text-[10px] font-black uppercase">Étudiant</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Formation</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Progression</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Reste à Payer</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingInstallments ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-20">Chargement...</TableCell></TableRow>
                                ) : installmentsCases?.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-20 italic text-muted-foreground">Aucun paiement par tranche en attente.</TableCell></TableRow>
                                ) : (
                                    installmentsCases?.map((item) => {
                                        const progress = (item.paid_amount / item.total_amount) * 100;
                                        const balance = item.total_amount - item.paid_amount;
                                        return (
                                            <TableRow key={item.id} className="hover:bg-amber-500/5 transition-colors">
                                                <TableCell className="pl-6">
                                                    <p className="font-black uppercase text-sm">{item.profiles?.full_name}</p>
                                                    <p className="text-[10px] italic text-muted-foreground">ID: {item.user_id.slice(0,8)}</p>
                                                </TableCell>
                                                <TableCell className="font-bold text-xs uppercase">{item.courses?.title}</TableCell>
                                                <TableCell className="w-48">
                                                    <div className="flex flex-col gap-1.5">
                                                        <Progress value={progress} className="h-2 bg-amber-100" indicatorClassName="bg-amber-500" />
                                                        <span className="text-[10px] font-black text-amber-600">{Math.round(progress)}% (${item.paid_amount} / ${item.total_amount})</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-black text-amber-600">${balance.toLocaleString()}</TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="h-8 rounded-lg border-amber-500/20 text-amber-600 hover:bg-amber-50 text-[10px] font-black uppercase"
                                                        onClick={() => sendReminderMutation.mutate(item.user_id)}
                                                    >
                                                        Rappeler
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : activeTab === "expenses" ? (
                <Card className="shadow-xl rounded-[2rem] overflow-hidden border-border/40">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Registre des Dépenses</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="pl-6 text-[10px] font-black uppercase">Date</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Catégorie</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Description</TableHead>
                                    <TableHead className="text-right pr-6 text-[10px] font-black uppercase">Montant</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">Aucune dépense enregistrée.</TableCell>
                                    </TableRow>
                                ) : (
                                    expenses?.map((expense) => (
                                        <TableRow key={expense.id} className="hover:bg-red-500/5 transition-colors">
                                            <TableCell className="pl-6 font-bold text-xs">{format(new Date(expense.date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="uppercase text-[9px] font-black bg-red-500/10 text-red-600 border-none">
                                                    {expense.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">{expense.description}</TableCell>
                                            <TableCell className="text-right pr-6 text-red-600 font-black">-${expense.amount}</TableCell>
                                            <TableCell>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-muted-foreground hover:text-destructive"
                                                    onClick={() => deleteExpenseMutation.mutate(expense.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <Card className="shadow-xl rounded-[2rem] overflow-hidden border-border/40">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Journal Historique</CardTitle>
                        <CardDescription>Flux chronologique complet (Revenus & Dépenses).</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="pl-6 text-[10px] font-black uppercase">Date</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Type</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Détails</TableHead>
                                    <TableHead className="text-right pr-6 text-[10px] font-black uppercase">Flux</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {approvedPayments.concat(expenses || []).sort((a,b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()).map((item: any, idx) => {
                                    const isRevenue = !!item.amount && !item.category;
                                    return (
                                        <TableRow key={idx} className={cn("transition-colors", isRevenue ? "hover:bg-emerald-500/5" : "hover:bg-red-500/5")}>
                                            <TableCell className="pl-6 text-xs font-bold">
                                                {format(new Date(item.created_at || item.date), 'dd/MM/yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("uppercase text-[9px] font-black border-none", isRevenue ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
                                                    {isRevenue ? 'Revenu' : 'Dépense'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm font-black uppercase">{item.profiles?.full_name || item.category || 'Système'}</p>
                                                <p className="text-[10px] text-muted-foreground italic">{item.courses?.title || item.description || 'Transaction'}</p>
                                            </TableCell>
                                            <TableCell className={cn("text-right pr-6 font-black", isRevenue ? "text-emerald-600" : "text-red-600")}>
                                                {isRevenue ? `+$${item.amount}` : `-$${item.amount}`}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Accounting;
