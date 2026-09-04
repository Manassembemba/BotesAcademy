import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Loader2, Upload, CheckCircle, Clock, ExternalLink, User,
    CreditCard, Search, Filter, AlertCircle, History, Info,
    RefreshCw, MonitorSmartphone, FileText, Send, CheckCircle2,
    ShieldCheck, AlertTriangle
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

interface PendingDeliveryData {
    purchase: IndicatorPurchase;
    file: File;
    deliveryNotes: string;
    notifyStudent: boolean;
}

const IndicatorDelivery = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    
    // State pour saisir un MT5 ID manquant inline
    const [mt5InputMap, setMt5InputMap] = useState<Record<string, string>>({});
    const [savingMt5Id, setSavingMt5Id] = useState<string | null>(null);

    // Modal de confirmation de livraison
    const [pendingDelivery, setPendingDelivery] = useState<PendingDeliveryData | null>(null);

    const { data: purchases, isLoading } = useQuery({
        queryKey: ['adminIndicatorPurchasesUnified'],
        queryFn: async () => {
            const { data: purchasesData, error: purchasesError } = await supabase
                .from('purchases')
                .select('*')
                .eq('product_type', 'indicator')
                .order('created_at', { ascending: false });

            if (purchasesError) throw purchasesError;
            if (!purchasesData || purchasesData.length === 0) return [];

            const userIds = Array.from(new Set(purchasesData.map(p => p.user_id).filter(Boolean)));
            const adminIds = Array.from(new Set(purchasesData.map(p => p.validated_by).filter(Boolean)));
            const indicatorIds = Array.from(new Set(purchasesData.map(p => p.indicator_id).filter(Boolean)));

            const allProfileIds = Array.from(new Set([...userIds, ...adminIds]));

            const [profilesRes, indicatorsRes] = await Promise.all([
                allProfileIds.length > 0
                    ? supabase.from('profiles').select('id, full_name').in('id', allProfileIds)
                    : Promise.resolve({ data: [] }),
                indicatorIds.length > 0
                    ? supabase.from('indicators').select('id, name, price').in('id', indicatorIds)
                    : Promise.resolve({ data: [] })
            ]);

            const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p.full_name]));
            const indicatorMap = new Map((indicatorsRes.data || []).map(i => [i.id, i.name]));

            return purchasesData.map(p => ({
                ...p,
                profiles: { full_name: profileMap.get(p.user_id) || null },
                admin_profile: { full_name: profileMap.get(p.validated_by) || null },
                indicators: { name: indicatorMap.get(p.indicator_id) || 'Indicateur' }
            })) as any[];
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
            toast.success("ID MT5 enregistré avec succès !");
            queryClient.invalidateQueries({ queryKey: ['adminIndicatorPurchasesUnified'] });
            setMt5InputMap(prev => {
                const next = { ...prev };
                delete next[purchaseId];
                return next;
            });
        }
    };

    // Mutation de livraison finale après confirmation
    const deliveryMutation = useMutation({
        mutationFn: async ({ 
            purchaseId, 
            userId, 
            file, 
            indicatorName,
            deliveryNotes,
            notifyStudent 
        }: { 
            purchaseId: string; 
            userId: string; 
            file: File; 
            indicatorName: string;
            deliveryNotes: string;
            notifyStudent: boolean;
        }) => {
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
                    delivery_notes: deliveryNotes || null,
                    validated_by: user.id,
                    delivery_status: 'delivered',
                    delivered_at: new Date().toISOString()
                } as any)
                .eq('id', purchaseId);
            if (updateError) throw updateError;

            // 4. Notifier l'étudiant si demandé
            if (notifyStudent) {
                await supabase.from('notifications').insert({
                    user_id: userId,
                    title: '✅ Votre indicateur MT5 est prêt !',
                    message: deliveryNotes 
                        ? `Votre indicateur "${indicatorName}" a été déployé. Note de l'administrateur : ${deliveryNotes}`
                        : `Votre indicateur "${indicatorName}" a été configuré pour votre compte MT5. Téléchargez-le depuis votre espace.`,
                    type: 'success',
                    link: '/dashboard'
                });
            }
        },
        onSuccess: () => {
            toast.success("Indicateur déployé et enregistré avec succès !");
            queryClient.invalidateQueries({ queryKey: ['adminIndicatorPurchasesUnified'] });
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
            setPendingDelivery(null);
        },
        onError: (error: any) => {
            toast.error(`Erreur lors de la livraison : ${error.message}`);
        },
    });

    // Interception de la sélection du fichier pour ouvrir la boîte de confirmation
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, purchase: IndicatorPurchase) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Réinitialiser la valeur de l'input pour permettre de resélectionner le même fichier si besoin
        e.target.value = '';

        setPendingDelivery({
            purchase,
            file,
            deliveryNotes: '',
            notifyStudent: true
        });
    };

    const handleConfirmDelivery = () => {
        if (!pendingDelivery) return;
        const { purchase, file, deliveryNotes, notifyStudent } = pendingDelivery;
        const indicatorName = purchase.indicators?.name || 'Indicateur MT5';

        deliveryMutation.mutate({
            purchaseId: purchase.id,
            userId: purchase.user_id,
            file,
            indicatorName,
            deliveryNotes,
            notifyStudent
        });
    };

    // Helper pour valider l'extension du fichier
    const getFileExtension = (filename: string) => {
        return filename.split('.').pop()?.toLowerCase() || '';
    };

    const isStandardTradingFile = (filename: string) => {
        const ext = getFileExtension(filename);
        return ['ex5', 'ex4', 'mq5', 'mq4', 'zip', 'rar', 'dll'].includes(ext);
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-40" />
            <span className="text-xs text-muted-foreground">Chargement de la logistique...</span>
        </div>
    );

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-20 max-w-7xl">

            {/* HEADER UNIFIÉ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
                        <Upload className="w-3 h-3" /> Logistique Numérique & Déploiement
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Livraison des Indicateurs & Outils
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Vérifiez les identifiants MT5 et déployez les fichiers binaires configurés pour chaque apprenant.
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

            {/* Liste des Livraisons */}
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
                                    <div className={`w-1.5 flex-shrink-0 ${isDelivered ? 'bg-emerald-500' : !hasMt5 ? 'bg-destructive' : 'bg-amber-500'}`} />

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
                                                    <History className="w-3 h-3" /> Suivi Logistique
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
                                                        {purchase.delivery_notes && (
                                                            <p className="text-[10px] text-muted-foreground/80 italic line-clamp-1" title={purchase.delivery_notes}>
                                                                Note : {purchase.delivery_notes}
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
                                                            <RefreshCw className="w-3 h-3" /> Remplacer le fichier
                                                            <input type="file" className="hidden" onChange={(e) => handleFileSelect(e, purchase)} />
                                                        </label>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Badge variant="outline" className="text-[10px] font-semibold border-amber-500/30 text-amber-600 bg-amber-500/5 rounded-full px-2.5 py-0.5">
                                                            <AlertCircle className="w-3 h-3 mr-1" /> Action requise
                                                        </Badge>
                                                        <label className={`relative cursor-pointer ${!hasMt5 ? 'opacity-50 pointer-events-none' : ''}`} title={!hasMt5 ? "Renseignez l'ID MT5 avant de livrer" : ""}>
                                                            <div className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold shadow-xs transition-all bg-primary text-primary-foreground hover:bg-primary/90">
                                                                <Upload className="w-3.5 h-3.5" />
                                                                Déployer l'outil
                                                            </div>
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                onChange={(e) => handleFileSelect(e, purchase)}
                                                                disabled={!hasMt5}
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

            {/* MODAL DE CONFIRMATION & VALIDATION AVANT LIVRAISON */}
            {pendingDelivery && (
                <Dialog open={!!pendingDelivery} onOpenChange={(open) => !open && setPendingDelivery(null)}>
                    <DialogContent className="sm:max-w-[540px] rounded-2xl p-6 space-y-4">
                        <DialogHeader>
                            <div className="inline-flex items-center gap-2 text-primary font-semibold text-xs mb-1">
                                <ShieldCheck className="w-4 h-4" /> Validation du Déploiement
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight">
                                Confirmer la livraison de l'indicateur
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Vérifiez les paramètres de liaison avant de rendre le fichier accessible à l'étudiant.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Récapitulatif Cible */}
                        <div className="p-3.5 bg-muted/40 rounded-xl border border-border/50 space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Apprenant :</span>
                                <span className="font-semibold text-foreground">{pendingDelivery.purchase.profiles?.full_name || 'Élève'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Indicateur :</span>
                                <span className="font-semibold text-primary">{pendingDelivery.purchase.indicators?.name || 'Outil MT5'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Compte MT5 ciblé :</span>
                                <span className="font-mono font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border/50">
                                    {pendingDelivery.purchase.mt5_id || 'NON FOURNI'}
                                </span>
                            </div>
                        </div>

                        {/* Détails du Fichier Sélectionné */}
                        <div className="p-3.5 bg-background rounded-xl border border-border/60 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-semibold text-foreground truncate max-w-[280px]">
                                        {pendingDelivery.file.name}
                                    </span>
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                    {(pendingDelivery.file.size / 1024).toFixed(1)} Ko
                                </span>
                            </div>

                            {/* Alerte si extension non usuelle */}
                            {!isStandardTradingFile(pendingDelivery.file.name) && (
                                <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 text-[11px]">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Attention : L'extension <strong>.{getFileExtension(pendingDelivery.file.name)}</strong> n'est pas un binaire MT4/MT5 habituel (.ex5, .ex4, .zip).</span>
                                </div>
                            )}
                        </div>

                        {/* Note ou Consignes personnalisées */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-foreground">
                                Consignes ou note de livraison (optionnelle)
                            </Label>
                            <Textarea
                                placeholder="Ex: Fichier configuré pour votre compte MT5. À placer dans le répertoire MQL5/Indicators."
                                className="text-xs rounded-xl min-h-[70px] resize-none"
                                value={pendingDelivery.deliveryNotes}
                                onChange={(e) => setPendingDelivery(prev => prev ? { ...prev, deliveryNotes: e.target.value } : null)}
                            />
                        </div>

                        {/* Option Notification Élève */}
                        <div className="flex items-center space-x-2 pt-1">
                            <Checkbox
                                id="notifyStudent"
                                checked={pendingDelivery.notifyStudent}
                                onCheckedChange={(checked) => setPendingDelivery(prev => prev ? { ...prev, notifyStudent: !!checked } : null)}
                            />
                            <Label htmlFor="notifyStudent" className="text-xs font-medium text-foreground cursor-pointer">
                                Envoyer une notification in-app immédiate à l'apprenant
                            </Label>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-xs"
                                onClick={() => setPendingDelivery(null)}
                                disabled={deliveryMutation.isPending}
                            >
                                Annuler
                            </Button>
                            <Button
                                size="sm"
                                className="rounded-xl text-xs font-semibold gap-1.5 bg-primary text-primary-foreground"
                                onClick={handleConfirmDelivery}
                                disabled={deliveryMutation.isPending}
                            >
                                {deliveryMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Déploiement en cours...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Confirmer & Déployer
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default IndicatorDelivery;
