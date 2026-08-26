import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  format, 
  startOfToday, 
  endOfToday, 
  startOfYesterday, 
  endOfYesterday, 
  startOfWeek, 
  startOfMonth, 
  endOfMonth,
  endOfWeek
} from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Filter, 
  Download, 
  DollarSign, 
  Users, 
  BookOpen, 
  Wallet, 
  CheckCircle2, 
  Search, 
  CreditCard, 
  Layers, 
  Sun, 
  Sunset, 
  FileSpreadsheet,
  FileText,
  UserCheck
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

type DateFilter = "today" | "yesterday" | "week" | "month" | "custom" | "all";

export default function Accounting() {
  const [filter, setFilter] = useState<DateFilter>("today");
  const [customStartDate, setCustomStartDate] = useState<string>(format(startOfToday(), "yyyy-MM-dd"));
  const [customEndDate, setCustomEndDate] = useState<string>(format(endOfToday(), "yyyy-MM-dd"));
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Calcul des dates ISO selon le filtre sélectionné
  const { startDateISO, endDateISO, labelPeriod } = useMemo(() => {
    let start: Date | null = null;
    let end: Date | null = null;
    let label = "Aujourd'hui";

    if (filter === "today") {
      start = startOfToday();
      end = endOfToday();
      label = "Aujourd'hui (" + format(new Date(), "dd MMMM yyyy", { locale: fr }) + ")";
    } else if (filter === "yesterday") {
      start = startOfYesterday();
      end = endOfYesterday();
      label = "Hier (" + format(startOfYesterday(), "dd MMMM yyyy", { locale: fr }) + ")";
    } else if (filter === "week") {
      start = startOfWeek(new Date(), { weekStartsOn: 1 });
      end = endOfWeek(new Date(), { weekStartsOn: 1 });
      label = "Cette Semaine";
    } else if (filter === "month") {
      start = startOfMonth(new Date());
      end = endOfMonth(new Date());
      label = "Ce Mois (" + format(new Date(), "MMMM yyyy", { locale: fr }) + ")";
    } else if (filter === "custom") {
      start = customStartDate ? new Date(customStartDate + "T00:00:00") : null;
      end = customEndDate ? new Date(customEndDate + "T23:59:59") : null;
      label = `Du ${customStartDate} au ${customEndDate}`;
    } else {
      label = "Tout l'historique";
    }

    return {
      startDateISO: start ? start.toISOString() : null,
      endDateISO: end ? end.toISOString() : null,
      labelPeriod: label
    };
  }, [filter, customStartDate, customEndDate]);

  // Récupération des données financières via RPC
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-financial-overview", startDateISO, endDateISO],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_financial_overview", {
        p_start_date: startDateISO,
        p_end_date: endDateISO
      });
      if (error) throw error;
      return data;
    }
  });

  const transactions: any[] = analytics?.transactions || [];
  const coursesBreakdown: any[] = analytics?.courses_breakdown || [];
  const methodsBreakdown: any[] = analytics?.methods_breakdown || [];
  const adminsBreakdown: any[] = analytics?.admins_breakdown || [];

  // Filtrage des transactions par recherche
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const match =
        t.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.course_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.registered_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      return match;
    });
  }, [transactions, searchTerm]);

  // Export PDF du rapport financier
  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text("BOTES ACADEMY — RAPPORT FINANCIER", 14, 20);
      
      doc.setFontSize(11);
      doc.text(`Période : ${labelPeriod}`, 14, 28);
      doc.text(`Date d'édition : ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 34);
      doc.text(`Total Encaissé sur la période : ${analytics?.period_revenue || 0} $`, 14, 40);

      const tableData = filteredTransactions.map((t) => [
        format(new Date(t.created_at), "dd/MM/yyyy HH:mm"),
        t.student_name || "N/A",
        t.course_title || "N/A",
        `${t.amount} $`,
        t.payment_method?.toUpperCase() || "CASH",
        t.registered_by || "Staff",
        t.notes || "-"
      ]);

      autoTable(doc, {
        head: [["Date", "Étudiant", "Formation", "Montant", "Moyen", "Caissier", "Note"]],
        body: tableData,
        startY: 46,
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59] }
      });

      doc.save(`Rapport_Financier_${filter}_${format(new Date(), "yyyyMMdd")}.pdf`);
      toast.success("Rapport PDF généré avec succès !");
    } catch (e: any) {
      toast.error(`Erreur d'export : ${e.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 pb-24 max-w-7xl">
      {/* HEADER FINANCIER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-black uppercase tracking-wider">
              Trésorerie & Recettes
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-foreground mt-2">
            Comptabilité & <span className="text-emerald-500">Flux Financiers</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Suivi des encaissements par période, formation, moyen de paiement et caissier.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={exportPDF}
            className="h-12 px-6 rounded-2xl font-black uppercase text-xs tracking-wider shadow-md bg-card border border-border hover:bg-muted text-foreground"
          >
            <Download className="w-4 h-4 mr-2 text-primary" /> Exporter Rapport PDF
          </Button>
        </div>
      </div>

      {/* BARRE DE FILTRES DE PÉRIODE */}
      <div className="bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-3xl border border-border/80 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filter === "today" ? "default" : "outline"}
            onClick={() => setFilter("today")}
            className="rounded-xl text-xs font-black uppercase tracking-wider h-10"
          >
            <Sun className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Aujourd'hui (${analytics?.today_revenue || 0})
          </Button>

          <Button
            variant={filter === "yesterday" ? "default" : "outline"}
            onClick={() => setFilter("yesterday")}
            className="rounded-xl text-xs font-black uppercase tracking-wider h-10"
          >
            <Sunset className="w-3.5 h-3.5 mr-1.5 text-orange-400" /> Hier (${analytics?.yesterday_revenue || 0})
          </Button>

          <Button
            variant={filter === "week" ? "default" : "outline"}
            onClick={() => setFilter("week")}
            className="rounded-xl text-xs font-black uppercase tracking-wider h-10"
          >
            Cette Semaine (${analytics?.week_revenue || 0})
          </Button>

          <Button
            variant={filter === "month" ? "default" : "outline"}
            onClick={() => setFilter("month")}
            className="rounded-xl text-xs font-black uppercase tracking-wider h-10"
          >
            Ce Mois (${analytics?.month_revenue || 0})
          </Button>

          <Button
            variant={filter === "custom" ? "default" : "outline"}
            onClick={() => setFilter("custom")}
            className="rounded-xl text-xs font-black uppercase tracking-wider h-10"
          >
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5" /> Personnalisée
          </Button>

          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="rounded-xl text-xs font-black uppercase tracking-wider h-10"
          >
            Tout
          </Button>
        </div>

        {/* Datepicker personnalisé si activé */}
        {filter === "custom" && (
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold text-muted-foreground">Du :</Label>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-10 rounded-xl w-40 text-xs font-bold"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold text-muted-foreground">Au :</Label>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-10 rounded-xl w-40 text-xs font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {/* KPIS REVENUS COMPARATIFS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Période Sélectionnée */}
        <Card className="rounded-3xl border-emerald-500/30 bg-emerald-500/5 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                Période ({filter.toUpperCase()})
              </p>
              <p className="text-3xl font-black italic text-emerald-500">
                ${analytics?.period_revenue?.toLocaleString() || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Aujourd'hui */}
        <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Aujourd'hui
              </p>
              <p className="text-2xl font-black italic text-foreground">
                ${analytics?.today_revenue?.toLocaleString() || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cette Semaine */}
        <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Cette Semaine
              </p>
              <p className="text-2xl font-black italic text-foreground">
                ${analytics?.week_revenue?.toLocaleString() || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ce Mois */}
        <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-black">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Ce Mois
              </p>
              <p className="text-2xl font-black italic text-foreground">
                ${analytics?.month_revenue?.toLocaleString() || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ANALYTIQUES ET RÉPARTITIONS SUR LA PÉRIODE SÉLECTIONNÉE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. ENTRÉES PAR FORMATION */}
        <Card className="rounded-[2.5rem] border-border bg-card/60 backdrop-blur-xl shadow-lg">
          <CardHeader className="p-6 pb-4 border-b border-border/50">
            <CardTitle className="text-base font-black uppercase italic flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Recettes par Formation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {coursesBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">Aucune entrée sur cette période</p>
            ) : (
              coursesBreakdown.map((c, i) => {
                const total = analytics?.period_revenue || 1;
                const percentage = Math.round((c.total_amount / total) * 100);
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="truncate max-w-[180px]">{c.course_title}</span>
                      <span className="text-emerald-500 font-black">${c.total_amount} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{c.payments_count} versement(s)</p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* 2. ENTRÉES PAR MOYEN DE PAIEMENT */}
        <Card className="rounded-[2.5rem] border-border bg-card/60 backdrop-blur-xl shadow-lg">
          <CardHeader className="p-6 pb-4 border-b border-border/50">
            <CardTitle className="text-base font-black uppercase italic flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" /> Moyens de Paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {methodsBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">Aucune entrée sur cette période</p>
            ) : (
              methodsBreakdown.map((m, i) => {
                const total = analytics?.period_revenue || 1;
                const percentage = Math.round((m.total_amount / total) * 100);
                const labels: Record<string, string> = {
                  cash: "Espèces (Cash Réception)",
                  mobile_money: "Mobile Money (M-Pesa, Orange)",
                  bank_transfer: "Virement Bancaire",
                  pos: "Terminal Carte / POS",
                  card: "Carte Bancaire"
                };
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{labels[m.payment_method] || m.payment_method}</span>
                      <span className="text-emerald-500 font-black">${m.total_amount}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{percentage}% du total ({m.payments_count} transactions)</p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* 3. ENTRÉES PAR CAISSIER / RÉCEPTIONNISTE */}
        <Card className="rounded-[2.5rem] border-border bg-card/60 backdrop-blur-xl shadow-lg">
          <CardHeader className="p-6 pb-4 border-b border-border/50">
            <CardTitle className="text-base font-black uppercase italic flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-500" /> Encaissé par (Staff)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {adminsBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">Aucune entrée sur cette période</p>
            ) : (
              adminsBreakdown.map((a, i) => {
                const total = analytics?.period_revenue || 1;
                const percentage = Math.round((a.total_amount / total) * 100);
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{a.admin_name}</span>
                      <span className="text-purple-400 font-black">${a.total_amount}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{a.payments_count} versement(s) validé(s)</p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* REGISTRE CHRONOLOGIQUE DES TRANSACTIONS SUR LA PÉRIODE */}
      <Card className="rounded-[2.5rem] border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardHeader className="p-6 md:p-8 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-black uppercase italic tracking-tight">
                Journal des Recettes & Versements
              </CardTitle>
              <CardDescription>
                Période : <strong>{labelPeriod}</strong> — {filteredTransactions.length} transaction(s) enregistrée(s)
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher élève ou formation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-11 rounded-xl bg-background/80"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground font-black text-xs uppercase animate-pulse">
              Chargement des flux financiers...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground space-y-3">
              <DollarSign className="w-12 h-12 mx-auto opacity-20" />
              <p className="font-black uppercase text-sm">Aucun versement enregistré sur cette période</p>
              <p className="text-xs">Changez le filtre de date pour consulter d'autres périodes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-black text-[10px] uppercase tracking-wider">Date & Heure</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider">Étudiant</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider">Formation</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider">Montant</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider">Moyen</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider">Encaissé par</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider">Note / Référence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/40">
                  {filteredTransactions.map((t) => (
                    <TableRow key={t.installment_id} className="hover:bg-muted/30">
                      <TableCell className="font-bold text-xs">
                        {format(new Date(t.created_at), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="font-black text-xs text-foreground uppercase">{t.student_name}</div>
                        {t.student_phone && (
                          <div className="text-[10px] text-muted-foreground">{t.student_phone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {t.course_title}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-black text-emerald-500 text-sm">
                        +${t.amount}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-muted text-foreground text-[9px] font-black uppercase">
                          {t.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground">
                        {t.registered_by || "Staff"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground italic max-w-xs truncate">
                        {t.notes || "Versement scolarité"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
