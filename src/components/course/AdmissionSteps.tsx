import { CheckCircle2, Circle, Send, ClipboardCheck, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Inscription",
    description: "Remplissez le formulaire de candidature en ligne.",
    icon: Send,
  },
  {
    title: "Test en ligne",
    description: "Évaluez vos compétences techniques de base.",
    icon: ClipboardCheck,
  },
  {
    title: "Confirmation",
    description: "Entretien de motivation avec un conseiller.",
    icon: CheckCircle2,
  },
  {
    title: "Admission",
    description: "Validation administrative et finale.",
    icon: GraduationCap,
  }
];

export const AdmissionSteps = () => {
  return (
    <div className="py-12 px-6 bg-primary/5 rounded-[2.5rem] border border-primary/10 shadow-xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700">
         <ClipboardCheck className="w-48 h-48" />
      </div>
      
      <div className="relative z-10 space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Processus d'Admission</h3>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">4 étapes simples pour rejoindre nos cohorte</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center text-center space-y-4 group/step">
              {/* Connector */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 border-t-2 border-dashed border-primary/20 -z-10" />
              )}
              
              <div className="w-16 h-16 rounded-[1.5rem] bg-background border-2 border-primary/10 flex items-center justify-center group-hover/step:border-primary group-hover/step:shadow-glow-primary transition-all duration-300 transform group-hover/step:rotate-12">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              
              <div className="space-y-1">
                <h4 className="font-black uppercase text-xs tracking-tight">{step.title}</h4>
                <p className="text-[10px] text-muted-foreground font-medium italic leading-tight px-4">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
