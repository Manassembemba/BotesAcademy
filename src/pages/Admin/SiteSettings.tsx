import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, Loader2, Phone, Mail, CreditCard, Tag } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface Setting {
    id: string;
    key: string;
    value: any;
    description: string;
}

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

    if (error) {
        return (
            <div className="container mx-auto p-8 text-center text-destructive">
                <Card className="p-12 border-destructive/20 bg-destructive/5">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h2 className="text-xl font-bold mb-2">Erreur de configuration</h2>
                    <p>La table 'site_settings' n'existe pas ou n'est pas accessible.</p>
                    <p className="text-sm mt-2 font-mono">{error.message}</p>
                    <p className="mt-4 text-sm text-muted-foreground">Veuillez exécuter la migration SQL 'admin_enhancements.sql'.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold mb-2">Configuration du Site</h1>
                <p className="text-muted-foreground">
                    Gérez les paramètres globaux de l'académie et les informations de paiement.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Moyens de Paiement */}
                <Card className="border-primary/20 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle>Moyens de Paiement</CardTitle>
                                <CardDescription>Numéros Mobile Money affichés aux étudiants.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Numéros Mobile Money (un par ligne)</Label>
                            <Textarea
                                value={localSettings['payment_methods']?.mobile_money?.join('\n') || ''}
                                onChange={(e) => handleLocalChange('payment_methods', 'mobile_money', e.target.value.split('\n'))}
                                placeholder="+243 000 000 000"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Informations Virement Bancaire</Label>
                            <Input
                                value={localSettings['payment_methods']?.bank || ''}
                                onChange={(e) => handleLocalChange('payment_methods', 'bank', e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={() => handleSave('payment_methods')}
                            disabled={updateSettingMutation.isPending}
                        >
                            {updateSettingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Sauvegarder les paiements
                        </Button>
                    </CardContent>
                </Card>

                {/* Informations de l'Académie */}
                <Card className="border-primary/20 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Tag className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle>Infos Académie</CardTitle>
                                <CardDescription>Coordonnées de contact officielles.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 italic">
                                <Mail className="w-3 h-3" /> E-mail de contact
                            </Label>
                            <Input
                                value={localSettings['academy_info']?.email || ''}
                                onChange={(e) => handleLocalChange('academy_info', 'email', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 italic">
                                <Phone className="w-3 h-3" /> Téléphone / WhatsApp
                            </Label>
                            <Input
                                value={localSettings['academy_info']?.phone || ''}
                                onChange={(e) => handleLocalChange('academy_info', 'phone', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 italic">
                                <Tag className="w-3 h-3" /> Lien Canal Support (Telegram/WA)
                            </Label>
                            <Input
                                value={localSettings['academy_info']?.support_link || ''}
                                onChange={(e) => handleLocalChange('academy_info', 'support_link', e.target.value)}
                                placeholder="https://t.me/..."
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={() => handleSave('academy_info')}
                            disabled={updateSettingMutation.isPending}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Sauvegarder les contacts
                        </Button>
                    </CardContent>
                </Card>

                {/* Catégories de Formations (Démonstration de JSON Array) */}
                <Card className="md:col-span-2 border-primary/20 bg-card/50">
                    <CardHeader>
                        <CardTitle>Catégories de Formations</CardTitle>
                        <CardDescription>Définissez les catégories disponibles pour les filtres du catalogue.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Input
                                value={localSettings['categories']?.join(', ') || ''}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, categories: e.target.value.split(',').map(s => s.trim()) }))}
                                placeholder="Finance, Technologie, Communication..."
                            />
                            <p className="text-xs text-muted-foreground italic">Séparez les catégories par des virgules.</p>
                            <Button
                                onClick={() => handleSave('categories')}
                                disabled={updateSettingMutation.isPending}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Mettre à jour les catégories
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SiteSettings;
