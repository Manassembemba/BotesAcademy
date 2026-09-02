import { useState } from "react";
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
  Receipt,
  CreditCard,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { generateInvoice } from "@/lib/pdfService";
import { PaymentProofDialog } from "@/components/PaymentProofDialog";

const Finance = () => {
  const { user } = useAuth();
  const [selectedCourseForPayment, setSelectedCourseForPayment] = useState<{
    courseId: string;
    courseTitle: string;
    remainingAmount: number;
  } | null>(null);

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
  const pendingCount = proofs?.filter(p => p.status === 'pending').length || 0;
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': 
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-semibold rounded-full px-2.5 py-0.5 gap-1">
            <CheckCircle2 className="w-3 h-3" /> Validé
          </Badge>
        );
      case 'rejected': 
        return (
          <Badge variant="destructive" className="text-[10px] font-semibold rounded-full px-2.5 py-0.5 gap-1">
            <XCircle className="w-3 h-3" /> Rejeté
          </Badge>
        );
      default: 
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-semibold rounded-full px-2.5 py-0.5 gap-1">
            <Clock className="w-3 h-3" /> En attente
          </Badge>
        );
    }
  };

  const getProductName = (proof: any) => {
    if (proof.courses?.title) return proof.courses.title;
    if (proof.strategies?.title) return proof.strategies.title;
    if (proof.indicators?.name) return proof.indicators.name;
    return "Formation / Outil";
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8 pt-24 space-y-6 pb-20 max-w-7xl">
        
        {/* HEADER UNIFIÉ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
              <Receipt className="w-3 h-3" /> Suivi Académique & Règlements
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Mes Paiements & Soldes
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Consultez l'historique de vos versements, téléchargez vos reçus et réglez vos tranches restantes.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-card border border-border/50 rounded-2xl shadow-xs">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total réglé</p>
                <p className="text-lg font-bold text-foreground leading-tight">${totalPaid} <span className="text-xs font-normal text-muted-foreground">USD</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="bg-card border border-border/50 p-1 rounded-xl h-10 w-fit">
                <TabsTrigger value="history" className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                  Historique des Règlements
                </TabsTrigger>
                <TabsTrigger value="pending" className="relative rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all">
                  En Attente
                  {pendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-4">
                <Card className="rounded-2xl border border-border/50 bg-card shadow-xs overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="pl-5 text-xs font-semibold">Article / Formation</TableHead>
                        <TableHead className="text-xs font-semibold">Date</TableHead>
                        <TableHead className="text-xs font-semibold">Montant</TableHead>
                        <TableHead className="text-xs font-semibold">Statut</TableHead>
                        <TableHead className="text-right pr-5 text-xs font-semibold">Reçu PDF</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingProofs ? (
                        [1, 2, 3].map(i => (
                          <TableRow key={i}><TableCell colSpan={5} className="p-4"><Skeleton className="h-8 w-full rounded-xl" /></TableCell></TableRow>
                        ))
                      ) : proofs?.filter(p => p.status !== 'pending').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-sm text-muted-foreground italic">
                            Aucun historique de paiement pour le moment.
                          </TableCell>
                        </TableRow>
                      ) : (
                        proofs?.filter(p => p.status !== 'pending').map((proof) => (
                          <TableRow key={proof.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="pl-5 font-semibold text-xs text-foreground">{getProductName(proof)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{format(new Date(proof.created_at), 'dd MMM yyyy', { locale: fr })}</TableCell>
                            <TableCell className="font-bold text-xs text-foreground">${proof.amount}</TableCell>
                            <TableCell>{getStatusBadge(proof.status)}</TableCell>
                            <TableCell className="text-right pr-5">
                              {proof.status === 'approved' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2.5 rounded-xl hover:bg-primary/10 text-primary text-xs font-semibold gap-1.5"
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
                                  <Download className="w-3.5 h-3.5" /> Reçu
                                </Button>
                              )}
                              {proof.status === 'rejected' && proof.admin_notes && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2.5 rounded-xl hover:bg-destructive/10 text-destructive text-xs font-semibold gap-1.5"
                                  onClick={() => alert(`Motif du rejet : ${proof.admin_notes}`)}
                                >
                                  <AlertCircle className="w-3.5 h-3.5" /> Motif
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

              <TabsContent value="pending" className="mt-4">
                <div className="space-y-3">
                  {proofs?.filter(p => p.status === 'pending').map((proof) => (
                    <Card key={proof.id} className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-4 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{getProductName(proof)}</h4>
                          <p className="text-xs text-muted-foreground">Preuve en cours de vérification par l'équipe administrative</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-foreground">${proof.amount}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{format(new Date(proof.created_at), 'dd MMM HH:mm', { locale: fr })}</p>
                      </div>
                    </Card>
                  ))}
                  {proofs?.filter(p => p.status === 'pending').length === 0 && (
                    <Card className="p-10 text-center text-muted-foreground border-dashed border rounded-2xl bg-card">
                      <p className="text-sm font-medium">Vous n'avez aucun paiement en attente.</p>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar: Balances */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                Soldes Restants
              </h2>
            </div>
            
            <div className="space-y-3">
              {loadingEnrollments ? (
                <Skeleton className="h-32 w-full rounded-2xl" />
              ) : enrollments?.filter(e => e.total_amount > e.paid_amount).length === 0 ? (
                <Card className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Comptabilité à jour</p>
                  <p className="text-[11px] text-muted-foreground">Toutes vos formations sont entièrement soldées.</p>
                </Card>
              ) : (
                enrollments?.filter(e => e.total_amount > e.paid_amount).map((course) => {
                  const remaining = course.total_amount - course.paid_amount;
                  return (
                    <Card key={course.course_id} className="p-4 rounded-2xl border border-destructive/20 bg-destructive/5 space-y-3 shadow-xs">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold text-xs text-foreground leading-snug">{course.course_title}</h4>
                        <Badge variant="destructive" className="text-[9px] font-bold rounded-full px-2 py-0.5 shrink-0">Tranche Due</Badge>
                      </div>
                      
                      <div className="space-y-1 bg-background/60 p-2.5 rounded-xl border border-border/40">
                        <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase">
                          <span>Déjà versé</span>
                          <span>Reste à payer</span>
                        </div>
                        <div className="flex justify-between items-baseline font-bold text-sm">
                          <span className="text-muted-foreground text-xs">${course.paid_amount}</span>
                          <span className="text-destructive">${remaining} USD</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full h-9 rounded-xl font-semibold text-xs gap-1.5 shadow-xs"
                        onClick={() => setSelectedCourseForPayment({
                          courseId: course.course_id,
                          courseTitle: course.course_title,
                          remainingAmount: remaining
                        })}
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Régler la tranche restante
                      </Button>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Soumission de Preuve pour la Tranche Restante */}
      {selectedCourseForPayment && (
        <PaymentProofDialog
          isOpen={!!selectedCourseForPayment}
          onClose={() => setSelectedCourseForPayment(null)}
          courseId={selectedCourseForPayment.courseId}
          courseTitle={selectedCourseForPayment.courseTitle}
          coursePrice={selectedCourseForPayment.remainingAmount}
        />
      )}
    </div>
  );
};

export default Finance;
