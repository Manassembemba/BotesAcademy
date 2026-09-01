import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Download, Trash2, Layers, Cpu, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ResourcesTabProps {
    studentStrategiesDetails: any[] | null;
    studentIndicatorsDetails: any[] | null;
    allStrategies: any[] | undefined;
    allIndicators: any[] | undefined;
    enrollMutation: any;
    deleteMutation: any;
}

export const ResourcesTab = ({
    studentStrategiesDetails,
    studentIndicatorsDetails,
    allStrategies,
    allIndicators,
    enrollMutation,
    deleteMutation
}: ResourcesTabProps) => {
    return (
        <div className="space-y-6 pt-2 outline-none">
            {/* SECTION STRATÉGIES */}
            <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-amber-500 rounded-full" />
                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                            Stratégies de Trading
                        </h3>
                        <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 py-0 h-5">
                            {studentStrategiesDetails?.length || 0}
                        </Badge>
                    </div>

                    <div className="w-44">
                        <Select 
                            onValueChange={(val) => {
                                if (val && val !== 'none') {
                                    enrollMutation.mutate({ type: 'strategy', itemId: val });
                                }
                            }}
                            disabled={!allStrategies || allStrategies.length === 0}
                        >
                            <SelectTrigger className="h-8 rounded-xl bg-background border-border text-xs font-medium">
                                <Plus className="w-3 h-3 mr-1 text-amber-500" />
                                <SelectValue placeholder={allStrategies && allStrategies.length > 0 ? "Attribuer..." : "Catalogue vide"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-lg">
                                {allStrategies && allStrategies.length > 0 ? (
                                    allStrategies.map(s => (
                                        <SelectItem key={s.id} value={s.id} className="text-xs py-2">
                                            {s.title}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-xs text-muted-foreground text-center">
                                        Aucune stratégie créée
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    {studentStrategiesDetails?.length === 0 || !studentStrategiesDetails ? (
                        <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 text-center">
                            <Layers className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground/30" />
                            <p className="text-xs text-muted-foreground">Aucune stratégie assignée à cet étudiant</p>
                        </div>
                    ) : (
                        studentStrategiesDetails.map((s: any) => (
                            <div 
                                key={s.id} 
                                className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 hover:border-amber-500/30 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground leading-tight">
                                            {s.strategies?.title || "Stratégie"}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground">
                                            Accès actif
                                        </span>
                                    </div>
                                </div>

                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    onClick={() => deleteMutation.mutate({ type: 'strategy', id: s.id })}
                                    disabled={deleteMutation.isPending}
                                    title="Révoquer l'accès"
                                >
                                    {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* SECTION INDICATEURS */}
            <section className="space-y-3 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-blue-500 rounded-full" />
                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                            Indicateurs MT5 & Logiciels
                        </h3>
                        <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 py-0 h-5">
                            {studentIndicatorsDetails?.length || 0}
                        </Badge>
                    </div>

                    <div className="w-44">
                        <Select 
                            onValueChange={(val) => {
                                if (val && val !== 'none') {
                                    enrollMutation.mutate({ type: 'indicator', itemId: val });
                                }
                            }}
                            disabled={!allIndicators || allIndicators.length === 0}
                        >
                            <SelectTrigger className="h-8 rounded-xl bg-background border-border text-xs font-medium">
                                <Plus className="w-3 h-3 mr-1 text-blue-500" />
                                <SelectValue placeholder={allIndicators && allIndicators.length > 0 ? "Attribuer..." : "Catalogue vide"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-lg">
                                {allIndicators && allIndicators.length > 0 ? (
                                    allIndicators.map(i => (
                                        <SelectItem key={i.id} value={i.id} className="text-xs py-2">
                                            {i.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-xs text-muted-foreground text-center">
                                        Aucun indicateur créé
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    {studentIndicatorsDetails?.length === 0 || !studentIndicatorsDetails ? (
                        <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 text-center">
                            <Cpu className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground/30" />
                            <p className="text-xs text-muted-foreground">Aucun indicateur logiciel assigné</p>
                        </div>
                    ) : (
                        studentIndicatorsDetails.map((i: any) => (
                            <div 
                                key={i.id} 
                                className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 hover:border-blue-500/30 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                                        <Download className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground leading-tight">
                                            {i.indicators?.name || "Indicateur"}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground">
                                            Licence active
                                        </span>
                                    </div>
                                </div>

                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    onClick={() => deleteMutation.mutate({ type: 'indicator', id: i.id })}
                                    disabled={deleteMutation.isPending}
                                    title="Révoquer la licence"
                                >
                                    {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};
