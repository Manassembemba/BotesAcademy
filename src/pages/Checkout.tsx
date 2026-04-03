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
import { Loader2, Upload, CheckCircle, ShoppingCart, ArrowLeft, Wallet, Landmark, CreditCard, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const paymentSchema = z.object({
    payment_method: z.enum(['mobile_money', 'bank_transfer', 'cash_deposit', 'other']),
    transaction_reference: z.string().optional(),
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
        if (product?.price && productType !== 'indicator') form.setValue('amount', product.price);
        else if (productType === 'indicator' && product?.price_1m) form.setValue('amount', product.price_1m);
    }, [product, form, productType]);

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
                transaction_reference: data.transaction_reference || null,
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
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" />Retour</Button>
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <Card className="sticky top-8 rounded-3xl overflow-hidden shadow-xl border-primary/5">
                            <CardHeader className="bg-primary/5"><CardTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" />Récapitulatif</CardTitle></CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="aspect-video rounded-2xl overflow-hidden bg-muted"><img src={product.thumbnail_url || product.image_url || "/placeholder.svg"} alt={product.title || product.name} className="w-full h-full object-cover" /></div>
                                <div><h3 className="font-black text-lg mb-2">{product.title || product.name}</h3><p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p></div>
                                <Badge variant="outline" className="uppercase font-bold text-[10px]">{productType}</Badge>
                                <Separator />
                                <div className="flex justify-between text-xl font-black"><span>TOTAL</span><span className="text-primary">{form.watch('amount')} USD</span></div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-2">
                        <Card className="border-primary/20 shadow-xl overflow-hidden rounded-3xl">
                            <CardHeader className="bg-muted/30 border-b border-primary/10"><CardTitle className="text-xl font-black uppercase">Informations de paiement</CardTitle><CardDescription>Suivez les instructions ci-dessous.</CardDescription></CardHeader>
                            <CardContent className="pt-6">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(uploadMutation.mutate)} className="space-y-8">
                                        <FormField control={form.control} name="payment_method" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base font-black uppercase text-primary/70">1. Méthode de paiement</FormLabel>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                                    {[{ id: 'mobile_money', label: 'Mobile Money', icon: Wallet }, { id: 'bank_transfer', label: 'Virement', icon: Landmark }].map(item => (
                                                        <button key={item.id} type="button" onClick={() => field.onChange(item.id)} className={cn("flex flex-col items-center p-4 rounded-2xl border-2", field.value === item.id ? "border-primary bg-primary/10" : "border-border bg-card")}>
                                                            <item.icon className="w-6 h-6 mb-2" />
                                                            <span className="text-[10px] font-black uppercase">{item.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </FormItem>
                                        )} />
                                        
                                        {productType === 'course' && product?.mode !== 'online' && (
                                            <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
                                                <h3 className="font-black text-lg mb-4 uppercase">2. Préférences de cours</h3>
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <FormField control={form.control} name="session_id" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-xs">Session (Date)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Choisir..." /></SelectTrigger></FormControl><SelectContent>{sessions?.map((s: any) => (<SelectItem key={s.id} value={s.id}>{s.session_name} ({format(new Date(s.start_date), 'dd MMM', { locale: fr })})</SelectItem>))}</SelectContent></Select></FormItem>)} />
                                                    <FormField control={form.control} name="vacation_id" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-xs">Créneau (Heure)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Choisir..." /></SelectTrigger></FormControl><SelectContent>{vacations?.map((v: any) => (<SelectItem key={v.id} value={v.id}>{v.name} ({v.time_range})</SelectItem>))}</SelectContent></Select></FormItem>)} />
                                                </div>
                                            </div>
                                        )}

                                        {productType === 'indicator' && (
                                            <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 space-y-6">
                                                <div>
                                                    <h3 className="font-black text-lg mb-4 uppercase flex items-center gap-2">
                                                        <Clock className="w-5 h-5 text-primary" /> Durée de l'Abonnement
                                                    </h3>
                                                    <FormField control={form.control} name="subscription_duration" render={({ field }) => (
                                                        <FormItem>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {[
                                                                    { id: '1m', label: '1 MOIS', price: product.price_1m },
                                                                    { id: '3m', label: '3 MOIS', price: product.price_3m },
                                                                    { id: 'lifetime', label: 'À VIE', price: product.price_lifetime }
                                                                ].map(opt => (
                                                                    <button
                                                                        key={opt.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            field.onChange(opt.id);
                                                                            if (opt.price) form.setValue('amount', opt.price);
                                                                        }}
                                                                        className={cn(
                                                                            "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all",
                                                                            field.value === opt.id ? "border-primary bg-primary/10 shadow-glow-primary-sm" : "border-border bg-card hover:border-primary/30"
                                                                        )}
                                                                    >
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{opt.label}</span>
                                                                        <span className="text-2xl font-black italic">{opt.price} USD</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </FormItem>
                                                    )} />
                                                </div>

                                                <div className="pt-4 border-t border-primary/10">
                                                    <h3 className="font-black text-lg mb-4 uppercase flex items-center gap-2">
                                                        <CreditCard className="w-5 h-5 text-primary" /> Configuration Sécurité
                                                    </h3>
                                                    <FormField control={form.control} name="mt5_id" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-black uppercase text-xs">ID de compte MT5 (Obligatoire)</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Ex: 12345678" className="h-12 rounded-xl border-primary/20" {...field} required />
                                                            </FormControl>
                                                            <FormMessage />
                                                            <p className="text-[10px] text-muted-foreground italic mt-2">
                                                                Note : Votre indicateur sera verrouillé sur cet ID spécifique pour garantir votre exclusivité.
                                                            </p>
                                                        </FormItem>
                                                    )} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
                                            <h3 className="font-black text-lg mb-4 uppercase">3. Coordonnées</h3>
                                            {form.watch('payment_method') === 'mobile_money' && (
                                                <div className="space-y-3">
                                                    {(settings?.payment_methods?.mobile_money || []).map((num: any, i: number) => {
                                                        const numberToDisplay = typeof num === 'object' ? num.number : num;
                                                        const networkName = typeof num === 'object' ? num.name : `Réseau ${i + 1}`;
                                                        return (
                                                            <div key={i} className="flex items-center justify-between p-4 bg-card rounded-2xl border">
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-muted-foreground">{networkName}</p>
                                                                    <p className="text-xl font-black font-mono text-primary">{numberToDisplay}</p>
                                                                </div>
                                                                <Button variant="ghost" size="sm" type="button" onClick={() => { navigator.clipboard.writeText(numberToDisplay); toast.success("Copié !"); }}>Copier</Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {form.watch('payment_method') === 'bank_transfer' && (
                                                <p className="text-sm p-4 bg-card rounded-2xl whitespace-pre-wrap">{settings?.payment_methods?.bank || "Contactez le support."}</p>
                                            )}
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-xs">4. Montant à payer (USD)</FormLabel><FormControl><Input type="number" step="0.01" className="h-12 rounded-xl bg-muted/50" {...field} readOnly /></FormControl></FormItem>)} />
                                            <FormField control={form.control} name="transaction_reference" render={({ field }) => (<FormItem><FormLabel className="font-black uppercase text-xs">Référence de Transaction</FormLabel><FormControl><Input placeholder="Ex: TXN123..." className="h-12 rounded-xl" {...field} /></FormControl></FormItem>)} />
                                        </div>

                                        <FormItem>
                                            <FormLabel className="font-black uppercase text-xs">5. Preuve de paiement</FormLabel>
                                            <FormControl>
                                                <div className={cn("relative border-4 border-dashed rounded-3xl p-10 text-center", proofFile ? "border-green-500/50" : "border-primary/10")}>
                                                    <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0" />
                                                    {proofFile ? <div className="flex flex-col items-center gap-2"><CheckCircle className="w-10 h-10 text-green-500" /><p className="font-black">{proofFile.name}</p></div> : <div className="flex flex-col items-center gap-2"><Upload className="w-12 h-12 text-primary/30" /><p className="font-black">Charger votre reçu</p></div>}
                                                </div>
                                            </FormControl>
                                        </FormItem>

                                        {productType === 'indicator' && (
                                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                                                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Délai de Configuration</p>
                                                    <p className="text-xs font-medium text-amber-700 leading-relaxed italic">
                                                        Note : Cet outil est sécurisé manuellement avec votre ID MT5. Livraison estimée sous <strong>24h à 48h ouvrées</strong> après validation du paiement.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <Button type="submit" className="w-full h-16 rounded-2xl text-xl font-black uppercase shadow-glow-primary" disabled={uploadMutation.isPending || !proofFile}>
                                            {uploadMutation.isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Confirmer mon achat"}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
