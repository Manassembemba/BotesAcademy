import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, GraduationCap, Calendar, Clock } from "lucide-react";

interface EnrollStudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string | null;
    studentName: string;
    allCourses: any[];
    onEnroll: (data: { courseId: string; sessionId: string; vacationId: string; amount: number }) => void;
    isPending: boolean;
    enrolledCourseIds?: string[];
}

export const EnrollStudentDialog = ({
    open,
    onOpenChange,
    studentId,
    studentName,
    allCourses,
    onEnroll,
    isPending,
    enrolledCourseIds = []
}: EnrollStudentDialogProps) => {
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedSessionId, setSelectedSessionId] = useState("");
    const [selectedVacationId, setSelectedVacationId] = useState("");
    const [amount, setAmount] = useState(0);

    // Filtrer les cours pour ne garder que ceux que l'élève n'a pas encore
    const availableCourses = allCourses.filter(course => !enrolledCourseIds.includes(course.id));

    // Fetch Sessions for the selected course
    const { data: sessions } = useQuery({
        queryKey: ['course-sessions', selectedCourseId],
        queryFn: async () => {
            const { data } = await supabase.from('course_sessions').select('*').eq('course_id', selectedCourseId);
            return data || [];
        },
        enabled: !!selectedCourseId
    });

    // Fetch Vacations for the selected course
    const { data: vacations } = useQuery({
        queryKey: ['course-vacations', selectedCourseId],
        queryFn: async () => {
            const { data } = await supabase.from('course_vacations').select('*').eq('course_id', selectedCourseId);
            return data || [];
        },
        enabled: !!selectedCourseId
    });

    useEffect(() => {
        if (selectedCourseId) {
            const course = allCourses.find(c => c.id === selectedCourseId);
            if (course) setAmount(course.price);
        }
    }, [selectedCourseId, allCourses]);

    const handleEnroll = () => {
        if (!selectedCourseId || !selectedSessionId) return;
        onEnroll({
            courseId: selectedCourseId,
            sessionId: selectedSessionId,
            vacationId: selectedVacationId,
            amount: amount
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase italic flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary" />
                        Inscrire {studentName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase opacity-60">Formation</Label>
                        <Select onValueChange={setSelectedCourseId} value={selectedCourseId}>
                            <SelectTrigger className="rounded-xl h-12">
                                <SelectValue placeholder="Choisir un cours" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {availableCourses.length === 0 ? (
                                    <SelectItem value="none" disabled>Toutes les formations ont été acquises</SelectItem>
                                ) : (
                                    availableCourses.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.title} (${c.price})</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedCourseId && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Session
                                </Label>
                                <Select onValueChange={setSelectedSessionId} value={selectedSessionId}>
                                    <SelectTrigger className="rounded-xl h-12">
                                        <SelectValue placeholder="Session" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {sessions?.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.session_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Vacation
                                </Label>
                                <Select onValueChange={setSelectedVacationId} value={selectedVacationId}>
                                    <SelectTrigger className="rounded-xl h-12">
                                        <SelectValue placeholder="Vacation" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="none">Par défaut</SelectItem>
                                        {vacations?.map(v => (
                                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase opacity-60">Montant de la formation ($)</Label>
                        <Input 
                            type="number" 
                            value={amount} 
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="rounded-xl h-12 font-bold"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold uppercase text-xs">Annuler</Button>
                    <Button 
                        onClick={handleEnroll} 
                        disabled={isPending || !selectedCourseId || !selectedSessionId}
                        className="rounded-xl h-12 px-8 font-black uppercase text-xs shadow-glow-primary"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirmer l'inscription"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
