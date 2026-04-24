import { motion, animate } from "framer-motion";
import { useEffect, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, TrendingUp } from "lucide-react";

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

  const totalProgress = useMemo(() => {
    if (!enrolledCourses || enrolledCourses.length === 0) return 0;
    const total = enrolledCourses.reduce((acc, course) => acc + (course.progress || 0), 0);
    return total / enrolledCourses.length;
  }, [enrolledCourses]);

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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
    >
      <motion.div variants={item}>
        <Card className="bento-card-compact p-6 bg-card/40 backdrop-blur-xl border-white/5 shadow-premium group rounded-3xl">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-glow-primary transition-transform group-hover:scale-110 duration-500">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tighter italic">
                {isLoading ? <Skeleton className="h-8 w-8" /> : <CountUp value={enrolledCourses?.length || 0} />}
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic opacity-60">Cours actifs</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="bento-card-compact p-6 bg-card/40 backdrop-blur-xl border-white/5 shadow-premium group rounded-3xl">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shadow-glow-accent transition-transform group-hover:scale-110 duration-500">
              <TrendingUp className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tighter italic">
                {isLoading ? <Skeleton className="h-8 w-12" /> : <CountUp value={totalProgress} suffix="%" />}
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic opacity-60">Progression</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
