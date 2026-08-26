import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserCheck, 
  BookOpen, 
  CreditCard, 
  CheckCircle2, 
  Search, 
  UserPlus, 
  Calendar, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ShieldCheck,
  AlertCircle,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addDays, addMonths } from "date-fns";
import { fr } from "date-fns/locale";

interface InstallmentPlanItem {
  installment_number: number;
  amount: number;
  due_date: string;
  notes: string;
}

export default function EnrollmentWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Étape courante (1: Étudiant, 2: Formation & Créneau, 3: Modalité Paiement & Tranches, 4: Récapitulatif)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Étape 1 : Étudiant
  const [studentMode, setStudentMode] = useState<"existing" | "new">("existing");
  const [searchStudentTerm, setSearchStudentTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newStudent, setNewStudent] = useState({
    full_name: "",
    email: "",
    phone: "",
    gender: "M"
  });

  // Étape 2 : Formation & Créneau
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedVacationName, setSelectedVacationName] = useState<string>("MATIN");

  // Étape 3 : Paiement & Tranches
  const [paymentType, setPaymentType] = useState<"full" | "installments">("full");
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [customTotalAmount, setCustomTotalAmount] = useState<number | null>(null);
  const [installmentCount, setInstallmentCount] = useState<number>(2);
  const [installments, setInstallments] = useState<InstallmentPlanItem[]>([]);

  // 1. Charger la liste des étudiants
  const { data: studentsList = [] } = useQuery({
    queryKey: ["admin-students-search", searchStudentTerm],
    queryFn: async () => {
      let q = supabase.from("profiles").select("id, full_name, avatar_url, phone");
      if (searchStudentTerm.trim()) {
        q = q.ilike("full_name", `%${searchStudentTerm.trim()}%`);
      }
      const { data, error } = await q.limit(10);
      if (error) throw error;
      return data || [];
    }
  });

  // 2. Charger les formations
  const { data: courses = [] } = useQuery({
    queryKey: ["admin-enrollment-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("status", "published")
        .order("title");
      if (error) throw error;
      return data || [];
    }
  });

  // 3. Charger les sessions pour la formation sélectionnée
  const { data: sessions = [] } = useQuery({
    queryKey: ["admin-course-sessions", selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const { data, error } = await supabase
        .from("course_sessions")
        .select("*")
        .eq("course_id", selectedCourseId)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCourseId
  });

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const effectiveTotalAmount = customTotalAmount !== null ? customTotalAmount : (selectedCourse?.price || 0);
  const remainingBalance = Math.max(0, effectiveTotalAmount - initialPaymentAmount);

  // Générer automatiquement les tranches
  const generateInstallments = (count: number, remAmount: number) => {
    if (remAmount <= 0 || count <= 0) {
      setInstallments([]);
      return;
    }
    const perTranche = Math.round((remAmount / count) * 100) / 100;
    const newItems: InstallmentPlanItem[] = [];
    
    for (let i = 1; i <= count; i++) {
      // Échéance tous les 30 jours
      const dueDate = format(addDays(new Date(), i * 30), "yyyy-MM-dd");
      // Ajustement pour les centimes sur la dernière tranche
      const amount = i === count ? Math.round((remAmount - perTranche * (count - 1)) * 100) / 100 : perTranche;
      
      newItems.push({
        installment_number: i,
        amount: amount,
        due_date: dueDate,
        notes: `Tranche ${i}/${count}`
      });
    }
    setInstallments(newItems);
  };

  // Mettre à jour une tranche manuellement
  const updateInstallment = (index: number, field: keyof InstallmentPlanItem, value: any) => {
    const updated = [...installments];
    updated[index] = { ...updated[index], [field]: value };
    setInstallments(updated);
  };

  // Mutation pour créer un nouvel utilisateur et l'inscrire
  const enrollMutation = useMutation({
    mutationFn: async () => {
      let targetUserId = selectedStudent?.id;

      // Si nouvel étudiant, on l'enregistre via la fonction ou la création de profil
      if (studentMode === "new") {
        if (!newStudent.full_name) {
          throw new Error("Veuillez saisir le nom complet de l'étudiant");
        }

        const { data: regRes, error: regErr } = await supabase.functions.invoke("admin-register-student", {
          body: {
            fullName: newStudent.full_name,
            email: newStudent.email || undefined,
            phone: newStudent.phone,
            courseId: selectedCourseId,
            amount: 0, // enroll_student_with_plan ci-dessous s'occupe de l'enregistrement financier exact
            paymentMethod: paymentMethod,
            adminId: user?.id
          }
        });

        if (regErr || regRes?.error) {
          throw new Error(regErr?.message || regRes?.error || "Erreur lors de la création du compte étudiant");
        }

        targetUserId = regRes.userId;
      }

      if (!targetUserId) throw new Error("Aucun étudiant sélectionné");
      if (!selectedCourseId) throw new Error("Veuillez sélectionner une formation");

      // Appel de la fonction RPC enroll_student_with_plan
      const { data, error } = await supabase.rpc("enroll_student_with_plan", {
        p_user_id: targetUserId,
        p_course_id: selectedCourseId,
        p_session_id: selectedSessionId || null,
        p_vacation_name: selectedVacationName,
        p_initial_amount: initialPaymentAmount,
        p_total_amount: effectiveTotalAmount,
        p_payment_method: paymentMethod,
        p_installments: paymentType === "installments" ? installments : [],
        p_admin_id: user?.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Inscription et plan de paiement enregistrés avec succès !");
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      queryClient.invalidateQueries({ queryKey: ["debtors-overview"] });
      navigate("/admin/attendance");
    },
    onError: (err: any) => {
      toast.error(`Échec de l'inscription : ${err.message}`);
    }
  });

  const canGoNext = () => {
    if (currentStep === 1) {
      if (studentMode === "existing") return !!selectedStudent;
      return !!newStudent.full_name;
    }
    if (currentStep === 2) {
      return !!selectedCourseId;
    }
    if (currentStep === 3) {
      if (paymentType === "full") return true;
      const sumInstallments = installments.reduce((acc, inst) => acc + (Number(inst.amount) || 0), 0);
      return Math.abs((initialPaymentAmount + sumInstallments) - effectiveTotalAmount) < 0.01;
    }
    return true;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl space-y-8 pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
              Module Réception & Admin
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-foreground mt-2">
            Inscription <span className="text-primary">& Plan de Paiement</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Inscrivez un étudiant, assignez son créneau (Matin / Midi / Soir) et configurez ses tranches d'échéances.
          </p>
        </div>
      </div>

      {/* STEPPER PROGRESS */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {[
          { num: 1, title: "Étudiant", icon: UserCheck },
          { num: 2, title: "Formation & Créneau", icon: BookOpen },
          { num: 3, title: "Modalités de Paiement", icon: CreditCard },
          { num: 4, title: "Validation", icon: ShieldCheck }
        ].map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num;
          return (
            <div
              key={s.num}
              onClick={() => isDone && setCurrentStep(s.num)}
              className={`p-3 md:p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                isActive
                  ? "bg-primary/10 border-primary shadow-glow-primary text-primary"
                  : isDone
                  ? "bg-muted/40 border-emerald-500/30 text-emerald-500"
                  : "bg-muted/10 border-border text-muted-foreground opacity-60"
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-emerald-500 text-white" : "bg-muted text-foreground"
              }`}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-70">Étape {s.num}</p>
                <p className="text-xs font-bold truncate">{s.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* STEP CONTENT CONTAINER */}
      <Card className="rounded-[2.5rem] border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardContent className="p-6 md:p-10">
          <AnimatePresence mode="wait">
            {/* ======================= STEP 1 : ÉTUDIANT ======================= */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <h2 className="text-xl font-black uppercase italic tracking-tight">1. Sélection de l'Étudiant</h2>
                    <p className="text-sm text-muted-foreground">Recherchez un profil existant ou créez une fiche rapide</p>
                  </div>
                  <div className="flex bg-muted/40 p-1 rounded-xl border border-border">
                    <Button
                      type="button"
                      size="sm"
                      variant={studentMode === "existing" ? "default" : "ghost"}
                      onClick={() => setStudentMode("existing")}
                      className="rounded-lg text-xs font-bold"
                    >
                      <Search className="w-3.5 h-3.5 mr-1.5" /> Existant
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={studentMode === "new" ? "default" : "ghost"}
                      onClick={() => setStudentMode("new")}
                      className="rounded-lg text-xs font-bold"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Nouveau
                    </Button>
                  </div>
                </div>

                {studentMode === "existing" ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par nom complet..."
                        value={searchStudentTerm}
                        onChange={(e) => setSearchStudentTerm(e.target.value)}
                        className="pl-11 h-12 rounded-xl bg-background/50"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                      {studentsList.map((st) => {
                        const isSelected = selectedStudent?.id === st.id;
                        return (
                          <div
                            key={st.id}
                            onClick={() => setSelectedStudent(st)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-primary/10 border-primary text-primary shadow-md"
                                : "bg-muted/20 border-border hover:border-primary/40"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-black text-sm">
                                {st.full_name?.charAt(0) || "U"}
                              </div>
                              <div>
                                <p className="font-black text-sm text-foreground">{st.full_name}</p>
                                <p className="text-xs text-muted-foreground">{st.phone || "Sans téléphone"}</p>
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                          </div>
                        );
                      })}
                      {studentsList.length === 0 && (
                        <p className="text-center py-6 text-muted-foreground text-sm col-span-2">
                          Aucun étudiant trouvé. Basculez sur "Nouveau" pour l'enregistrer.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom complet *</Label>
                      <Input
                        placeholder="ex: Patrick Mulumba"
                        value={newStudent.full_name}
                        onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email <span className="text-xs font-normal text-muted-foreground">(Optionnel)</span></Label>
                      <Input
                        type="email"
                        placeholder="ex: patrick@gmail.com"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value.trim().toLowerCase() })}
                        className="h-12 rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">Si vide, un identifiant interne sera généré automatiquement.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone / WhatsApp</Label>
                      <Input
                        placeholder="ex: +243 85 478 3211"
                        value={newStudent.phone}
                        onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Genre</Label>
                      <Select
                        value={newStudent.gender}
                        onValueChange={(v) => setNewStudent({ ...newStudent, gender: v })}
                      >
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Sélectionner le genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculin</SelectItem>
                          <SelectItem value="F">Féminin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ======================= STEP 2 : FORMATION & CRÉNEAU ======================= */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-border/50 pb-4">
                  <h2 className="text-xl font-black uppercase italic tracking-tight">2. Choix de la Formation & du Créneau</h2>
                  <p className="text-sm text-muted-foreground">Sélectionnez le cursus ainsi que la session et l'horaire de référence</p>
                </div>

                {/* Choix Formation */}
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Formations Disponibles
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {courses.map((c) => {
                      const isSelected = selectedCourseId === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCourseId(c.id);
                            setCustomTotalAmount(c.price);
                          }}
                          className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-primary/10 border-primary text-primary shadow-glow-primary"
                              : "bg-muted/20 border-border hover:border-primary/30"
                          }`}
                        >
                          <div>
                            <Badge variant="outline" className="text-[9px] font-black uppercase mb-2">
                              {c.category || "CURSUS"}
                            </Badge>
                            <h3 className="font-black text-sm uppercase italic text-foreground leading-tight mb-2">
                              {c.title}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                            <span className="text-lg font-black text-foreground italic">{c.price}$</span>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Choix Horaire de cours (MATIN / MIDI / SOIR) */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div>
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Horaire de Cours Souhaité
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      (NB : L'étudiant pourra également assister aux autres créneaux horaires selon ses disponibilités)
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: "MATIN", label: "Matin", time: "08h00 - 11h00", icon: Sun, color: "text-amber-500" },
                      { name: "MIDI", label: "Midi", time: "11h30 - 14h30", icon: Sunset, color: "text-orange-500" },
                      { name: "SOIR", label: "Soir", time: "16h00 - 19h00", icon: Moon, color: "text-indigo-400" }
                    ].map((v) => {
                      const Icon = v.icon;
                      const isSelected = selectedVacationName === v.name;
                      return (
                        <div
                          key={v.name}
                          onClick={() => setSelectedVacationName(v.name)}
                          className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 border-primary text-primary shadow-md"
                              : "bg-muted/20 border-border hover:border-primary/30"
                          }`}
                        >
                          <Icon className={`w-6 h-6 mx-auto mb-1 ${v.color}`} />
                          <p className="font-black text-sm uppercase italic text-foreground">{v.label}</p>
                          <p className="text-[10px] text-muted-foreground">{v.time}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ======================= STEP 3 : PAIEMENT & TRANCHES ======================= */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-border/50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-black uppercase italic tracking-tight">3. Modalités Financières & Tranches</h2>
                    <p className="text-sm text-muted-foreground">Définissez le versement initial et l'échéancier des dettes</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground font-black uppercase">Coût de la Formation</p>
                    <p className="text-2xl font-black text-primary italic">{effectiveTotalAmount}$</p>
                  </div>
                </div>

                {/* Mode de paiement : Total ou Tranches */}
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => {
                      setPaymentType("full");
                      setInitialPaymentAmount(effectiveTotalAmount);
                      setInstallments([]);
                    }}
                    className={`p-5 rounded-2xl border text-center transition-all cursor-pointer ${
                      paymentType === "full"
                        ? "bg-primary/10 border-primary text-primary shadow-md"
                        : "bg-muted/20 border-border hover:border-primary/30"
                    }`}
                  >
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                    <p className="font-black text-sm uppercase italic text-foreground">Paiement Comptant (Total)</p>
                    <p className="text-xs text-muted-foreground mt-1">L'étudiant règle l'intégralité ({effectiveTotalAmount}$)</p>
                  </div>

                  <div
                    onClick={() => {
                      setPaymentType("installments");
                      const defaultAcompte = Math.round(effectiveTotalAmount / 2);
                      setInitialPaymentAmount(defaultAcompte);
                      generateInstallments(installmentCount, effectiveTotalAmount - defaultAcompte);
                    }}
                    className={`p-5 rounded-2xl border text-center transition-all cursor-pointer ${
                      paymentType === "installments"
                        ? "bg-primary/10 border-primary text-primary shadow-md"
                        : "bg-muted/20 border-border hover:border-primary/30"
                    }`}
                  >
                    <Layers className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                    <p className="font-black text-sm uppercase italic text-foreground">Paiement Échelonné (Tranches)</p>
                    <p className="text-xs text-muted-foreground mt-1">Acompte à l'inscription + tranches ultérieures</p>
                  </div>
                </div>

                {/* Paramétrage des montants */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-muted/20 border border-border/60">
                  <div className="space-y-2">
                    <Label>Montant versé aujourd'hui ($) *</Label>
                    <Input
                      type="number"
                      min={0}
                      max={effectiveTotalAmount}
                      value={initialPaymentAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setInitialPaymentAmount(val);
                        if (paymentType === "installments") {
                          generateInstallments(installmentCount, effectiveTotalAmount - val);
                        }
                      }}
                      className="h-12 rounded-xl text-lg font-black text-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Moyen de Paiement *</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Choisir le moyen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Espèces (Cash Réception)</SelectItem>
                        <SelectItem value="mobile_money">M-Pesa / Orange / Airtel Money</SelectItem>
                        <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                        <SelectItem value="pos">Terminal Carte / POS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Si tranches activées : Configuration de l'échéancier */}
                {paymentType === "installments" && (
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-sm uppercase italic text-foreground">Échéancier des Tranches</h3>
                        <p className="text-xs text-muted-foreground">
                          Reste à payer : <strong className="text-amber-500">{remainingBalance}$</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Nombre de tranches :</Label>
                        <Select
                          value={String(installmentCount)}
                          onValueChange={(val) => {
                            const count = Number(val);
                            setInstallmentCount(count);
                            generateInstallments(count, remainingBalance);
                          }}
                        >
                          <SelectTrigger className="w-24 h-9 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 tranche</SelectItem>
                            <SelectItem value="2">2 tranches</SelectItem>
                            <SelectItem value="3">3 tranches</SelectItem>
                            <SelectItem value="4">4 tranches</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {installments.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-card border border-border/80 flex flex-col sm:flex-row items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 font-black text-xs flex items-center justify-center flex-shrink-0">
                            #{item.installment_number}
                          </div>

                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                            <div>
                              <Label className="text-[10px] text-muted-foreground uppercase font-black">Montant ($)</Label>
                              <Input
                                type="number"
                                value={item.amount}
                                onChange={(e) => updateInstallment(idx, "amount", Number(e.target.value) || 0)}
                                className="h-10 rounded-xl font-bold"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground uppercase font-black">Date d'échéance</Label>
                              <Input
                                type="date"
                                value={item.due_date}
                                onChange={(e) => updateInstallment(idx, "due_date", e.target.value)}
                                className="h-10 rounded-xl"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground uppercase font-black">Note / Libellé</Label>
                              <Input
                                value={item.notes}
                                onChange={(e) => updateInstallment(idx, "notes", e.target.value)}
                                className="h-10 rounded-xl"
                                placeholder="ex: Solde avant examen"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ======================= STEP 4 : RÉCAPITULATIF & VALIDATION ======================= */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-border/50 pb-4">
                  <h2 className="text-xl font-black uppercase italic tracking-tight">4. Confirmation & Enregistrement</h2>
                  <p className="text-sm text-muted-foreground">Vérifiez toutes les informations avant de valider l'inscription</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fiche Étudiant & Formation */}
                  <div className="space-y-4 p-6 rounded-3xl bg-muted/20 border border-border/60">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Informations Académiques</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Étudiant :</span>
                        <strong className="text-foreground">
                          {studentMode === "existing" ? selectedStudent?.full_name : newStudent.full_name}
                        </strong>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Contact :</span>
                        <span>{studentMode === "existing" ? selectedStudent?.phone : newStudent.phone || newStudent.email}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Formation :</span>
                        <strong className="text-primary">{selectedCourse?.title}</strong>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Créneau assigné :</span>
                        <Badge className="bg-primary/20 text-primary border-none font-bold">
                          {selectedVacationName}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Fiche Financière */}
                  <div className="space-y-4 p-6 rounded-3xl bg-muted/20 border border-border/60">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Plan Financier</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Montant total :</span>
                        <strong className="text-foreground">{effectiveTotalAmount}$</strong>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Versé à l'inscription :</span>
                        <strong className="text-emerald-500">{initialPaymentAmount}$ ({paymentMethod})</strong>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Solde restant :</span>
                        <strong className={remainingBalance > 0 ? "text-amber-500" : "text-emerald-500"}>
                          {remainingBalance}$
                        </strong>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Statut de paiement :</span>
                        <Badge variant={remainingBalance === 0 ? "default" : "secondary"}>
                          {remainingBalance === 0 ? "Soldé (Comptant)" : "Échelonné (Partiel)"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Échéances prévues */}
                {installments.length > 0 && (
                  <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4" /> Échéances à notifier automatiquement
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {installments.map((inst, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-card border border-border text-xs space-y-1">
                          <p className="font-bold text-foreground">Tranche #{inst.installment_number} : {inst.amount}$</p>
                          <p className="text-muted-foreground">Date limite : {format(new Date(inst.due_date), "dd MMMM yyyy", { locale: fr })}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* BOUTONS NAVIGATION */}
          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="h-12 px-6 rounded-xl font-bold"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                disabled={!canGoNext()}
                onClick={() => setCurrentStep(currentStep + 1)}
                className="h-12 px-8 rounded-xl font-black uppercase text-xs tracking-wider shadow-glow-primary"
              >
                Suivant <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={enrollMutation.isPending}
                onClick={() => enrollMutation.mutate()}
                className="h-12 px-10 rounded-xl font-black uppercase text-xs tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
              >
                {enrollMutation.isPending ? "Enregistrement..." : "Confirmer l'Inscription"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
