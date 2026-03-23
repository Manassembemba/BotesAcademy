import { motion } from "framer-motion";
import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import { generateInvoice } from "@/lib/pdfService";
import { StrategyModal } from "@/components/StrategyModal";

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

  const [searchQuery, setSearchQuery] = useState("");

  const filteredEnrolledCourses = useMemo(() => {
    if (!enrolledCourses) return [];
    return enrolledCourses.filter(course => 
      course.course_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.course_category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [enrolledCourses, searchQuery]);

  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);

  const totalProgress = useMemo(() => {
    if (!enrolledCourses || enrolledCourses.length === 0) return 0;
    const total = enrolledCourses.reduce((acc, course) => acc + (course.progress || 0), 0);
    return total / enrolledCourses.length;
  }, [enrolledCourses]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-36 w-full rounded-3xl" />
          <Skeleton className="h-36 w-full rounded-3xl" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-500 flex flex-col items-center gap-4 py-20">
          <AlertCircle className="w-12 h-12" />
          <h3 className="text-xl font-semibold">Erreur lors du chargement de vos cours</h3>
          <p>{error.message}</p>
        </div>
      );
    }

    if (!enrolledCourses || enrolledCourses.length === 0) {
      return (
        <div className="text-center text-muted-foreground flex flex-col items-center gap-4 py-20 bg-muted/20 rounded-[3rem] border border-dashed">
          <BookOpen className="w-16 h-16 opacity-20" />
          <h3 className="text-xl font-black uppercase tracking-tighter italic">Aucun cours actif</h3>
          <p className="max-w-xs mx-auto">Explorez nos formations pour commencer votre aventure d'apprentissage !</p>
          <Link to="/formations">
            <Button className="rounded-2xl px-8 shadow-glow-primary">Voir le catalogue</Button>
          </Link>
        </div>
      );
    }

    if (filteredEnrolledCourses.length === 0 && searchQuery) {
        return (
            <div className="text-center py-20 bg-muted/10 rounded-[3rem] border border-dashed">
                <p className="text-muted-foreground font-medium italic">Aucun cours ne correspond à "{searchQuery}"</p>
                <Button variant="ghost" className="mt-2 text-primary" onClick={() => setSearchQuery("")}>Effacer la recherche</Button>
            </div>
        );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEnrolledCourses.map((course) => {
          const proof = paymentProofs?.find(p => p.course_id === course.course_id);

          return (
            <div key={course.course_id} className="relative group">
              <Link to={`/formations/${course.course_id}`}>
                <Card className="p-6 hover:border-primary/50 transition-all duration-300 h-full rounded-[2.5rem] bg-card/50 backdrop-blur-xl group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
                    <div className="flex-1 space-y-2">
                       <h3 className="text-xl font-black uppercase tracking-tighter italic leading-none">{course.course_title}</h3>
                       <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-primary/5 border-primary/20 text-primary px-3 py-1 rounded-full">{course.course_category}</Badge>
                        {course.vacation_name && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-full">
                            {course.vacation_name} • {course.vacation_time}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 px-3 py-1 rounded-full flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {course.estimated_duration || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <span>Progression</span>
                        <span className="text-primary">{Math.round(course.progress || 0)}%</span>
                      </div>
                      <Progress value={course.progress || 0} className="h-2 rounded-full overflow-hidden" />
                    </div>
 
                    {proof && (
                      <div className="flex gap-2 pt-4 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[10px] font-bold uppercase tracking-tight gap-1 hover:bg-primary/10 hover:text-primary rounded-xl"
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
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      );
    }

    const hasTools = (purchasedTools?.strategies.length || 0) + (purchasedTools?.indicators.length || 0) > 0;

    if (!hasTools) {
      return (
        <Card className="p-12 text-center bg-muted/10 border-dashed border-2 rounded-[3rem] group">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-10 group-hover:opacity-20 transition-opacity" />
          <p className="text-muted-foreground mb-4 font-medium italic">Vous n'avez pas encore d'outils ou de stratégies.</p>
          <Link to="/marketplace">
            <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 rounded-2xl px-8 h-12 font-black uppercase tracking-widest text-[10px]">Explorer la Marketplace</Button>
          </Link>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {purchasedTools?.strategies.map((p: any) => (
          <Card key={p.id} className="p-5 flex items-center justify-between group hover:border-emerald-500/50 transition-all border-emerald-500/10 bg-emerald-500/5 rounded-3xl shadow-sm hover:shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:rotate-12 transition-transform duration-500">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-black text-sm truncate max-w-[150px] uppercase tracking-tighter italic leading-none mb-1">{p.strategies?.title}</h4>
                <Badge variant="outline" className="text-[9px] h-4 py-0 uppercase font-black border-emerald-500/20 text-emerald-600 px-2 rounded-full">Stratégie Gold</Badge>
              </div>
            </div>
            {p.strategies?.content ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-2xl shadow-inner bg-background/50 h-10 w-10"
                onClick={() => {
                    setSelectedStrategy(p.strategies);
                    setIsStrategyModalOpen(true);
                }}
              >
                <BookOpen className="w-5 h-5 text-emerald-600" />
              </Button>
            ) : (
              <Badge variant="secondary" className="text-[8px] opacity-50 px-2 py-0.5 rounded-full font-black uppercase">VOD Incluse</Badge>
            )}
          </Card>
        ))}
        {purchasedTools?.indicators.map((p: any) => (
          <Card key={p.id} className="p-5 flex items-center justify-between group hover:border-primary/50 transition-all border-primary/10 bg-primary/5 rounded-3xl shadow-sm hover:shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl group-hover:-rotate-12 transition-transform duration-500">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-black text-sm truncate max-w-[150px] uppercase tracking-tighter italic leading-none mb-1">{p.indicators?.name}</h4>
                <Badge variant="outline" className="text-[9px] h-4 py-0 uppercase font-black border-primary/20 text-primary px-2 rounded-full">Indicateur Pro</Badge>
              </div>
            </div>
            {p.indicators?.file_url && (
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:bg-primary/10 rounded-2xl shadow-inner bg-background/50 h-10 w-10"
                onClick={() => {
                    toast.success("Téléchargement lancé...");
                    window.open(p.indicators.file_url, '_blank');
                }}
              >
                <Download className="w-5 h-5" />
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
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2 uppercase tracking-tighter italic leading-tight">
                Bienvenue, <span className="text-gradient-primary">{user?.user_metadata.full_name || 'Étudiant'}</span> !
              </h1>
              <p className="text-muted-foreground font-medium italic">
                Suivez votre progression et gérez vos formations professionnelles.
              </p>
            </div>
            
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher une formation..." 
                className="pl-11 h-12 rounded-2xl bg-card/50 backdrop-blur-xl border-border/50 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
      <StrategyModal 
        isOpen={isStrategyModalOpen}
        onClose={() => setIsStrategyModalOpen(false)}
        strategy={selectedStrategy}
      />
    </div>
  );
};

export default Dashboard;
