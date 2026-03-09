import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lock, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  XCircle, 
  ShoppingCart,
  Users,
  Award,
  BookOpen,
  Trophy,
  Download,
  MessageSquare,
  FileDown,
  Info,
  Star,
  Send,
  CheckCircle,
  Layout
} from "lucide-react";
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { toast } from "sonner";
import { generateCertificate, generateInvoice, generateBadge } from "@/lib/pdfService";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Confetti from 'react-confetti';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Specialized components
import { PdfPlayer } from "@/components/course/PdfPlayer";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { CourseSidebar } from "@/components/course/CourseSidebar";

// Configuration du worker pour react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

const CourseDetail = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [previewEnded, setPreviewEnded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);

  // Base Queries
  const { data: course, isLoading: isLoadingCourse, error: courseError } = useQuery({
    queryKey: ['courseDetail', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { data: purchase } = useQuery({
    queryKey: ['userAccess', courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) return null;
      const { data, error } = await supabase
        .from('purchases')
        .select('id, validation_status')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data;
    },
    enabled: !!user && !!course && course.is_paid,
  });

  const { data: paymentProofs } = useQuery({
    queryKey: ['paymentProofs', courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) return [];
      const { data, error } = await supabase
        .from('payment_proofs')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user && !!courseId,
  });

  const hasAccess = course && (!course.is_paid || (!!purchase && purchase.validation_status === 'approved'));
  const latestPaymentProof = paymentProofs?.[0];

  const { data: lessons, isLoading: isLoadingLessons, error: lessonsError } = useQuery({
    queryKey: ['courseLessons', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index');
      if (error) throw new Error(error.message);
      if (data && data.length > 0 && !selectedLesson) {
        setSelectedLesson(data[0]);
      }
      return data;
    },
    enabled: !!course,
  });

  const { data: siteSettings } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').eq('key', 'academy_info').single();
      if (error) return null;
      return data.value;
    }
  });

  const { data: completedLessons } = useQuery({
    queryKey: ['lessonCompletions', courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) return new Set<string>();
      const { data, error } = await supabase
        .from('lesson_completions')
        .select('lesson_id')
        .eq('user_id', user.id)
        .in('lesson_id', lessons?.map(l => l.id) || []);
      if (error) throw new Error(error.message);
      return new Set(data.map(c => c.lesson_id));
    },
    enabled: !!user && !!lessons && lessons.length > 0,
  });

  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ['courseComments', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          rating,
          created_at,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const enrollmentMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Vous devez être connecté pour vous inscrire.");
      if (!course) throw new Error("Cours non trouvé.");

      const { error } = await supabase.from('purchases').insert({
        user_id: user.id,
        course_id: course.id,
        amount: 0,
        payment_status: 'completed',
        validation_status: 'approved',
        validated_at: new Date().toISOString(),
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Inscription réussie ! Vous avez maintenant accès au cours.");
      queryClient.invalidateQueries({ queryKey: ['userAccess', courseId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['enrolled-courses', user?.id] });
    },
    onError: (error) => toast.error(error.message),
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!user || !newComment.trim()) return;
      const { error } = await supabase.from('comments').insert({
        user_id: user.id,
        course_id: courseId,
        content: newComment,
        rating: rating
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Commentaire publié !");
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ['courseComments', courseId] });
    },
    onError: (err: any) => toast.error(`Erreur: ${err.message}`),
  });

  const toggleLessonCompletionMutation = useMutation({
    mutationFn: async ({ lessonId, isCompleted }: { lessonId: string; isCompleted: boolean }) => {
      if (!user) return;

      if (isCompleted) {
        const { error } = await supabase.from('lesson_completions').delete().match({ user_id: user.id, lesson_id: lessonId });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('lesson_completions').insert({ user_id: user.id, lesson_id: lessonId });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessonCompletions', courseId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['enrolled-courses', user?.id] });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const isCourseCompleted = lessons && completedLessons && completedLessons.size === lessons.length;

  useEffect(() => {
    if (isCourseCompleted && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [isCourseCompleted, showConfetti]);

  useEffect(() => {
    setPreviewEnded(false);
    if (!hasAccess && selectedLesson?.lesson_type === 'video') {
      const timer = setTimeout(() => {
        setPreviewEnded(true);
      }, 30000); // 30 seconds preview
      return () => clearTimeout(timer);
    }
  }, [selectedLesson, hasAccess]);

  const handleEnroll = () => {
    if (!user) {
      toast.info("Veuillez vous connecter pour vous inscrire à un cours.");
      navigate('/auth');
      return;
    }

    if (!course?.is_paid) {
      enrollmentMutation.mutate();
    } else {
      navigate(`/checkout/${courseId}`);
    }
  };

  const handleDownloadCertificate = () => {
    if (user && course) {
      generateCertificate({
        studentName: user.user_metadata?.full_name || user.email || "Étudiant Botes",
        courseTitle: course.title,
        date: new Date().toISOString()
      });
      toast.success("Certificat généré avec succès !");
    }
  };

  const currentLessonIndex = useMemo(() => {
    return lessons?.findIndex(l => l.id === selectedLesson?.id) ?? -1;
  }, [lessons, selectedLesson]);

  const goToNextLesson = () => {
    if (lessons && currentLessonIndex < lessons.length - 1) {
      setSelectedLesson(lessons[currentLessonIndex + 1]);
      document.getElementById('lesson-player')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const goToPrevLesson = () => {
    if (lessons && currentLessonIndex > 0) {
      setSelectedLesson(lessons[currentLessonIndex - 1]);
      document.getElementById('lesson-player')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderHeaderInfo = () => {
    const isOnline = course?.mode === 'online';
    
    return (
      <div className="flex flex-wrap gap-3 mb-4">
        <Badge variant="outline" className={cn(
          "backdrop-blur-md font-bold uppercase text-[10px] tracking-widest px-4 py-1 rounded-full border-2",
          isOnline ? "bg-primary/10 text-primary border-primary/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        )}>
          {course?.category}
        </Badge>
        
        <Badge className={cn(
          "font-black uppercase text-[10px] tracking-widest px-4 py-1 rounded-full shadow-lg",
          isOnline 
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/20" 
            : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20"
        )}>
          {isOnline ? (
            <span className="flex items-center gap-2">⚡ ACCÈS INSTANTANÉ (VOD)</span>
          ) : course?.mode === 'presentiel' ? (
            <span className="flex items-center gap-2">🏫 FORMATION EN SALLE</span>
          ) : (
            <span className="flex items-center gap-2">🌓 FORMAT HYBRIDE</span>
          )}
        </Badge>

        {course?.is_special_session && (
          <Badge variant="destructive" className="animate-pulse shadow-glow-destructive uppercase font-black text-[10px] tracking-widest px-4 py-1 rounded-full">
            OFFRE LIMITÉE 🔥
          </Badge>
        )}
      </div>
    );
  };

  const renderRestrictedAccess = () => {
    return (
      <div className="bg-card rounded-[2.5rem] overflow-hidden border border-primary/10 shadow-2xl relative aspect-video flex flex-col items-center justify-center group/gate">
        <img 
          src={course?.thumbnail_url || "/placeholder.svg"} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/gate:scale-110"
        />
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="w-20 h-20 rounded-[2rem] bg-primary/90 backdrop-blur-md flex items-center justify-center shadow-glow-primary transform rotate-12 group-hover/gate:rotate-0 transition-transform duration-500">
            <Lock className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-white drop-shadow-lg">
              {previewEnded ? "Aperçu terminé" : "Contenu Protégé"}
            </h3>
            <p className="text-white/80 text-sm max-w-xs mx-auto font-medium drop-shadow-md">
              Inscrivez-vous pour débloquer l'accès complet à cette formation.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderEnrollmentForm = () => {
    const hasPendingProof = latestPaymentProof?.status === 'pending';
    const hasRejectedProof = latestPaymentProof?.status === 'rejected';

    if (hasPendingProof) {
      return (
        <Card className="mt-8 rounded-[2.5rem] border-warning/20 bg-warning/5 p-8 text-center animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center animate-pulse">
              <Clock className="w-8 h-8 text-warning" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-tighter italic">Validation en cours</h3>
              <p className="text-muted-foreground text-sm font-medium">Nos experts vérifient votre reçu (Moins de 24h).</p>
            </div>
            <Button onClick={() => navigate(`/payment-status/${latestPaymentProof.id}`)} variant="outline" className="h-12 px-8 rounded-2xl border-warning/30 text-warning hover:bg-warning/10 font-black uppercase text-[10px] tracking-widest">
              Suivre mon dossier
            </Button>
          </div>
        </Card>
      );
    }

    if (hasRejectedProof) {
      return (
        <Card className="mt-8 rounded-[2.5rem] border-destructive/20 bg-destructive/5 p-8 text-center animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-tighter text-destructive italic">Action Requise</h3>
              <p className="text-destructive/80 text-sm font-medium">Votre preuve de paiement a été rejetée.</p>
              {latestPaymentProof.admin_notes && (
                <p className="text-xs italic bg-destructive/10 p-3 rounded-xl mt-2">"{latestPaymentProof.admin_notes}"</p>
              )}
            </div>
            <Button onClick={() => navigate(`/checkout/${courseId}`)} className="h-12 px-8 rounded-2xl bg-destructive hover:bg-destructive/90 text-white shadow-glow-destructive font-black uppercase text-[10px] tracking-widest">
              Soumettre à nouveau
            </Button>
          </div>
        </Card>
      );
    }

    return (
      <Card className="mt-8 rounded-[2.5rem] border-primary/20 bg-card shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <ShoppingCart className="w-32 h-32 text-primary" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex-1 space-y-2 w-full">
            <h3 className="text-2xl font-black uppercase tracking-tighter italic">Débloquer cette formation</h3>
            <p className="text-muted-foreground text-sm font-medium">Rejoignez notre académie et accédez à l'intégralité du programme.</p>
          </div>

          <div className="shrink-0 w-full md:w-auto text-center md:text-right space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Prix de l'accès</p>
              <p className="text-4xl font-black text-primary italic leading-none">
                {course?.is_paid ? `${course.price} USD` : "GRATUIT"}
              </p>
            </div>
            
            <Button
              onClick={handleEnroll}
              disabled={enrollmentMutation.isPending}
              size="lg"
              className="w-full md:w-auto rounded-2xl px-12 shadow-glow-primary h-16 font-black uppercase text-xs tracking-[0.2em] bg-primary hover:bg-primary/90"
            >
              {enrollmentMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-3 h-5 w-5" />}
              {course?.is_paid ? "S'inscrire maintenant" : "Accéder gratuitement"}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const renderEnrolledToolbar = () => {
    if (!hasAccess || !course) return null;

    const proof = latestPaymentProof;

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4 p-4 bg-primary/5 rounded-[2rem] border border-primary/10 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none mb-1">Accès Officiel</p>
            <p className="text-xs font-bold text-muted-foreground">Formation débloquée à vie</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {proof && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 rounded-xl border-primary/20 hover:bg-primary/10 text-[10px] font-black uppercase tracking-tighter"
                onClick={() => generateInvoice({
                  studentName: user?.user_metadata.full_name || user?.email || 'Étudiant',
                  courseTitle: course.title,
                  amount: proof.amount,
                  paymentMethod: proof.payment_method,
                  transactionRef: proof.transaction_reference || undefined,
                  date: proof.validated_at || proof.created_at,
                  invoiceNumber: proof.id.slice(0, 8).toUpperCase()
                })}
              >
                <FileDown className="w-3.5 h-3.5 mr-2" /> Facture
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 rounded-xl border-primary/20 hover:bg-primary/10 text-[10px] font-black uppercase tracking-tighter"
                onClick={() => generateBadge({
                  studentName: user?.user_metadata.full_name || user?.email || 'Étudiant',
                  courseTitle: course.title,
                  date: proof.validated_at || proof.created_at
                })}
              >
                <Award className="w-3.5 h-3.5 mr-2" /> Badge
              </Button>
            </>
          )}
          <Button 
            variant="hero" 
            size="sm" 
            className="h-9 rounded-xl text-[10px] font-black uppercase tracking-tighter"
            onClick={() => {
              const link = siteSettings?.support_link || "https://t.me/botesacademy";
              window.open(link, '_blank');
            }}
          >
            <MessageSquare className="w-3.5 h-3.5 mr-2" /> Support
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderMainContent = () => {
    if (!hasAccess) {
      if (selectedLesson?.lesson_type === 'video' && !previewEnded) {
        return <VideoPlayer url={selectedLesson.video_url} title={selectedLesson.title} isPreview={true} />;
      }
      return (
        <div className="space-y-4">
          {renderRestrictedAccess()}
          {renderEnrollmentForm()}
        </div>
      );
    }
    
    if (!selectedLesson) {
      return <AspectRatio ratio={16 / 9} className="bg-muted rounded-3xl flex items-center justify-center"><p className="font-bold italic text-muted-foreground uppercase text-xs tracking-widest">Sélectionnez une leçon pour commencer.</p></AspectRatio>;
    }

    switch (selectedLesson.lesson_type) {
      case 'video': return <VideoPlayer url={selectedLesson.video_url} title={selectedLesson.title} mode={course?.mode} />;
      case 'pdf': return <PdfPlayer url={selectedLesson.pdf_url} mode={course?.mode} />;
      default: return <AspectRatio ratio={16 / 9} className="bg-muted rounded-3xl flex items-center justify-center"><p>Contenu non disponible.</p></AspectRatio>;
    }
  };

  if (isLoadingCourse) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (courseError || !course) return <div className="min-h-screen flex items-center justify-center text-destructive font-bold uppercase italic">Formation non trouvée.</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />}

      <div className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={course.thumbnail_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover opacity-30 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/80 to-background" />
        </div>
        <div className="container relative z-10 mx-auto px-4 pt-12 pb-8">
           <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end text-center md:text-left">
              <div className="w-48 md:w-64 h-32 md:h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/20 shrink-0 bg-muted">
                <img src={course.thumbnail_url || "/placeholder.svg"} alt={course.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div className="flex justify-center md:justify-start">{renderHeaderInfo()}</div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight uppercase italic">{course.title}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-sm text-muted-foreground uppercase font-black tracking-tighter">
                   <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span>2.4k Étudiants</span></div>
                   <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /><span>{course.estimated_duration || "N/A"}</span></div>
                   <div className="flex items-center gap-2"><Award className="w-4 h-4 text-primary" /><span>{course.level || "Débutant"}</span></div>
                </div>
              </div>
           </div>
        </div>
      </div>

      <div className="container mx-auto p-3 sm:p-4 md:p-8 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-8 w-full overflow-hidden">
            <div id="lesson-player" className="animate-in fade-in zoom-in-95 duration-500">
              {renderMainContent()}
            </div>

            {renderEnrolledToolbar()}

            {isCourseCompleted && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-r from-yellow-500/20 via-primary/20 to-yellow-500/20 border-2 border-yellow-500/50 p-8 rounded-[2.5rem] text-center shadow-2xl shadow-primary/20">
                <div className="inline-flex p-4 rounded-full bg-yellow-500/20 mb-4 ring-4 ring-yellow-500/10"><Trophy className="w-12 h-12 text-yellow-500" /></div>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 italic">Félicitations !</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto font-medium text-sm">Vous avez terminé 100% de la formation. Votre certificat est disponible.</p>
                <Button size="lg" onClick={handleDownloadCertificate} className="rounded-full px-10 h-14 bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-widest shadow-lg shadow-yellow-500/40"><Download className="w-5 h-5 mr-3" />Récupérer mon certificat</Button>
              </motion.div>
            )}

            {hasAccess && lessons && lessons.length > 1 && (
              <div className="flex items-center justify-between gap-2 sm:gap-4 py-6 px-1 sm:px-2 border-b border-border/50">
                <Button variant="outline" size="lg" onClick={goToPrevLesson} disabled={currentLessonIndex <= 0} className="rounded-xl sm:rounded-2xl px-3 sm:px-8 hover:bg-primary/10 hover:text-primary transition-all group h-10 sm:h-12 text-xs sm:text-base font-bold uppercase tracking-widest"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2 transition-transform group-hover:-translate-x-1" /><span className="hidden xs:inline">Précédent</span></Button>
                <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-1 sm:py-2 rounded-xl sm:rounded-2xl bg-primary/5 border border-primary/10"><span className="hidden sm:inline text-xs font-black text-muted-foreground uppercase tracking-widest">Leçon</span><span className="text-sm sm:text-lg font-black text-primary">{currentLessonIndex + 1} <span className="text-muted-foreground/30 mx-0.5 sm:mx-1">/</span> {lessons.length}</span></div>
                <Button variant="hero" size="lg" onClick={goToNextLesson} disabled={currentLessonIndex >= (lessons?.length ?? 0) - 1} className="rounded-xl sm:rounded-2xl px-3 sm:px-8 shadow-glow-primary group h-10 sm:h-12 text-xs sm:text-base font-bold uppercase tracking-widest"><span className="hidden xs:inline">Suivant</span><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 sm:ml-2 transition-transform group-hover:translate-x-1" /></Button>
              </div>
            )}

            <div className="pt-8">
              <Tabs defaultValue="comments" className="w-full">
                <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-14 p-0 gap-8">
                  <TabsTrigger value="comments" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none h-full px-2 font-black uppercase text-xs tracking-widest gap-2"><MessageSquare className="w-4 h-4" /> Avis & Q&A</TabsTrigger>
                  <TabsTrigger value="resources" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none h-full px-2 font-black uppercase text-xs tracking-widest gap-2"><FileDown className="w-4 h-4" /> Ressources</TabsTrigger>
                </TabsList>

                <TabsContent value="comments" className="pt-8 animate-in fade-in slide-in-from-left-4 duration-500">
                   <div className="space-y-10">
                      {hasAccess ? (
                        <div className="bg-muted/20 p-6 rounded-3xl border border-border/50 space-y-4">
                          <div className="flex items-center justify-between"><h3 className="font-black uppercase text-xs tracking-widest italic">Laisser un avis</h3><div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((s) => (<button key={s} onClick={() => setRating(s)} className="transition-transform active:scale-125"><Star className={cn("w-5 h-5", s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} /></button>))}</div></div>
                          <div className="relative"><Textarea placeholder="Votre message..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="rounded-2xl border-border/50 min-h-[100px] pr-12 focus:border-primary transition-all bg-background/50 text-sm font-medium" /><Button size="icon" onClick={() => addCommentMutation.mutate()} disabled={addCommentMutation.isPending || !newComment.trim()} className="absolute bottom-3 right-3 rounded-xl shadow-glow-primary"><Send className="w-4 h-4" /></Button></div>
                        </div>
                      ) : <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 text-center text-xs font-bold text-primary uppercase tracking-tighter italic">Inscrivez-vous pour participer à la discussion.</div>}

                      <div className="space-y-6">
                        {isLoadingComments ? <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div> : comments && comments.length > 0 ? comments.map((comment: any) => (
                          <div key={comment.id} className="flex gap-4 group">
                            <Avatar className="w-10 h-10 border-2 border-primary/10"><AvatarImage src={comment.profiles?.avatar_url || ""} /><AvatarFallback className="font-bold">{comment.profiles?.full_name?.charAt(0)}</AvatarFallback></Avatar>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between"><div><p className="font-black text-sm uppercase tracking-tighter">{comment.profiles?.full_name}</p><p className="text-[10px] text-muted-foreground uppercase font-bold">{format(new Date(comment.created_at), 'dd MMMM yyyy', { locale: fr })}</p></div><div className="flex items-center gap-0.5">{[...Array(5)].map((_, i) => (<Star key={i} className={cn("w-3 h-3", i < (comment.rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />))}</div></div>
                              <div className="bg-muted/10 p-4 rounded-2xl border border-border/30 text-sm leading-relaxed group-hover:bg-muted/20 transition-colors">{comment.content}</div>
                            </div>
                          </div>
                        )) : <div className="py-20 text-center bg-muted/10 rounded-3xl border border-border/50 border-dashed"><MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-10" /><p className="text-muted-foreground font-medium italic uppercase text-xs tracking-widest text-center">Aucun commentaire pour le moment.</p></div>}
                      </div>
                   </div>
                </TabsContent>

                <TabsContent value="resources" className="pt-8 animate-in fade-in slide-in-from-left-4 duration-500">
                   <div className="space-y-6"><h2 className="text-2xl font-bold italic uppercase tracking-tighter">Matériel de cours</h2><div className="grid sm:grid-cols-2 gap-4"><div className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex items-center justify-between group hover:bg-primary/5 transition-all"><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><FileDown className="w-5 h-5 text-primary" /></div><div><p className="text-sm font-black uppercase tracking-tighter">Plan de Trading.xlsx</p><p className="text-[10px] text-muted-foreground font-bold uppercase">Tableur de gestion</p></div></div><Button size="icon" variant="ghost" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"><Download className="w-4 h-4" /></Button></div><div className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex items-center justify-between group hover:bg-primary/5 transition-all"><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><FileDown className="w-5 h-5 text-primary" /></div><div><p className="text-sm font-black uppercase tracking-tighter">Glossaire IA.pdf</p><p className="text-[10px] text-muted-foreground font-bold uppercase">Résumé des termes</p></div></div><Button size="icon" variant="ghost" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"><Download className="w-4 h-4" /></Button></div></div></div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <CourseSidebar lessons={lessons} isLoadingLessons={isLoadingLessons} lessonsError={lessonsError} hasAccess={hasAccess} selectedLesson={selectedLesson} setSelectedLesson={setSelectedLesson} completedLessons={completedLessons} onToggleCompletion={(id, isC) => toggleLessonCompletionMutation.mutate({ lessonId: id, isCompleted: isC })} isToggling={toggleLessonCompletionMutation.isPending} />
            
            {/* Logistics Card for In-Person/Hybrid */}
            {(course?.mode === 'presentiel' || course?.mode === 'hybrid') && (
              <Card className="rounded-[2rem] border-emerald-500/20 bg-emerald-500/5 shadow-xl overflow-hidden relative group">
                <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-emerald-600">
                    <Layout className="w-4 h-4" /> Infos Pratiques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">📍 Lieu de formation</p>
                    <p className="text-xs font-bold leading-relaxed">{course.location || "Siège Botes Academy, Kinshasa"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">🎒 Matériel requis</p>
                    <p className="text-xs font-bold leading-relaxed italic text-emerald-700/70">Ordinateur portable, cahier de notes, et votre motivation.</p>
                  </div>
                  <div className="pt-2 border-t border-emerald-500/10">
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                       <CheckCircle className="w-3 h-3" /> Badge d'accès inclus
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="p-6 bg-gradient-to-br from-accent/10 to-transparent border-accent/20 rounded-3xl shadow-xl"><h4 className="font-bold mb-2 uppercase tracking-tighter">Besoin d'aide ?</h4><p className="text-xs text-muted-foreground mb-4 font-medium italic">Nos formateurs sont disponibles pour répondre à vos questions techniques.</p><Button variant="outline" size="sm" className="w-full border-accent text-accent hover:bg-accent/10 rounded-xl font-black uppercase tracking-widest text-[10px] h-10" onClick={() => { const link = siteSettings?.support_link || "https://t.me/botesacademy"; window.open(link, '_blank'); }}>Rejoindre le canal Support</Button></Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
