import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, CheckCircle2, Users, Trophy, Download, Calendar, CreditCard, 
  Target, Rocket, Brain, Zap, Briefcase, Compass, MapPin, Timer, Settings,
  BarChart, ArrowRight, BookOpen, ShoppingCart, Clock, Award
} from "lucide-react";
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Confetti from 'react-confetti';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";


import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Configuration du worker pour react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

// Composant pour les sections animées
const MotionSection = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.section
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.section>
);

const CourseDetail = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'total' | 'installments'>('total');
  
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_completed, registration_source')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setShowStickyHeader(latest > 600);
  });

  const { data: course, isLoading: isLoadingCourse, error: courseError } = useQuery({
    queryKey: ['courseDetail', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const isPromoActive = useMemo(() => {
    if (!course?.promo_end_date) return false;
    return isAfter(new Date(course.promo_end_date), new Date());
  }, [course?.promo_end_date]);

  const { data: sessions } = useQuery({
    queryKey: ['courseSessions', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_sessions').select('*').eq('course_id', courseId).eq('is_active', true).order('start_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!course && (course.mode === 'presentiel' || course.mode === 'hybrid'),
  });

  const { data: enrollment } = useQuery({
    queryKey: ['userEnrollment', courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) return null;
      const { data, error } = await supabase
        .from('purchases')
        .select('validation_status')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!courseId,
  });

  const { data: lessons } = useQuery({
    queryKey: ['courseLessons', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId,
  });

  const isEnrolled = enrollment?.validation_status === 'approved';
  const isPendingValidation = enrollment?.validation_status === 'pending';
  const isRejected = enrollment?.validation_status === 'rejected';

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user || !courseId) throw new Error("Veuillez vous connecter");
      
      const { error } = await supabase.from('purchases').insert({
        user_id: user.id,
        course_id: courseId,
        amount: 0,
        payment_status: 'completed',
        validation_status: 'approved',
        validated_at: new Date().toISOString()
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Accès débloqué ! Bonne formation.");
      queryClient.invalidateQueries({ queryKey: ['userEnrollment', courseId] });
      navigate(`/formations/${courseId}/content`);
    },
    onError: (error: any) => toast.error(`Erreur: ${error.message}`),
  });

  const handleEnroll = () => {
    if (!user) {
      toast.info("Veuillez vous connecter pour vous inscrire.", {
        action: { label: "Connexion", onClick: () => navigate('/auth') },
      });
      return;
    }

    // SIS: Vérification de la complétion du profil
    if (profile && !profile.profile_completed) {
      toast.warning("Profil incomplet", {
        description: "Veuillez compléter vos informations académiques avant de vous inscrire.",
        action: { label: "Mon Profil", onClick: () => navigate('/profile') },
      });
      return;
    }

    if (isEnrolled) {
      navigate(`/formations/${courseId}/content`);
      return;
    }

    if (isPendingValidation) {
      toast.info("Paiement en cours de vérification", {
        description: "Votre accès sera débloqué dès qu'un administrateur aura validé votre reçu.",
      });
      navigate('/finance');
      return;
    }

    if (isRejected) {
      toast.error("Paiement rejeté", {
        description: "Veuillez vérifier vos informations de paiement ou contacter le support.",
      });
      navigate('/finance');
      return;
    }

    if (!course.is_paid || course.price === 0) {
      enrollMutation.mutate();
      return;
    }

    // SIS: Choix du plan de paiement si autorisé et inscrit par le staff
    const canUseInstallments = course.allow_installments && profile?.registration_source === 'admin';
    
    if (canUseInstallments) {
      setShowPaymentChoice(true);
      return;
    }

    navigate(`/checkout/${courseId}?plan=total`);
  };

  const confirmEnrollment = () => {
    setShowPaymentChoice(false);
    navigate(`/checkout/${courseId}?plan=${selectedPlan}`);
  };

  const getButtonLabel = () => {
    if (enrollMutation.isPending) return "Traitement...";
    if (isEnrolled) return "Continuer l'apprentissage";
    if (isPendingValidation) return "Validation en cours...";
    if (isRejected) return "Paiement Rejeté";
    if (course.price === 0 || !course.is_paid) return "Accéder gratuitement";
    return course.mode === 'online' ? "S'inscrire à la formation" : "Réserver ma place";
  };

  const learningObjectives = useMemo(() => course?.learning_objectives?.filter(o => o) || [], [course]);
  const prerequisites = useMemo(() => course?.prerequisites?.filter(p => p) || [], [course]);
  const targetAudience = useMemo(() => course?.target_audience?.filter(a => a) || [], [course]);

  if (isLoadingCourse) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (courseError || !course) return <div className="min-h-screen flex items-center justify-center text-destructive font-black uppercase italic">Formation introuvable.</div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 overflow-x-hidden">
      <Navbar />
      
      <AnimatePresence>
        {showStickyHeader && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-lg border-b border-border/50 z-40"
          >
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black uppercase tracking-tight italic truncate">{course.title}</h3>
                <p className="text-[10px] text-muted-foreground font-bold">{course.level} • {course.category}</p>
              </div>
              <div className="flex items-center gap-4 ml-4">
                <div className="text-right">
                  <p className="text-lg font-black text-primary italic">{course.price}$</p>
                  {course.full_price && isPromoActive && <p className="text-xs text-muted-foreground line-through -mt-1">{course.full_price}$</p>}
                </div>
                <Button onClick={handleEnroll} size="lg" className="rounded-xl font-bold uppercase text-xs tracking-widest hidden sm:flex">
                  {getButtonLabel()} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative pt-20 md:pt-28 pb-10 overflow-hidden">
        {/* Dynamic Background Accents */}
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[20vw] h-[20vw] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-[1.2] space-y-6"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 border-y border-white/5 my-6 bg-white/[0.01] rounded-xl px-4">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-primary/50 italic">Niveau</p>
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase italic">{course.level || "Tous"}</span>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-primary/50 italic">Format</p>
                      <div className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase italic">{course.mode === 'online' ? 'Digital' : 'Campus'}</span>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-primary/50 italic">Certification</p>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase italic">Dossier Pro</span>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-primary/50 italic">Accès</p>
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase italic">Immédiat</span>
                      </div>
                    </div>
                </div>
                
                <h1 className="text-[clamp(1.5rem,3.5vw,2.8rem)] font-black uppercase tracking-tighter leading-tight italic break-words">
                  {course.title}
                </h1>

                <p className="text-sm md:text-base text-muted-foreground font-medium max-w-xl leading-relaxed italic border-l-2 border-primary/20 pl-5 py-2 bg-primary/5 rounded-r-xl">
                  {course.description || "Devenez un expert, apprenez à concevoir des solutions de bout en bout."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button onClick={handleEnroll} size="lg" className="w-full sm:w-auto rounded-xl px-8 h-14 shadow-md font-black uppercase text-[10px] tracking-widest border border-white/5 group overflow-hidden relative">
                  <span className="relative z-10 flex items-center">
                    <Zap className="mr-2 w-4 h-4 fill-current" /> 
                    {getButtonLabel()}
                  </span>
                  <div className="absolute inset-0 bg-primary opacity-90 group-hover:bg-primary/80 transition-colors" />
                </Button>
                
                {course.brochure_url && (
                  <Button variant="outline" onClick={() => window.open(course.brochure_url!, '_blank')} className="w-full sm:w-auto rounded-xl px-6 h-14 border-white/10 text-foreground font-black uppercase text-[9px] tracking-widest hover:bg-white/5 backdrop-blur-sm">
                    <Download className="mr-2 w-4 h-4 text-primary" /> Brochure PDF
                  </Button>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="flex-1 relative w-full max-w-md lg:max-w-none"
            >
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-xl border border-white/5 aspect-video md:aspect-[4/5] bg-muted group">
                <img src={course.thumbnail_url || "/placeholder.svg"} alt={course.title} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-60" />
                
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                  <div className="bg-black/40 backdrop-blur-xl p-3.5 rounded-xl border border-white/10 shadow-lg">
                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-primary mb-0.5">Niveau {course.level || "01"}</p>
                    <p className="text-base font-black italic text-white uppercase tracking-tighter">Status: Opérationnel</p>
                  </div>
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                    <Trophy className="text-white w-6 h-6" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* --- SECTION 2 : BENTO ARCHITECTURE --- */}
      <MotionSection className="py-12 bg-muted/5 border-y border-white/5">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Objectives Block */}
            <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 shadow-sm group">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600"><Target className="w-5 h-5" /></div>
                    <h3 className="text-lg font-black uppercase tracking-tighter italic leading-tight">Objectifs <br /><span className="text-emerald-600/60 font-bold">Pédagogiques</span></h3>
                </div>
                <div className="space-y-2.5">
                    {learningObjectives.length > 0 ? learningObjectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="font-bold uppercase tracking-tight italic text-[10px] text-foreground/80 leading-tight">{obj}</p>
                      </div>
                    )) : <p className="text-muted-foreground italic text-[9px] uppercase font-bold text-center py-4">En cours de finalisation...</p>}
                </div>
            </div>

            {/* Prerequisites Block */}
            <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/10 shadow-sm group">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-600"><Brain className="w-5 h-5" /></div>
                    <h3 className="text-lg font-black uppercase tracking-tighter italic leading-tight">Prérequis <br /><span className="text-amber-600/60 font-bold">Techniques</span></h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {prerequisites.length > 0 ? prerequisites.map((item, i) => (
                      <Badge key={i} variant="outline" className="bg-amber-500/5 border-amber-500/10 text-amber-700 font-bold italic px-2.5 py-1 rounded-md text-[8px] uppercase">
                        {item}
                      </Badge>
                    )) : <p className="text-muted-foreground italic text-[9px] uppercase font-bold">Accessible à tous.</p>}
                </div>
            </div>

            {/* Audience Block */}
            <div className="p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 shadow-sm group">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-600"><Users className="w-5 h-5" /></div>
                    <h3 className="text-lg font-black uppercase tracking-tighter italic leading-tight">Public <br /><span className="text-indigo-600/60 font-bold">Cible</span></h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {targetAudience.length > 0 ? targetAudience.map((item, i) => (
                      <Badge key={i} variant="outline" className="bg-indigo-500/5 border-indigo-500/10 text-indigo-700 font-bold italic px-2.5 py-1 rounded-md text-[8px] uppercase">
                        {item}
                      </Badge>
                    )) : <p className="text-muted-foreground italic text-[9px] uppercase font-bold">Formation universelle.</p>}
                </div>
            </div>
          </div>
        </div>
      </MotionSection>

      {/* --- SECTION 3 : PROGRAMME (ACCORDIONS) --- */}
      {lessons && lessons.length > 0 && (
        <MotionSection className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-10">
              <div className="text-center space-y-2">
                 <Badge className="bg-primary/10 text-primary border-none font-black uppercase text-[7px] tracking-[0.2em] px-3 py-1 rounded-full">Syllabus</Badge>
                 <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">PROGRAMME DE <span className="text-primary">FORMATION</span></h2>
              </div>

              <Accordion type="single" collapsible className="w-full space-y-3">
                {Array.from(new Set(lessons.map(l => l.module_name || "Général"))).map((moduleName, modIdx) => (
                  <AccordionItem key={modIdx} value={`item-${modIdx}`} className="border border-white/5 rounded-xl bg-white/5 px-5 overflow-hidden data-[state=open]:border-primary/20 transition-all">
                    <AccordionTrigger className="hover:no-underline py-5">
                      <div className="flex items-center gap-4 text-left">
                         <span className="text-xl font-black italic text-primary/20">0{modIdx + 1}</span>
                         <h3 className="text-base font-black uppercase tracking-tight italic">{moduleName}</h3>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 space-y-2.5 pl-10">
                       {lessons.filter(l => (l.module_name || "Général") === moduleName).map((lesson, idx) => (
                          <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 group hover:bg-primary/5 transition-colors">
                             <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary"><BookOpen className="w-3.5 h-3.5" /></div>
                                <h4 className="font-bold uppercase italic text-[10px] tracking-tight">{lesson.title}</h4>
                             </div>
                             <Badge variant="outline" className="text-[7px] font-black uppercase border-white/10 opacity-30">{lesson.lesson_type}</Badge>
                          </div>
                       ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </MotionSection>
      )}

      {/* --- SECTION 4 : FRAIS DE FORMATION & INSCRIPTION --- */}
      <MotionSection className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full scale-150 translate-y-1/2 pointer-events-none" />
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Payment / Enrollment Card */}
            <div className="order-2 lg:order-1">
                <Card className="rounded-3xl border-primary/20 bg-black/40 backdrop-blur-3xl shadow-xl overflow-hidden">
                  <div className="p-6 bg-primary/5 border-b border-white/10 relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><GraduationCap className="w-16 h-16" /></div>
                    <div className="relative z-10 space-y-1">
                        <Badge className="bg-primary text-white border-none px-3 py-0.5 rounded-full font-black uppercase text-[8px] tracking-widest shadow-glow-primary">Tarif & Inscription</Badge>
                        <h2 className="text-xl font-black uppercase tracking-tighter italic text-white leading-none">FRAIS DE <span className="text-primary">FORMATION</span></h2>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-baseline justify-between border-b border-white/5 pb-4">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">Frais de Formation</p>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-black text-white italic tracking-tighter">{course.price}$</span>
                            {course.full_price && isPromoActive && (
                               <Badge className="bg-emerald-500 text-white border-none font-black text-[8px] px-1.5 py-0.5 rounded">
                                 -{Math.round(((course.full_price - (course.price || 0)) / course.full_price) * 100)}%
                               </Badge>
                            )}
                          </div>
                        </div>
                        {course.full_price && isPromoActive && (
                          <div className="text-right">
                             <p className="text-lg font-black text-muted-foreground/20 line-through italic decoration-primary/40">{course.full_price}$</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-muted-foreground/60">
                         <CreditCard className="w-3.5 h-3.5" />
                         <p className="text-[10px] font-bold uppercase italic tracking-widest">Carte • Mobile Money • Virement Bancaire</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                        <Button onClick={handleEnroll} size="lg" className="w-full h-14 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-glow-primary group overflow-hidden relative">
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {enrollMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                                {getButtonLabel()}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                        <p className="text-[8px] text-center text-muted-foreground font-bold uppercase tracking-[0.15em] italic opacity-50">Inscription certifiée & Support académique</p>
                    </div>
                  </div>
                </Card>
            </div>

            {/* Sessions Node */}
            <div className="order-1 lg:order-2 space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent shadow-inner"><Calendar className="w-7 h-7" /></div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">Prochaines <br /><span className="text-accent">Sessions</span></h3>
                </div>
                <p className="text-muted-foreground font-medium italic text-lg leading-relaxed">Les places sont limitées pour garantir un encadrement d'élite. Réservez votre créneau dès maintenant.</p>
              </div>

              <div className="grid gap-6">
                {sessions && sessions.length > 0 ? (
                  sessions.map((session: any) => {
                    const remaining = (session.max_students || 20) - (session.current_students || 0);
                    const isFull = remaining <= 0;
                    const isAlmostFull = remaining <= 3;
                    return (
                      <div key={session.id} className={cn(
                        "group relative p-8 rounded-[2.5rem] bg-card border-2 transition-all duration-500 overflow-hidden", 
                        isFull ? "border-muted/20 opacity-60" : isAlmostFull ? "border-amber-500/50 shadow-2xl shadow-amber-500/10" : "border-white/10 hover:border-primary/40 hover:shadow-2xl"
                      )}>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <Badge className={cn("font-black text-[9px] uppercase tracking-widest px-4", isFull ? "bg-muted text-muted-foreground" : isAlmostFull ? "bg-amber-500 text-white" : "bg-emerald-500 text-white")}>
                                {isFull ? "COMPLET" : isAlmostFull ? `URGENCE: ${remaining} PLACES !` : `DISPONIBLE: ${remaining} PLACES`}
                              </Badge>
                              <h4 className="text-2xl font-black uppercase tracking-tighter italic leading-none">{session.session_name}</h4>
                            </div>
                            <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-muted-foreground">
                              <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-primary" /><span className="italic">Du {format(new Date(session.start_date), 'dd MMM yyyy', { locale: fr })} au {format(new Date(session.end_date), 'dd MMM yyyy', { locale: fr })}</span></div>
                              {session.location && (<div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-primary" /><span className="italic">{session.location}</span></div>)}
                            </div>
                          </div>
                          <div className="md:w-56 space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60"><span>Occupation</span><span>{session.current_students || 0} / {session.max_students || 20}</span></div>
                            <Progress value={((session.current_students || 0) / (session.max_students || 20)) * 100} className={cn("h-2.5 bg-white/5", isFull ? "" : isAlmostFull ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary shadow-glow-primary")} />
                          </div>
                        </div>
                        {/* Interactive Background Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                      </div>
                    );
                  })
                ) : ( 
                    <div className="p-16 text-center border-2 border-dashed border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-sm">
                        <Timer className="w-16 h-16 mx-auto mb-6 opacity-20 animate-pulse" />
                        <h4 className="font-black uppercase italic text-xl mb-2">Planification en cours</h4>
                        <p className="text-muted-foreground font-medium italic">Les dates de la prochaine cohorte d'élite seront bientôt révélées.</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      {/* SIS: Dialog de choix du plan de paiement */}
      <Dialog open={showPaymentChoice} onOpenChange={setShowPaymentChoice}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-primary/20 bg-card p-0 overflow-hidden">
          <div className="bg-primary/5 p-8 border-b border-primary/10">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-2">Plan de Financement</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest italic">Choisissez comment vous souhaitez investir</p>
          </div>
          
          <div className="p-8">
            <RadioGroup defaultValue="total" value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'total' | 'installments')} className="space-y-4">
              <div 
                className={cn(
                    "relative flex items-center justify-between p-6 rounded-3xl border-2 transition-all cursor-pointer group",
                    selectedPlan === 'total' ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" : "border-border hover:border-primary/20"
                )}
                onClick={() => setSelectedPlan('total')}
              >
                <div className="flex items-center gap-4">
                  <RadioGroupItem value="total" id="total" className="sr-only" />
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", selectedPlan === 'total' ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10")}>
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <Label htmlFor="total" className="font-black uppercase italic text-lg m-0 cursor-pointer">Paiement Intégral</Label>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Une seule traite • Accès immédiat</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black italic text-primary">{course.price}$</p>
                  {course.registration_fee > 0 && <p className="text-[9px] font-bold text-muted-foreground">+{course.registration_fee}$ Inscription</p>}
                </div>
              </div>

              <div 
                className={cn(
                    "relative flex items-center justify-between p-6 rounded-3xl border-2 transition-all cursor-pointer group",
                    selectedPlan === 'installments' ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/5" : "border-border hover:border-emerald-500/20"
                )}
                onClick={() => setSelectedPlan('installments')}
              >
                <div className="flex items-center gap-4">
                  <RadioGroupItem value="installments" id="installments" className="sr-only" />
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", selectedPlan === 'installments' ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground group-hover:bg-emerald-500/10")}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <Label htmlFor="installments" className="font-black uppercase italic text-lg m-0 cursor-pointer">Paiement Échelonné</Label>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Acompte + Tranches mensuelles</p>
                  </div>
                </div>
                <div className="text-right text-emerald-600">
                  <p className="text-xl font-black italic">{(course.min_installment_amount || 0) + (course.registration_fee || 0)}$</p>
                  <p className="text-[9px] font-black uppercase tracking-widest leading-none">Premier versement</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter className="p-8 pt-0 flex flex-col gap-4">
            <Button onClick={confirmEnrollment} className="w-full h-16 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-glow-primary">
              Confirmer Selection <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-[9px] text-center text-muted-foreground italic font-medium">NB: L'accès aux cours ne sera validé qu'après approbation manuelle de votre reçu.</p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetail;
