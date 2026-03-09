import { motion } from "framer-motion";
import { useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Award, TrendingUp, Clock, AlertCircle, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { generateInvoice, generateBadge } from "@/lib/pdfService";

const Dashboard = () => {
  const { user } = useAuth();

  const { data: enrolledCourses, isLoading, error } = useQuery({
    queryKey: ['enrolled-courses-with-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_enrolled_courses_with_progress');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  const { data: paymentProofs } = useQuery({
    queryKey: ['user-payment-proofs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('payment_proofs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: attendanceStats } = useQuery({
    queryKey: ['user-attendance-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('attendance' as any)
        .select('status')
        .eq('student_id', user.id);
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const present = data?.filter((a: any) => a.status === 'present').length || 0;
      const late = data?.filter((a: any) => a.status === 'late').length || 0;
      const rate = total > 0 ? ((present + (late * 0.5)) / total) * 100 : 100;
      
      return { total, present, late, rate };
    },
    enabled: !!user,
  });

  const { data: purchasedTools, isLoading: isLoadingTools } = useQuery({
    queryKey: ['purchased-tools', user?.id],
    queryFn: async () => {
      if (!user) return { strategies: [], indicators: [] };

      const [strategiesRes, indicatorsRes] = await Promise.all([
        supabase
          .from('strategy_purchases')
          .select('*, strategies(*)')
          .eq('user_id', user.id),
        supabase
          .from('indicator_purchases')
          .select('*, indicators(*)')
          .eq('user_id', user.id)
      ]);

      return {
        strategies: strategiesRes.data || [],
        indicators: indicatorsRes.data || []
      };
    },
    enabled: !!user,
  });

  const totalProgress = useMemo(() => {
    if (!enrolledCourses || enrolledCourses.length === 0) return 0;
    const total = enrolledCourses.reduce((acc, course) => acc + (course.progress || 0), 0);
    return total / enrolledCourses.length;
  }, [enrolledCourses]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-500 flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12" />
          <h3 className="text-xl font-semibold">Erreur lors du chargement de vos cours</h3>
          <p>{error.message}</p>
        </div>
      );
    }

    if (!enrolledCourses || enrolledCourses.length === 0) {
      return (
        <div className="text-center text-muted-foreground flex flex-col items-center gap-4 py-12">
          <BookOpen className="w-16 h-16" />
          <h3 className="text-xl font-semibold">Vous n'êtes inscrit à aucun cours pour le moment.</h3>
          <p>Explorez nos formations pour commencer votre aventure d'apprentissage !</p>
          <Link to="/formations">
            <Button>Voir les formations</Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {enrolledCourses.map((course) => {
          const proof = paymentProofs?.find(p => p.course_id === course.course_id);

          return (
            <div key={course.course_id} className="relative group">
              <Link to={`/formations/${course.course_id}`}>
                <Card className="p-6 hover:border-primary/50 transition-all duration-300 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1">{course.course_title}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">{course.course_category}</Badge>
                        {course.vacation_name && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-black uppercase tracking-tighter">
                            {course.vacation_name} • {course.vacation_time}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.estimated_duration || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-semibold">{Math.round(course.progress || 0)}%</span>
                      </div>
                      <Progress value={course.progress || 0} className="h-2" />
                    </div>

                    {proof && (
                      <div className="flex gap-2 pt-2 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[10px] font-bold uppercase tracking-tight gap-1 hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            generateInvoice({
                              studentName: user?.user_metadata.full_name || user?.email || 'Étudiant',
                              courseTitle: course.course_title,
                              amount: proof.amount,
                              paymentMethod: proof.payment_method === 'mobile_money' ? 'Mobile Money' :
                                proof.payment_method === 'bank_transfer' ? 'Virement bancaire' :
                                  proof.payment_method === 'cash_deposit' ? 'Dépôt en espèces' : 'Autre',
                              transactionRef: proof.transaction_reference || undefined,
                              date: proof.validated_at || proof.created_at,
                              invoiceNumber: proof.id.slice(0, 8).toUpperCase()
                            });
                          }}
                        >
                          <Download className="w-3 h-3" />
                          Facture
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[10px] font-bold uppercase tracking-tight gap-1 hover:bg-accent/10 hover:text-accent"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            generateBadge({
                              studentName: user?.user_metadata.full_name || user?.email || 'Étudiant',
                              courseTitle: course.course_title,
                              date: proof.validated_at || proof.created_at
                            });
                          }}
                        >
                          <Award className="w-3 h-3" />
                          Badge
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTools = () => {
    if (isLoadingTools) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    const hasTools = (purchasedTools?.strategies.length || 0) + (purchasedTools?.indicators.length || 0) > 0;

    if (!hasTools) {
      return (
        <Card className="p-8 text-center bg-muted/30 border-dashed border-2">
          <p className="text-muted-foreground mb-4 font-medium italic">Vous n'avez pas encore d'outils ou de stratégies.</p>
          <Link to="/marketplace">
            <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent/10">Explorer la Marketplace</Button>
          </Link>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {purchasedTools?.strategies.map((p: any) => (
          <Card key={p.id} className="p-4 flex items-center justify-between group hover:border-emerald-500/50 transition-all border-emerald-500/10 bg-emerald-500/5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-black text-sm truncate max-w-[150px] uppercase tracking-tighter italic">{p.strategies?.title}</h4>
                <Badge variant="outline" className="text-[9px] h-4 py-0 uppercase font-bold border-emerald-500/20 text-emerald-600">Stratégie Gold</Badge>
              </div>
            </div>
            {p.strategies?.content ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-xl"
                onClick={() => {
                    toast.info("Affichage de la stratégie...");
                    // Optionnel: Ouvrir une modale avec le contenu
                }}
              >
                <BookOpen className="w-4 h-4" />
              </Button>
            ) : (
              <Badge variant="secondary" className="text-[8px] opacity-50">VOD Incluse</Badge>
            )}
          </Card>
        ))}
        {purchasedTools?.indicators.map((p: any) => (
          <Card key={p.id} className="p-4 flex items-center justify-between group hover:border-primary/50 transition-all border-primary/10 bg-primary/5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-black text-sm truncate max-w-[150px] uppercase tracking-tighter italic">{p.indicators?.name}</h4>
                <Badge variant="outline" className="text-[9px] h-4 py-0 uppercase font-bold border-primary/20 text-primary">Indicateur Pro</Badge>
              </div>
            </div>
            {p.indicators?.file_url && (
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:text-primary hover:bg-primary/10 rounded-xl"
                onClick={() => {
                    toast.success("Téléchargement lancé...");
                    window.open(p.indicators.file_url, '_blank');
                }}
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold mb-2">
              Bienvenue, <span className="text-gradient-primary">{user?.user_metadata.full_name || 'Étudiant'}</span> !
            </h1>
            <p className="text-muted-foreground">
              Suivez votre progression et gérez vos formations.
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-10" /> : enrolledCourses?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Cours actifs</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Certifications</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-10" /> : `${Math.round(totalProgress)}%`}</div>
                  <p className="text-sm text-muted-foreground">Progression</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-foreground/10 to-foreground/5 border-foreground/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-foreground/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{attendanceStats ? `${Math.round(attendanceStats.rate)}%` : '100%'}</div>
                  <p className="text-sm text-muted-foreground">Assiduité</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Enrolled Courses */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Mes formations en cours</h2>
            {renderContent()}
          </div>

          {/* Purchased Tools */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Mes outils & stratégies</h2>
              <Link to="/marketplace" className="text-accent hover:underline text-sm font-medium">Marketplace →</Link>
            </div>
            {renderTools()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
