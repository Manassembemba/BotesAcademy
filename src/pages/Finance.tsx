import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Download, 
  AlertCircle, 
  ArrowUpRight,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { generateInvoice } from "@/lib/pdfService";

const Finance = () => {
  const { user } = useAuth();

  // Fetch all payment proofs for the user
  const { data: proofs, isLoading: loadingProofs } = useQuery({
    queryKey: ['user-finance-proofs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('payment_proofs')
        .select(`
          *,
          courses (title),
          strategies (title),
          indicators (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch enrolled courses for balance tracking
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['user-finance-enrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_enrolled_courses_with_progress');
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user
  });

  const totalPaid = proofs?.filter(p => p.status === 'approved').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  const pendingAmount = proofs?.filter(p => p.status === 'pending').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Validé</Badge>;
      case 'rejected': return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Rejeté</Badge>;
      default: return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 animate-pulse"><Clock className="w-3 h-3" /> En attente</Badge>;
    }
  };

  const getProductName = (proof: any) => {
    if (proof.courses?.title) return proof.courses.title;
    if (proof.strategies?.title) return proof.strategies.title;
    if (proof.indicators?.name) return proof.indicators.name;
    return "Produit Inconnu";
  };

  return (
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
                Mon <span className="text-gradient-primary">Portefeuille</span>
              </h1>
              <p className="text-muted-foreground font-medium italic text-lg ml-1">Gérez vos investissements et votre parcours académique.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-card/30 backdrop-blur-3xl p-5 rounded-[2.5rem] border border-white/5 shadow-premium">
               <div className="p-4 bg-primary/20 rounded-2xl text-primary shadow-glow-primary transition-transform hover:scale-110 duration-500">
                 <Wallet className="w-8 h-8" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 leading-none mb-1">Total Investi</p>
                 <p className="text-4xl font-black italic tracking-tighter">{totalPaid} <span className="text-sm opacity-50 font-bold not-italic">USD</span></p>
               </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="bg-card/30 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5 mb-8 w-fit space-x-1">
                <TabsTrigger value="history" className="rounded-xl px-8 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Historique</TabsTrigger>
                <TabsTrigger value="pending" className="relative rounded-xl px-8 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all">
                  Attente
                  {proofs?.filter(p => p.status === 'pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center animate-bounce shadow-lg">
                      {proofs.filter(p => p.status === 'pending').length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history">
                <Card className="shadow-2xl rounded-[2rem] overflow-hidden border-border/40">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="pl-6 font-black uppercase text-[10px]">Article</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Date</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Montant</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Statut</TableHead>
                        <TableHead className="text-right pr-6 font-black uppercase text-[10px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingProofs ? (
                        [1,2,3].map(i => (
                          <TableRow key={i}><TableCell colSpan={5} className="p-4"><Skeleton className="h-8 w-full rounded-xl" /></TableCell></TableRow>
                        ))
                      ) : proofs?.filter(p => p.status !== 'pending').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">Aucun historique de paiement pour le moment.</TableCell>
                        </TableRow>
                      ) : (
                        proofs?.filter(p => p.status !== 'pending').map((proof) => (
                          <TableRow key={proof.id} className="hover:bg-primary/5 transition-colors">
                            <TableCell className="pl-6 font-bold">{getProductName(proof)}</TableCell>
                            <TableCell className="text-xs">{format(new Date(proof.created_at), 'dd MMM yyyy', { locale: fr })}</TableCell>
                            <TableCell className="font-black">${proof.amount}</TableCell>
                            <TableCell>{getStatusBadge(proof.status)}</TableCell>
                            <TableCell className="text-right pr-6">
                              {proof.status === 'approved' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="rounded-xl hover:bg-primary/10 text-primary"
                                  onClick={() => generateInvoice({
                                    studentName: user?.user_metadata.full_name || user?.email || 'Étudiant',
                                    courseTitle: getProductName(proof),
                                    amount: proof.amount,
                                    paymentMethod: proof.payment_method,
                                    transactionRef: proof.transaction_reference,
                                    date: proof.validated_at || proof.created_at,
                                    invoiceNumber: proof.id.slice(0, 8).toUpperCase()
                                  })}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                              {proof.status === 'rejected' && proof.admin_notes && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="rounded-xl hover:bg-destructive/10 text-destructive"
                                  onClick={() => alert(`Motif du rejet : ${proof.admin_notes}`)}
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="pending">
                <div className="space-y-4">
                  {proofs?.filter(p => p.status === 'pending').map((proof) => (
                    <Card key={proof.id} className="p-6 border-none bg-muted/20 rounded-[2rem] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600"><Clock className="w-6 h-6" /></div>
                        <div>
                          <h4 className="font-bold text-lg leading-tight">{getProductName(proof)}</h4>
                          <p className="text-xs text-muted-foreground italic">En attente de vérification par l'équipe administrative</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black">${proof.amount}</p>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{format(new Date(proof.created_at), 'dd MMM', { locale: fr })}</p>
                      </div>
                    </Card>
                  ))}
                  {proofs?.filter(p => p.status === 'pending').length === 0 && (
                    <Card className="p-12 text-center text-muted-foreground border-dashed border-2 rounded-[2.5rem] bg-card/30">
                      Vous n'avez aucun paiement en attente.
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar: Balances */}
          <div className="space-y-8">
            <h2 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Solds Restants
            </h2>
            <div className="space-y-4">
              {loadingEnrollments ? (
                <Skeleton className="h-32 w-full rounded-3xl" />
              ) : enrollments?.filter(e => e.total_amount > e.paid_amount).length === 0 ? (
                <Card className="p-6 bg-emerald-500/5 border-emerald-500/20 rounded-[2rem] text-center">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Tous vos cours sont réglés !</p>
                </Card>
              ) : (
                enrollments?.filter(e => e.total_amount > e.paid_amount).map((course) => (
                  <Card key={course.course_id} className="p-6 border-none bg-gradient-to-br from-red-500/10 to-transparent rounded-[2rem] space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm leading-tight max-w-[150px]">{course.course_title}</h4>
                      <Badge variant="destructive" className="text-[9px] font-black uppercase tracking-tighter">Solde Ouvert</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                        <span>Payé</span>
                        <span>Reste</span>
                      </div>
                      <div className="flex justify-between text-lg font-black italic items-end">
                        <span className="text-muted-foreground text-sm">${course.paid_amount}</span>
                        <span className="text-red-600">${course.total_amount - course.paid_amount}</span>
                      </div>
                    </div>
                    <Button variant="hero" className="w-full h-10 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg">
                      Régler le solde
                    </Button>
                  </Card>
                ))
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Finance;
