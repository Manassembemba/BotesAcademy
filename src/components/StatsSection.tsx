import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Users, GraduationCap, Globe, Award } from "lucide-react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const Counter = ({ value, duration = 2 }: { value: string, duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const count = useMotionValue(0);
  const numericValue = parseInt(value.replace(/[,+]/g, "")) || 0;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, numericValue, { 
        duration: duration, 
        ease: "easeOut",
        onUpdate: (latest) => {
          setDisplayValue(Math.round(latest));
        }
      });
      return controls.stop;
    }
  }, [isInView, numericValue, count, duration]);

  return (
    <span ref={ref}>
      {displayValue}
      {value.includes("+") && "+"}
      {value.includes("%") && "%"}
    </span>
  );
};

const StatsSection = () => {
  const { settings } = useSiteSettings();

  const stats = [
    {
      icon: <Users className="w-6 h-6" />,
      value: settings?.stats?.students || "2500+",
      label: "Étudiants Formés",
      description: "Une communauté grandissante de professionnels."
    },
    {
      icon: <GraduationCap className="w-6 h-6" />,
      value: settings?.stats?.success_rate || "95%",
      label: "Taux de Réussite",
      description: "Nos étudiants atteignent leurs objectifs de carrière."
    },
    {
      icon: <Globe className="w-6 h-6" />,
      value: settings?.stats?.countries || "12",
      label: "Pays Couverts",
      description: "Une présence panafricaine et internationale."
    },
    {
      icon: <Award className="w-6 h-6" />,
      value: settings?.stats?.mentors || "50+",
      label: "Experts Mentors",
      description: "Des formateurs issus du monde professionnel."
    }
  ];

  return (
    <section className="py-20 bg-primary/5 border-y border-primary/10 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center space-y-4"
            >
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 shadow-inner">
                {stat.icon}
              </div>
              <h3 className="text-5xl font-black text-primary tracking-tighter">
                <Counter value={stat.value} />
              </h3>
              <div className="space-y-2">
                <p className="font-black text-lg uppercase tracking-tight">{stat.label}</p>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed">{stat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
    </section>
  );
};

export default StatsSection;
