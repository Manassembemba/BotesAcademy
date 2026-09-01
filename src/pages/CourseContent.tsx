import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CourseSidebar } from "@/components/course/CourseSidebar";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { PdfPlayer } from "@/components/course/PdfPlayer";
import Navbar from "@/components/Navbar";
import { 
  Loader2, AlertCircle, Lock, ArrowLeft, Wallet, MessageSquare, PlayCircle, 
  Calendar, MapPin, Clock, Printer, QrCode, ShieldCheck, UserCheck, BookOpen, Download,
  ChevronLeft, ChevronRight, FileText, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Confetti from 'react-confetti';
import { useWindowSize } from "react-use";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseChat } from "@/components/course/CourseChat";

const CourseContent = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { width, height } = useWindowSize();

  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  // 0. Fetch User Profile (for Matricule and full info)
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-course-pass', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // 1. Fetch Course & Enrollment details (including payment status)
  const { data: enrollmentData, isLoading: isLoadingEnrollment } = useQuery({
    queryKey: ['user-course-access', courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) return null;
      const { data, error } = await supabase
        .from('purchases')
        .select('*, courses(*)')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!courseId,
  });

  const hasAccess = enrollmentData?.validation_status === 'approved';
  const isOverdue = enrollmentData?.payment_status === 'overdue';
  const isPresentialOnly = enrollmentData?.courses?.mode === 'presentiel';

  // 2. Fetch Lessons
  const { data: lessons, isLoading: isLoadingLessons, error: lessonsError } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('module_name', { ascending: true })
        .order('id', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!courseId && hasAccess && !isOverdue,
  });

  // 3. Fetch Completed Lessons
  const { data: completedLessonsData } = useQuery({
    queryKey: ['completed-lessons', courseId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_completions')
        .select('lesson_id')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return new Set(data.map(d => d.lesson_id));
    },
    enabled: !!user && !!courseId && hasAccess,
  });

  // Auto-sélection de la première leçon non terminée (ou la 1ère)
  useEffect(() => {
    if (lessons && lessons.length > 0 && !selectedLesson) {
      if (completedLessonsData) {
        const firstUncompleted = lessons.find((l: any) => !completedLessonsData.has(l.id));
        setSelectedLesson(firstUncompleted || lessons[0]);
      } else {
        setSelectedLesson(lessons[0]);
      }
    }
  }, [lessons, completedLessonsData, selectedLesson]);

  // Index de navigation
  const currentIndex = lessons && selectedLesson 
    ? lessons.findIndex((l: any) => l.id === selectedLesson.id) 
    : -1;
  const prevLesson = currentIndex > 0 ? lessons?.[currentIndex - 1] : null;
  const nextLesson = (currentIndex >= 0 && lessons && currentIndex < lessons.length - 1) 
    ? lessons[currentIndex + 1] 
    : null;

  // 4. Toggle Completion Mutation
  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ lessonId, isCompleted }: { lessonId: string, isCompleted: boolean }) => {
      if (isCompleted) {
        const { error } = await supabase
          .from('lesson_completions')
          .delete()
          .eq('user_id', user?.id)
          .eq('lesson_id', lessonId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lesson_completions')
          .insert({ user_id: user?.id, lesson_id: lessonId });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['completed-lessons', courseId] });
      queryClient.invalidateQueries({ queryKey: ['enrolled-courses-with-progress'] });
      
      if (!variables.isCompleted) {
        toast.success("Leçon marquée comme terminée !");
        
        // Check if all lessons are now complete
        const totalLessons = lessons?.length || 0;
        const newlyCompletedCount = (completedLessonsData?.size || 0) + 1;
        if (totalLessons > 0 && newlyCompletedCount === totalLessons) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 8000);
          toast.success("Félicitations ! Vous avez terminé la formation !", {
            duration: 10000,
            description: "Votre certificat est maintenant disponible dans votre profil."
          });
        }
      }
    },
    onError: (error: any) => toast.error(`Erreur: ${error.message}`),
  });

  // Select first lesson by default
  useEffect(() => {
    if (lessons && lessons.length > 0 && !selectedLesson) {
      setSelectedLesson(lessons[0]);
    }
  }, [lessons, selectedLesson]);

  if (isLoadingEnrollment || isLoadingLessons) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 text-center space-y-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Accès Restreint</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Vous n'êtes pas encore inscrit à cette formation ou votre inscription est en attente de validation.
          </p>
          <Link to={`/formations/${courseId}`}>
            <Button className="rounded-2xl px-8 h-12 font-black uppercase text-xs tracking-widest shadow-glow-primary">Voir la formation</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isOverdue) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <Wallet className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-red-600">Accès Suspendu</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Votre accès à ce cours a été suspendu car vous avez un paiement en retard. 
            Veuillez régulariser votre solde pour continuer votre apprentissage.
          </p>
          <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/10 inline-block">
             <p className="text-sm font-bold">Solde dû : {(enrollmentData.total_amount - enrollmentData.paid_amount).toFixed(2)} USD</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="rounded-2xl h-12" onClick={() => navigate('/dashboard')}>
                Retour au tableau de bord
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white rounded-2xl px-8 h-12 font-black uppercase text-xs tracking-widest">
                Régulariser maintenant
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isCinemaMode ? 'bg-[#050505] text-white' : 'bg-background'} pb-12`}>
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.15} colors={['#EAB308', '#0F172A', '#3B82F6']} />}
      {!isCinemaMode && <Navbar />}

      <div className={`container mx-auto px-4 ${isCinemaMode ? 'pt-8' : 'pt-28'} transition-all duration-700`}>
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className={`rounded-xl ${isCinemaMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-primary/10 text-primary'}`} onClick={() => isCinemaMode ? setIsCinemaMode(false) : navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-tight leading-none">{enrollmentData?.courses?.title}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isCinemaMode ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {enrollmentData?.courses?.category}
                  </span>
                  {enrollmentData?.vacation_name && (
                    <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Vacation : {enrollmentData.vacation_name}
                    </Badge>
                  )}
                  {enrollmentData?.courses?.mode && (
                    <Badge variant="outline" className="bg-muted border-border/50 text-muted-foreground text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md">
                      {enrollmentData.courses.mode === 'online' ? 'En ligne' : enrollmentData.courses.mode === 'presentiel' ? 'Présentiel Campus' : 'Hybride'}
                    </Badge>
                  )}
                </div>
              </div>
           </div>
           {!isPresentialOnly && (
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => setIsCinemaMode(!isCinemaMode)}
               className={`rounded-xl border font-bold uppercase text-[10px] tracking-wider ${isCinemaMode ? 'border-white/20 bg-white/5 hover:bg-white/10 text-white' : 'border-primary/20 hover:bg-primary/5 text-primary'}`}
             >
               {isCinemaMode ? 'Quitter le mode cinéma' : 'Mode Cinéma'}
             </Button>
           )}
        </div>

        {/* VUE EXCLUSIVE FORMATION EN PRÉSENTIEL */}
        {isPresentialOnly ? (
          <div className="space-y-8 max-w-5xl mx-auto">
            {/* CARTE / PASS D'ACCÈS PRÉSENTIEL OFFICIEL */}
            <Card className="rounded-[2.5rem] border-primary/20 bg-card/60 backdrop-blur-xl shadow-lg p-6 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold uppercase px-3 py-1 rounded-lg flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Pass d'Accès Présentiel Actif
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">Session {new Date().getFullYear()}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-foreground">
                      {userProfile?.full_name || user?.user_metadata?.full_name || "Étudiant Botes Academy"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Formation : <span className="text-foreground font-semibold">{enrollmentData?.courses?.title}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/40">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Vacation</p>
                        <p className="font-semibold text-foreground">
                          {enrollmentData?.vacation_name || "Matin"} (
                          {enrollmentData?.vacation_name === "MIDI" ? "11h30 - 14h30" : enrollmentData?.vacation_name === "SOIR" ? "16h00 - 19h00" : "08h00 - 11h00"}
                          )
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/40">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Lieu & Campus</p>
                        <p className="font-semibold text-foreground">Campus Botes Academy</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/40">
                      <UserCheck className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Statut Inscription</p>
                        <p className="font-semibold text-emerald-600">Accès Autorisé & Validé</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center lg:items-end gap-3 self-center lg:self-auto p-6 rounded-3xl bg-muted/20 border border-border/40 shrink-0 text-center lg:text-right">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Code d'Accès Étudiant</div>
                  <div className="font-mono font-black text-2xl md:text-3xl tracking-wider text-primary bg-primary/10 px-5 py-2.5 rounded-2xl border border-primary/20">
                    {userProfile?.matricule || `BOTES-${user?.id?.slice(0, 6)?.toUpperCase()}`}
                  </div>
                  <p className="text-[11px] text-muted-foreground max-w-[220px]">
                    Présentez ce code à la réception ou au formateur lors de votre entrée en salle.
                  </p>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => window.print()}
                    className="rounded-xl text-xs font-bold gap-2 mt-2 h-10 px-5"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer le Pass d'Accès
                  </Button>
                </div>
              </div>
            </Card>

            {/* PROGRAMME & SUPPORTS DE COURS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold uppercase tracking-tight">Programme & Supports de Cours</h3>
              </div>

              {lessons && lessons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lessons.map((lesson: any, index: number) => (
                    <Card key={lesson.id} className="rounded-2xl border border-border/50 bg-card/40 p-5 hover:border-primary/30 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">Module {index + 1}</span>
                          <h4 className="font-bold text-sm text-foreground">{lesson.title}</h4>
                          {lesson.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{lesson.description}</p>
                          )}
                        </div>
                        {lesson.file_url || lesson.pdf_url ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(lesson.file_url || lesson.pdf_url, '_blank')}
                            className="rounded-xl text-[10px] font-bold uppercase shrink-0 gap-1.5 h-8"
                          >
                            <Download className="w-3.5 h-3.5" /> Support PDF
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] uppercase font-semibold">Présentiel</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="rounded-2xl border-dashed border-border p-8 text-center bg-muted/10 space-y-2">
                  <BookOpen className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
                  <p className="font-bold text-sm">Supports & Programme de formation</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Le programme détaillé ainsi que les polycopiés imprimés vous seront directement remis en main propre lors de la première séance en salle.
                  </p>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* VUE EN LIGNE / HYBRIDE (LECTEUR VIDÉO, SIDEBAR, FORUM) */
          <Tabs defaultValue="lesson" className="space-y-8">
            {!isCinemaMode && (
              <div className="flex justify-start">
                <TabsList className="bg-muted/30 p-1 rounded-2xl border border-border/50 h-12">
                  <TabsTrigger value="lesson" className="rounded-xl px-6 data-[state=active]:shadow-lg gap-2 font-black uppercase text-[10px] tracking-widest">
                    <PlayCircle className="w-4 h-4" />
                    Contenu du cours
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="rounded-xl px-6 data-[state=active]:shadow-lg gap-2 font-black uppercase text-[10px] tracking-widest">
                    <MessageSquare className="w-4 h-4" />
                    Forum & Entraide
                  </TabsTrigger>
                </TabsList>
              </div>
            )}

            <TabsContent value="lesson">
              <div className={`grid grid-cols-1 ${isCinemaMode ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8 transition-all duration-700`}>
                {/* Main Content Area */}
                <div className={`${isCinemaMode ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-8`}>
                  {selectedLesson ? (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-1000">
                      <div className="relative">
                        <div className="absolute -inset-4 bg-primary/20 blur-[100px] rounded-full opacity-40 animate-pulse pointer-events-none" />
                        
                        <div className={`rounded-[2.5rem] overflow-hidden bg-black aspect-video shadow-[0_0_100px_rgba(0,0,0,0.5)] border-4 ${isCinemaMode ? 'border-white/10' : 'border-card/50'} relative group transition-all duration-700`}>
                          {selectedLesson.lesson_type === 'video' ? (
                            <VideoPlayer 
                              key={selectedLesson.id}
                              url={selectedLesson.video_url} 
                              onEnded={() => {
                                if (completedLessonsData && !completedLessonsData.has(selectedLesson.id)) {
                                   toggleCompletionMutation.mutate({ lessonId: selectedLesson.id, isCompleted: false });
                                }
                              }}
                            />
                          ) : (
                            <PdfPlayer key={selectedLesson.id} url={selectedLesson.file_url} />
                          )}
                        </div>
                      </div>

                      <div className={`p-10 ${isCinemaMode ? 'bg-white/5 border-white/10' : 'bg-card/50 border-primary/10'} backdrop-blur-3xl rounded-[3rem] border shadow-2xl transition-all duration-700`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                          <div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-2">{selectedLesson.title}</h2>
                            <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.3em] opacity-40">
                               <span>Module {selectedLesson.module_name || 'Général'}</span>
                               <span>•</span>
                               <span>{selectedLesson.lesson_type} Content</span>
                            </div>
                          </div>
                          <Button 
                            variant={completedLessonsData?.has(selectedLesson.id) ? "outline" : "default"}
                            className={`${completedLessonsData?.has(selectedLesson.id) ? (isCinemaMode ? 'border-white/20 text-white hover:bg-white/10' : 'border-green-500 text-green-600 hover:bg-green-50') : 'shadow-glow-primary'} rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95`}
                            onClick={() => toggleCompletionMutation.mutate({ 
                              lessonId: selectedLesson.id, 
                              isCompleted: completedLessonsData?.has(selectedLesson.id) || false 
                            })}
                            disabled={toggleCompletionMutation.isPending}
                          >
                            {toggleCompletionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : null}
                            {completedLessonsData?.has(selectedLesson.id) ? "Terminée" : "Marquer comme terminée"}
                          </Button>
                        </div>
                        <div className={`prose prose-lg max-w-none font-medium leading-relaxed ${isCinemaMode ? 'text-white/60' : 'text-muted-foreground'}`}>
                          {selectedLesson.description || "Aucune description disponible pour cette leçon."}
                        </div>

                        {/* Support PDF attaché à la leçon vidéo */}
                        {(selectedLesson.pdf_url || (selectedLesson.lesson_type === 'video' && selectedLesson.file_url)) && (
                          <div className="pt-6">
                            <Button 
                              variant="outline" 
                              onClick={() => window.open(selectedLesson.pdf_url || selectedLesson.file_url, '_blank')}
                              className="rounded-xl h-11 px-5 text-xs font-bold gap-2"
                            >
                              <FileText className="w-4 h-4 text-primary" />
                              Télécharger la fiche / support du cours (PDF)
                            </Button>
                          </div>
                        )}

                        {/* Barre de navigation Leçon Précédente / Suivante */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/40 mt-8">
                          <Button
                            variant="outline"
                            onClick={() => prevLesson && setSelectedLesson(prevLesson)}
                            disabled={!prevLesson}
                            className="w-full sm:w-auto h-12 px-5 rounded-xl font-bold uppercase text-[10px] tracking-wider gap-2"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Leçon précédente
                          </Button>

                          <div className="text-center text-xs text-muted-foreground font-semibold">
                            Leçon {currentIndex + 1} sur {lessons?.length || 0}
                          </div>

                          <Button
                            variant={nextLesson ? "default" : "outline"}
                            onClick={() => nextLesson && setSelectedLesson(nextLesson)}
                            disabled={!nextLesson}
                            className="w-full sm:w-auto h-12 px-5 rounded-xl font-bold uppercase text-[10px] tracking-wider gap-2"
                          >
                            Leçon suivante
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[600px] flex flex-col items-center justify-center bg-white/5 rounded-[4rem] border-2 border-dashed border-white/10 space-y-6">
                      <Loader2 className="w-12 h-12 animate-spin text-primary" />
                      <p className="text-white/40 font-black italic uppercase tracking-[0.4em] text-xs">Chargement du contenu...</p>
                    </div>
                  )}
                </div>

                {/* Sidebar Area */}
                <div className={`${isCinemaMode ? 'lg:col-span-1' : 'lg:col-span-1'} transition-all duration-700`}>
                  <CourseSidebar 
                    lessons={lessons}
                    isLoadingLessons={isLoadingLessons}
                    lessonsError={lessonsError}
                    hasAccess={hasAccess && !isOverdue}
                    selectedLesson={selectedLesson}
                    setSelectedLesson={setSelectedLesson}
                    completedLessons={completedLessonsData}
                    onToggleCompletion={(lessonId, isCompleted) => toggleCompletionMutation.mutate({ lessonId, isCompleted })}
                    isToggling={toggleCompletionMutation.isPending}
                    mode={enrollmentData?.courses?.mode}
                    isCinemaMode={isCinemaMode}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chat">
              <div className="max-w-4xl mx-auto">
                <CourseChat courseId={courseId!} />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default CourseContent;
