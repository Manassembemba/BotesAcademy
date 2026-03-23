import { motion } from "framer-motion";

const technologies = [
  "MetaTrader 5", "Python", "React.js", "TypeScript", "Node.js", 
  "Adobe Suite", "Excel Pro", "SQL Server", "Docker", "AWS",
  "Tailwind CSS", "TradingView", "Figma", "JavaScript"
];

const TrustBar = () => {
  return (
    <div className="py-10 bg-background border-b border-border/50 overflow-hidden group">
      <div className="container mx-auto px-4 mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center text-muted-foreground/60">
          Outils & Technologies Maîtrisés dans nos parcours
        </p>
      </div>
      
      <div className="relative flex overflow-hidden">
        <motion.div
          className="flex whitespace-nowrap gap-12 items-center"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            duration: 30, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          {/* Double the list for infinite effect */}
          {[...technologies, ...technologies].map((tech, index) => (
            <div 
              key={index} 
              className="text-2xl md:text-3xl font-black text-muted-foreground/20 hover:text-primary/40 transition-colors cursor-default select-none uppercase tracking-tighter italic"
            >
              {tech}
            </div>
          ))}
        </motion.div>
        
        {/* Gradients for smooth fade on edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
      </div>
    </div>
  );
};

export default TrustBar;
