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
        <div className="space-y-12 mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.8] mb-2">
                            Student <span className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">Management</span>
                        </h1>
                        <p className="text-muted-foreground font-medium italic text-lg ml-1 border-l-4 border-primary pl-4 py-1 bg-primary/5 rounded-r-lg">
                            Pilotez et suivez le parcours académique de vos apprenants d'élite.
                        </p>
                    </motion.div>
                </div>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-4"
                >
                    <Button 
                        onClick={onAddStudent} 
                        className="group relative overflow-hidden gap-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_10px_30px_-10px_rgba(var(--primary),0.5)] rounded-2xl h-16 font-black uppercase tracking-widest text-xs px-10 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        Inscrire un élève
                        <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                    </Button>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        primary: "text-primary bg-primary/10 border-primary/20",
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="p-6 bg-card/40 backdrop-blur-2xl border-white/5 rounded-[2rem] shadow-premium hover:border-white/10 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all" />
                
                <div className="flex flex-col gap-4 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colorMap[color]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-3xl font-black italic tracking-tighter leading-none mb-1">{value}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">{label}</div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-tighter opacity-40">{subValue}</span>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};
