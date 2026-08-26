import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Loader2, Upload, CheckCircle, Clock, ExternalLink, User, 
    CreditCard, Search, Filter, AlertCircle, History, Info
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface IndicatorPurchase {
    id: string;
    user_id: string;
    indicator_id: string;
    admin_id: string | null;
    mt5_id: string | null;
    delivered_file_url: string | null;
    delivered_file_name: string | null;
    delivered_at: string | null;
    delivery_status: 'pending' | 'processing' | 'delivered' | 'error';
    delivery_notes: string | null;
    created_at: string;
    profiles: { full_name: string | null } | null;
    admin_profile: { full_name: string | null } | null;
    indicators: { name: string } | null;
}

const IndicatorDelivery = () => {
    const queryClient = useQueryClient();
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const { data: purchases, isLoading } = useQuery({
        queryKey: ['adminIndicatorPurchasesUnified'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('purchases')
                .select(`
                    *,
                    profiles:user_id (full_name),
                    admin_profile:validated_by (full_name),
                    indicators:indicator_id (name)
                `)
                .eq('product_type', 'indicator')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as any[];
        },
    });

    const filteredPurchases = useMemo(() => {
        if (!purchases) return [];
        return purchases.filter(p => {
            const matchesSearch = 
                p.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.indicators?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.mt5_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.delivered_file_name?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = 
                statusFilter === "all" || 
                (statusFilter === "delivered" && p.delivered_file_url) ||
                (statusFilter === "pending" && !p.delivered_file_url);
            
            return matchesSearch && matchesStatus;
        });
    }, [purchases, searchTerm, statusFilter]);

    const deliveryMutation = useMutation({
        mutationFn: async ({ purchaseId, userId, file }: { purchaseId: string; userId: string; file: File }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Admin non authentifié");

            // Use original filename in a unique folder to prevent collisions but keep the name clean
            const fileName = `secrets/${userId}/${purchaseId}/${file.name}`;
            
            // 1. Upload file
            const { error: uploadError } = await supabase.storage
                .from('marketplace')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: urlData } = supabase.storage
                .from('marketplace')
                .getPublicUrl(fileName);

            // 3. Update database with traceability and the original filename
            const { error: updateError } = await supabase
                .from('purchases')
                .update({ 
                    delivered_file_url: urlData.publicUrl,
                    delivered_file_name: file.name,
                    validated_by: user.id,
                    delivery_status: 'delivered',
                    delivered_at: new Date().toISOString()
                } as any)
                .eq('id', purchaseId);

            if (updateError) throw updateError;
        },
        onSuccess: () => {
            toast.success("Indicateur livré avec succès !");
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
        
        // Validation simple du type de fichier si nécessaire
        setUploadingId(purchase.id);
        deliveryMutation.mutate({ purchaseId: purchase.id, userId: purchase.user_id, file });
    };

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-primary leading-none mb-2">Livraisons <span className="text-foreground">Elite</span></h1>
                    <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Gestion du déploiement des outils de trading</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-4 py-2 border-primary/20 bg-primary/5 text-primary rounded-xl font-black uppercase text-[10px] tracking-widest">
                        {purchases?.filter(p => !p.delivered_file_url).length || 0} EN ATTENTE
                    </Badge>
                </div>
            </div>

            {/* Barre de Filtres */}
            <Card className="rounded-[2rem] border-primary/5 bg-card/50 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Rechercher par élève, outil ou ID MT5..." 
                            className="pl-10 h-12 rounded-xl bg-muted/20 border-none font-medium italic"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] h-12 rounded-xl bg-muted/20 border-none font-bold uppercase text-[10px] tracking-widest">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-3 h-3" />
                                    <SelectValue placeholder="Filtrer" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-primary/10">
                                <SelectItem value="all">Tous les achats</SelectItem>
                                <SelectItem value="pending">En attente ⏳</SelectItem>
                                <SelectItem value="delivered">Livrés ✅</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6">
                {filteredPurchases.length === 0 ? (
                    <div className="text-center py-32 bg-muted/10 rounded-[3rem] border-4 border-dashed border-muted flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                            <Info className="w-10 h-10 text-muted-foreground opacity-20" />
                        </div>
                        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs italic">Aucune livraison correspondante</p>
                        {searchTerm && <Button variant="ghost" onClick={() => setSearchTerm("")} className="text-primary font-bold">Effacer la recherche</Button>}
                    </div>
                ) : (
                    filteredPurchases.map((purchase: IndicatorPurchase) => (
                        <Card key={purchase.id} className="group relative overflow-hidden rounded-[2.5rem] border-primary/5 hover:border-primary/20 transition-all shadow-lg bg-card/80 backdrop-blur-md">
                            <div className="flex flex-col md:flex-row min-h-[160px]">
                                <div className={`w-3 bg-gradient-to-b transition-colors duration-500 ${purchase.delivered_file_url ? 'from-emerald-500 to-teal-500' : 'from-amber-500 to-orange-500'}`} />
                                <CardContent className="flex-1 p-8 grid md:grid-cols-4 gap-8 items-center">
                                    {/* Info Produit */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                            <CreditCard className="w-3 h-3" /> Produit
                                        </div>
                                        <h3 className="font-black text-2xl leading-none uppercase italic tracking-tighter text-foreground">{purchase.indicators?.name || 'Outil'}</h3>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold italic">
                                            <Clock className="w-3 h-3" /> Acheté le {format(new Date(purchase.created_at), 'dd/MM/yyyy')}
                                        </div>
                                    </div>

                                    {/* Info Élève */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                            <User className="w-3 h-3" /> Apprenant
                                        </div>
                                        <p className="font-black text-lg leading-none uppercase italic text-foreground truncate">{purchase.profiles?.full_name || 'Élève Inconnu'}</p>
                                        <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10 inline-block">
                                            <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none mb-1 flex items-center gap-1">
                                                ID MT5
                                            </p>
                                            <p className="text-sm font-black font-mono tracking-widest text-primary leading-none">{purchase.mt5_id || 'NON FOURNI'}</p>
                                        </div>
                                    </div>

                                    {/* Historique de livraison */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                            <History className="w-3 h-3" /> Logistique
                                        </div>
                                        {purchase.delivered_at ? (
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-bold text-emerald-600 italic">
                                                    Livré le {format(new Date(purchase.delivered_at), 'dd/MM HH:mm')}
                                                </p>
                                                {purchase.admin_profile?.full_name && (
                                                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                                                        Par: {purchase.admin_profile.full_name}
                                                    </p>
                                                )}
                                                {purchase.delivery_notes && (
                                                    <p className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">
                                                        Note: {purchase.delivery_notes}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] font-bold text-amber-600 animate-pulse uppercase tracking-widest">
                                                En attente de déploiement
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col items-end gap-3">
                                        {purchase.delivered_file_url ? (
                                            <div className="flex flex-col items-end gap-2 animate-in fade-in duration-500">
                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-4 py-1.5 uppercase text-[10px] font-black tracking-widest rounded-full">
                                                    <CheckCircle className="w-3 h-3 mr-2" /> Statut: Livré
                                                </Badge>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-10 px-6 rounded-xl border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 font-bold uppercase text-[10px] tracking-widest" 
                                                    onClick={() => window.open(purchase.delivered_file_url!, '_blank')}
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-2" /> Télécharger
                                                </Button>
                                                <label className="text-[10px] text-muted-foreground hover:text-primary cursor-pointer font-black uppercase tracking-widest transition-colors mt-1">
                                                    Mettre à jour le fichier
                                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, purchase)} disabled={uploadingId === purchase.id} />
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-end gap-3 animate-in slide-in-from-right-4 duration-500">
                                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-4 py-1.5 uppercase text-[10px] font-black tracking-widest rounded-full">
                                                    <AlertCircle className="w-3 h-3 mr-2" /> Action Requise
                                                </Badge>
                                                <label className="relative cursor-pointer group/upload">
                                                    <div className={`flex items-center gap-3 h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 ${uploadingId === purchase.id ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90 shadow-glow-primary'}`}>
                                                        {uploadingId === purchase.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5 group-hover/upload:-translate-y-1 transition-transform" />}
                                                        Déployer l'outil
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
