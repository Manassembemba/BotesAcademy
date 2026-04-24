import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, CheckCircle, ShoppingCart, ArrowLeft, Wallet, Landmark, CreditCard, Clock, Trophy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, HelpCircle } from "lucide-react";

const paymentSchema = z.object({
    payment_method: z.enum(['mobile_money', 'bank_transfer', 'cash_deposit', 'other']),
    amount: z.coerce.number().positive("Le montant doit être positif"),
    session_id: z.string().optional(),
    vacation_id: z.string().optional(),
    mt5_id: z.string().optional(),
    subscription_duration: z.enum(['1m', '3m', 'lifetime']).optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const Checkout = () => {
    const { id: productId } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { settings } = useSiteSettings();
    const [proofFile, setProofFile] = useState<File | null>(null);

    const searchParams = new URLSearchParams(window.location.search);
    const productType = searchParams.get('type') || 'course';
    const selectedPlan = searchParams.get('plan') || 'total';

    const { data: product, isLoading: isLoadingProduct } = useQuery({
        queryKey: ['checkoutProduct', productId, productType],
        queryFn: async () => {
            if (!productId) return null;
            let table = productType === 'course' ? 'courses' : (productType === 'indicator' ? 'indicators' : 'strategies');
            const { data, error } = await supabase.from(table as any).select('*').eq('id', productId).single();
            if (error) throw new Error(error.message);
            return data as any;
        },
        enabled: !!productId,
    });

    const { data: sessions } = useQuery({
        queryKey: ['checkoutSessions', productId],
        queryFn: async () => {
            if (!productId || productType !== 'course' || product?.mode === 'online') return [];
            const { data, error } = await supabase.from('course_sessions').select('*').eq('course_id', productId).eq('is_active', true).gt('end_date', new Date().toISOString());
            if (error) throw error;
            return data || [];
        },
        enabled: !!productId && productType === 'course' && product?.mode !== 'online',
    });

    const { data: vacations } = useQuery({
        queryKey: ['checkoutVacations', productId],
        queryFn: async () => {
            if (!productId || productType !== 'course' || product?.mode === 'online') return [];
            const { data } = await supabase.from('course_vacations' as any).select('*').eq('course_id', productId);
            return data || [];
        },
        enabled: !!productId && productType === 'course' && product?.mode !== 'online',
    });

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: { payment_method: 'mobile_money', amount: 0, subscription_duration: '1m' },
    });

    useEffect(() => {
        if (product && productType !== 'indicator') {
            const regFee = product.registration_fee || 0;
            if (selectedPlan === 'installments' && product.allow_installments) {
                form.setValue('amount', regFee + (product.min_installment_amount || 0));
            } else {
                form.setValue('amount', regFee + (product.price || 0));
            }
        }
        else if (productType === 'indicator' && product?.price_1m) form.setValue('amount', product.price_1m);
    }, [product, form, productType, selectedPlan]);

    const uploadMutation = useMutation({
        mutationFn: async (data: PaymentFormValues) => {
            if (!user || !productId || !proofFile) throw new Error("Informations manquantes.");

            const fileExt = proofFile.name.split('.').pop();
            const fileName = `${user.id}_${productId}_${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(filePath, proofFile);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(filePath);
            const proof_url = urlData.publicUrl;

            const insertData: any = {
                user_id: user.id,
                proof_url,
                payment_method: data.payment_method,
                amount: data.amount,
                status: 'pending',
                course_id: productType === 'course' ? productId : null,
                indicator_id: productType === 'indicator' ? productId : null,
                strategy_id: productType === 'strategy' ? productId : null,
                vacation_id: (productType === 'course' && product?.mode !== 'online' && data.vacation_id) ? data.vacation_id : null,
                session_id: (productType === 'course' && product?.mode !== 'online' && data.session_id) ? data.session_id : null,
                mt5_id: data.mt5_id || null,
                subscription_duration: data.subscription_duration || (productType === 'indicator' ? '1m' : null),
            };
            
            const { data: proofData, error: insertError } = await supabase.from('payment_proofs').insert(insertData).select().single();
            if (insertError) throw insertError;
            return proofData;
        },
        onSuccess: (proofData) => {
            if (productType === 'course') {
                toast.success("Preuve de paiement envoyée !");
                navigate(`/payment-status/${proofData.id}`);
            } else {
                toast.success("Achat enregistré ! Nos experts configurent votre outil. Vous recevrez un mail dès qu'il sera prêt.", {
                    duration: 6000,
                });
                navigate(`/marketplace`);
            }
            queryClient.invalidateQueries({ queryKey: ['pendingProof', productId, user?.id] });
        },
        onError: (error: Error) => toast.error(`Erreur: ${error.message}`),
    });

    if (isLoadingProduct) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    if (!product) return <div>Produit introuvable</div>;

    return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 pt-28">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-xl hover:bg-primary/10 text-primary font-black uppercase text-[10px] tracking-widest italic group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Retour à la sélection
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Order Summary - Sticky Sidebar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-4 order-1 lg:order-1">
            <div className="bento-card p-0 overflow-hidden bg-card border-none shadow-2xl sticky top-28">
              <div className="p-6 bg-primary/5 border-b border-primary/10 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary"><ShoppingCart className="w-5 h-5" /></div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter">Récapitulatif</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="aspect-video rounded-3xl overflow-hidden shadow-inner bg-muted group relative">
                   <img src={product.thumbnail_url || product.image_url || "/placeholder.svg"} alt={product.title || product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                   <div className="absolute top-4 left-4"><Badge className="bg-primary/90 backdrop-blur-md text-white font-black uppercase text-[9px] px-3 py-1 rounded-full border-none">{productType}</Badge></div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none line-clamp-2">{product.title || product.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium italic line-clamp-3 leading-relaxed">{product.description}</p>
                </div>
                <div className="pt-6 border-t border-border/50 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Total à régler</span>
                    <div className="text-right">
                       <span className="text-4xl font-black italic text-primary leading-none">{form.watch('amount')} USD</span>
                       <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest mt-1">TVA & Frais inclus</p>
                    </div>
                  </div>
                </div>

                {productType === 'course' && (
                    <div className="pt-6 border-t border-border/50 space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <span>Formule choisie</span>
                            <Badge variant="outline" className={cn("rounded-full px-3", selectedPlan === 'installments' ? "border-emerald-500 text-emerald-600" : "border-primary text-primary")}>
                                {selectedPlan === 'installments' ? "Échelonné" : "Paiement Total"}
                            </Badge>
                        </div>
                        {selectedPlan === 'installments' ? (
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-800 leading-relaxed italic">
                                <Info className="w-3 h-3 mb-1" />
                                Vous réglez l'acompte ({(product?.min_installment_amount || 0)}$) + les frais d'inscription ({(product?.registration_fee || 0)}$). Le reste sera dû selon l'échéancier.
                            </div>
                        ) : (
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary/80 leading-relaxed italic">
                                <Trophy className="w-3 h-3 mb-1" />
                                Vous réglez la totalité de la formation ainsi que les frais d'inscription. Accès définitif illimité.
                            </div>
                        )}
                    </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Checkout Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-8 order-1 lg:order-2">
            <div className="bento-card p-10 bg-card border-none shadow-2xl">
              <div className="mb-10">
                <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">Finaliser l'acquisition</h1>
                <p className="italic font-medium text-sm text-muted-foreground">Suivez les étapes sécurisées pour débloquer votre accès.</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(uploadMutation.mutate)} className="space-y-12">
                  {/* Step 1: Payment Method */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black italic shadow-glow-primary">1</div>
                       <h3 className="text-xl font-black uppercase italic tracking-tighter">Méthode de paiement</h3>
                    </div>
                    <FormField control={form.control} name="payment_method" render={({ field }) => (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { id: 'mobile_money', label: 'Mobile Money', icon: Wallet, desc: 'Rapide & Instantané' },
                          { id: 'bank_transfer', label: 'Virement', icon: Landmark, desc: 'Sécurisé & Classique' }
                        ].map(item => (
                          <button 
                            key={item.id} 
                            type="button" 
                            onClick={() => field.onChange(item.id)}
                            className={cn(
                              "flex items-center gap-4 p-6 rounded-3xl border-2 transition-all duration-300 transform active:scale-[0.98] text-left group",
                              field.value === item.id ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" : "border-border/50 bg-background hover:border-primary/30"
                            )}
                          >
                            <div className={cn("p-4 rounded-2xl transition-colors duration-300", field.value === item.id ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary")}>
                              <item.icon className="w-8 h-8" />
                            </div>
                            <div>
                               <p className="font-black uppercase italic tracking-tighter text-lg leading-none">{item.label}</p>
                               <p className="text-[10px] font-bold text-muted-foreground italic uppercase tracking-widest mt-1">{item.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )} />
                  </div>

                  {/* Step 2: Course Preferences or Indicator Config */}
                  {(productType === 'course' && product?.mode !== 'online') || productType === 'indicator' ? (
                    <div className="space-y-6 p-8 bg-muted/30 rounded-[2.5rem] border border-border/50">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black italic shadow-glow-amber">2</div>
                         <h3 className="text-xl font-black uppercase italic tracking-tighter">Configuration spécifique</h3>
                      </div>
                      
                      {productType === 'course' && product?.mode !== 'online' && (
                        <div className="grid md:grid-cols-2 gap-6">
                          <FormField control={form.control} name="session_id" render={({ field }) => (
                             <FormItem className="space-y-3">
                               <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Choix de la session</FormLabel>
                               <Select onValueChange={field.onChange} value={field.value}>
                                 <FormControl><SelectTrigger className="h-14 rounded-2xl border-2 border-border/50 font-bold italic px-6 focus:border-primary/50"><SelectValue placeholder="Séléctionnez une cohorte" /></SelectTrigger></FormControl>
                                 <SelectContent className="rounded-2xl border-none shadow-2xl p-2">{sessions?.map((s: any) => (<SelectItem key={s.id} value={s.id} className="rounded-xl font-bold italic py-3">{s.session_name} ({format(new Date(s.start_date), 'dd MMM', { locale: fr })})</SelectItem>))}</SelectContent>
                               </Select>
                             </FormItem>
                          )} />
                          <FormField control={form.control} name="vacation_id" render={({ field }) => (
                             <FormItem className="space-y-3">
                               <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Créneau horaire</FormLabel>
                               <Select onValueChange={field.onChange} value={field.value}>
                                 <FormControl><SelectTrigger className="h-14 rounded-2xl border-2 border-border/50 font-bold italic px-6 focus:border-primary/50"><SelectValue placeholder="Heure préférée" /></SelectTrigger></FormControl>
                                 <SelectContent className="rounded-2xl border-none shadow-2xl p-2">{vacations?.map((v: any) => (<SelectItem key={v.id} value={v.id} className="rounded-xl font-bold italic py-3">{v.name} ({v.time_range})</SelectItem>))}</SelectContent>
                               </Select>
                             </FormItem>
                          )} />
                        </div>
                      )}

                      {productType === 'indicator' && (
                        <div className="space-y-8">
                          <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2"><Clock className="w-4 h-4" /> Durée de l'accessibilité</Label>
                            <FormField control={form.control} name="subscription_duration" render={({ field }) => (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                  { id: '1m', label: '1 MOIS', price: product.price_1m, desc: 'Découverte' },
                                  { id: '3m', label: '3 MOIS', price: product.price_3m, desc: 'Progressif' },
                                  { id: 'lifetime', label: 'À VIE', price: product.price_lifetime, desc: 'Investisseur' }
                                ].map(opt => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => { field.onChange(opt.id); if (opt.price) form.setValue('amount', opt.price); }}
                                    className={cn(
                                      "flex flex-col items-start p-6 rounded-2xl border-2 transition-all group",
                                      field.value === opt.id ? "border-amber-500 bg-amber-500/5 shadow-xl shadow-amber-500/10" : "border-border/50 bg-background hover:border-amber-500/30"
                                    )}
                                  >
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">{opt.desc}</span>
                                    <span className="text-xl font-black italic leading-none mb-4 group-hover:text-amber-600 transition-colors">{opt.label}</span>
                                    <span className="text-2xl font-black italic text-primary">{opt.price} USD</span>
                                  </button>
                                ))}
                              </div>
                            )} />
                          </div>

                          <FormField control={form.control} name="mt5_id" render={({ field }) => (
                            <FormItem className="space-y-3 pt-6 border-t border-border/50">
                               <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2"><CreditCard className="w-4 h-4" /> ID de compte MetaTrader 5 (Obligatoire)</FormLabel>
                               <FormControl><Input placeholder="Ex: 88721054" className="h-16 rounded-2xl border-2 border-border/50 bg-background font-black font-mono text-xl px-6 focus:border-amber-500/50 transition-all shadow-inner" {...field} required /></FormControl>
                               <FormMessage />
                               <p className="text-[9px] font-bold text-amber-600 italic uppercase tracking-widest">L'outil sera verrouillé exclusivement sur cet identifiant MT5.</p>
                            </FormItem>
                          )} />
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Step 3: Payment Details */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black italic shadow-glow-emerald">3</div>
                       <h3 className="text-xl font-black uppercase italic tracking-tighter">Coordonnées de paiement</h3>
                    </div>

                    <div className="space-y-4">
                      {form.watch('payment_method') === 'mobile_money' && (
                        <div className="grid gap-3">
                           {(settings?.payment_methods?.mobile_money || []).map((num: any, i: number) => {
                             const numberToDisplay = typeof num === 'object' ? num.number : num;
                             const networkName = typeof num === 'object' ? num.name : `Réseau ${i + 1}`;
                             return (
                               <motion.div key={i} whileHover={{ x: 5 }} className="flex items-center justify-between p-6 bg-muted/20 rounded-3xl border border-border/50 group">
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">{networkName}</p>
                                    <p className="text-2xl font-black font-mono text-primary tracking-tight">{numberToDisplay}</p>
                                 </div>
                                 <Button variant="ghost" size="sm" type="button" onClick={() => { navigator.clipboard.writeText(numberToDisplay); toast.success("Coordonnées copiées !"); }} className="rounded-xl h-12 px-6 border border-primary/20 font-black uppercase text-[10px] tracking-widest italic hover:bg-primary text-primary hover:text-white transition-all">Copier</Button>
                               </motion.div>
                             );
                           })}
                        </div>
                      )}
                      
                      {form.watch('payment_method') === 'bank_transfer' && (
                        <div className="p-8 bg-muted/20 rounded-3xl border border-divider/50 font-black italic text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {settings?.payment_methods?.bank || "Coordonnées bancaires non disponibles. Veuillez contacter notre support pour obtenir l'IBAN actuel."}
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 pt-4">
                       <FormField control={form.control} name="amount" render={({ field }) => (
                         <FormItem className="space-y-3">
                           <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Montant à transférer (USD)</FormLabel>
                           <FormControl><Input type="number" step="0.01" className="h-16 rounded-2xl bg-muted/50 border-none font-black italic text-2xl text-primary px-8" {...field} readOnly /></FormControl>
                         </FormItem>
                       )} />
                    </div>
                  </div>

                  {/* Step 4: Proof Upload */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-black italic shadow-glow-indigo">4</div>
                       <h3 className="text-xl font-black uppercase italic tracking-tighter">Confirmation par image</h3>
                    </div>
                    
                    <FormItem>
                       <FormControl>
                          <div className={cn(
                            "relative border-4 border-dashed rounded-[2.5rem] p-16 text-center transition-all duration-500 group overflow-hidden",
                            proofFile ? "border-emerald-500/50 bg-emerald-500/5" : "border-primary/10 bg-muted/10 hover:border-primary/30 hover:bg-primary/5"
                          )}>
                             <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                             <AnimatePresence mode="wait">
                               {proofFile ? (
                                 <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex flex-col items-center gap-4 relative z-10">
                                    <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-glow-emerald animate-bounce"><CheckCircle className="w-10 h-10" /></div>
                                    <div className="space-y-1">
                                       <p className="font-black text-lg italic uppercase tracking-tighter text-emerald-600 line-clamp-1">{proofFile.name}</p>
                                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Image séléctionnée avec succès</p>
                                    </div>
                                    <Button variant="ghost" type="button" onClick={(e) => { e.stopPropagation(); setProofFile(null); }} className="text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 h-8 rounded-lg mt-2 relative z-30">Changer de fichier</Button>
                                 </motion.div>
                               ) : (
                                 <div className="flex flex-col items-center gap-6 relative z-10 transition-transform duration-500 group-hover:scale-110">
                                    <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary/40"><Upload className="w-12 h-12" /></div>
                                    <div className="space-y-2">
                                       <p className="text-2xl font-black italic uppercase tracking-tighter">Déposer votre reçu ici</p>
                                       <p className="text-xs font-medium text-muted-foreground italic px-10">Capture d'écran du SMS ou photo du bordereau de paiement.</p>
                                    </div>
                                 </div>
                               )}
                             </AnimatePresence>
                             {/* Background Decoration */}
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
                          </div>
                       </FormControl>
                    </FormItem>
                  </div>

                  {productType === 'indicator' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-amber-500/10 rounded-3xl border border-amber-500/20 flex gap-4">
                       <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-600 h-fit"><Clock className="w-6 h-6" /></div>
                       <div className="space-y-2">
                          <h4 className="text-lg font-black uppercase italic tracking-tighter text-amber-700 leading-none">Processus de sécurité</h4>
                          <p className="text-xs font-medium text-amber-800 italic leading-relaxed">
                             Chaque licence est cryptée manuellement pour correspondre à votre compte MT5. La livraison s'effectue généralement sous <strong>24h à 48h ouvrées</strong>.
                          </p>
                       </div>
                    </motion.div>
                  )}

                  <div className="pt-4">
                     <Button 
                        type="submit" 
                        disabled={uploadMutation.isPending || !proofFile} 
                        className="w-full h-20 rounded-[2rem] text-xl font-black uppercase tracking-[0.2em] shadow-glow-primary bg-primary text-white hover:shadow-primary/40 active:scale-[0.98] transition-all italic"
                     >
                        {uploadMutation.isPending ? (<><Loader2 className="mr-3 h-8 w-8 animate-spin" /> Validation...</>) : "Soumettre ma commande d'excellence"}
                     </Button>
                     <p className="text-center text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mt-6">Paiement sécurisé par cryptage AES-256</p>
                  </div>
                </form>
              </Form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
    );
};

export default Checkout;
