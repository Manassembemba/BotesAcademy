import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    Search, Loader2, TrendingUp, Download, Clock, 
    Eye, MoreHorizontal, Filter, FileSpreadsheet, Trash2, 
    Mail, X, CheckCircle2, ChevronUp, ChevronDown, ArrowUpDown,
    Users
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StudentData } from "@/hooks/admin/useStudentManagement";
import { toast } from "sonner";

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
    exportAll: () => Promise<StudentData[]>;
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
    onOpenBulkEmail,
    exportAll
}: StudentTableProps) => {
    const navigate = useNavigate();
    const totalPages = Math.ceil(totalCount / pageSize);
    const [isExporting, setIsExporting] = useState(false);

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
        if (sortConfig.column !== column) return <ArrowUpDown className="ml-1.5 h-3 w-3 opacity-30" />;
        return sortConfig.ascending 
            ? <ChevronUp className="ml-1.5 h-3 w-3 text-primary" /> 
            : <ChevronDown className="ml-1.5 h-3 w-3 text-primary" />;
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const allData = await exportAll();
            const csvContent = "data:text/csv;charset=utf-8," 
                + "Nom,Email,Formations,Total Investi,Statut Financier,Progression\n"
                + allData.map(s => 
                    `"${s.full_name}","${s.email}",${s.enrolled_courses_count},${s.total_spent},"${s.financial_status || ''}",${Math.round(s.average_progress || 0)}%`
                ).join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `export_etudiants_${format(new Date(), 'yyyyMMdd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(`${allData.length} étudiants exportés avec succès.`);
        } catch (e: any) {
            toast.error(`Échec de l'export : ${e.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const getFinancialBadge = (status: string | null, enrolledCount: number = 0) => {
        switch (status) {
            case 'overdue':
                return <Badge className="bg-destructive/10 text-destructive border border-destructive/20 font-semibold text-[10px] rounded-full px-2.5 py-0.5">En retard</Badge>;
            case 'partial':
                return <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 font-semibold text-[10px] rounded-full px-2.5 py-0.5">Partiel</Badge>;
            case 'completed':
                return <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold text-[10px] rounded-full px-2.5 py-0.5">Soldé</Badge>;
            default:
                if (enrolledCount === 0) {
                    return <Badge variant="secondary" className="bg-muted/40 text-muted-foreground/60 font-normal text-[10px] rounded-full px-2.5 py-0.5">Non inscrit</Badge>;
                }
                return <Badge variant="outline" className="text-muted-foreground/70 border-border/40 font-normal text-[10px] rounded-full px-2.5 py-0.5">En attente</Badge>;
        }
    };

    return (
        <div className="relative">
            <Card className="rounded-2xl border border-border/50 bg-card shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/40 p-4 sm:p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Annuaire académique</p>
                                <p className="text-[11px] text-muted-foreground">{totalCount} apprenant{totalCount !== 1 ? 's' : ''} au total</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher un apprenant..."
                                    className="pl-9 h-9 rounded-xl text-sm bg-background border-border/60"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 rounded-xl gap-1.5 text-xs font-semibold border-border/60"
                                onClick={handleExport}
                                disabled={isExporting}
                            >
                                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={`h-9 w-9 p-0 rounded-xl border-border/60 ${(courseFilter !== 'all' || statusFilter !== 'all') ? 'text-primary border-primary/40 bg-primary/5' : ''}`}
                                    >
                                        <Filter className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 rounded-xl p-2 shadow-lg" align="end">
                                    <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">Cursus</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={courseFilter} onValueChange={setCourseFilter}>
                                        <DropdownMenuRadioItem value="all" className="rounded-lg text-xs py-2">Toutes les formations</DropdownMenuRadioItem>
                                        {allCourses?.map(course => (
                                            <DropdownMenuRadioItem key={course.id} value={course.id} className="rounded-lg text-xs py-2">
                                                {course.title}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                    
                                    <DropdownMenuSeparator className="my-1.5" />
                                    
                                    <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">Statut Paiement</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                                        <DropdownMenuRadioItem value="all" className="rounded-lg text-xs py-2">Tous les statuts</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="active" className="rounded-lg text-xs py-2">Actif (non banni)</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="banned" className="rounded-lg text-xs py-2">Banni</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="completed" className="rounded-lg text-xs py-2">Soldé uniquement</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="partial" className="rounded-lg text-xs py-2">Paiement partiel</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="overdue" className="rounded-lg text-xs py-2">En retard</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>

                                    {(courseFilter !== 'all' || statusFilter !== 'all') && (
                                        <>
                                            <DropdownMenuSeparator className="my-1.5" />
                                            <DropdownMenuItem 
                                                className="rounded-lg text-xs font-semibold text-primary text-center justify-center py-2 bg-primary/5 hover:bg-primary/10"
                                                onClick={() => { setCourseFilter('all'); setStatusFilter('all'); }}
                                            >
                                                Réinitialiser les filtres
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-40" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-16 text-destructive space-y-3 px-6">
                            <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20 inline-block">
                                <p className="font-semibold text-sm">Erreur de chargement</p>
                                <p className="text-xs opacity-80 mt-1">{error.message}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/20 hover:bg-muted/20 border-border/40">
                                            <TableHead className="pl-4 w-10">
                                                <Checkbox 
                                                    checked={selectedIds.length === students?.length && students?.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </TableHead>
                                            <TableHead className="h-11 text-[11px] font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('full_name')}>
                                                <div className="flex items-center">Apprenant <SortIcon column="full_name" /></div>
                                            </TableHead>
                                            <TableHead className="h-11 text-[11px] font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('average_progress')}>
                                                <div className="flex items-center">Cursus <SortIcon column="average_progress" /></div>
                                            </TableHead>
                                            <TableHead className="h-11 text-[11px] font-semibold text-muted-foreground">Outils</TableHead>
                                            <TableHead className="h-11 text-[11px] font-semibold text-muted-foreground">Statut</TableHead>
                                            <TableHead className="text-right pr-4 h-11 text-[11px] font-semibold text-muted-foreground">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence mode="popLayout">
                                            {students?.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground text-sm">
                                                        Aucun dossier correspondant.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                students?.map((student, index) => (
                                                    <motion.tr
                                                        key={student.student_id}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        transition={{ delay: index * 0.03 }}
                                                        className={`hover:bg-muted/30 transition-colors border-border/30 group cursor-default ${selectedIds.includes(student.student_id) ? 'bg-primary/5' : ''}`}
                                                    >
                                                        <TableCell className="pl-4 py-3.5">
                                                            <Checkbox 
                                                                checked={selectedIds.includes(student.student_id)}
                                                                onCheckedChange={() => toggleSelectOne(student.student_id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative">
                                                                    <Avatar className="h-9 w-9 border border-border/50">
                                                                        <AvatarImage src={student.avatar_url || ''} />
                                                                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">{student.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                                                    </Avatar>
                                                                    {/* Status dot */}
                                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-background rounded-full ${student.banned_until && new Date(student.banned_until) > new Date() ? 'bg-destructive' : 'bg-emerald-500'}`} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-semibold text-sm text-foreground truncate">{student.full_name}</div>
                                                                    <div className="text-[11px] text-muted-foreground truncate">{student.email}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3.5">
                                                            <div className="flex flex-col gap-1.5 max-w-[200px]">
                                                                <div className="flex items-center justify-between text-[11px]">
                                                                    <span className="text-muted-foreground">
                                                                        {student.enrolled_courses_count || 0} formation{student.enrolled_courses_count !== 1 ? 's' : ''}
                                                                    </span>
                                                                    {(student.average_progress || 0) > 0 && (
                                                                        <span className="font-semibold text-primary">{Math.round(student.average_progress)}%</span>
                                                                    )}
                                                                </div>
                                                                {/* Barre masquée si 0% — du bruit visuel inutile */}
                                                                {(student.average_progress || 0) > 0 && (
                                                                    <Progress value={student.average_progress} className="h-1.5" />
                                                                )}
                                                                {/* Badges cours avec tooltip pour éviter la troncature */}
                                                                <div className="flex flex-wrap gap-1">
                                                                    {student.course_titles?.filter(Boolean).slice(0, 2).map((title, i) => (
                                                                        <Badge
                                                                            key={i}
                                                                            variant="outline"
                                                                            title={title}
                                                                            className="text-[10px] font-medium max-w-[160px] truncate bg-primary/5 border-primary/15 text-primary/80 cursor-default"
                                                                        >
                                                                            {title}
                                                                        </Badge>
                                                                    ))}
                                                                    {(student.course_titles?.filter(Boolean).length || 0) > 2 && (
                                                                        <Badge variant="outline" className="text-[10px] font-medium bg-muted/50 text-muted-foreground border-border/40">
                                                                            +{(student.course_titles?.filter(Boolean).length || 0) - 2}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3.5">
                                                            {/* Outils — masqué si aucun outil acheté */}
                                                            {((Number(student.purchased_strategies_count) || 0) + (Number(student.purchased_indicators_count) || 0)) > 0 ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    {(Number(student.purchased_strategies_count) || 0) > 0 && (
                                                                        <div className="p-1.5 rounded-lg bg-amber-500/5 border border-amber-500/15" title={`${student.purchased_strategies_count} stratégie(s)`}>
                                                                            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                                                                        </div>
                                                                    )}
                                                                    {(Number(student.purchased_indicators_count) || 0) > 0 && (
                                                                        <div className="p-1.5 rounded-lg bg-blue-500/5 border border-blue-500/15" title={`${student.purchased_indicators_count} indicateur(s)`}>
                                                                            <Download className="w-3.5 h-3.5 text-blue-600" />
                                                                        </div>
                                                                    )}
                                                                    <span className="text-[11px] font-medium text-muted-foreground">
                                                                        {(Number(student.purchased_strategies_count) || 0) + (Number(student.purchased_indicators_count) || 0)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[11px] text-muted-foreground/40">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-3.5">
                                                            {getFinancialBadge(student.financial_status, student.enrolled_courses_count)}
                                                        </TableCell>
                                                        <TableCell className="text-right pr-4 py-3.5">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                                                                    onClick={() => {
                                                                        setSelectedStudentId(student.student_id);
                                                                        setIsDetailsOpen(true);
                                                                    }}
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-muted">
                                                                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-lg">
                                                                        <DropdownMenuItem className="rounded-lg text-xs font-medium py-2 cursor-pointer" onClick={() => { setSelectedStudentId(student.student_id); setIsDetailsOpen(true); }}>
                                                                            <Eye className="w-3.5 h-3.5 mr-2 text-primary" /> Dossier complet
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem className="rounded-lg text-xs font-medium py-2 cursor-pointer" onClick={() => navigate('/admin/attendance')}>
                                                                            <Clock className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Émargement / Présence
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem className="rounded-lg text-xs font-medium py-2 cursor-pointer" onClick={() => navigate('/admin/debts')}>
                                                                            <TrendingUp className="w-3.5 h-3.5 mr-2 text-amber-500" /> Dettes & Tranches
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem className="rounded-lg text-xs font-medium py-2 cursor-pointer" onClick={() => window.open(`mailto:${student.email}`)}>
                                                                            <Mail className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Contacter par email
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
                                <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-t border-border/40 bg-muted/20">
                                    <div className="text-[11px] text-muted-foreground">
                                        {students?.length} sur {totalCount} résultats
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                            className="h-8 px-3 rounded-lg text-xs font-medium border-border/60"
                                        >
                                            Précédent
                                        </Button>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background rounded-lg border border-border/60 text-xs font-semibold">
                                            <span className="text-primary">{page}</span>
                                            <span className="text-muted-foreground">/</span>
                                            <span>{totalPages}</span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === totalPages}
                                            onClick={() => setPage(page + 1)}
                                            className="h-8 px-3 rounded-lg text-xs font-medium border-border/60"
                                        >
                                            Suivant
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Mobile Card View */}
                            <div className="grid grid-cols-1 gap-3 md:hidden p-4">
                                {students?.map((student) => (
                                    <motion.div
                                        key={student.student_id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-4 border border-border/50 bg-card rounded-2xl hover:border-primary/30 transition-colors group space-y-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox 
                                                checked={selectedIds.includes(student.student_id)}
                                                onCheckedChange={() => toggleSelectOne(student.student_id)}
                                            />
                                            <Avatar className="h-10 w-10 border border-border/50">
                                                <AvatarImage src={student.avatar_url || ''} />
                                                <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">{student.full_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">{student.full_name}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">{student.email}</p>
                                            </div>
                                            {getFinancialBadge(student.financial_status, student.enrolled_courses_count)}
                                        </div>

                                        {/* Cursus info for mobile */}
                                        <div className="space-y-1.5 pt-1">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-muted-foreground">
                                                    {student.enrolled_courses_count > 0 
                                                        ? `${student.enrolled_courses_count} formation${student.enrolled_courses_count > 1 ? 's' : ''}` 
                                                        : 'Aucune formation active'}
                                                </span>
                                                {(student.average_progress || 0) > 0 && (
                                                    <span className="font-semibold text-primary">{Math.round(student.average_progress)}%</span>
                                                )}
                                            </div>

                                            {(student.average_progress || 0) > 0 && (
                                                <Progress value={student.average_progress} className="h-1.5" />
                                            )}

                                            {student.course_titles?.filter(Boolean).length > 0 && (
                                                <div className="flex flex-wrap gap-1 pt-1">
                                                    {student.course_titles.filter(Boolean).slice(0, 2).map((title, i) => (
                                                        <Badge key={i} variant="outline" className="text-[10px] font-medium bg-primary/5 border-primary/15 text-primary/80">
                                                            {title}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                                            <Button 
                                                variant="secondary" 
                                                size="sm"
                                                className="h-8 rounded-xl text-xs font-semibold gap-1.5"
                                                onClick={() => {
                                                    setSelectedStudentId(student.student_id);
                                                    setIsDetailsOpen(true);
                                                }}
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Dossier
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs font-medium border-border/60" onClick={() => window.open(`mailto:${student.email}`)}>
                                                <Mail className="h-3.5 w-3.5 mr-1.5" />
                                                Email
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
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-4 min-w-[340px]"
                    >
                        <div className="flex items-center gap-2 border-r border-border/40 pr-4">
                            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
                                {selectedIds.length}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">sélectionné{selectedIds.length > 1 ? 's' : ''}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 rounded-lg text-xs font-medium gap-1.5"
                                onClick={onOpenBulkEmail}
                                disabled={bulkEmailMutation.isPending}
                            >
                                {bulkEmailMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                Email
                            </Button>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="h-8 rounded-lg text-xs font-medium gap-1.5"
                                        disabled={bulkStatusUpdateMutation.isPending}
                                    >
                                        {bulkStatusUpdateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                        Statut
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="rounded-xl p-1.5 shadow-lg min-w-[180px]" align="end">
                                    <DropdownMenuItem className="font-medium text-xs py-2 rounded-lg cursor-pointer" onClick={() => bulkStatusUpdateMutation.mutate({ userIds: selectedIds, action: 'RESTORE_USER' }, { onSuccess: () => setSelectedIds([]) })}>
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Activer / Restaurer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="font-medium text-xs py-2 rounded-lg cursor-pointer text-destructive hover:bg-destructive/10" onClick={() => bulkStatusUpdateMutation.mutate({ userIds: selectedIds, action: 'SUSPEND_USER' }, { onSuccess: () => setSelectedIds([]) })}>
                                        <X className="w-3.5 h-3.5 mr-2" /> Suspendre l'accès
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 rounded-lg text-xs font-medium gap-1.5 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                    if (confirm(`Supprimer ces ${selectedIds.length} étudiants ? Action irréversible.`)) {
                                        bulkDeleteMutation.mutate(selectedIds, {
                                            onSuccess: () => setSelectedIds([])
                                        });
                                    }
                                }}
                                disabled={bulkDeleteMutation.isPending}
                            >
                                {bulkDeleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                Supprimer
                            </Button>
                        </div>

                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-muted ml-1"
                            onClick={() => setSelectedIds([])}
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
