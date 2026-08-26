import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
                <div className="space-y-3">
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-[0.9] group-hover:text-primary transition-colors duration-500">
                    {course.course_title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest bg-primary/5 border-primary/20 text-primary px-3 h-6 flex items-center rounded-lg">
                      {course.course_category}
                    </Badge>
                    {course.vacation_name && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/10 text-[9px] font-black uppercase tracking-tighter px-3 h-6 flex items-center rounded-lg">
                        {course.vacation_name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/20 px-4 py-2 rounded-xl flex items-center gap-2 border border-border/10">
                  <Clock className="w-3 h-3 text-primary" />
                  {course.estimated_duration || 'N/A'}
                </div>
              </div>
              
              <div className="space-y-6 mt-auto">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="opacity-60 italic">Progression</span>
                    <span className="text-primary">{Math.round(course.progress || 0)}%</span>
                  </div>
                  <Progress value={course.progress || 0} className="h-1.5 rounded-full bg-primary/10 overflow-hidden" />
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/10 rounded-3xl border border-border/5">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Status Caisse</p>
                    {course.payment_status === 'completed' ? (
                      <span className="text-[10px] font-black uppercase text-emerald-600">Soli de Réglé</span>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-amber-600">En cours</span>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Investi</p>
                    <p className="text-sm font-black italic tracking-tighter text-primary">{course.paid_amount || 0} USD</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                   {balance > 0 ? (
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Reste: ${balance.toFixed(2)}</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-2 text-emerald-600">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Accès Complet</span>
                     </div>
                   )}

                   <div className="flex items-center gap-4">
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
                          className="p-2 bg-muted/20 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors"
                          title="Télécharger le reçu"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary group-hover:translate-x-1 transition-transform">
                        Continuer <ArrowRight className="w-3 h-3" />
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
