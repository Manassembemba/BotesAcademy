import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CourseSidebar } from "@/components/course/CourseSidebar";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { PdfPlayer } from "@/components/course/PdfPlayer";
import Navbar from "@/components/Navbar";
import { Loader2, AlertCircle, Lock, ArrowLeft, Wallet, MessageSquare, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
                <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{enrollmentData?.courses?.title}</h1>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isCinemaMode ? 'text-white/40' : 'text-muted-foreground'}`}>{enrollmentData?.courses?.category}</p>
              </div>
           </div>
           <Button 
             variant="outline" 
             size="sm" 
             onClick={() => setIsCinemaMode(!isCinemaMode)}
             className={`rounded-xl border-2 font-black uppercase text-[10px] tracking-widest ${isCinemaMode ? 'border-white/20 bg-white/5 hover:bg-white/10 text-white' : 'border-primary/20 hover:bg-primary/5 text-primary'}`}
           >
             {isCinemaMode ? 'Quitter le mode cinéma' : 'Mode Cinéma'}
           </Button>
        </div>

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
                      {/* Ambient Glow Effect */}
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
                        ) : selectedLesson.lesson_type === 'pdf' ? (
                          <PdfPlayer key={selectedLesson.id} url={selectedLesson.file_url} />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground space-y-4">
                              <AlertCircle className="w-12 h-12 opacity-20" />
                              <p className="font-bold italic">Module interactif / Quiz (Prochainement)</p>
                          </div>
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
                      <div className={`prose prose-lg max-w-none font-medium italic leading-relaxed ${isCinemaMode ? 'text-white/60' : 'text-muted-foreground'}`}>
                        {selectedLesson.description || "Aucune description disponible pour cette leçon."}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[600px] flex flex-col items-center justify-center bg-white/5 rounded-[4rem] border-2 border-dashed border-white/10 space-y-6">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-white/40 font-black italic uppercase tracking-[0.4em] text-xs">Initialisation de l'Expertise...</p>
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
      </div>
    </div>
  );
};

export default CourseContent;
