import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, Download, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { generateInvoice } from "@/lib/pdfService";
import { motion } from "framer-motion";

interface EnrolledCourseCardProps {
  course: any;
  paymentProofs?: any[];
  user: any;
}

export const EnrolledCourseCard = ({ course, paymentProofs, user }: EnrolledCourseCardProps) => {
  const proof = paymentProofs?.find(p => p.course_id === course.course_id);
  const balance = (course.total_amount || 0) - (course.paid_amount || 0);
  
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX((y - centerY) / 15);
    setRotateY((centerX - x) / 15);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ 
        perspective: "1000px",
      }}
      className="group"
    >
      <Link to={`/formations/${course.course_id}/content`}>
        <div 
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ 
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transition: "transform 0.1s ease-out"
          }}
          className="h-full"
        >
          <Card className="p-8 h-full rounded-[2.5rem] bg-card/40 backdrop-blur-xl border-border/20 shadow-premium group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden relative">
            {/* Subtle glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-6 gap-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">
                    {course.course_title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-primary/5 border-primary/20 text-primary px-2.5 h-6 flex items-center rounded-lg">
                      {course.course_category}
                    </Badge>
                    {course.vacation_name && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/10 text-[10px] font-bold uppercase tracking-wider px-2.5 h-6 flex items-center rounded-lg">
                        {course.vacation_name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-xs font-semibold text-muted-foreground bg-muted/30 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-border/20 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {course.estimated_duration || 'N/A'}
                </div>
              </div>
              
              <div className="space-y-4 mt-auto">

                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-2xl border border-border/40">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Statut Dossier</p>
                    {course.payment_status === 'completed' ? (
                      <span className="text-xs font-bold uppercase text-emerald-600">Soldé</span>
                    ) : (
                      <span className="text-xs font-bold uppercase text-amber-600">En cours</span>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Total Versé</p>
                    <p className="text-sm font-bold tracking-tight text-primary">{course.paid_amount || 0} USD</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/20">
                   {balance > 0 ? (
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Reste : ${balance.toFixed(2)}</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-2 text-emerald-600">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">Accès Complet</span>
                     </div>
                   )}

                   <div className="flex items-center gap-2">
                      {proof && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            generateInvoice({
                              studentName: user?.user_metadata.full_name || user?.email || 'Étudiant',
                              courseTitle: course.course_title,
                              amount: proof.amount,
                              paymentMethod: proof.payment_method === 'mobile_money' ? 'Mobile Money' :
                                proof.payment_method === 'bank_transfer' ? 'Virement bancaire' :
                                  proof.payment_method === 'cash_deposit' ? 'Dépôt en espèces' : 'Autre',
                              transactionRef: proof.transaction_reference || undefined,
                              date: proof.validated_at || proof.created_at,
                              invoiceNumber: proof.id.slice(0, 8).toUpperCase()
                            });
                          }}
                          className="p-2 bg-muted/40 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-colors"
                          title="Télécharger le reçu officiel (PDF)"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary group-hover:translate-x-1 transition-transform pl-1">
                        Accéder <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Link>
    </motion.div>
  );
};

export default EnrolledCourseCard;
