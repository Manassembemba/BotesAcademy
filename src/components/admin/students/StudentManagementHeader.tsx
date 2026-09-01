import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Plus, TrendingUp, DollarSign, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

interface StudentManagementHeaderProps {
    studentCount: number;
    financialStats?: any;
    onAddStudent: () => void;
}

export const StudentManagementHeader = ({
    studentCount,
    financialStats,
    onAddStudent
}: StudentManagementHeaderProps) => {
    // Valeurs extraites du RPC ou valeurs par défaut
    const totalRevenue = financialStats?.total_revenue || 0;
    const monthlyNetProfit = financialStats?.monthly_net_profit || 0;
    const totalDebt = financialStats?.total_debt || 0;
    const overdueCount = financialStats?.overdue_students_count || 0;

    return (
        <div className="space-y-6 mb-6">
            {/* HEADER UNIFIÉ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
                        <Users className="w-3 h-3" /> Ressources Humaines
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Gestion des Étudiants
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Pilotez et suivez le parcours académique de vos apprenants.
                    </p>
                </div>
                <Button 
                    onClick={onAddStudent} 
                    size="sm"
                    className="h-10 px-4 rounded-xl font-semibold text-xs gap-2 shadow-xs"
                >
                    <Plus className="w-4 h-4" />
                    Inscrire un étudiant
                </Button>
            </div>

            {/* KPI FINANCIERS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard 
                    icon={Users} 
                    label="Total Apprenants" 
                    value={studentCount} 
                    subValue="Inscrits en base"
                    color="primary"
                    delay={0.1}
                />
                <StatsCard 
                    icon={DollarSign} 
                    label="Profit Net (Mois)" 
                    value={`$${monthlyNetProfit.toLocaleString()}`} 
                    subValue="Après dépenses"
                    color="emerald"
                    delay={0.2}
                />
                <StatsCard 
                    icon={TrendingUp} 
                    label="Dette Globale" 
                    value={`$${totalDebt.toLocaleString()}`} 
                    subValue="Reste à percevoir"
                    color="amber"
                    delay={0.3}
                />
                <StatsCard 
                    icon={UserCheck} 
                    label="Impayés" 
                    value={overdueCount} 
                    subValue="Élèves en retard"
                    color="blue"
                    delay={0.4}
                />
            </div>
        </div>
    );
};

interface StatsCardProps {
    icon: any;
    label: string;
    value: string | number;
    subValue: string;
    color: string;
    delay: number;
}

const StatsCard = ({ icon: Icon, label, value, subValue, color, delay }: StatsCardProps) => {
    const colorMap: any = {
        primary: "text-primary bg-primary/10",
        emerald: "text-emerald-500 bg-emerald-500/10",
        amber: "text-amber-500 bg-amber-500/10",
        blue: "text-blue-500 bg-blue-500/10",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="p-4 sm:p-5 bg-card border border-border/50 rounded-2xl shadow-xs hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">{label}</p>
                        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">{subValue}</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};
