import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  endDate: string;
  className?: string;
}

export const CountdownTimer = ({ endDate, className }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endDate) - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) return null;

  return (
    <div className={cn("flex gap-2 sm:gap-4 items-center justify-center", className)}>
      <TimeUnit value={timeLeft.days} label="j" />
      <TimeUnit value={timeLeft.hours} label="h" />
      <TimeUnit value={timeLeft.minutes} label="m" />
      <TimeUnit value={timeLeft.seconds} label="s" isUrgent={timeLeft.days === 0 && timeLeft.hours < 24} />
    </div>
  );
};

const TimeUnit = ({ value, label, isUrgent }: { value: number; label: string; isUrgent?: boolean }) => (
  <div className="flex flex-col items-center">
    <div className={cn(
      "w-12 h-14 sm:w-16 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 shadow-xl",
      isUrgent && "border-primary/50 text-primary animate-pulse shadow-glow-primary"
    )}>
      <span className="text-xl sm:text-3xl font-black italic tracking-tighter">
        {value.toString().padStart(2, '0')}
      </span>
    </div>
    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest mt-1 sm:mt-2 opacity-60">
      {label}
    </span>
  </div>
);
