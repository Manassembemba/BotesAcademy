import { motion } from "framer-motion";
import { BookOpen, Target, Zap, ShieldCheck, Users, BarChart } from "lucide-react";

const features = [
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Apprentissage Hybride",
    description: "Combinez la flexibilité des cours en ligne avec la rigueur des sessions en présentiel pour une immersion totale."
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Focus Pratique",
    description: "80% de nos formations sont basées sur des projets réels et des cas pratiques pour une employabilité immédiate."
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Accélération de Carrière",
    description: "Des parcours intensifs conçus pour vous faire passer de débutant à professionnel en un temps record."
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Certification Reconnue",
    description: "Validez vos compétences avec des certificats officiels reconnus par les acteurs majeurs du secteur."
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Mentorat Personnalisé",
    description: "Chaque étudiant bénéficie d'un suivi par un expert dédié pour lever les blocages techniques et stratégiques."
  },
  {
    icon: <BarChart className="w-6 h-6" />,
    title: "Outils Professionnels",
    description: "Accès exclusif à notre Marketplace d'indicateurs et de logiciels pour une expérience au-delà de la théorie."
  }
];

const MethodologySection = () => {
  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="w-full md:w-1/3">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-black uppercase leading-tight">
                Une Approche <span className="text-gradient-primary">Scientifique</span> de la Réussite
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Chez Botes Academy, nous ne nous contentons pas de transmettre des connaissances. Nous avons développé une méthodologie d'ingénierie pédagogique qui garantit l'assimilation durable des compétences complexes.
              </p>
              <div className="pt-4">
                <div className="h-1 w-24 bg-primary rounded-full mb-8" />
              </div>
            </motion.div>
          </div>
          
          <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-3xl border border-border/50 bg-card hover:border-primary/20 transition-all group"
              >
                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MethodologySection;
