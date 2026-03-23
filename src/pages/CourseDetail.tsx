import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, CheckCircle2, Users, Trophy, Download, Calendar, CreditCard, 
  Target, Rocket, Brain, Zap, Briefcase, Compass, MapPin, Timer, Settings,
  BarChart, ArrowRight, BookOpen, ShoppingCart
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

import { ApplicationModal } from "@/components/course/ApplicationModal";
import { AdmissionSteps } from "@/components/course/AdmissionSteps";

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

  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  
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

  const handleEnroll = () => {
    if (!user) {
      toast.info("Veuillez vous connecter pour vous inscrire.", {
        action: { label: "Connexion", onClick: () => navigate('/auth') },
      });
      return;
    }
    // Rediriger directement vers la page de paiement
    navigate(`/checkout/${courseId}`);
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
                  S'inscrire <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="flex-1 space-y-8"
            >
              <div className="space-y-4">
                <Badge variant="outline" className="px-4 py-1.5 bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-[0.2em] text-[10px] rounded-full">
                  Pôle {course.category || "Technologie"}
                </Badge>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] italic">
                  {course.title}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
                  {course.description || "Devenez un expert, apprenez à concevoir des solutions de bout en bout, de l'analyse du besoin à la mise en ligne."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Button onClick={handleEnroll} size="xl" className="w-full sm:w-auto rounded-2xl px-12 h-16 shadow-glow-primary font-black uppercase text-xs tracking-[0.2em]">
                  <ShoppingCart className="mr-3 w-5 h-5" /> S'inscrire maintenant
                </Button>
                {course.brochure_url && (
                  <Button variant="outline" onClick={() => window.open(course.brochure_url!, '_blank')} className="w-full sm:w-auto rounded-2xl px-8 h-16 border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/5">
                    <Download className="mr-3 w-4 h-4" /> Brochure
                  </Button>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="flex-1 relative"
            >
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-card/50 aspect-video md:aspect-square bg-muted">
                <img src={course.thumbnail_url || "/placeholder.svg"} alt={course.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                  <div className="bg-background/20 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Niveau requis</p>
                    <p className="text-xl font-black italic text-white">{course.level || "Tous niveaux"}</p>
                  </div>
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-glow-primary transform rotate-12">
                    <Trophy className="text-white w-8 h-8" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* --- SECTION 2 : OBJECTIFS & PREREQUIS --- */}
      <MotionSection className="py-24 bg-muted/20 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest px-4">Programme</Badge>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">Un cursus conçu pour <span className="text-primary">l'excellence</span></h2>
              <p className="text-muted-foreground font-medium text-lg max-w-3xl mx-auto">
                De la théorie à la pratique, chaque module est pensé pour vous rendre opérationnel et compétitif sur le marché.
              </p>
            </div>
            
            {learningObjectives.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {learningObjectives.map((obj, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, delay: i * 0.05 }}>
                    <Card className="h-full rounded-[2rem] border-primary/10 bg-card/50 shadow-lg overflow-hidden group hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-2">
                      <CardContent className="p-8 space-y-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform"><Target className="w-6 h-6" /></div>
                        <p className="font-black uppercase tracking-tight italic leading-snug text-base">{obj}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
                <Card className="p-12 text-center border-dashed border-2 rounded-[2.5rem] bg-card/30">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <h3 className="font-black uppercase italic text-lg mb-2">Le programme détaillé arrive bientôt</h3>
                    <p className="text-muted-foreground font-medium">Les objectifs pédagogiques de cette formation sont en cours de finalisation.</p>
                </Card>
            )}
            
            <div className="grid md:grid-cols-2 gap-8 pt-12">
              <Card className="rounded-[2.5rem] border-amber-500/10 bg-card/50 shadow-xl overflow-hidden group hover:border-amber-500/30 transition-all duration-500">
                  <CardHeader className="p-8 pb-0">
                    <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform"><Brain className="w-7 h-7" /></div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Prérequis</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-6 space-y-4">
                    {prerequisites.length > 0 ? prerequisites.map((item, i) => (
                      <div key={i} className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" /><p className="text-sm font-bold text-muted-foreground italic">{item}</p></div>
                    )) : <p className="text-sm font-bold text-muted-foreground italic">Aucun prérequis technique n'est exigé, seule votre motivation compte !</p>}
                  </CardContent>
              </Card>
              <Card className="rounded-[2.5rem] border-primary/10 bg-card/50 shadow-xl overflow-hidden group hover:border-primary/30 transition-all duration-500">
                  <CardHeader className="p-8 pb-0">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform"><Users className="w-7 h-7" /></div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Public Cible</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-6 space-y-4">
                    {targetAudience.length > 0 ? targetAudience.map((item, i) => (
                      <div key={i} className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /><p className="text-sm font-bold text-muted-foreground italic">{item}</p></div>
                    )) : <p className="text-sm font-bold text-muted-foreground italic">Cette formation s'adresse à toute personne passionnée souhaitant faire carrière dans ce domaine.</p>}
                  </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MotionSection>

      {/* --- SECTION 4 : FRAIS & CRÉNEAUX --- */}
      <MotionSection className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <Card className="rounded-[3rem] border-primary/20 bg-card shadow-2xl overflow-hidden sticky top-28">
              <CardHeader className="p-10 bg-primary/5 border-b border-primary/10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1"><Badge className="bg-primary text-white font-black text-[10px] uppercase tracking-widest px-4 mb-2">Investissement</Badge><CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Frais & Financement</CardTitle></div>
                  <div className="text-right">
                    <div className="flex flex-col items-end">
                      {course.full_price && isPromoActive && (<span className="text-lg font-bold text-muted-foreground line-through decoration-primary/50 decoration-2">{course.full_price}$</span>)}
                      <div className="flex items-center gap-2">
                        <p className="text-5xl font-black text-primary italic leading-none">{course.price || "N/A"}$</p>
                        {course.full_price && isPromoActive && (<Badge className="bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest px-2 py-0.5 animate-pulse">-{Math.round(((course.full_price - (course.price || 0)) / course.full_price) * 100)}%</Badge>)}
                      </div>
                    </div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mt-2 tracking-widest">Formation complète</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                {course.registration_fee && course.registration_fee > 0 && (
                    <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/20 border border-dashed border-border">
                        <div className="flex items-center gap-3"><Compass className="w-5 h-5 text-primary" /><span className="font-black uppercase text-sm italic">Frais d'Inscription</span></div>
                        <span className="text-2xl font-black italic">{course.registration_fee}$</span>
                    </div>
                )}
                <div className="space-y-4">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><CreditCard className="w-4 h-4" /> Options de financement :</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center"><p className="text-[10px] font-black uppercase mb-1">Paiement en</p><p className="text-lg font-black italic">3 Tranches</p></div>
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center"><p className="text-[10px] font-black uppercase mb-1">Paiement en</p><p className="text-lg font-black italic">1 Tranche</p></div>
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground italic font-medium pt-2">Bénéficiez de -10% de réduction pour tout paiement complet à l'inscription.</p>
                </div>
                <Button onClick={handleEnroll} className="w-full h-16 rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow-primary">S'inscrire maintenant</Button>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent shadow-glow-accent"><Calendar className="w-6 h-6" /></div>
                <div><h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Sessions Disponibles</h3><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">Choisissez votre cohorte</p></div>
              </div>
              <div className="grid gap-4">
                {sessions && sessions.length > 0 ? (
                  sessions.map((session: any) => {
                    const remaining = (session.max_students || 20) - (session.current_students || 0);
                    const isFull = remaining <= 0;
                    const isAlmostFull = remaining <= 3;
                    return (
                      <div key={session.id} className={cn("p-6 rounded-[2rem] bg-card border-2 transition-all", isFull ? "border-muted bg-muted/20 opacity-60" : isAlmostFull ? "border-amber-500/50 shadow-lg shadow-amber-500/10" : "border-border hover:border-primary/30 hover:shadow-xl")}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <Badge className={cn("font-black text-[9px] uppercase tracking-widest", isFull ? "bg-muted text-muted-foreground" : isAlmostFull ? "bg-amber-500 text-white" : "bg-emerald-500 text-white")}>{isFull ? "Complet" : isAlmostFull ? `Plus que ${remaining} places !` : `${remaining} places dispos`}</Badge>
                              <h4 className="text-lg font-black uppercase tracking-tighter italic">{session.session_name}</h4>
                            </div>
                            <div className="flex items-center gap-6 text-sm font-bold text-muted-foreground">
                              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /><span>Du {format(new Date(session.start_date), 'dd MMM yyyy', { locale: fr })} au {format(new Date(session.end_date), 'dd MMM yyyy', { locale: fr })}</span></div>
                              {session.location && (<div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /><span className="italic">{session.location}</span></div>)}
                            </div>
                          </div>
                          <div className="md:w-48 space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span>Remplissage</span><span>{session.current_students || 0} / {session.max_students || 20}</span></div>
                            <Progress value={((session.current_students || 0) / (session.max_students || 20)) * 100} className={cn("h-2", isFull ? "" : isAlmostFull ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary")} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : ( <Card className="p-12 text-center border-dashed border-2 rounded-[2.5rem]"><Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" /><p className="text-muted-foreground font-medium italic">Les dates des prochaines sessions seront annoncées bientôt.</p></Card>)}
              </div>
            </div>
          </div>
        </div>
      </MotionSection>
    </div>
  );
};

export default CourseDetail;
