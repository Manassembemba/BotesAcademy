import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, Users, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const Attendance = () => {
    const queryClient = useQueryClient();
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [selectedVacation, setSelectedVacation] = useState<string>("");
    const [date, setDate] = useState<Date>(new Date());
    const [searchTerm, setSearchTerm] = useState("");

    // 1. Fetch courses
    const { data: courses } = useQuery({
        queryKey: ['admin-courses-list'],
        queryFn: async () => {
            const { data } = await supabase.from('courses').select('id, title');
            return data || [];
        }
    });

    // 2. Fetch sessions for selected course
    const { data: sessions } = useQuery({
        queryKey: ['course-sessions-list', selectedCourse],
        queryFn: async () => {
            if (!selectedCourse) return [];
            const { data } = await supabase
                .from('course_sessions')
                .select('id, session_name')
                .eq('course_id', selectedCourse);
            return data || [];
        },
        enabled: !!selectedCourse
    });

    // 3. Fetch vacations for selected course
    const { data: vacations } = useQuery({
        queryKey: ['course-vacations-list', selectedCourse],
        queryFn: async () => {
            if (!selectedCourse) return [];
            const { data } = await supabase
                .from('course_vacations')
                .select('id, name, time_range')
                .eq('course_id', selectedCourse);
            return data || [];
        },
        enabled: !!selectedCourse
    });

    // 4. Fetch students enrolled in this session AND vacation
    const { data: students, isLoading: isLoadingStudents } = useQuery({
        queryKey: ['students-attendance', selectedSession, selectedVacation],
        queryFn: async () => {
            if (!selectedSession || !selectedVacation) return [];
            const { data, error } = await supabase
                .from('purchases')
                .select(`
                    user_id,
                    profiles:user_id (id, full_name, avatar_url)
                `)
                .eq('session_id', selectedSession)
                .eq('vacation_id', selectedVacation)
                .eq('validation_status', 'approved');

            if (error) throw error;
            return data || [];
        },
        enabled: !!selectedSession && !!selectedVacation
    });

    // 5. Fetch existing attendance for this day, session and vacation
    const { data: attendanceData } = useQuery({
        queryKey: ['daily-attendance', selectedSession, selectedVacation, date],
        queryFn: async () => {
            if (!selectedSession || !selectedVacation) return {};
            const formattedDate = format(date, 'yyyy-MM-dd');
            const { data } = await supabase
                .from('attendance')
                .select('*')
                .eq('session_id', selectedSession)
                .eq('vacation_id', selectedVacation)
                .eq('date', formattedDate);
            
            const map: Record<string, string> = {};
            data?.forEach((a) => {
                map[a.student_id] = a.status;
            });
            return map;
        },
        enabled: !!selectedSession && !!selectedVacation
    });

    // 6. Mutation to toggle attendance
    const toggleAttendanceMutation = useMutation({
        mutationFn: async ({ studentId, status }: { studentId: string, status: string }) => {
            const formattedDate = format(date, 'yyyy-MM-dd');
            
            const { error } = await supabase.from('attendance').upsert({
                student_id: studentId,
                course_id: selectedCourse,
                session_id: selectedSession,
                vacation_id: selectedVacation,
                date: formattedDate,
                status: status
            }, { onConflict: 'student_id, course_id, session_id, date' });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-attendance'] });
        },
        onError: (err: any) => toast.error(err.message)
    });

    const filteredStudents = students?.filter((s: any) => 
        s.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 italic text-primary">
                        <Users className="w-10 h-10" />
                        ÉMARGEMENT QUOTIDIEN
                    </h1>
                    <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">Contrôle des présences par vacation</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-muted/30 p-4 rounded-3xl border border-border/50 backdrop-blur-sm">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase ml-1">Formation</Label>
                        <Select value={selectedCourse} onValueChange={(val) => { setSelectedCourse(val); setSelectedSession(""); setSelectedVacation(""); }}>
                            <SelectTrigger className="w-[180px] bg-background h-10 rounded-xl font-bold">
                                <SelectValue placeholder="Choisir un cours" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase ml-1">Session (Date)</Label>
                        <Select value={selectedSession} onValueChange={setSelectedSession} disabled={!selectedCourse}>
                            <SelectTrigger className="w-[180px] bg-background h-10 rounded-xl font-bold">
                                <SelectValue placeholder="Choisir session" />
                            </SelectTrigger>
                            <SelectContent>
                                {sessions?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.session_name}</SelectItem>)}
                                {(!sessions || sessions.length === 0) && <SelectItem value="none" disabled>Aucune session</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase ml-1">Créneau (Heure)</Label>
                        <Select value={selectedVacation} onValueChange={setSelectedVacation} disabled={!selectedCourse}>
                            <SelectTrigger className="w-[180px] bg-background h-10 rounded-xl font-bold">
                                <SelectValue placeholder="Choisir vacation" />
                            </SelectTrigger>
                            <SelectContent>
                                {vacations?.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.name} ({v.time_range})</SelectItem>)}
                                {(!vacations || vacations.length === 0) && <SelectItem value="none" disabled>Aucun créneau</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase ml-1">Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[180px] justify-start text-left font-bold h-10 rounded-xl bg-background">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(date, 'PPP', { locale: fr })}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <Card className="lg:col-span-3 rounded-[2.5rem] overflow-hidden shadow-2xl border-border/40">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Liste d'appel</CardTitle>
                                <CardDescription className="font-medium">{filteredStudents?.length || 0} étudiants pour ce créneau</CardDescription>
                            </div>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Chercher un élève..." 
                                    className="pl-10 h-10 rounded-xl bg-background border-border/50 font-bold"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {(!selectedSession || !selectedVacation) ? (
                            <div className="py-20 text-center text-muted-foreground italic px-6">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                Veuillez sélectionner une <span className="text-primary font-black">session</span> et une <span className="text-primary font-black">vacation</span> pour charger les élèves.
                            </div>
                        ) : isLoadingStudents ? (
                            <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8">Étudiant</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status de Présence</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents?.map((s: any) => {
                                        const status = attendanceData?.[s.user_id] || 'none';
                                        return (
                                            <TableRow key={s.user_id} className="hover:bg-primary/5 transition-colors border-b border-border/50">
                                                <TableCell className="pl-8 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-black text-primary">
                                                            {s.profiles?.full_name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black uppercase tracking-tighter">{s.profiles?.full_name}</p>
                                                            <p className="text-[10px] text-muted-foreground font-bold italic">Réf: {s.user_id.slice(0,8)}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap items-center justify-center gap-2 py-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant={status === 'present' ? 'default' : 'outline'}
                                                            className={status === 'present' 
                                                                ? 'bg-emerald-600 hover:bg-emerald-700 h-8 sm:h-9 px-2 sm:px-4 rounded-lg sm:rounded-xl text-[10px] sm:text-sm' 
                                                                : 'h-8 sm:h-9 px-2 sm:px-4 rounded-lg sm:rounded-xl border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 text-[10px] sm:text-sm'}
                                                            onClick={() => toggleAttendanceMutation.mutate({ studentId: s.user_id, status: 'present' })}
                                                        >
                                                            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Présent
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant={status === 'absent' ? 'destructive' : 'outline'}
                                                            className={status === 'absent' 
                                                                ? 'h-8 sm:h-9 px-2 sm:px-4 rounded-lg sm:rounded-xl text-[10px] sm:text-sm' 
                                                                : 'h-8 sm:h-9 px-2 sm:px-4 rounded-lg sm:rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5 text-[10px] sm:text-sm'}
                                                            onClick={() => toggleAttendanceMutation.mutate({ studentId: s.user_id, status: 'absent' })}
                                                        >
                                                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Absent
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant={status === 'late' ? 'secondary' : 'outline'}
                                                            className={status === 'late' 
                                                                ? 'bg-amber-500 text-white hover:bg-amber-600 h-8 sm:h-9 px-2 sm:px-4 rounded-lg sm:rounded-xl text-[10px] sm:text-sm' 
                                                                : 'h-8 sm:h-9 px-2 sm:px-4 rounded-lg sm:rounded-xl border-amber-500/20 text-amber-600 hover:bg-amber-50 text-[10px] sm:text-sm'}
                                                            onClick={() => toggleAttendanceMutation.mutate({ studentId: s.user_id, status: 'late' })}
                                                        >
                                                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Retard
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-[2rem] border-primary/20 bg-primary/5 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase italic tracking-tighter">Récap' du Jour</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border/50">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Présents</span>
                                <span className="text-xl font-black text-emerald-600">
                                    {Object.values(attendanceData || {}).filter(v => v === 'present').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border/50">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Absents</span>
                                <span className="text-xl font-black text-destructive">
                                    {Object.values(attendanceData || {}).filter(v => v === 'absent').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border/50">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Retards</span>
                                <span className="text-xl font-black text-amber-500">
                                    {Object.values(attendanceData || {}).filter(v => v === 'late').length}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-accent/20 bg-accent/5 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase italic tracking-tighter">Note du Réceptionniste</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                                "Le pointage est sauvegardé instantanément. Les étudiants peuvent voir leur statut de présence sur leur dashboard."
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
