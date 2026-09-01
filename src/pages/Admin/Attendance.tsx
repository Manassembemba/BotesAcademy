import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Search, 
  Calendar as CalendarIcon, 
  Sun, 
  Sunset, 
  Moon, 
  Sparkles,
  DollarSign,
  Phone,
  AlertCircle,
  FileSpreadsheet,
  CheckCheck,
  CreditCard,
  Scale,
  Gavel
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const VACATIONS = [
  { id: "MATIN", label: "Matin", time: "08h00 - 11h00", icon: Sun, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30" },
  { id: "MIDI", label: "Midi", time: "11h30 - 14h30", icon: Sunset, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30" },
  { id: "SOIR", label: "Soir", time: "16h00 - 19h00", icon: Moon, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30" }
];

export default function Attendance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedVacation, setSelectedVacation] = useState<string>("MATIN");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Note de présence
  const [noteDialogStudent, setNoteDialogStudent] = useState<any>(null);
  const [attendanceNote, setAttendanceNote] = useState<string>("");

  // Modal Encaissement Direct / Complément de Frais
  const [paymentModalData, setPaymentModalData] = useState<any>(null);
  const [installmentAmount, setInstallmentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  // 1. Charger la liste des formations
  const { data: courses = [] } = useQuery({
    queryKey: ["admin-attendance-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, category, mode, price")
        .order("title");
      if (error) throw error;
      return data || [];
    }
  });

  if (courses.length > 0 && !selectedCourseId) {
    setSelectedCourseId(courses[0].id);
  }

  // 2. Charger TOUS les étudiants inscrits à la formation sélectionnée avec leur état financier
  const { data: enrolledStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["admin-enrolled-students", selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          id,
          user_id,
          vacation_name,
          payment_status,
          paid_amount,
          total_amount,
          is_disputed,
          dispute_reason,
          enrollment_status,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            phone,
            matricule
          )
        `)
        .eq("course_id", selectedCourseId)
        .eq("product_type", "course");

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCourseId
  });

  // 3. Charger les pointages existants pour cette formation à cette date
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ["admin-attendance-records", selectedCourseId, selectedDate],
    queryFn: async () => {
      if (!selectedCourseId || !selectedDate) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("course_id", selectedCourseId)
        .eq("date", selectedDate);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCourseId && !!selectedDate
  });

  // Associer chaque étudiant avec son pointage du jour
  const attendanceMap = useMemo(() => {
    const map = new Map<string, any>();
    attendanceRecords.forEach((rec) => {
      map.set(rec.student_id, rec);
    });
    return map;
  }, [attendanceRecords]);

  // Mutation pour pointer la présence
  const markAttendanceMutation = useMutation({
    mutationFn: async ({
      studentId,
      status,
      vacation,
      notes
    }: {
      studentId: string;
      status: "present" | "late" | "absent";
      vacation: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc("record_attendance_flexible", {
        p_student_id: studentId,
        p_course_id: selectedCourseId,
        p_session_id: null,
        p_vacation_name: vacation,
        p_date: selectedDate,
        p_status: status,
        p_notes: notes || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-attendance-records", selectedCourseId, selectedDate]
      });
      const labels = { present: "Présent", late: "En retard", absent: "Absent" };
      toast.success(`Pointé : ${labels[variables.status]} (${variables.vacation})`);
    },
    onError: (err: any) => {
      toast.error(`Erreur de pointage : ${err.message}`);
    }
  });

  // Mutation pour encaisser directement un versement / compléter une dette
  const recordInstallmentMutation = useMutation({
    mutationFn: async () => {
      if (!paymentModalData?.id || installmentAmount <= 0) {
        throw new Error("Montant invalide");
      }

      // Si le dossier est en litige, on utilise resolve_student_dispute_and_pay
      if (paymentModalData.is_disputed) {
        const { error: dispErr } = await supabase.rpc("resolve_student_dispute_and_pay", {
          p_purchase_id: paymentModalData.id,
          p_payment_amount: installmentAmount,
          p_payment_method: paymentMethod,
          p_resolution_notes: paymentNotes || "Régularisation effectuée lors du pointage",
          p_admin_id: user?.id
        });
        if (dispErr) throw dispErr;
      } else {
        // Encaissement normal dans payment_installments
        const { error: instErr } = await supabase
          .from("payment_installments")
          .insert({
            purchase_id: paymentModalData.id,
            amount: installmentAmount,
            payment_method: paymentMethod,
            admin_id: user?.id,
            notes: paymentNotes || "Versement perçu lors de la session de présence"
          });
        if (instErr) throw instErr;

        // Notification à l'étudiant
        await supabase.from("notifications").insert({
          user_id: paymentModalData.user_id,
          title: "Reçu de paiement enregistré",
          message: `Votre versement de ${installmentAmount}$ pour votre formation a été perçu avec succès.`,
          type: "success",
          link: "/profile"
        });
      }
    },
    onSuccess: () => {
      toast.success("Versement enregistré avec succès ! Le solde est actualisé.");
      queryClient.invalidateQueries({ queryKey: ["admin-enrolled-students", selectedCourseId] });
      queryClient.invalidateQueries({ queryKey: ["admin-debtors-overview"] });
      setPaymentModalData(null);
      setInstallmentAmount(0);
      setPaymentNotes("");
    },
    onError: (err: any) => {
      toast.error(`Erreur d'encaissement : ${err.message}`);
    }
  });

  // Tout marquer présent pour le créneau actif
  const markAllPresent = async () => {
    if (!enrolledStudents.length) return;
    try {
      for (const item of enrolledStudents) {
        const student = item.profiles as any;
        if (!student?.id) continue;
        await supabase.rpc("record_attendance_flexible", {
          p_student_id: student.id,
          p_course_id: selectedCourseId,
          p_session_id: null,
          p_vacation_name: selectedVacation,
          p_date: selectedDate,
          p_status: "present",
          p_notes: null
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["admin-attendance-records", selectedCourseId, selectedDate]
      });
      toast.success(`Tous les étudiants ont été marqués présents pour la session ${selectedVacation} !`);
    } catch (e: any) {
      toast.error(`Erreur : ${e.message}`);
    }
  };

  // Filtrer les étudiants
  const filteredStudents = useMemo(() => {
    return enrolledStudents.filter((item) => {
      const profile = item.profiles as any;
      if (!profile) return false;
      const matchSearch =
        profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.phone?.includes(searchTerm) ||
        profile.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [enrolledStudents, searchTerm]);

  // Calcul des statistiques du jour
  const stats = useMemo(() => {
    const total = enrolledStudents.length;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let vacationBreakdown: Record<string, number> = { MATIN: 0, MIDI: 0, SOIR: 0 };
    let totalDebtCount = 0;
    let totalDisputeCount = 0;

    enrolledStudents.forEach((st) => {
      const tot = Number(st.total_amount) || 0;
      const paid = Number(st.paid_amount) || 0;
      if (tot > paid) totalDebtCount++;
      if (st.is_disputed) totalDisputeCount++;
    });

    attendanceRecords.forEach((r) => {
      if (r.status === "present") presentCount++;
      if (r.status === "late") lateCount++;
      if (r.status === "absent") absentCount++;
      if (r.vacation_name && vacationBreakdown[r.vacation_name] !== undefined) {
        vacationBreakdown[r.vacation_name]++;
      }
    });

    const totalPointes = presentCount + lateCount;
    const rate = total > 0 ? Math.round((totalPointes / total) * 100) : 0;

    return { total, presentCount, lateCount, absentCount, rate, vacationBreakdown, totalDebtCount, totalDisputeCount };
  }, [enrolledStudents, attendanceRecords]);

  const selectedCourseObj = courses.find((c) => c.id === selectedCourseId);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-24 max-w-7xl">
      {/* HEADER UNIFIÉ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
            Feuille d'Émargement & Recouvrement
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Pointage & Présences — Sessions
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pointez les présences et encaissez les frais restants directement à l'arrivée des élèves.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-card border border-border/60 px-3 py-2 rounded-xl shadow-xs">
          <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-none bg-transparent font-semibold text-sm h-8 w-36 p-0 focus-visible:ring-0"
          />
        </div>
      </div>

      {/* STATS RAPIDES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inscrits au Cursus</p>
              <p className="text-2xl font-black italic">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Présents Aujourd'hui</p>
              <p className="text-2xl font-black italic text-emerald-500">{stats.presentCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Étudiants avec Dette</p>
              <p className="text-2xl font-black italic text-amber-500">{stats.totalDebtCount}</p>
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
              <p className="text-2xl font-black italic text-purple-500">{stats.totalDisputeCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SÉLECTEURS DE FORMATION ET CRÉNEAUX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Sélection Formation */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Formation Actuelle
          </Label>
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="h-14 rounded-2xl font-black text-sm bg-card border-border shadow-sm">
              <SelectValue placeholder="Choisir une formation" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id} className="font-bold">
                  {c.title} ({c.category || "Cursus"}) — {c.price}$
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Créneau Actuel (Matin / Midi / Soir) */}
        <div className="lg:col-span-2 space-y-2">
          <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Session de Pointage (Créneau)
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {VACATIONS.map((v) => {
              const Icon = v.icon;
              const isSelected = selectedVacation === v.id;
              const countInVacation = stats.vacationBreakdown[v.id] || 0;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVacation(v.id)}
                  className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-between px-4 ${
                    isSelected
                      ? `${v.bg} shadow-md`
                      : "bg-card/50 border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <Icon className={`w-6 h-6 ${v.color}`} />
                    <div>
                      <p className="font-black text-xs uppercase italic text-foreground leading-none">{v.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{v.time}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-black text-[10px] bg-background/80">
                    {countInVacation} venus
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BARRE D'OUTILS ET RECHERCHE */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-3xl border border-border/80">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Vérifier par Code d'Accès, Matricule, Nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 rounded-xl bg-background/80"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllPresent}
            className="h-11 px-5 rounded-xl font-black uppercase text-xs tracking-wider border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
          >
            <CheckCheck className="w-4 h-4 mr-2" /> Tout pointer présent ({selectedVacation})
          </Button>
        </div>
      </div>

      {/* LISTE DES ÉTUDIANTS AVEC ÉTAT FINANCIER & POINTAGE */}
      <Card className="rounded-[2.5rem] border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardHeader className="p-6 md:p-8 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-black uppercase italic tracking-tight">
                Registre des Présences & Frais : {selectedCourseObj?.title}
              </CardTitle>
              <CardDescription>
                Pointage du {format(new Date(selectedDate), "EEEE dd MMMM yyyy", { locale: fr })} — Session {selectedVacation}
              </CardDescription>
            </div>
            <Badge className="bg-primary/20 text-primary border-none font-black text-xs py-1.5 px-4 self-start sm:self-auto">
              {filteredStudents.length} Étudiants Inscrits
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingStudents ? (
            <div className="py-20 text-center text-muted-foreground font-black text-xs uppercase animate-pulse">
              Chargement des inscrits et des finances...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground space-y-3">
              <Users className="w-12 h-12 mx-auto opacity-20" />
              <p className="font-black uppercase text-sm">Aucun étudiant trouvé pour cette formation</p>
              <p className="text-xs">Utilisez le module d'inscription pour ajouter des élèves.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filteredStudents.map((item) => {
                const profile = item.profiles as any;
                const studentId = profile?.id;
                const record = attendanceMap.get(studentId);
                const isPresent = record?.status === "present";
                const isLate = record?.status === "late";
                const isAbsent = record?.status === "absent";

                // Calculs financiers
                const total = Number(item.total_amount) || 0;
                const paid = Number(item.paid_amount) || 0;
                const remaining = total - paid;
                const isDebt = remaining > 0;
                const isDisputed = item.is_disputed === true;

                return (
                  <div
                    key={item.id}
                    className={`p-4 md:p-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 transition-all ${
                      isDisputed
                        ? "bg-purple-500/10 border-l-4 border-purple-500"
                        : isPresent
                        ? "bg-emerald-500/5"
                        : isLate
                        ? "bg-amber-500/5"
                        : isAbsent
                        ? "bg-rose-500/5"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    {/* 1. Infos Étudiant */}
                    <div className="flex items-center gap-4 min-w-[280px]">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-sm ${
                          isDisputed ? "bg-purple-500/20 text-purple-500" : "bg-primary/20 text-primary"
                        }`}>
                          {isDisputed ? <Scale className="w-6 h-6" /> : profile?.full_name?.charAt(0) || "E"}
                        </div>
                        {isPresent && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground uppercase tracking-tight">
                            {profile?.full_name}
                          </h4>
                          <span className="text-[9px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                            {profile?.matricule || `BOTES-${studentId?.slice(0, 6)?.toUpperCase()}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {profile?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {profile.phone}
                            </span>
                          )}
                          <span className="text-[10px] font-bold uppercase opacity-70">
                            Vacation : {item.vacation_name || "Matin"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. VISION FINANCIÈRE & BOUTON COMPLÉTER DETTE */}
                    <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-2xl border border-border/80 min-w-[280px] justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {isDisputed ? (
                            <Badge className="bg-purple-600 text-white font-bold text-[9px] uppercase px-2">
                              En Litige
                            </Badge>
                          ) : !isDebt ? (
                            <Badge className="bg-emerald-500 text-white font-bold text-[9px] uppercase px-2">
                              Soldé
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-black uppercase text-amber-500 border-amber-500/40 bg-amber-500/10">
                              Dette : {remaining}$
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Payé : <strong className="text-foreground">{paid}$</strong> sur <strong>{total}$</strong>
                        </p>
                      </div>

                      {/* Bouton Encaisser direct si dette ou litige */}
                      {(isDebt || isDisputed) && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setPaymentModalData({
                              ...item,
                              student_name: profile?.full_name,
                              course_title: selectedCourseObj?.title,
                              remaining_amount: remaining
                            });
                            setInstallmentAmount(remaining);
                          }}
                          className={`rounded-xl font-black text-[10px] uppercase tracking-wider h-8 px-3 ${
                            isDisputed
                              ? "bg-purple-600 hover:bg-purple-700 text-white"
                              : "bg-amber-500 hover:bg-amber-600 text-black font-black"
                          }`}
                        >
                          <DollarSign className="w-3.5 h-3.5 mr-1" />
                          {isDisputed ? "Régulariser" : "Encaisser"}
                        </Button>
                      )}
                    </div>

                    {/* 3. Statut du pointage actuel */}
                    <div className="flex items-center gap-3">
                      {record ? (
                        <div className="text-right">
                          <Badge
                            className={`font-black text-[10px] uppercase tracking-wider ${
                              isPresent
                                ? "bg-emerald-500 text-white"
                                : isLate
                                ? "bg-amber-500 text-white"
                                : "bg-rose-500 text-white"
                            }`}
                          >
                            {isPresent ? "Présent" : isLate ? "Retard" : "Absent"} ({record.vacation_name})
                          </Badge>
                          {record.notes && (
                            <p className="text-[10px] text-muted-foreground italic mt-0.5 truncate max-w-xs">
                              Note : {record.notes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Non pointé</span>
                      )}
                    </div>

                    {/* 4. Boutons d'Action de Pointage Instantané */}
                    <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
                      <Button
                        size="sm"
                        variant={isPresent ? "default" : "outline"}
                        onClick={() =>
                          markAttendanceMutation.mutate({
                            studentId,
                            status: "present",
                            vacation: selectedVacation
                          })
                        }
                        className={`rounded-xl font-black text-xs ${
                          isPresent
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                            : "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Présent
                      </Button>

                      <Button
                        size="sm"
                        variant={isLate ? "default" : "outline"}
                        onClick={() =>
                          markAttendanceMutation.mutate({
                            studentId,
                            status: "late",
                            vacation: selectedVacation
                          })
                        }
                        className={`rounded-xl font-black text-xs ${
                          isLate
                            ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md"
                            : "border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                        }`}
                      >
                        <Clock className="w-4 h-4 mr-1.5" /> Retard
                      </Button>

                      <Button
                        size="sm"
                        variant={isAbsent ? "default" : "outline"}
                        onClick={() =>
                          markAttendanceMutation.mutate({
                            studentId,
                            status: "absent",
                            vacation: selectedVacation
                          })
                        }
                        className={`rounded-xl font-black text-xs ${
                          isAbsent
                            ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md"
                            : "border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                        }`}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Absent
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setNoteDialogStudent({ id: studentId, name: profile?.full_name });
                          setAttendanceNote(record?.notes || "");
                        }}
                        className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground"
                        title="Ajouter une note"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL ENCAISSEMENT DIRECT DEPUIS LA FEUILLE DE PRÉSENCE */}
      <Dialog open={!!paymentModalData} onOpenChange={(o) => !o && setPaymentModalData(null)}>
        <DialogContent className="rounded-3xl bg-card border-border max-w-lg shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight">
              {paymentModalData?.is_disputed ? "Régulariser le Litige / Complément" : "Encaisser un Versement de Frais"}
            </DialogTitle>
            <DialogDescription>
              Étudiant : <strong>{paymentModalData?.student_name}</strong> — {paymentModalData?.course_title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border flex justify-between items-center text-sm">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Solde restant dû</p>
                <p className="text-xl font-black text-amber-500">{paymentModalData?.remaining_amount}$</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Déjà versé</p>
                <p className="text-xl font-black text-emerald-500">{paymentModalData?.paid_amount}$</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Montant perçu en séance ($) *</Label>
              <Input
                type="number"
                min={1}
                max={paymentModalData?.remaining_amount}
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(Number(e.target.value) || 0)}
                className="h-12 rounded-xl text-lg font-black text-primary"
              />
            </div>

            <div className="space-y-2">
              <Label>Moyen de Paiement *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces (Cash Réception / Salle)</SelectItem>
                  <SelectItem value="mobile_money">M-Pesa / Orange / Airtel Money</SelectItem>
                  <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                  <SelectItem value="pos">Terminal Carte / POS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note / Référence de reçu</Label>
              <Input
                placeholder="ex: Reçu #REC-0091 ou Tranche 2/3"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentModalData(null)} className="rounded-xl font-bold">
              Annuler
            </Button>
            <Button
              disabled={recordInstallmentMutation.isPending || installmentAmount <= 0}
              onClick={() => recordInstallmentMutation.mutate()}
              className="rounded-xl font-black uppercase text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {recordInstallmentMutation.isPending ? "Validation..." : "Valider l'Encaissement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG NOTE SUR PRÉSENCE */}
      <Dialog open={!!noteDialogStudent} onOpenChange={(o) => !o && setNoteDialogStudent(null)}>
        <DialogContent className="rounded-3xl bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black uppercase italic">
              Note de présence : {noteDialogStudent?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Observation / Motif d'absence ou retard</Label>
            <Textarea
              placeholder="ex: Retard justifié pour embouteillage, ou malade..."
              value={attendanceNote}
              onChange={(e) => setAttendanceNote(e.target.value)}
              className="rounded-xl h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogStudent(null)} className="rounded-xl">
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (noteDialogStudent?.id) {
                  markAttendanceMutation.mutate({
                    studentId: noteDialogStudent.id,
                    status: attendanceMap.get(noteDialogStudent.id)?.status || "present",
                    vacation: selectedVacation,
                    notes: attendanceNote
                  });
                  setNoteDialogStudent(null);
                }
              }}
              className="rounded-xl font-bold bg-primary text-primary-foreground"
            >
              Enregistrer la note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
