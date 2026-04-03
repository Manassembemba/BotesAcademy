import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, CheckCircle, Clock, ExternalLink, User, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface IndicatorPurchase {
    id: string;
    user_id: string;
    indicator_id: string;
    mt5_id: string | null;
    delivered_file_url: string | null;
    created_at: string;
    profiles: { full_name: string | null } | null;
    indicators: { name: string } | null;
}

const IndicatorDelivery = () => {
    const queryClient = useQueryClient();
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    const { data: purchases, isLoading } = useQuery({
        queryKey: ['adminIndicatorPurchases'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('indicator_purchases')
                .select(`
                    *,
                    profiles:user_id (full_name),
                    indicators:indicator_id (name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as any[];
        },
    });

    const deliveryMutation = useMutation({
        mutationFn: async ({ purchaseId, userId, file }: { purchaseId: string; userId: string; file: File }) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `secrets/${userId}/${purchaseId}_${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('marketplace')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('marketplace')
                .getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('indicator_purchases')
                .update({ delivered_file_url: urlData.publicUrl })
                .eq('id', purchaseId);

            if (updateError) throw updateError;
            
            // Si un paiement est lié, on peut aussi ajouter une note admin si nécessaire
            // ou déclencher d'autres actions via RPC si besoin.
        },
        onSuccess: () => {
            toast.success("Indicateur livré et élève notifié !");
            queryClient.invalidateQueries({ queryKey: ['adminIndicatorPurchases'] });
            setUploadingId(null);
        },
        onError: (error: any) => {
            toast.error(`Erreur lors de la livraison: ${error.message}`);
            setUploadingId(null);
        },
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, purchase: IndicatorPurchase) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingId(purchase.id);
        deliveryMutation.mutate({ purchaseId: purchase.id, userId: purchase.user_id, file });
    };

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase italic tracking-tighter text-primary">Livraisons d'Outils</h1>
                    <p className="text-muted-foreground font-medium italic">Configurez et livrez les indicateurs sécurisés aux élèves.</p>
                </div>
                <Badge variant="outline" className="px-4 py-2 border-primary/30 bg-primary/5 text-primary">
                    {purchases?.filter(p => !p.delivered_file_url).length || 0} en attente
                </Badge>
            </div>

            <div className="grid gap-6">
                {!purchases || purchases.length === 0 ? (
                    <Card className="p-12 text-center text-muted-foreground border-dashed border-2 rounded-3xl">
                        Aucun achat d'indicateur enregistré pour le moment.
                    </Card>
                ) : (
                    purchases.map((purchase: IndicatorPurchase) => (
                        <Card key={purchase.id} className="overflow-hidden rounded-3xl border-primary/5 hover:border-primary/20 transition-all shadow-sm">
                            <div className="flex flex-col md:flex-row">
                                <div className={`w-2 md:w-3 bg-gradient-to-b ${purchase.delivered_file_url ? 'from-emerald-500 to-teal-500' : 'from-amber-500 to-orange-500'}`} />
                                <CardContent className="flex-1 p-6 grid md:grid-cols-4 gap-6 items-center">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                                            <CreditCard className="w-3 h-3" /> Outil acheté
                                        </p>
                                        <h3 className="font-black text-lg leading-tight uppercase italic">{purchase.indicators?.name || 'Outil'}</h3>
                                        <p className="text-xs text-muted-foreground italic">Le {format(new Date(purchase.created_at), 'dd MMM yyyy', { locale: fr })}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                                            <User className="w-3 h-3" /> Élève
                                        </p>
                                        <p className="font-bold text-sm">{purchase.profiles?.full_name || 'Inconnu'}</p>
                                    </div>

                                    <div className="space-y-1 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                                        <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1">
                                            🔑 ID Compte MT5
                                        </p>
                                        <p className="text-xl font-black font-mono tracking-widest text-primary">{purchase.mt5_id || 'NON FOURNI'}</p>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        {purchase.delivered_file_url ? (
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge className="bg-emerald-500 text-white border-none px-3 py-1 uppercase text-[10px] font-black tracking-widest">
                                                    <CheckCircle className="w-3 h-3 mr-2" /> Livré
                                                </Badge>
                                                <Button variant="outline" size="sm" className="h-10 rounded-xl border-emerald-500/20 text-emerald-600 hover:bg-emerald-50" onClick={() => window.open(purchase.delivered_file_url!, '_blank')}>
                                                    <ExternalLink className="w-4 h-4 mr-2" /> Voir le fichier
                                                </Button>
                                                <label className="text-[10px] text-muted-foreground hover:text-primary cursor-pointer font-bold uppercase transition-colors">
                                                    Remplacer le fichier
                                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, purchase)} disabled={uploadingId === purchase.id} />
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-end gap-3">
                                                <Badge className="bg-amber-100 text-amber-700 border-none px-3 py-1 uppercase text-[10px] font-black tracking-widest animate-pulse">
                                                    <Clock className="w-3 h-3 mr-2" /> En attente
                                                </Badge>
                                                <label className="relative cursor-pointer">
                                                    <div className={`flex items-center gap-2 h-12 px-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow-primary transition-all ${uploadingId === purchase.id ? 'bg-muted text-muted-foreground' : 'bg-primary text-white hover:bg-primary/90'}`}>
                                                        {uploadingId === purchase.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                        Livrer l'outil
                                                    </div>
                                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, purchase)} disabled={uploadingId === purchase.id} />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default IndicatorDelivery;
