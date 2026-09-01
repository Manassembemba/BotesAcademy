import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Loader2, Upload, CheckCircle, Clock, ExternalLink, User,
    CreditCard, Search, Filter, AlertCircle, History, Info,
    RefreshCw, MonitorSmartphone, Bell
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
    // State pour saisir un MT5 ID manquant inline
    const [mt5InputMap, setMt5InputMap] = useState<Record<string, string>>({});
    const [savingMt5Id, setSavingMt5Id] = useState<string | null>(null);

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

    // Statistiques rapides
    const pendingCount = purchases?.filter(p => p.delivery_status !== 'delivered' && !p.delivered_file_url).length || 0;
    const deliveredCount = purchases?.filter(p => p.delivered_file_url).length || 0;
    const missingMt5Count = purchases?.filter(p => !p.mt5_id && !p.delivered_file_url).length || 0;

    const filteredPurchases = useMemo(() => {
        if (!purchases) return [];
        return purchases.filter(p => {
            const matchesSearch =
                p.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.indicators?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.mt5_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.delivered_file_name?.toLowerCase().includes(searchTerm.toLowerCase());

            // Filtre basé sur delivery_status ET delivered_file_url pour robustesse
            const isDelivered = p.delivery_status === 'delivered' || !!p.delivered_file_url;
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "delivered" && isDelivered) ||
                (statusFilter === "pending" && !isDelivered);

            return matchesSearch && matchesStatus;
        });
    }, [purchases, searchTerm, statusFilter]);

    // Sauvegarder l'ID MT5 renseigné manuellement
    const saveMt5Id = async (purchaseId: string, mt5Id: string) => {
        setSavingMt5Id(purchaseId);
        const { error } = await supabase
            .from('purchases')
            .update({ mt5_id: mt5Id } as any)
            .eq('id', purchaseId);
        setSavingMt5Id(null);
        if (error) {
            toast.error("Erreur lors de la sauvegarde de l'ID MT5");
        } else {
            toast.success("ID MT5 enregistré !");
            queryClient.invalidateQueries({ queryKey: ['adminIndicatorPurchasesUnified'] });
            setMt5InputMap(prev => {
                const next = { ...prev };
                delete next[purchaseId];
                return next;
            });
        }
    };

    const deliveryMutation = useMutation({
        mutationFn: async ({ purchaseId, userId, file, indicatorName }: { purchaseId: string; userId: string; file: File; indicatorName: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Admin non authentifié");

            const fileName = `secrets/${userId}/${purchaseId}/${file.name}`;

            // 1. Upload fichier
            const { error: uploadError } = await supabase.storage
                .from('marketplace')
                .upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;

            // 2. URL publique
            const { data: urlData } = supabase.storage
                .from('marketplace')
                .getPublicUrl(fileName);

            // 3. Mettre à jour la purchase
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

            // 4. Notifier l'étudiant
            await supabase.from('notifications').insert({
                user_id: userId,
                title: '✅ Votre outil est disponible',
                message: `Votre indicateur "${indicatorName}" a été déployé. Téléchargez-le depuis votre espace Marketplace.`,
                type: 'success',
                link: '/marketplace'
            });
        },
        onSuccess: () => {
            toast.success("Indicateur livré et étudiant notifié !");
            // Clé correcte correspondant au queryKey de la query
            queryClient.invalidateQueries({ queryKey: ['adminIndicatorPurchasesUnified'] });
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
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
        const indicatorName = purchase.indicators?.name || 'Indicateur';
        deliveryMutation.mutate({ purchaseId: purchase.id, userId: purchase.user_id, file, indicatorName });
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-40" />
            <span className="text-xs text-muted-foreground">Chargement des livraisons...</span>
        </div>
    );

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-20 max-w-7xl">

            {/* HEADER UNIFIÉ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
                        <Upload className="w-3 h-3" /> Logistique Numérique
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Livraison des Indicateurs & Outils
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Déployez les fichiers d'indicateurs configurés pour les identifiants MT5 de vos apprenants.
                    </p>
                </div>

                {/* KPI Rapides */}
                <div className="flex items-center gap-2 flex-wrap">
                    {pendingCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            {pendingCount} en attente
                        </span>
                    )}
                    {missingMt5Count > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold">
                            <MonitorSmartphone className="w-3.5 h-3.5" />
                            {missingMt5Count} MT5 manquants
                        </span>
                    )}
                    {deliveredCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {deliveredCount} livrés
                        </span>
                    )}
                </div>
            </div>

            {/* Barre de Filtres */}
            <div className="flex flex-col sm:flex-row gap-3 items-center bg-card border border-border/50 p-3 rounded-2xl shadow-xs">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par élève, outil ou ID MT5..."
                        className="pl-9 h-9 bg-transparent border-none focus-visible:ring-0 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] h-9 rounded-xl text-xs font-medium">
                        <div className="flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                            <SelectValue placeholder="Filtrer" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="all">Tous les achats</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="delivered">Livrés</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Liste */}
            <div className="space-y-3">
                {filteredPurchases.length === 0 ? (
                    <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border/60 flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                            <Info className="w-6 h-6 text-muted-foreground opacity-40" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Aucune livraison correspondante</p>
                        {searchTerm && (
                            <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")} className="text-primary text-xs font-semibold h-8 rounded-xl">
                                Effacer la recherche
                            </Button>
                        )}
                    </div>
                ) : (
                    filteredPurchases.map((purchase: IndicatorPurchase) => {
                        const isDelivered = purchase.delivery_status === 'delivered' || !!purchase.delivered_file_url;
                        const hasMt5 = !!purchase.mt5_id;
                        const mt5Input = mt5InputMap[purchase.id] ?? '';

                        return (
                            <Card key={purchase.id} className="rounded-2xl border border-border/50 bg-card shadow-xs hover:border-primary/20 transition-colors overflow-hidden">
                                <div className="flex">
                                    {/* Barre de statut latérale */}
                                    <div className={`w-1 flex-shrink-0 ${isDelivered ? 'bg-emerald-500' : !hasMt5 ? 'bg-destructive' : 'bg-amber-500'}`} />

                                    <CardContent className="flex-1 p-4 sm:p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">

                                            {/* Col 1 — Produit */}
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                                    <CreditCard className="w-3 h-3" /> Produit
                                                </p>
                                                <p className="text-sm font-semibold text-foreground leading-snug">
                                                    {purchase.indicators?.name || 'Outil'}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Acheté le {format(new Date(purchase.created_at), 'dd MMM yyyy', { locale: fr })}
                                                </p>
                                            </div>

                                            {/* Col 2 — Apprenant + MT5 */}
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                                    <User className="w-3 h-3" /> Apprenant
                                                </p>
                                                <p className="text-sm font-semibold text-foreground truncate">
                                                    {purchase.profiles?.full_name || 'Élève Inconnu'}
                                                </p>

                                                {/* ID MT5 */}
                                                {hasMt5 ? (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 border border-primary/15 rounded-lg">
                                                        <MonitorSmartphone className="w-3 h-3 text-primary" />
                                                        <span className="text-[11px] font-mono font-semibold text-primary">{purchase.mt5_id}</span>
                                                    </div>
                                                ) : !isDelivered ? (
                                                    <div className="space-y-1.5">
                                                        <p className="text-[10px] text-destructive font-medium">ID MT5 requis avant livraison</p>
                                                        <div className="flex gap-1.5">
                                                            <Input
                                                                placeholder="Ex: 123456789"
                                                                className="h-7 text-xs rounded-lg flex-1 font-mono"
                                                                value={mt5Input}
                                                                onChange={e => setMt5InputMap(prev => ({ ...prev, [purchase.id]: e.target.value }))}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter' && mt5Input.trim()) saveMt5Id(purchase.id, mt5Input.trim());
                                                                }}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                className="h-7 px-2.5 rounded-lg text-xs font-semibold"
                                                                disabled={!mt5Input.trim() || savingMt5Id === purchase.id}
                                                                onClick={() => saveMt5Id(purchase.id, mt5Input.trim())}
                                                            >
                                                                {savingMt5Id === purchase.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'OK'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-muted-foreground/60 italic">MT5 non renseigné</span>
                                                )}
                                            </div>

                                            {/* Col 3 — Logistique */}
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                                    <History className="w-3 h-3" /> Logistique
                                                </p>
                                                {purchase.delivered_at ? (
                                                    <div className="space-y-0.5">
                                                        <p className="text-[11px] font-semibold text-emerald-600">
                                                            Livré le {format(new Date(purchase.delivered_at), 'dd MMM HH:mm', { locale: fr })}
                                                        </p>
                                                        {purchase.admin_profile?.full_name && (
                                                            <p className="text-[10px] text-muted-foreground">
                                                                Par : {purchase.admin_profile.full_name}
                                                            </p>
                                                        )}
                                                        {purchase.delivered_file_name && (
                                                            <p className="text-[10px] text-muted-foreground truncate max-w-[160px]" title={purchase.delivered_file_name}>
                                                                📄 {purchase.delivered_file_name}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] font-medium border-amber-500/30 text-amber-600 bg-amber-500/5">
                                                        En attente de déploiement
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Col 4 — Actions */}
                                            <div className="flex flex-col items-end gap-2">
                                                {isDelivered ? (
                                                    <>
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-semibold rounded-full px-2.5 py-0.5">
                                                            <CheckCircle className="w-3 h-3 mr-1" /> Livré
                                                        </Badge>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-3 rounded-xl text-xs font-semibold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5"
                                                            onClick={() => window.open(purchase.delivered_file_url!, '_blank')}
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Télécharger
                                                        </Button>
                                                        <label className="text-[10px] text-muted-foreground hover:text-primary cursor-pointer font-medium transition-colors flex items-center gap-1">
                                                            <RefreshCw className="w-3 h-3" /> Mettre à jour
                                                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, purchase)} disabled={uploadingId === purchase.id} />
                                                        </label>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Badge variant="outline" className="text-[10px] font-semibold border-amber-500/30 text-amber-600 bg-amber-500/5 rounded-full px-2.5 py-0.5">
                                                            <AlertCircle className="w-3 h-3 mr-1" /> Action requise
                                                        </Badge>
                                                        <label className={`relative cursor-pointer ${!hasMt5 ? 'opacity-50 pointer-events-none' : ''}`} title={!hasMt5 ? "Renseignez l'ID MT5 avant de livrer" : ""}>
                                                            <div className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold shadow-xs transition-all ${uploadingId === purchase.id ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                                                                {uploadingId === purchase.id
                                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                    : <Upload className="w-3.5 h-3.5" />
                                                                }
                                                                Déployer l'outil
                                                            </div>
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                onChange={(e) => handleFileUpload(e, purchase)}
                                                                disabled={uploadingId === purchase.id || !hasMt5}
                                                            />
                                                        </label>
                                                        {!hasMt5 && (
                                                            <p className="text-[10px] text-muted-foreground text-right">
                                                                Saisir l'ID MT5 d'abord
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default IndicatorDelivery;
