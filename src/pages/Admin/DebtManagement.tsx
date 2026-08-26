import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  CreditCard, 
  AlertTriangle, 
  Send, 
  DollarSign, 
  Search, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  Phone, 
  Mail, 
  TrendingUp, 
  UserPlus,
  Scale,
  Gavel,
  CalendarClock,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";

export default function DebtManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "overdue" | "disputed" | "upcoming">("all");
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Modal Encaisser une tranche spécifique
  const [payScheduleModalData, setPayScheduleModalData] = useState<{
    schedule: any;
    studentName: string;
    courseTitle: string;
  } | null>(null);
  const [schedulePaymentMethod, setSchedulePaymentMethod] = useState<string>("cash");
  const [schedulePaymentNotes, setSchedulePaymentNotes] = useState<string>("");

  // Modal Encaisser versement libre
  const [freePaymentModalData, setFreePaymentModalData] = useState<any>(null);
  const [freeAmount, setFreeAmount] = useState<number>(0);
  const [freeMethod, setFreeMethod] = useState<string>("cash");
  const [freeNotes, setFreeNotes] = useState<string>("");

  // Modal Reporter une Échéance
  const [rescheduleModalData, setRescheduleModalData] = useState<{
    schedule: any;
    studentName: string;
  } | null>(null);
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [rescheduleNotes, setRescheduleNotes] = useState<string>("");

  // Modal Régularisation de Litige
  const [disputeResolveModalData, setDisputeResolveModalData] = useState<any>(null);
  const [disputePayAmount, setDisputePayAmount] = useState<number>(0);
  const [disputePayMethod, setDisputePayMethod] = useState<string>("cash");
  const [disputeResolutionNotes, setDisputeResolutionNotes] = useState<string>("");

  // Modal Signaler un Litige
  const [flagDisputeModalData, setFlagDisputeModalData] = useState<any>(null);
  const [disputeReason, setDisputeReason] = useState<string>("");
  const [disputeExtraAmount, setDisputeExtraAmount] = useState<number>(0);

  // Modal Rappel manuel
  const [reminderModalData, setReminderModalData] = useState<any>(null);
  const [reminderMessage, setReminderMessage] = useState<string>("");

  // 1. Charger la liste des débiteurs et leurs tranches via RPC
  const { data: debtors = [], isLoading } = useQuery({
    queryKey: ["admin-debtors-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_debtors_overview");
      if (error) throw error;
      return data || [];
    }
  });

  // 2. Mutation : Payer une tranche spécifique
  const payScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!payScheduleModalData?.schedule?.id) throw new Error("Tranche invalide");

      const { data, error } = await supabase.rpc("pay_scheduled_installment", {
        p_schedule_id: payScheduleModalData.schedule.id,
        p_payment_method: schedulePaymentMethod,
        p_notes: schedulePaymentNotes || `Règlement Tranche ${payScheduleModalData.schedule.installment_number}`,
        p_admin_id: user?.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Tranche validée et solde mis à jour !");
      queryClient.invalidateQueries({ queryKey: ["admin-debtors-overview"] });
      setPayScheduleModalData(null);
      setSchedulePaymentNotes("");
    },
    onError: (err: any) => {
      toast.error(`Erreur : ${err.message}`);
    }
  });

  // 3. Mutation : Encaisser un versement libre
  const recordFreePaymentMutation = useMutation({
    mutationFn: async () => {
      if (!freePaymentModalData?.purchase_id || freeAmount <= 0) throw new Error("Montant invalide");

      const { error } = await supabase.from("payment_installments").insert({
        purchase_id: freePaymentModalData.purchase_id,
        amount: freeAmount,
        payment_method: freeMethod,
        admin_id: user?.id,
        notes: freeNotes || "Versement d'acompte / scolarité"
      });

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: freePaymentModalData.student_id,
        title: "Reçu de paiement enregistré",
        message: `Votre versement de ${freeAmount}$ pour ${freePaymentModalData.course_title} a été validé.`,
        type: "success",
        link: "/profile"
      });
    },
    onSuccess: () => {
      toast.success("Versement enregistré avec succès !");
      queryClient.invalidateQueries({ queryKey: ["admin-debtors-overview"] });
      setFreePaymentModalData(null);
      setFreeAmount(0);
      setFreeNotes("");
    },
    onError: (err: any) => {
      toast.error(`Erreur : ${err.message}`);
    }
  });

  // 4. Mutation : Reporter une échéance
  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      if (!rescheduleModalData?.schedule?.id || !newDueDate) throw new Error("Nouvelle date requise");

      const { data, error } = await supabase.rpc("reschedule_installment", {
        p_schedule_id: rescheduleModalData.schedule.id,
        p_new_due_date: newDueDate,
        p_notes: rescheduleNotes || "Report accordé par l'administration",
        p_admin_id: user?.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Échéance reportée avec succès !");
      queryClient.invalidateQueries({ queryKey: ["admin-debtors-overview"] });
      setRescheduleModalData(null);
      setNewDueDate("");
      setRescheduleNotes("");
    },
    onError: (err: any) => {
      toast.error(`Erreur : ${err.message}`);
    }
  });

  // 5. Mutation : Régulariser un litige
  const resolveDisputeMutation = useMutation({
    mutationFn: async () => {
      if (!disputeResolveModalData?.purchase_id) throw new Error("Inscription invalide");

      const { data, error } = await supabase.rpc("resolve_student_dispute_and_pay", {
        p_purchase_id: disputeResolveModalData.purchase_id,
        p_payment_amount: disputePayAmount,
        p_payment_method: disputePayMethod,
        p_resolution_notes: disputeResolutionNotes || "Régularisation amiable",
        p_admin_id: user?.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Litige régularisé et dossier remis en règle !");
      queryClient.invalidateQueries({ queryKey: ["admin-debtors-overview"] });
      setDisputeResolveModalData(null);
    },
    onError: (err: any) => {
      toast.error(`Erreur : ${err.message}`);
    }
  });

  // 6. Mutation : Signaler un litige
  const flagDisputeMutation = useMutation({
    mutationFn: async () => {
      if (!flagDisputeModalData?.purchase_id || !disputeReason) throw new Error("Motif requis");

      const { data, error } = await supabase.rpc("flag_student_dispute", {
        p_purchase_id: flagDisputeModalData.purchase_id,
        p_reason: disputeReason,
        p_extra_amount: disputeExtraAmount || 0,
        p_admin_id: user?.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Litige signalé sur le dossier !");
      queryClient.invalidateQueries({ queryKey: ["admin-debtors-overview"] });
      setFlagDisputeModalData(null);
      setDisputeReason("");
      setDisputeExtraAmount(0);
    },
    onError: (err: any) => {
      toast.error(`Erreur : ${err.message}`);
    }
  });

  // 7. Mutation : Envoyer un rappel
  const sendReminderMutation = useMutation({
    mutationFn: async () => {
      if (!reminderModalData?.student_id) return;

      const { error } = await supabase.from("notifications").insert({
        user_id: reminderModalData.student_id,
        title: "Rappel d'échéance de paiement",
        message: reminderMessage,
        type: "warning",
        link: "/profile"
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Relance envoyée à l'étudiant !");
      setReminderModalData(null);
    },
    onError: (err: any) => {
      toast.error(`Erreur : ${err.message}`);
    }
  });

  // Filtrage des débiteurs
  const filteredDebtors = debtors.filter((d: any) => {
    const matchesSearch =
      d.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.student_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.course_title?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === "disputed") return d.is_disputed === true;
    const isOverdue = d.next_due_date && isPast(new Date(d.next_due_date));
    if (filterStatus === "overdue") return isOverdue;
    if (filterStatus === "upcoming") return !isOverdue && !d.is_disputed;
    return true;
  });

  // Statistiques
  const stats = {
    totalRemaining: debtors.reduce((acc: number, d: any) => acc + (Number(d.remaining_amount) || 0), 0),
    totalOverdueCount: debtors.filter((d: any) => d.next_due_date && isPast(new Date(d.next_due_date))).length,
    totalDisputesCount: debtors.filter((d: any) => d.is_disputed === true).length,
    totalDebtorsCount: debtors.length
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 pb-24 max-w-7xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-black uppercase tracking-wider">
              Recouvrement & Échéanciers
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-foreground mt-2">
            Suivi des Dettes & <span className="text-amber-500">Tranches de Paiement</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Gérez les échéances planifiées, encaissez les tranches et accordez des reports en toute transparence.
          </p>
        </div>

        <Link to="/admin/enrollment">
          <Button className="h-12 px-6 rounded-2xl font-black uppercase text-xs tracking-wider shadow-glow-primary bg-primary text-primary-foreground">
            <UserPlus className="w-4 h-4 mr-2" /> Nouvelle Inscription
          </Button>
        </Link>
      </div>

      {/* STATS RECUPERATION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Dettes à Recouvrer</p>
              <p className="text-2xl font-black italic text-amber-500">${stats.totalRemaining.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-black">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Échéances Dépassées</p>
              <p className="text-2xl font-black italic text-rose-500">{stats.totalOverdueCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-black">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Litiges Ouverts</p>
              <p className="text-2xl font-black italic text-purple-500">{stats.totalDisputesCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dossiers en Dette</p>
              <p className="text-2xl font-black italic text-foreground">{stats.totalDebtorsCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTRES & RECHERCHE */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-3xl border border-border/80">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou formation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 rounded-xl bg-background/80"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
            className="rounded-xl text-xs font-bold"
          >
            Tous ({debtors.length})
          </Button>

          <Button
            variant={filterStatus === "overdue" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("overdue")}
            className="rounded-xl text-xs font-bold"
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> En retard ({stats.totalOverdueCount})
          </Button>

          <Button
            variant={filterStatus === "disputed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("disputed")}
            className={`rounded-xl text-xs font-bold ${
              filterStatus === "disputed" ? "bg-purple-600 text-white" : "border-purple-500/30 text-purple-500"
            }`}
          >
            <Scale className="w-3.5 h-3.5 mr-1" /> Litiges ({stats.totalDisputesCount})
          </Button>

          <Button
            variant={filterStatus === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("upcoming")}
            className="rounded-xl text-xs font-bold"
          >
            Échéance future
          </Button>
        </div>
      </div>

      {/* REGISTRE LOGIQUE DES DETTES AVEC TIMELINE D'ÉCHÉANCES */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground font-black text-xs uppercase animate-pulse">
            Chargement des échéanciers et des soldes...
          </div>
        ) : filteredDebtors.length === 0 ? (
          <Card className="rounded-3xl p-12 text-center text-muted-foreground space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 opacity-60" />
            <p className="font-black uppercase text-sm">Tous les comptes sont à jour !</p>
            <p className="text-xs">Aucun étudiant n'a de tranche en retard ou de dette impayée.</p>
          </Card>
        ) : (
          filteredDebtors.map((d: any) => {
            const total = Number(d.total_amount) || 0;
            const paid = Number(d.paid_amount) || 0;
            const remaining = Number(d.remaining_amount) || 0;
            const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
            const schedules: any[] = d.schedules || [];
            
            const isOverdue = d.next_due_date && isPast(new Date(d.next_due_date));
            const daysOverdue = d.next_due_date ? differenceInDays(new Date(), new Date(d.next_due_date)) : 0;
            const isDisputed = d.is_disputed === true;
            const isExpanded = expandedStudentId === d.purchase_id;

            return (
              <Card
                key={d.purchase_id}
                className={`rounded-[2.5rem] border transition-all overflow-hidden ${
                  isDisputed
                    ? "border-purple-500/40 bg-purple-500/[0.03]"
                    : isOverdue
                    ? "border-rose-500/40 bg-rose-500/[0.03]"
                    : "border-border bg-card/60"
                }`}
              >
                {/* LIGNE PRINCIPALE DE L'ÉTUDIANT */}
                <div className="p-6 md:p-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
                  {/* Infos Étudiant */}
                  <div className="flex items-center gap-4 min-w-[300px]">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${
                      isDisputed ? "bg-purple-500/20 text-purple-500" : isOverdue ? "bg-rose-500/20 text-rose-500" : "bg-amber-500/20 text-amber-500"
                    }`}>
                      {isDisputed ? <Scale className="w-7 h-7" /> : d.student_name?.charAt(0) || "U"}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-foreground uppercase tracking-tight">
                          {d.student_name}
                        </h3>
                        {isDisputed ? (
                          <Badge className="bg-purple-600 text-white font-black text-[9px] uppercase px-2 animate-pulse">
                            ⚖️ Litige Ouvert
                          </Badge>
                        ) : isOverdue ? (
                          <Badge variant="destructive" className="font-black text-[9px] uppercase px-2">
                            Retard {daysOverdue} jours
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] font-bold uppercase text-amber-500 border-amber-500/30">
                            En cours de paiement
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-primary font-bold">{d.course_title}</p>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {d.student_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {d.student_phone}
                          </span>
                        )}
                        {d.student_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {d.student_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progression & Soldes */}
                  <div className="w-full xl:w-80 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Versé : <strong className="text-emerald-500">${paid}</strong></span>
                      <span>Dette restante : <strong className={isDisputed ? "text-purple-400" : "text-rose-500"}>${remaining}</strong></span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isDisputed
                            ? "bg-gradient-to-r from-purple-500 to-emerald-500"
                            : "bg-gradient-to-r from-amber-500 to-emerald-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Total Formation : ${total}</span>
                      <span className="font-black">{progress}% réglé</span>
                    </div>
                  </div>

                  {/* Prochaine Échéance Logique */}
                  <div className="text-left xl:text-right space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Prochaine Échéance</p>
                    {isDisputed ? (
                      <span className="text-xs text-purple-400 font-bold uppercase">Litige à régulariser</span>
                    ) : d.next_due_date ? (
                      <p className={`font-black text-sm ${isOverdue ? "text-rose-500" : "text-foreground"}`}>
                        {format(new Date(d.next_due_date), "dd MMMM yyyy", { locale: fr })}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Non planifiée</p>
                    )}
                  </div>

                  {/* Boutons d'Action Rapide */}
                  <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
                    {isDisputed ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setDisputeResolveModalData(d);
                          setDisputePayAmount(remaining);
                        }}
                        className="rounded-xl font-black text-xs uppercase bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Gavel className="w-4 h-4 mr-1.5" /> Régulariser Litige
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setFreePaymentModalData(d);
                          setFreeAmount(remaining);
                        }}
                        className="rounded-xl font-black text-xs uppercase bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <DollarSign className="w-4 h-4 mr-1" /> Encaisser Versement
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReminderModalData(d);
                        setReminderMessage(
                          `Bonjour ${d.student_name}, rappel de l'administration Botes Academy pour votre formation ${d.course_title} : votre solde restant dû est de ${remaining}$. Merci de passer à la réception pour régulariser votre dossier.`
                        );
                      }}
                      className="rounded-xl font-bold text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" /> Relance
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedStudentId(isExpanded ? null : d.purchase_id)}
                      className="rounded-xl font-bold text-xs gap-1"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      Échéancier ({schedules.length})
                    </Button>
                  </div>
                </div>

                {/* TIMELINE VISUELLE DE L'ÉCHÉANCIER DÉTAILLÉ (ACCORDÉON) */}
                {isExpanded && (
                  <div className="border-t border-border/60 bg-muted/20 p-6 md:p-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="w-4 h-4 text-primary" />
                        <h4 className="font-black text-xs uppercase tracking-wider text-foreground">
                          Détail des Tranches Planifiées & Échéances
                        </h4>
                      </div>
                    </div>

                    {schedules.length === 0 ? (
                      <div className="text-center py-6 text-xs text-muted-foreground italic">
                        Aucune tranche programmée. Utilisez "Encaisser Versement" pour solder la dette de manière libre.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {schedules.map((sch) => {
                          const isPaid = sch.status === "paid";
                          const isLate = !isPaid && sch.due_date && isPast(new Date(sch.due_date));
                          const daysLate = sch.due_date ? differenceInDays(new Date(), new Date(sch.due_date)) : 0;

                          return (
                            <div
                              key={sch.id}
                              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                                isPaid
                                  ? "bg-emerald-500/5 border-emerald-500/30"
                                  : isLate
                                  ? "bg-rose-500/5 border-rose-500/40"
                                  : "bg-card border-border"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs uppercase">
                                  Tranche #{sch.installment_number}
                                </span>
                                <Badge
                                  className={`text-[9px] font-black uppercase ${
                                    isPaid
                                      ? "bg-emerald-500 text-white"
                                      : isLate
                                      ? "bg-rose-500 text-white"
                                      : "bg-amber-500 text-black"
                                  }`}
                                >
                                  {isPaid ? "✓ Payée" : isLate ? `Retard ${daysLate}j` : "À Venir"}
                                </Badge>
                              </div>

                              <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-black text-foreground">${sch.amount}</span>
                                <span className="text-xs font-bold text-muted-foreground">
                                  Échéance : {format(new Date(sch.due_date), "dd/MM/yyyy")}
                                </span>
                              </div>

                              {sch.notes && (
                                <p className="text-[11px] text-muted-foreground italic truncate">{sch.notes}</p>
                              )}

                              {!isPaid && (
                                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      setPayScheduleModalData({
                                        schedule: sch,
                                        studentName: d.student_name,
                                        courseTitle: d.course_title
                                      })
                                    }
                                    className="flex-1 rounded-xl h-8 text-[10px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Valider (${sch.amount})
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setRescheduleModalData({
                                        schedule: sch,
                                        studentName: d.student_name
                                      });
                                      setNewDueDate(sch.due_date);
                                    }}
                                    className="rounded-xl h-8 text-[10px] font-bold"
                                  >
                                    Reporter
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* MODAL ENCAISSER TRANCHE SPÉCIFIQUE */}
      <Dialog open={!!payScheduleModalData} onOpenChange={(o) => !o && setPayScheduleModalData(null)}>
        <DialogContent className="rounded-3xl bg-card border-border max-w-lg shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tight">
              Valider le Règlement de la Tranche #{payScheduleModalData?.schedule?.installment_number}
            </DialogTitle>
            <DialogDescription>
              Étudiant : <strong>{payScheduleModalData?.studentName}</strong> — Montant :{" "}
              <strong className="text-emerald-500">${payScheduleModalData?.schedule?.amount}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Moyen de Paiement *</Label>
              <Select value={schedulePaymentMethod} onValueChange={setSchedulePaymentMethod}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces (Cash Réception)</SelectItem>
                  <SelectItem value="mobile_money">M-Pesa / Orange / Airtel Money</SelectItem>
                  <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                  <SelectItem value="pos">Terminal Carte / POS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note / Référence du reçu</Label>
              <Input
                placeholder="ex: Reçu #REC-0095"
                value={schedulePaymentNotes}
                onChange={(e) => setSchedulePaymentNotes(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayScheduleModalData(null)} className="rounded-xl font-bold">
              Annuler
            </Button>
            <Button
              disabled={payScheduleMutation.isPending}
              onClick={() => payScheduleMutation.mutate()}
              className="rounded-xl font-black uppercase text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {payScheduleMutation.isPending ? "Validation..." : "Confirmer l'Encaissement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL REPORTER UNE ÉCHÉANCE */}
      <Dialog open={!!rescheduleModalData} onOpenChange={(o) => !o && setRescheduleModalData(null)}>
        <DialogContent className="rounded-3xl bg-card border-border max-w-lg shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tight">
              Accorder un Report d'Échéance
            </DialogTitle>
            <DialogDescription>
              Étudiant : <strong>{rescheduleModalData?.studentName}</strong> (Tranche #{rescheduleModalData?.schedule?.installment_number})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nouvelle Date Limite d'Échéance *</Label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="h-12 rounded-xl text-sm font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label>Motif du Report / Accord</Label>
              <Textarea
                placeholder="ex: Délai de 15 jours accordé suite à une demande écrite..."
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                className="rounded-xl h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleModalData(null)} className="rounded-xl font-bold">
              Annuler
            </Button>
            <Button
              disabled={rescheduleMutation.isPending || !newDueDate}
              onClick={() => rescheduleMutation.mutate()}
              className="rounded-xl font-black uppercase text-xs bg-primary text-primary-foreground"
            >
              {rescheduleMutation.isPending ? "Enregistrement..." : "Valider le Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL ENCAISSEMENT LIBRE */}
      <Dialog open={!!freePaymentModalData} onOpenChange={(o) => !o && setFreePaymentModalData(null)}>
        <DialogContent className="rounded-3xl bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tight">
              Encaisser un Versement Libre
            </DialogTitle>
            <DialogDescription>
              Étudiant : <strong>{freePaymentModalData?.student_name}</strong> — {freePaymentModalData?.course_title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border flex justify-between items-center text-sm">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Solde dû</p>
                <p className="text-xl font-black text-amber-500">${freePaymentModalData?.remaining_amount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Déjà réglé</p>
                <p className="text-xl font-black text-emerald-500">${freePaymentModalData?.paid_amount}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Montant Encaissé ($) *</Label>
              <Input
                type="number"
                min={1}
                max={freePaymentModalData?.remaining_amount}
                value={freeAmount}
                onChange={(e) => setFreeAmount(Number(e.target.value) || 0)}
                className="h-12 rounded-xl text-lg font-black text-primary"
              />
            </div>

            <div className="space-y-2">
              <Label>Moyen de Paiement *</Label>
              <Select value={freeMethod} onValueChange={setFreeMethod}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces (Cash Réception)</SelectItem>
                  <SelectItem value="mobile_money">M-Pesa / Orange / Airtel Money</SelectItem>
                  <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                  <SelectItem value="pos">Terminal Carte / POS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note / Référence</Label>
              <Input
                placeholder="ex: Reçu #REC-0099"
                value={freeNotes}
                onChange={(e) => setFreeNotes(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFreePaymentModalData(null)} className="rounded-xl font-bold">
              Annuler
            </Button>
            <Button
              disabled={recordFreePaymentMutation.isPending || freeAmount <= 0}
              onClick={() => recordFreePaymentMutation.mutate()}
              className="rounded-xl font-black uppercase text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {recordFreePaymentMutation.isPending ? "Validation..." : "Valider l'Encaissement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL RÉGULARISATION LITIGE */}
      <Dialog open={!!disputeResolveModalData} onOpenChange={(o) => !o && setDisputeResolveModalData(null)}>
        <DialogContent className="rounded-3xl bg-card border-purple-500/30 max-w-lg shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tight">
              Compléter les Frais & Lever le Litige
            </DialogTitle>
            <DialogDescription>
              Étudiant : <strong>{disputeResolveModalData?.student_name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {disputeResolveModalData?.dispute_reason && (
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
                <span className="font-black uppercase text-[10px] text-purple-400">Motif du litige :</span>
                <p className="text-foreground font-medium">{disputeResolveModalData.dispute_reason}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Montant du Versement de Régularisation ($) *</Label>
              <Input
                type="number"
                min={0}
                value={disputePayAmount}
                onChange={(e) => setDisputePayAmount(Number(e.target.value) || 0)}
                className="h-12 rounded-xl text-lg font-black text-purple-400"
              />
            </div>

            <div className="space-y-2">
              <Label>Moyen de Paiement *</Label>
              <Select value={disputePayMethod} onValueChange={setDisputePayMethod}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces (Cash Réception)</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note d'accord</Label>
              <Textarea
                placeholder="Régularisation effectuée après accord..."
                value={disputeResolutionNotes}
                onChange={(e) => setDisputeResolutionNotes(e.target.value)}
                className="rounded-xl h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeResolveModalData(null)} className="rounded-xl">
              Annuler
            </Button>
            <Button
              disabled={resolveDisputeMutation.isPending}
              onClick={() => resolveDisputeMutation.mutate()}
              className="rounded-xl font-black uppercase text-xs bg-purple-600 hover:bg-purple-700 text-white"
            >
              {resolveDisputeMutation.isPending ? "Validation..." : "Valider & Clôturer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL RELANCE / RAPPEL */}
      <Dialog open={!!reminderModalData} onOpenChange={(o) => !o && setReminderModalData(null)}>
        <DialogContent className="rounded-3xl bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tight">
              Envoyer une Relance de Dette
            </DialogTitle>
            <DialogDescription>
              Destinataire : <strong>{reminderModalData?.student_name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Message de notification</Label>
              <Textarea
                rows={5}
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderModalData(null)} className="rounded-xl font-bold">
              Annuler
            </Button>
            <Button
              disabled={sendReminderMutation.isPending}
              onClick={() => sendReminderMutation.mutate()}
              className="rounded-xl font-black uppercase text-xs bg-amber-500 hover:bg-amber-600 text-black font-bold"
            >
              {sendReminderMutation.isPending ? "Envoi..." : "Envoyer la Relance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
