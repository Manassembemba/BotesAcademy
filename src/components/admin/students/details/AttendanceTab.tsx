import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, Clock, XCircle, Calendar, Sun, Sunset, Moon, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AttendanceTabProps {
  studentId: string;
}

export const AttendanceTab = ({ studentId }: AttendanceTabProps) => {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["student-attendance-history", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          date,
          status,
          vacation_name,
          notes,
          courses:course_id (
            id,
            title
          )
        `)
        .eq("student_id", studentId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  const total = records.length;
  const presentCount = records.filter((r) => r.status === "present").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const attendanceRate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  return (
    <div className="space-y-6 pt-6 outline-none pb-12">
      {/* STATS D'ASSIDUITÉ */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl text-center">
          <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">
            Taux de Présence
          </div>
          <div className="text-3xl font-black italic text-primary">{attendanceRate}%</div>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl text-center">
          <div className="text-[9px] font-black uppercase tracking-wider text-emerald-600 mb-1">
            Séances Suivies
          </div>
          <div className="text-3xl font-black italic text-emerald-500">{presentCount + lateCount}</div>
        </div>

        <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl text-center">
          <div className="text-[9px] font-black uppercase tracking-wider text-rose-600 mb-1">
            Absences
          </div>
          <div className="text-3xl font-black italic text-rose-500">{absentCount}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-muted-foreground uppercase text-[10px] tracking-wider">Assiduité Globale</span>
          <span className="text-primary">{attendanceRate}%</span>
        </div>
        <Progress value={attendanceRate} className="h-2 rounded-full bg-muted" />
      </div>

      {/* HISTORIQUE DES SÉANCES */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
            Historique des Séances Pointées ({records.length})
          </h4>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-16 bg-muted/10 rounded-3xl border border-dashed border-border text-muted-foreground space-y-2">
            <Clock className="w-10 h-10 mx-auto opacity-20" />
            <p className="font-bold text-xs uppercase">Aucune séance pointée pour cet étudiant</p>
            <p className="text-[11px]">Les présences apparaîtront dès le premier émargement.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40 border border-border/60 rounded-2xl bg-card overflow-hidden">
            {records.map((r: any) => {
              const isPresent = r.status === "present";
              const isLate = r.status === "late";
              const courseTitle = r.courses?.title || "Formation";

              return (
                <div key={r.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      isPresent ? "bg-emerald-500/10 text-emerald-500" : isLate ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                    }`}>
                      {isPresent ? <CheckCircle2 className="w-4 h-4" /> : isLate ? <Clock className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-black text-foreground">{courseTitle}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(r.date), "EEEE dd MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    {r.vacation_name && (
                      <Badge variant="outline" className="text-[9px] font-bold uppercase">
                        {r.vacation_name}
                      </Badge>
                    )}
                    <Badge className={`text-[9px] font-black uppercase ${
                      isPresent ? "bg-emerald-500 text-white" : isLate ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                    }`}>
                      {isPresent ? "Présent" : isLate ? "Retard" : "Absent"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
