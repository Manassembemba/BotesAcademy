import { motion, animate } from "framer-motion";
import { useEffect, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ShieldCheck } from "lucide-react";

interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
}

function CountUp({ value, prefix = "", suffix = "" }: CountUpProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(0, value, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate(v) {
          node.textContent = `${prefix}${Math.round(v).toString()}${suffix}`;
        },
      });
      return () => controls.stop();
    }
  }, [value, prefix, suffix]);
  return <span ref={nodeRef}>{prefix}0{suffix}</span>;
}

interface StatsSectionProps {
  enrolledCourses?: any[];
  attendanceRate?: number;
  financialSummary: {
    totalDebt: number;
    hasOverdue: boolean;
  };
  isLoading: boolean;
}

export const StatsSection = ({ 
  enrolledCourses, 
  isLoading 
}: StatsSectionProps) => {

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
    >
      <motion.div variants={item}>
        <Card className="p-4 sm:p-5 bg-card border border-border/50 rounded-2xl shadow-xs group hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Formations Inscrites</p>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {isLoading ? <Skeleton className="h-7 w-8" /> : <CountUp value={enrolledCourses?.length || 0} />}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="p-4 sm:p-5 bg-card border border-border/50 rounded-2xl shadow-xs group hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Statut Dossier Académique</p>
              <div className="text-2xl font-bold tracking-tight text-emerald-600">
                {enrolledCourses && enrolledCourses.length > 0 ? "Actif" : "En attente"}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
