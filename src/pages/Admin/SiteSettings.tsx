import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Settings, Save, Loader2, Phone, Mail, CreditCard, Tag, Globe, 
    MessageSquare, Facebook, Instagram, Twitter, Youtube, CheckCircle2,
    Palette, Image as ImageIcon, Layout, Type, BarChart3, Sparkles, Clock,
    Monitor, Share2, Wallet, Upload, X
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";

interface Setting {
    id: string;
    key: string;
    value: any;
    description: string | null;
}

const ImageUploader = ({ 
    label, 
    value, 
    onChange, 
    id 
}: { 
    label: string, 
    value: string, 
    onChange: (url: string) => void,
    id: string
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validation simple
        if (!file.type.startsWith('image/')) {
            toast.error("Le fichier doit être une image.");
            return;
        }

        setIsUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const { data, error } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            onChange(publicUrl);
            toast.success("Image téléversée avec succès.");
        } catch (error: any) {
            toast.error(`Erreur d'upload: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-tighter italic flex items-center gap-2">
                <ImageIcon className="w-3 h-3" /> {label}
            </Label>
            <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                    <Input 
                        value={value} 
                        onChange={(e) => onChange(e.target.value)} 
                        placeholder="URL de l'image ou téléversez-en une"
                        className="flex-1"
                    />
                    <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="rounded-xl border-dashed border-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleUpload} 
                        className="hidden" 
                        accept="image/*"
                    />
                </div>
                {value && (
                    <div className="relative group rounded-2xl overflow-hidden border-2 border-primary/10 aspect-video bg-muted shadow-lg">
                        <img src={value} alt="Aperçu" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <Badge className="bg-primary text-[10px] uppercase font-black tracking-widest">Aperçu Actuel</Badge>
                            <Button 
                                size="sm" 
                                variant="destructive" 
                                className="h-8 rounded-lg"
                                onClick={() => onChange('')}
                            >
                                <X className="w-3 h-3 mr-1" /> Retirer
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SiteSettings = () => {
    const queryClient = useQueryClient();
    const [localSettings, setLocalSettings] = useState<Record<string, any>>({});

    const { data: settings, isLoading, error } = useQuery({
        queryKey: ['admin-site-settings'],
        queryFn: async () => {
            const { data, error } = await supabase.from('site_settings').select('*');
            if (error) throw error;
            return data as Setting[];
        },
    });

    useEffect(() => {
        if (settings) {
            const initialSettings: Record<string, any> = {};
            settings.forEach(s => {
                initialSettings[s.key] = s.value;
            });
            setLocalSettings(initialSettings);
        }
    }, [settings]);

    const updateSettingMutation = useMutation({
        mutationFn: async ({ key, value }: { key: string; value: any }) => {
            const { error } = await supabase
                .from('site_settings')
                .update({ value, updated_at: new Date().toISOString() })
                .eq('key', key);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Paramètre mis à jour avec succès.");
            queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
            queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
        },
        onError: (error: any) => {
            toast.error(`Erreur: ${error.message}`);
        },
    });

    const handleLocalChange = (key: string, field: string, value: any) => {
        setLocalSettings(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };

    const handleSave = (key: string) => {
        updateSettingMutation.mutate({ key, value: localSettings[key] });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter italic">Tableau de Bord <span className="text-primary">Configuration</span></h1>
                    <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">
                        Gérez l'identité et les fonctionnalités de Botes Academy.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="px-3 py-1 bg-primary/5 text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px]">Système Actif</Badge>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-8">
                <TabsList className="bg-background border border-border p-1 h-auto flex-wrap justify-start gap-1 rounded-2xl">
                    <TabsTrigger value="general" className="rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
                        <Settings className="w-4 h-4" /> Général
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
                        <Monitor className="w-4 h-4" /> Apparence
                    </TabsTrigger>
                    <TabsTrigger value="content" className="rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
                        <BarChart3 className="w-4 h-4" /> Contenu & Stats
                    </TabsTrigger>
                    <TabsTrigger value="logistics" className="rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
                        <Wallet className="w-4 h-4" /> Logistique
                    </TabsTrigger>
                </TabsList>

                {/* --- ONGLET GÉNÉRAL --- */}
                <TabsContent value="general" className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Branding */}
                        <Card className="border-primary/20 bg-card/50 shadow-xl overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Palette className="w-5 h-5" /></div>
                                    <div>
                                        <CardTitle className="uppercase font-black text-sm tracking-widest">Branding & Logo</CardTitle>
                                        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Identité visuelle globale</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 italic">Couleur Primaire (HEX)</Label>
                                        <div className="flex gap-3">
                                            <Input type="color" className="w-12 h-10 p-1 rounded-lg bg-transparent" value={localSettings['appearance']?.primary_color || '#3b82f6'} onChange={(e) => handleLocalChange('appearance', 'primary_color', e.target.value)} />
                                            <Input value={localSettings['appearance']?.primary_color || '#3b82f6'} onChange={(e) => handleLocalChange('appearance', 'primary_color', e.target.value)} className="flex-1" />
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-muted/30 border border-border flex flex-col items-center gap-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground self-start">Logo Actuel</Label>
                                        <img src="/logo.png" alt="Botes Logo" className="h-16 w-auto object-contain" />
                                        <p className="text-[9px] text-center text-muted-foreground italic font-medium">Note : Le logo est fixe sur /logo.png.</p>
                                    </div>
                                </div>
                                <Button className="w-full rounded-xl" onClick={() => handleSave('appearance')} disabled={updateSettingMutation.isPending}>
                                    <Save className="mr-2 h-4 w-4" /> Enregistrer le Branding
                                </Button>
                            </CardContent>
                        </Card>

                        {/* SEO */}
                        <Card className="border-primary/20 bg-card/50 shadow-xl overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Globe className="w-5 h-5" /></div>
                                    <div>
                                        <CardTitle className="uppercase font-black text-sm tracking-widest">SEO & Référencement</CardTitle>
                                        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Méta-informations pour Google</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-tighter italic">Titre Principal (Meta Title)</Label>
                                    <Input value={localSettings['seo']?.meta_title || ''} onChange={(e) => handleLocalChange('seo', 'meta_title', e.target.value)} placeholder="Botes Academy | La référence du Trading" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-tighter italic">Description (Meta Description)</Label>
                                    <Textarea value={localSettings['seo']?.meta_description || ''} onChange={(e) => handleLocalChange('seo', 'meta_description', e.target.value)} placeholder="Rejoignez la meilleure plateforme d'apprentissage..." rows={3} />
                                </div>
                                <Button className="w-full rounded-xl" onClick={() => handleSave('seo')} disabled={updateSettingMutation.isPending}>
                                    <Save className="mr-2 h-4 w-4" /> Sauvegarder le SEO
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- ONGLET APPARENCE --- */}
                <TabsContent value="appearance" className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Hero Carousel */}
                        <Card className="border-primary/20 bg-card/50 shadow-xl overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Layout className="w-5 h-5" /></div>
                                    <div>
                                        <CardTitle className="uppercase font-black text-sm tracking-widest">Configuration Hero</CardTitle>
                                        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Carrousel et textes d'accueil</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-tighter italic flex items-center gap-2"><Type className="w-3 h-3" /> Titre du Hero</Label>
                                        <Input value={localSettings['appearance']?.hero_title || ''} onChange={(e) => handleLocalChange('appearance', 'hero_title', e.target.value)} placeholder="Ex: L'Excellence dans chaque [Discipline]" />
                                    </div>
                                    <div className="space-y-6">
                                        <Label className="text-xs font-black uppercase tracking-widest text-primary italic">Carrousel d'Images (Upload personnel)</Label>
                                        <div className="grid grid-cols-1 gap-6">
                                            <ImageUploader 
                                                id="hero-1"
                                                label="Image 1 (Principale)"
                                                value={localSettings['appearance']?.hero_image_url || ''}
                                                onChange={(url) => handleLocalChange('appearance', 'hero_image_url', url)}
                                            />
                                            <ImageUploader 
                                                id="hero-2"
                                                label="Image 2"
                                                value={localSettings['appearance']?.hero_image_url_2 || ''}
                                                onChange={(url) => handleLocalChange('appearance', 'hero_image_url_2', url)}
                                            />
                                            <ImageUploader 
                                                id="hero-3"
                                                label="Image 3"
                                                value={localSettings['appearance']?.hero_image_url_3 || ''}
                                                onChange={(url) => handleLocalChange('appearance', 'hero_image_url_3', url)}
                                            />
                                            <ImageUploader 
                                                id="hero-4"
                                                label="Image 4"
                                                value={localSettings['appearance']?.hero_image_url_4 || ''}
                                                onChange={(url) => handleLocalChange('appearance', 'hero_image_url_4', url)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button className="w-full rounded-xl h-12 font-black uppercase tracking-widest mt-6" onClick={() => handleSave('appearance')} disabled={updateSettingMutation.isPending}>
                                    <Save className="mr-2 h-4 w-4" /> Enregistrer le Hero
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Promo & Bannière */}
                        <div className="space-y-8">
                            <Card className="border-primary/20 bg-card/50 shadow-xl overflow-hidden">
                                <CardHeader className="bg-primary/5 border-b border-primary/10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-xl text-primary"><Sparkles className="w-5 h-5" /></div>
                                        <CardTitle className="uppercase font-black text-sm tracking-widest">Promo Popup</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                                        <Label className="text-[10px] font-black uppercase">Activer le Popup</Label>
                                        <Switch checked={localSettings['promo_overlay']?.is_active || false} onCheckedChange={(checked) => handleLocalChange('promo_overlay', 'is_active', checked)} />
                                    </div>
                                    <Input value={localSettings['promo_overlay']?.title || ''} onChange={(e) => handleLocalChange('promo_overlay', 'title', e.target.value)} placeholder="Titre Promo" />
                                    
                                    <ImageUploader 
                                        id="promo-img"
                                        label="Image de Promotion"
                                        value={localSettings['promo_overlay']?.image_url || ''}
                                        onChange={(url) => handleLocalChange('promo_overlay', 'image_url', url)}
                                    />

                                    <Button className="w-full rounded-xl" onClick={() => handleSave('promo_overlay')} disabled={updateSettingMutation.isPending}>
                                        <Save className="mr-2 h-4 w-4" /> Sauvegarder la Promo
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20 bg-card/50 shadow-xl overflow-hidden">
                                <CardHeader className="bg-primary/5 border-b border-primary/10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-xl text-primary"><Tag className="w-5 h-5" /></div>
                                        <CardTitle className="uppercase font-black text-sm tracking-widest">Bannière Annonce</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                                        <Label className="text-[10px] font-black uppercase">Activer la Bannière</Label>
                                        <Switch checked={localSettings['global_banner']?.is_active || false} onCheckedChange={(checked) => handleLocalChange('global_banner', 'is_active', checked)} />
                                    </div>
                                    <Input value={localSettings['global_banner']?.text || ''} onChange={(e) => handleLocalChange('global_banner', 'text', e.target.value)} placeholder="Texte de la bannière" />
                                    <Button className="w-full rounded-xl" onClick={() => handleSave('global_banner')} disabled={updateSettingMutation.isPending}>
                                        <Save className="mr-2 h-4 w-4" /> Sauvegarder la Bannière
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- ONGLET CONTENU --- */}
                <TabsContent value="content" className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Statistiques */}
                        <Card className="border-primary/20 bg-card/50 shadow-xl overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><BarChart3 className="w-5 h-5" /></div>
                                    <div>
                                        <CardTitle className="uppercase font-black text-sm tracking-widest">Compteurs & Stats</CardTitle>
                                        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Chiffres clés de l'accueil</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Étudiants</Label>
                                        <Input value={localSettings['stats']?.students || ''} onChange={(e) => handleLocalChange('stats', 'students', e.target.value)} placeholder="2500+" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Réussite (%)</Label>
                                        <Input value={localSettings['stats']?.success_rate || ''} onChange={(e) => handleLocalChange('stats', 'success_rate', e.target.value)} placeholder="95%" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Pays</Label>
                                        <Input value={localSettings['stats']?.countries || ''} onChange={(e) => handleLocalChange('stats', 'countries', e.target.value)} placeholder="12" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Mentors</Label>
                                        <Input value={localSettings['stats']?.mentors || ''} onChange={(e) => handleLocalChange('stats', 'mentors', e.target.value)} placeholder="50+" />
                                    </div>
                                </div>
                                <Button className="w-full rounded-xl" onClick={() => handleSave('stats')} disabled={updateSettingMutation.isPending}>
                                    <Save className="mr-2 h-4 w-4" /> Mettre à jour les stats
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Réseaux Sociaux */}
                        <Card className="border-primary/20 bg-card/50 shadow-xl overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Share2 className="w-5 h-5" /></div>
                                    <div>
                                        <CardTitle className="uppercase font-black text-sm tracking-widest">Liens Sociaux</CardTitle>
                                        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Visibilité externe</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 italic"><Facebook className="w-3 h-3 text-blue-600" /> Facebook</Label>
                                    <Input value={localSettings['social_links']?.facebook || ''} onChange={(e) => handleLocalChange('social_links', 'facebook', e.target.value)} placeholder="URL Facebook" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 italic"><Instagram className="w-3 h-3 text-pink-600" /> Instagram</Label>
                                    <Input value={localSettings['social_links']?.instagram || ''} onChange={(e) => handleLocalChange('social_links', 'instagram', e.target.value)} placeholder="URL Instagram" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 italic"><Twitter className="w-3 h-3 text-sky-500" /> Twitter (X)</Label>
                                    <Input value={localSettings['social_links']?.twitter || ''} onChange={(e) => handleLocalChange('social_links', 'twitter', e.target.value)} placeholder="URL Twitter" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 italic"><Youtube className="w-3 h-3 text-red-600" /> Youtube</Label>
                                    <Input value={localSettings['social_links']?.youtube || ''} onChange={(e) => handleLocalChange('social_links', 'youtube', e.target.value)} placeholder="URL Youtube" />
                                </div>
                                <Button className="w-full rounded-xl" onClick={() => handleSave('social_links')} disabled={updateSettingMutation.isPending}>
                                    <Save className="mr-2 h-4 w-4" /> Sauvegarder les liens
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- ONGLET LOGISTIQUE --- */}
                <TabsContent value="logistics" className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Paiements */}
                        <Card className="border-primary/20 bg-card/50 shadow-xl overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><CreditCard className="w-5 h-5" /></div>
                                    <div>
                                        <CardTitle className="uppercase font-black text-sm tracking-widest">Paiements</CardTitle>
                                        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Mobile Money & Banque</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-tighter italic">Numéros Mobile Money (un par ligne)</Label>
                                    <Textarea value={localSettings['payment_methods']?.mobile_money?.join('\n') || ''} onChange={(e) => handleLocalChange('payment_methods', 'mobile_money', e.target.value.split('\n'))} placeholder="+243..." rows={3} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-tighter italic">Banque</Label>
                                    <Input value={localSettings['payment_methods']?.bank || ''} onChange={(e) => handleLocalChange('payment_methods', 'bank', e.target.value)} placeholder="Détails bancaires" />
                                </div>
                                <Button className="w-full rounded-xl" onClick={() => handleSave('payment_methods')} disabled={updateSettingMutation.isPending}>
                                    <Save className="mr-2 h-4 w-4" /> Sauvegarder les Paiements
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Contact Info */}
                        <Card className="border-primary/20 bg-card/50 shadow-xl overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Mail className="w-5 h-5" /></div>
                                    <div>
                                        <CardTitle className="uppercase font-black text-sm tracking-widest">Contact & Support</CardTitle>
                                        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Infos de l'académie</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 italic"><Mail className="w-3 h-3 text-primary" /> Email</Label>
                                    <Input value={localSettings['academy_info']?.email || ''} onChange={(e) => handleLocalChange('academy_info', 'email', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 italic"><Phone className="w-3 h-3 text-primary" /> Téléphone</Label>
                                    <Input value={localSettings['academy_info']?.phone || ''} onChange={(e) => handleLocalChange('academy_info', 'phone', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 italic"><Tag className="w-3 h-3 text-primary" /> Support Link</Label>
                                    <Input value={localSettings['academy_info']?.support_link || ''} onChange={(e) => handleLocalChange('academy_info', 'support_link', e.target.value)} />
                                </div>
                                <Button className="w-full rounded-xl" onClick={() => handleSave('academy_info')} disabled={updateSettingMutation.isPending}>
                                    <Save className="mr-2 h-4 w-4" /> Sauvegarder les Contacts
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SiteSettings;
