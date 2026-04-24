import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
    DropdownMenuRadioGroup, DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { 
    Search, Loader2, BookOpen, TrendingUp, Download, Clock, 
    Eye, MoreHorizontal, Filter, FileSpreadsheet, Trash2, 
    Mail, X, CheckCircle2, ChevronUp, ChevronDown, ArrowUpDown 
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { StudentData } from "@/hooks/admin/useStudentManagement";

interface StudentTableProps {
    students: StudentData[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    setSelectedStudentId: (id: string) => void;
    setIsDetailsOpen: (open: boolean) => void;
    isLoading: boolean;
    error: any;
    page: number;
    totalCount: number;
    setPage: (page: number) => void;
    pageSize: number;
    bulkDeleteMutation: any;
    bulkEmailMutation: any;
    bulkStatusUpdateMutation: any;
    courseFilter: string;
    setCourseFilter: (id: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    allCourses: any[];
    sortConfig: { column: string, ascending: boolean };
    setSortConfig: (config: { column: string, ascending: boolean }) => void;
    selectedIds: string[];
    setSelectedIds: (ids: string[]) => void;
    onOpenBulkEmail: () => void;
}

export const StudentTable = ({
    students,
    searchTerm,
    setSearchTerm,
    setSelectedStudentId,
    setIsDetailsOpen,
    isLoading,
    error,
    page,
    totalCount,
    setPage,
    pageSize,
    bulkDeleteMutation,
    bulkEmailMutation,
    bulkStatusUpdateMutation,
    courseFilter,
    setCourseFilter,
    statusFilter,
    setStatusFilter,
    allCourses,
    sortConfig,
    setSortConfig,
    selectedIds,
    setSelectedIds,
    onOpenBulkEmail
}: StudentTableProps) => {
    const totalPages = Math.ceil(totalCount / pageSize);

    const toggleSelectAll = () => {
        if (selectedIds.length === students?.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(students?.map(s => s.student_id) || []);
        }
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(selectedIds.includes(id) 
            ? selectedIds.filter(i => i !== id) 
            : [...selectedIds, id]
        );
    };

    const handleSort = (column: string) => {
        if (sortConfig.column === column) {
            setSortConfig({ column, ascending: !sortConfig.ascending });
        } else {
            setSortConfig({ column, ascending: true });
        }
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig.column !== column) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-20" />;
        return sortConfig.ascending 
            ? <ChevronUp className="ml-2 h-3 w-3 text-primary" /> 
            : <ChevronDown className="ml-2 h-3 w-3 text-primary" />;
    };

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Nom,Email,Inscriptions,Total Investi\n"
            + students.map(s => `${s.full_name},${s.email},${s.enrolled_courses_count},${s.total_spent}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `export_etudiants_${format(new Date(), 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="relative">
            <Card className="shadow-premium rounded-[2.5rem] border-white/5 bg-card/20 backdrop-blur-3xl overflow-hidden border border-white/10">
                <CardHeader className="bg-muted/10 border-b border-white/5 pb-10 pt-10 px-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-8 bg-primary rounded-full" />
                                <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Base de données <span className="text-primary">SIS</span></CardTitle>
                            </div>
                            <CardDescription className="font-medium italic opacity-60 text-base">Annuaire académique et suivi opérationnel.</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                            <div className="relative w-full sm:w-80 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Rechercher un apprenant..."
                                    className="pl-12 bg-background/40 border-white/5 rounded-2xl h-14 font-medium focus:ring-primary shadow-inner transition-all focus:border-primary/50"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" className="h-14 rounded-2xl border-white/5 bg-background/40 gap-2 font-black uppercase text-[10px] tracking-widest px-6" onClick={handleExport}>
                                    <FileSpreadsheet className="h-4 w-4" /> Export
                                </Button>
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className={`h-14 w-14 rounded-2xl border-white/5 bg-background/40 ${(courseFilter !== 'all' || statusFilter !== 'all') ? 'text-primary border-primary/30' : ''}`}>
                                            <Filter className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56 bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl p-2 shadow-2xl" align="end">
                                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40 px-3 py-2">Cursus Académique</DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={courseFilter} onValueChange={setCourseFilter}>
                                            <DropdownMenuRadioItem value="all" className="rounded-xl text-xs font-bold py-2.5">Toutes les formations</DropdownMenuRadioItem>
                                            {allCourses?.map(course => (
                                                <DropdownMenuRadioItem key={course.id} value={course.id} className="rounded-xl text-xs font-bold py-2.5">
                                                    {course.title}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                        
                                        <DropdownMenuSeparator className="bg-white/5 my-2" />
                                        
                                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40 px-3 py-2">Statut de Paiement</DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                                            <DropdownMenuRadioItem value="all" className="rounded-xl text-xs font-bold py-2.5">Tous les statuts</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="completed" className="rounded-xl text-xs font-bold py-2.5">Soldé uniquement</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="partial" className="rounded-xl text-xs font-bold py-2.5">Paiement partiel</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="overdue" className="rounded-xl text-xs font-bold py-2.5">En retard</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>

                                        {(courseFilter !== 'all' || statusFilter !== 'all') && (
                                            <>
                                                <DropdownMenuSeparator className="bg-white/5 my-2" />
                                                <DropdownMenuItem 
                                                    className="rounded-xl text-xs font-black uppercase text-primary text-center justify-center py-3 bg-primary/5 hover:bg-primary/10"
                                                    onClick={() => { setCourseFilter('all'); setStatusFilter('all'); }}
                                                >
                                                    Réinitialiser
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 animate-spin text-primary opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                                </div>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-32 text-destructive space-y-6 px-10">
                            <div className="bg-destructive/10 p-6 rounded-3xl border border-destructive/20 inline-block">
                                <p className="font-black uppercase italic tracking-widest text-lg">Erreur de synchronisation</p>
                                <p className="text-sm opacity-80 font-medium">{error.message}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/5 hover:bg-muted/5 border-white/5">
                                            <TableHead className="pl-10 w-12 text-center">
                                                <Checkbox 
                                                    checked={selectedIds.length === students?.length && students?.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                    className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                />
                                            </TableHead>
                                            <TableHead className="h-16 text-[11px] font-black uppercase tracking-[0.2em] opacity-40 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('full_name')}>
                                                <div className="flex items-center">Apprenant <SortIcon column="full_name" /></div>
                                            </TableHead>
                                            <TableHead className="h-16 text-[11px] font-black uppercase tracking-[0.2em] opacity-40 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('average_progress')}>
                                                <div className="flex items-center">Cursus Académique <SortIcon column="average_progress" /></div>
                                            </TableHead>
                                            <TableHead className="h-16 text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Écosystème Outils</TableHead>
                                            <TableHead className="h-16 text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Statut</TableHead>
                                            <TableHead className="text-right pr-10 h-16 text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence mode="popLayout">
                                            {students?.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-32 text-muted-foreground italic uppercase text-xs tracking-[0.3em] opacity-30">
                                                        Aucun dossier correspondant.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                students?.map((student, index) => (
                                                    <motion.tr
                                                        key={student.student_id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className={`hover:bg-primary/[0.03] transition-all border-white/5 group cursor-default ${selectedIds.includes(student.student_id) ? 'bg-primary/[0.05]' : ''}`}
                                                    >
                                                        <TableCell className="pl-10 py-6 text-center">
                                                            <Checkbox 
                                                                checked={selectedIds.includes(student.student_id)}
                                                                onCheckedChange={() => toggleSelectOne(student.student_id)}
                                                                className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            <div className="flex items-center gap-5">
                                                                <div className="relative">
                                                                    <Avatar className="h-12 w-12 border-2 border-white/5 ring-2 ring-transparent group-hover:ring-primary/20 transition-all shadow-lg">
                                                                        <AvatarImage src={student.avatar_url || ''} />
                                                                        <AvatarFallback className="font-black bg-primary/10 text-primary">{student.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-black uppercase text-sm tracking-tight group-hover:text-primary transition-colors">{student.full_name}</div>
                                                                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">{student.email}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            <div className="flex flex-col gap-3 max-w-[200px]">
                                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter">
                                                                    <span className="opacity-40 italic">{student.enrolled_courses_count || 0} Formations</span>
                                                                    <span className="text-primary">{Math.round((student as any).average_progress || 0)}%</span>
                                                                </div>
                                                                <Progress value={(student as any).average_progress || 0} className="h-1.5 bg-primary/10" />
                                                                <div className="flex flex-wrap gap-1">
                                                                    {student.course_titles?.filter(Boolean).slice(0, 1).map((title, i) => (
                                                                        <Badge key={i} variant="outline" className="text-[8px] font-black uppercase tracking-tighter bg-primary/5 border-primary/10 text-primary/70">
                                                                            {title}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/10 group-hover:bg-amber-500/10 transition-colors">
                                                                    <TrendingUp className="w-4 h-4 text-amber-600" />
                                                                </div>
                                                                <div className="p-2 rounded-xl bg-blue-500/5 border border-blue-500/10 group-hover:bg-blue-500/10 transition-colors">
                                                                    <Download className="w-4 h-4 text-blue-600" />
                                                                </div>
                                                                <span className="text-xs font-black italic opacity-40 ml-1">
                                                                    +{(Number(student.purchased_strategies_count) || 0) + (Number(student.purchased_indicators_count) || 0)}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            {(student as any).financial_status === 'overdue' ? (
                                                                <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                                                                    En retard
                                                                </Badge>
                                                            ) : (student as any).financial_status === 'partial' ? (
                                                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                                                                    Partiel
                                                                </Badge>
                                                            ) : (student as any).financial_status === 'completed' ? (
                                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                                                                    Soldé
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-muted text-muted-foreground font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                                                                    Aucun
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right pr-10 py-6">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                                                    onClick={() => {
                                                                        setSelectedStudentId(student.student_id);
                                                                        setIsDetailsOpen(true);
                                                                    }}
                                                                >
                                                                    <Eye className="w-5 h-5" />
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-white/5">
                                                                            <MoreHorizontal className="w-5 h-5 opacity-40" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-48 bg-card border-white/10 rounded-2xl shadow-2xl p-2">
                                                                        <DropdownMenuItem className="rounded-xl font-bold py-3 cursor-pointer" onClick={() => { setSelectedStudentId(student.student_id); setIsDetailsOpen(true); }}>
                                                                            <Eye className="w-4 h-4 mr-3 opacity-60" /> Dossier complet
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem className="rounded-xl font-bold py-3 cursor-pointer" onClick={() => window.open(`mailto:${student.email}`)}>
                                                                            <Mail className="w-4 h-4 mr-3 opacity-60" /> Contacter l'élève
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator className="bg-white/5 my-1" />
                                                                        <DropdownMenuItem className="rounded-xl font-bold py-3 cursor-pointer text-destructive hover:bg-destructive/10">
                                                                            <Trash2 className="w-4 h-4 mr-3 opacity-60" /> Supprimer
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </TableCell>
                                                    </motion.tr>
                                                ))
                                            )}
                                        </AnimatePresence>
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Footer */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-10 py-8 border-t border-white/5 bg-muted/5">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 italic">
                                        Affichage {students?.length} sur {totalCount} dossiers
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                            className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-12 px-6 border-white/5 hover:bg-primary/10"
                                        >
                                            Précédent
                                        </Button>
                                        <div className="flex items-center gap-3 px-5 py-2.5 bg-background/40 rounded-2xl border border-white/5 font-black text-[11px] shadow-inner">
                                            <span className="text-primary">{page}</span>
                                            <span className="opacity-20 italic">sur</span>
                                            <span className="opacity-60">{totalPages}</span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === totalPages}
                                            onClick={() => setPage(page + 1)}
                                            className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-12 px-6 border-white/5 hover:bg-primary/10"
                                        >
                                            Suivant
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Mobile Card View */}
                            <div className="grid grid-cols-1 gap-6 md:hidden p-8">
                                {students?.map((student) => (
                                    <motion.div
                                        key={student.student_id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-6 border-white/10 bg-background/20 backdrop-blur-xl rounded-[2.5rem] border hover:border-primary/30 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                                        
                                        <div className="flex items-center gap-5 mb-6 relative z-10">
                                            <Checkbox 
                                                checked={selectedIds.includes(student.student_id)}
                                                onCheckedChange={() => toggleSelectOne(student.student_id)}
                                                className="absolute top-0 right-0 border-white/20"
                                            />
                                            <Avatar className="h-16 w-16 border-2 border-primary/10 shadow-xl group-hover:scale-110 transition-transform">
                                                <AvatarImage src={student.avatar_url || ''} />
                                                <AvatarFallback className="font-black text-xl bg-primary/10 text-primary">{student.full_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black uppercase italic tracking-tighter truncate text-xl leading-none mb-1 group-hover:text-primary transition-colors">{student.full_name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold truncate opacity-40 tracking-widest">{student.email}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-30 italic">Progression</p>
                                                    <p className="font-black text-sm uppercase italic">{Math.round((student as any).average_progress || 0)}% du cursus</p>
                                                </div>
                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-full font-black text-[9px] px-3 uppercase tracking-widest">
                                                    {(student as any).financial_status || 'SOLDE'}
                                                </Badge>
                                            </div>
                                            <Progress value={(student as any).average_progress || 0} className="h-2 bg-primary/5 shadow-inner" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/5 relative z-10">
                                            <Button 
                                                variant="secondary" 
                                                className="rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest gap-2 bg-primary/10 hover:bg-primary/20 text-primary"
                                                onClick={() => {
                                                    setSelectedStudentId(student.student_id);
                                                    setIsDetailsOpen(true);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                                Dossier
                                            </Button>
                                            <Button variant="outline" className="rounded-2xl h-14 border-white/5 font-black uppercase text-[10px] tracking-widest opacity-40">
                                                Actions
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Bulk Actions Floating Toolbar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-8 py-4 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] flex items-center gap-8 min-w-[400px]"
                    >
                        <div className="flex items-center gap-3 border-r border-white/10 pr-8">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black italic">
                                {selectedIds.length}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Éléments sélectionnés</div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                className="h-12 rounded-xl text-xs font-black uppercase tracking-widest gap-2 hover:bg-white/5"
                                onClick={onOpenBulkEmail}
                                disabled={bulkEmailMutation.isPending}
                            >
                                {bulkEmailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                Email
                            </Button>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        className="h-12 rounded-xl text-xs font-black uppercase tracking-widest gap-2 hover:bg-white/5"
                                        disabled={bulkStatusUpdateMutation.isPending}
                                    >
                                        {bulkStatusUpdateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Statut
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-card border-white/10 rounded-xl p-2 shadow-2xl min-w-[200px]" align="end">
                                    <DropdownMenuItem className="font-bold py-3 rounded-lg cursor-pointer" onClick={() => bulkStatusUpdateMutation.mutate({ userIds: selectedIds, action: 'RESTORE_USER' }, { onSuccess: () => setSelectedIds([]) })}>
                                        <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Activer / Restaurer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="font-bold py-3 rounded-lg cursor-pointer text-destructive hover:bg-destructive/10" onClick={() => bulkStatusUpdateMutation.mutate({ userIds: selectedIds, action: 'SUSPEND_USER' }, { onSuccess: () => setSelectedIds([]) })}>
                                        <X className="w-4 h-4 mr-2" /> Suspendre l'accès
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button 
                                variant="ghost" 
                                className="h-12 rounded-xl text-xs font-black uppercase tracking-widest gap-2 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                    if (confirm(`Voulez-vous vraiment supprimer ces ${selectedIds.length} étudiants ? Cette action est irréversible.`)) {
                                        bulkDeleteMutation.mutate(selectedIds, {
                                            onSuccess: () => setSelectedIds([])
                                        });
                                    }
                                }}
                                disabled={bulkDeleteMutation.isPending}
                            >
                                {bulkDeleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Supprimer
                            </Button>
                        </div>

                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 rounded-full border-white/10 hover:bg-white/5 ml-4"
                            onClick={() => setSelectedIds([])}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
