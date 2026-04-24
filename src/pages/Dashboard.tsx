import { motion, animate } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Award, TrendingUp, Clock, AlertCircle, Download, Wallet, AlertTriangle, Megaphone, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { generateInvoice } from "@/lib/pdfService";
import { StrategyModal } from "@/components/StrategyModal";
import { StatsSection } from "@/components/dashboard/StatsSection";
import { EnrolledCourseCard } from "@/components/dashboard/EnrolledCourseCard";
import { AnnouncementsWidget } from "@/components/dashboard/AnnouncementsWidget";
import { SupportCard } from "@/components/dashboard/SupportCard";

// Moved to src/components/dashboard/StatsSection.tsx

const Dashboard = () => {
  const { user } = useAuth();

  const { data: enrolledCourses, isLoading, error } = useQuery({
    queryKey: ['enrolled-courses-with-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_enrolled_courses_with_progress');
      if (error) throw new Error(error.message);
      return data as any[];
    },
    enabled: !!user,
  });

  const { data: allPaymentProofs } = useQuery({
    queryKey: ['user-payment-proofs-all', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('payment_proofs')
        .select('*')
        .eq('user_id', user.id);
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

  const financialSummary = useMemo(() => {
    if (!enrolledCourses) return { totalDebt: 0, hasOverdue: false };
    return enrolledCourses.reduce((acc, course) => {
        const debt = (course.total_amount || 0) - (course.paid_amount || 0);
        return {
            totalDebt: acc.totalDebt + debt,
            hasOverdue: acc.hasOverdue || course.payment_status === 'overdue'
        };
    }, { totalDebt: 0, hasOverdue: false });
  }, [enrolledCourses]);

  const { data: profile } = useQuery({
    queryKey: ['user-profile-completion', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_completed, matricule')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map(i => (
             <Card key={i} className="p-6 h-full rounded-[2.5rem] bg-card/50 backdrop-blur-xl border border-border/40">
                <div className="flex justify-between mb-4">
                   <div className="space-y-3 flex-1 mr-4">
                      <Skeleton className="h-7 w-3/4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </div>
                   </div>
                   <Skeleton className="h-6 w-16 rounded-full shrink-0" />
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <div className="flex justify-between"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-8" /></div>
                      <Skeleton className="h-2 w-full rounded-full" />
                   </div>
                   <div className="flex justify-between p-3 bg-muted/20 rounded-2xl">
                      <div className="space-y-1"><Skeleton className="h-2 w-12" /><Skeleton className="h-4 w-20" /></div>
                      <div className="space-y-1 items-end flex flex-col"><Skeleton className="h-2 w-12" /><Skeleton className="h-4 w-16" /></div>
                   </div>
                </div>
             </Card>
          ))}
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

    const showProfileWarning = profile && !profile.profile_completed;
    const rejectedPayments = allPaymentProofs?.filter(p => p.status === 'rejected') || [];
    const pendingPayments = allPaymentProofs?.filter(p => p.status === 'pending') || [];

    return (
      <div className="space-y-8">
        {pendingPayments.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-amber-500/10 border-2 border-amber-500/30 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/5 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-500/20 rounded-3xl flex items-center justify-center text-amber-600 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                <Clock className="w-8 h-8" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-amber-700">Paiement en cours de validation</h3>
                <p className="text-sm font-medium text-amber-800/80 italic">Nous avons reçu vos justificatifs. Notre équipe les valide généralement en moins de 24h.</p>
              </div>
            </div>
            <Link to="/finance">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs group shadow-lg shadow-amber-500/20">
                Suivre mes achats
                <ArrowUpRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Button>
            </Link>
          </motion.div>
        )}

        {rejectedPayments.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-red-500/10 border-2 border-red-500/30 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-red-500/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-500/20 rounded-3xl flex items-center justify-center text-red-600 shadow-inner">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-red-600">Action Requise : Paiement Rejeté</h3>
                <p className="text-sm font-medium text-red-600/80 italic">L'un de vos paiements n'a pas pu être validé par le staff. Veuillez corriger les informations.</p>
              </div>
            </div>
            <Link to="/finance">
              <Button className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs group shadow-lg shadow-red-500/20">
                Voir les détails
                <ArrowUpRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Button>
            </Link>
          </motion.div>
        )}

        {showProfileWarning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-2 border-dashed border-amber-500/30 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/5 transition-all hover:shadow-amber-500/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-glow-amber shrink-0">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-amber-700 leading-none">Dossier Académique Incomplet</h3>
                <p className="text-xs font-medium text-amber-800 italic leading-relaxed">
                  Veuillez compléter vos informations (Adresse, Contact d'urgence) pour recevoir votre matricule officiel.
                </p>
              </div>
            </div>
            <Link to="/profile">
              <Button className="rounded-xl h-12 px-8 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all italic">
                Compléter l'Excellence
              </Button>
            </Link>
          </motion.div>
        )}

        {!enrolledCourses || enrolledCourses.length === 0 ? (
          <div className="relative overflow-hidden text-center flex flex-col items-center gap-6 py-24 bg-card/50 backdrop-blur-3xl rounded-[3rem] border border-border/50 shadow-2xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center shadow-inner relative z-10 transition-transform hover:scale-110 duration-500 hover:-rotate-12">
              <BookOpen className="w-12 h-12 text-primary opacity-80" />
            </div>
            <div className="relative z-10 space-y-2">
              <h3 className="text-3xl font-black uppercase tracking-tighter italic">Aucun cours actif</h3>
              {pendingPayments.length > 0 ? (
                <p className="max-w-sm mx-auto text-muted-foreground font-medium italic">
                  Votre accès est en cours de déblocage. Nous vérifions votre dernier paiement.
                </p>
              ) : (
                <p className="max-w-sm mx-auto text-muted-foreground font-medium">L'excellence vous attend. Explorez nos formations pour commencer votre aventure !</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 relative z-10 mt-2">
              <Link to="/formations">
                <Button className="rounded-2xl h-14 px-10 shadow-glow-primary hover:scale-105 transition-transform italic font-black uppercase tracking-widest text-xs">
                  Découvrir le catalogue
                </Button>
              </Link>
              {pendingPayments.length > 0 && (
                <Link to="/finance">
                  <Button variant="outline" className="rounded-2xl h-14 px-10 border-2 border-primary/20 hover:bg-primary/5 transition-all italic font-black uppercase tracking-widest text-[10px]">
                    Voir mes paiements
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : filteredEnrolledCourses.length === 0 && searchQuery ? (
          <div className="text-center py-20 bg-muted/10 rounded-[3rem] border border-dashed">
            <p className="text-muted-foreground font-medium italic">Aucun cours ne correspond à "{searchQuery}"</p>
            <Button variant="ghost" className="mt-2 text-primary font-black uppercase text-[10px] tracking-widest" onClick={() => setSearchQuery("")}>Effacer la recherche</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEnrolledCourses.map((course) => (
              <EnrolledCourseCard 
                key={course.course_id} 
                course={course} 
                paymentProofs={allPaymentProofs} 
                user={user} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTools = () => {
    if (isLoadingTools) {
      return (
        <div className="bento-grid">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bento-card border-none bg-muted/10 p-6 shadow-none">
              <div className="flex justify-between mb-4">
                 <Skeleton className="w-10 h-10 rounded-2xl" />
                 <Skeleton className="w-10 h-10 rounded-2xl" />
              </div>
              <div className="mt-8">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 rounded-full" />
              </div>
            </Card>
          ))}
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
      <div className="bento-grid">
        {purchasedTools?.strategies.map((p: any) => (
          <Card key={p.id} className="bento-card border-none bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-2xl group-hover:rotate-12 transition-transform duration-500">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              {p.strategies?.content ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-2xl bg-background/50 h-10 w-10"
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
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1 leading-tight">{p.strategies?.title}</h4>
              <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest border-emerald-500/20 text-emerald-600 px-3 py-1 rounded-full">Stratégie Gold</Badge>
            </div>
          </Card>
        ))}
        {purchasedTools?.indicators.map((p: any) => (
          <Card key={p.id} className="bento-card border-none bg-gradient-to-br from-primary/10 to-primary/5 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/20 rounded-2xl group-hover:-rotate-12 transition-transform duration-500">
                <Download className="w-6 h-6 text-primary" />
              </div>
              {p.indicators?.file_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-2xl bg-background/50 h-10 w-10"
                  onClick={() => {
                      toast.success("Téléchargement lancé...");
                      window.open(p.indicators.file_url, '_blank');
                  }}
                >
                  <Download className="w-5 h-5 text-primary" />
                </Button>
              )}
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1 leading-tight">{p.indicators?.name}</h4>
              <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest border-primary/20 text-primary px-3 py-1 rounded-full">Indicateur Pro</Badge>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-mesh-gradient relative overflow-hidden flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 pt-32 pb-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-[0.85]">
                Mon <span className="text-gradient-primary">Espace</span>
              </h1>
              <p className="text-muted-foreground font-medium italic text-lg ml-1">Bienvenue, <span className="text-primary font-black uppercase tracking-tight">{user?.user_metadata.full_name || 'Étudiant'}</span>. Prêt pour l'excellence ?</p>
            </div>
            
          </div>
        </motion.div>

        {/* Search floating for easier access */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une formation..." 
            className="pl-11 h-14 rounded-2xl bg-card/40 backdrop-blur-xl border-border/10 focus:ring-primary/20 shadow-premium italic font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <StatsSection 
          enrolledCourses={enrolledCourses}
          attendanceRate={attendanceStats?.rate}
          financialSummary={financialSummary}
          isLoading={isLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mt-12">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            <div className="flex items-center gap-3 pb-4 border-b border-border/10">
              <div className="p-2 bg-primary/10 rounded-xl"><BookOpen className="w-6 h-6 text-primary" /></div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">Mes Formations</h2>
            </div>
            {renderContent()}

            <div className="flex items-center gap-3 pt-12 pb-4 border-b border-border/10">
              <div className="p-2 bg-emerald-500/10 rounded-xl"><TrendingUp className="w-6 h-6 text-emerald-600" /></div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">Mes Stratégies & Outils</h2>
            </div>
            {renderTools()}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-12">
            <div className="space-y-10 sticky top-32">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-black uppercase tracking-tight italic">Annonces</h2>
                </div>
                <AnnouncementsWidget />
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-black uppercase tracking-tight italic">Assistance</h2>
                </div>
                <SupportCard />
              </div>
            </div>
          </aside>
        </div>
      </main>

      <StrategyModal 
        isOpen={isStrategyModalOpen}
        onClose={() => setIsStrategyModalOpen(false)}
        strategy={selectedStrategy}
      />
    </div>
  );
};

export default Dashboard;
