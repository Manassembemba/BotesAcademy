import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <div className="space-y-10 pt-8 outline-none">
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] italic">Stratégies</h3>
                    </div>
                    <Select onValueChange={(val) => enrollMutation.mutate({ type: 'strategy', itemId: val })}>
                        <SelectTrigger className="w-[180px] h-10 rounded-xl bg-white/5 border-white/5 font-bold uppercase text-[9px]">
                            <SelectValue placeholder="+ Ajouter" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10">
                            {allStrategies?.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {studentStrategiesDetails?.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span className="text-sm font-black uppercase italic tracking-tighter">{s.strategies?.title}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-white/20 hover:text-destructive" onClick={() => deleteMutation.mutate({ type: 'strategy', id: s.id })}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] italic">Indicateurs</h3>
                    </div>
                    <Select onValueChange={(val) => enrollMutation.mutate({ type: 'indicator', itemId: val })}>
                        <SelectTrigger className="w-[180px] h-10 rounded-xl bg-white/5 border-white/5 font-bold uppercase text-[9px]">
                            <SelectValue placeholder="+ Ajouter" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10">
                            {allIndicators?.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {studentIndicatorsDetails?.map((i: any) => (
                        <div key={i.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-3">
                                <Download className="w-4 h-4 text-primary" />
                                <span className="text-sm font-black uppercase italic tracking-tighter">{i.indicators?.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-white/20 hover:text-destructive" onClick={() => deleteMutation.mutate({ type: 'indicator', id: i.id })}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
