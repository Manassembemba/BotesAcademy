import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { StudentManagementHeader } from "@/components/admin/students/StudentManagementHeader";
import { AddStudentDialog } from "@/components/admin/students/AddStudentDialog";
import { StudentTable } from "@/components/admin/students/StudentTable";
import { InstallmentsHistoryDialog } from "@/components/admin/students/InstallmentsHistoryDialog";
import { StudentDetailsSheet } from "@/components/admin/students/StudentDetailsSheet";
import { UnifiedPaymentDialog } from "@/components/admin/students/UnifiedPaymentDialog";
import { BulkEmailDialog } from "@/components/admin/students/BulkEmailDialog";
import { useStudentManagement } from "@/hooks/admin/useStudentManagement";

const StudentManagement = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    // UI States
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [courseFilter, setCourseFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortConfig, setSortConfig] = useState({ column: 'last_enrollment_date', ascending: false });
    const pageSize = 15;

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);
    
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
    const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    // Manual Payment States
    const [isInstallmentsOpen, setIsInstallmentsOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
    const [manualPaymentAmount, setManualPaymentAmount] = useState<number>(0);

    // Use our new custom hook
    const { 
        students, 
        totalCount, 
        isLoading, 
        error, 
        addStudentMutation, 
        userActionMutation,
        bulkDeleteMutation,
        bulkEmailMutation,
        bulkStatusUpdateMutation
    } = useStudentManagement(
        debouncedSearchTerm, 
        page, 
        pageSize, 
        { courseId: courseFilter, status: statusFilter },
        sortConfig
    );

    const { data: financialStats } = useQuery({
        queryKey: ['admin-financial-dashboard'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_admin_financial_dashboard');
            if (error) throw error;
            return data;
        }
    });

    const { data: installments, isLoading: isLoadingInstallments } = useQuery({
        queryKey: ['purchase-installments', selectedPurchase?.id],
        queryFn: async () => {
            if (!selectedPurchase?.id) return [];
            const { data, error } = await supabase
                .from('payment_installments')
                .select(`
                    *,
                    admin:admin_id (full_name)
                `)
                .eq('purchase_id', selectedPurchase.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: isInstallmentsOpen && !!selectedPurchase?.id
    });

    const { data: allCourses } = useQuery({
        queryKey: ['admin-all-courses'],
        queryFn: async () => {
            const { data } = await supabase.from('courses').select('id, title, price');
            return data || [];
        }
    });

    const { data: allStrategies } = useQuery({
        queryKey: ['admin-all-strategies'],
        queryFn: async () => {
            const { data } = await supabase.from('strategies').select('id, title, price');
            return data || [];
        }
    });

    const { data: allIndicators } = useQuery({
        queryKey: ['admin-all-indicators'],
        queryFn: async () => {
            const { data } = await supabase.from('indicators').select('id, name, price');
            return data || [];
        }
    });

    const { data: courseSessions } = useQuery({
        queryKey: ['admin-course-sessions', selectedStudentId], 
        queryFn: async () => {
            const { data } = await supabase
                .from('course_sessions')
                .select('id, session_name, vacation_name, course_id');
            return data || [];
        }
    });

    const unifiedPaymentMutation = useMutation({
        mutationFn: async (data: any) => {
            if (!selectedStudentId || !user?.id) return;
            
            // 1. Appel RPC pour enregistrer en base
            const { data: purchaseId, error } = await supabase.rpc('process_student_payment', {
                p_user_id: selectedStudentId,
                p_course_id: data.courseId,
                p_amount: data.amount,
                p_payment_method: data.paymentMethod,
                p_admin_id: user.id,
                p_session_id: data.sessionId || null,
                p_vacation_name: data.vacationName || null
            });
            if (error) throw error;

            // 2. Calcul du nouveau solde pour l'email
            const { data: purchase } = await supabase
                .from('purchases')
                .select('total_amount, paid_amount, courses(title)')
                .eq('user_id', selectedStudentId)
                .eq('course_id', data.courseId)
                .single();

            const balance = (purchase?.total_amount || 0) - (purchase?.paid_amount || 0);

            // 3. Déclenchement de l'email de reçu
            await supabase.functions.invoke('payment-receipt-email', {
                body: {
                    userId: selectedStudentId,
                    courseTitle: (purchase?.courses as any)?.title || 'Formation Botes Academy',
                    amount: data.amount,
                    paymentMethod: data.paymentMethod,
                    balance: balance
                }
            });
        },
        onSuccess: () => {
            toast.success("Transaction validée et reçu envoyé par email.");
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
            queryClient.invalidateQueries({ queryKey: ['student-courses', selectedStudentId] });
            queryClient.invalidateQueries({ queryKey: ['admin-accounting'] });
            setIsEnrollDialogOpen(false);
        },
        onError: (err: any) => toast.error(`Échec de l'opération: ${err.message}`)
    });

    const enrollResourcesMutation = useMutation({
        mutationFn: async (data: { type: 'strategy' | 'indicator', itemId: string }) => {
            if (!selectedStudentId || !user?.id) return;

            if (data.type === 'strategy') {
                const { error } = await supabase.from('strategy_purchases').insert({
                    user_id: selectedStudentId,
                    strategy_id: data.itemId
                });
                if (error) throw error;
            } else if (data.type === 'indicator') {
                const { error } = await supabase.from('indicator_purchases').insert({
                    user_id: selectedStudentId,
                    indicator_id: data.itemId
                });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            toast.success("Ressource ajoutée avec succès");
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
            queryClient.invalidateQueries({ queryKey: ['student-strategies', selectedStudentId] });
            queryClient.invalidateQueries({ queryKey: ['student-indicators', selectedStudentId] });
        },
        onError: (err: any) => toast.error(`Échec de l'ajout: ${err.message}`)
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ type, id }: { type: 'course' | 'strategy' | 'indicator', id: string }) => {
            if (type === 'course') {
                const { error } = await supabase.from('purchases').delete().eq('id', id);
                if (error) throw error;
            } else if (type === 'strategy') {
                const { error } = await supabase.from('strategy_purchases').delete().eq('id', id);
                if (error) throw error;
            } else if (type === 'indicator') {
                const { error } = await supabase.from('indicator_purchases').delete().eq('id', id);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            toast.success("Ressource retirée avec succès");
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
            queryClient.invalidateQueries({ queryKey: ['student-courses', selectedStudentId] });
            queryClient.invalidateQueries({ queryKey: ['student-strategies', selectedStudentId] });
            queryClient.invalidateQueries({ queryKey: ['student-indicators', selectedStudentId] });
        },
        onError: (err: any) => toast.error(`Erreur lors de la suppression: ${err.message}`)
    });

    const selectedStudent = students?.find(s => s.student_id === selectedStudentId);

    const { data: studentCoursesDetails, isLoading: isLoadingCourses } = useQuery({
        queryKey: ['student-courses', selectedStudentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('purchases')
                .select(`
                    id, 
                    course_id,
                    created_at, 
                    amount, 
                    total_amount,
                    paid_amount,
                    due_date,
                    payment_status,
                    validation_status,
                    vacation_name,
                    courses (title),
                    course_sessions (session_name)
                `)
                .eq('user_id', selectedStudentId);
            if (error) throw error;
            return data;
        },
        enabled: !!selectedStudentId && isDetailsOpen
    });

    const { data: studentStrategiesDetails, isLoading: isLoadingStrategies } = useQuery({
        queryKey: ['student-strategies', selectedStudentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('strategy_purchases')
                .select(`id, created_at, strategies (title, price)`)
                .eq('user_id', selectedStudentId);
            if (error) throw error;
            return data;
        },
        enabled: !!selectedStudentId && isDetailsOpen
    });

    const { data: studentIndicatorsDetails, isLoading: isLoadingIndicators } = useQuery({
        queryKey: ['student-indicators', selectedStudentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('indicator_purchases')
                .select(`id, created_at, indicators (name, price)`)
                .eq('user_id', selectedStudentId);
            if (error) throw error;
            return data;
        },
        enabled: !!selectedStudentId && isDetailsOpen
    });

    const { data: fullProfile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['admin-student-profile', selectedStudentId],
        queryFn: async () => {
            if (!selectedStudentId) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', selectedStudentId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!selectedStudentId && isDetailsOpen
    });

    const updateProfileFieldsMutation = useMutation({
        mutationFn: async (fields: any) => {
            const { error } = await supabase
                .from('profiles')
                .update(fields)
                .eq('id', selectedStudentId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Informations académiques mises à jour.");
            queryClient.invalidateQueries({ queryKey: ['admin-student-profile', selectedStudentId] });
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
        },
        onError: (err: any) => toast.error(`Erreur: ${err.message}`)
    });

    const [editForm, setEditForm] = useState({ fullName: '', email: '' });
    const [academicForm, setAcademicForm] = useState({
        gender: '',
        birth_date: '',
        address: '',
        phone: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
    });

    useEffect(() => {
        if (selectedStudentId && isDetailsOpen && selectedStudent) {
            setEditForm({ 
                fullName: selectedStudent.full_name || '', 
                email: selectedStudent.email || '' 
            });
        }
    }, [selectedStudentId, isDetailsOpen, selectedStudent]);
    
    useEffect(() => {
        if (fullProfile) {
            setAcademicForm({
                gender: fullProfile.gender || '',
                birth_date: fullProfile.birth_date || '',
                address: fullProfile.address || '',
                phone: fullProfile.phone || '',
                emergency_contact_name: fullProfile.emergency_contact_name || '',
                emergency_contact_phone: fullProfile.emergency_contact_phone || ''
            });
        }
    }, [fullProfile]);

    return (
        <div className="min-h-screen bg-mesh-gradient relative overflow-hidden flex flex-col pb-20">
            <div className="container mx-auto p-4 md:p-8 space-y-12 relative z-10 pt-32">
                <StudentManagementHeader 
                    studentCount={totalCount}
                    financialStats={financialStats}
                    onAddStudent={() => setIsAddStudentOpen(true)}
                />

                <AddStudentDialog 
                    open={isAddStudentOpen}
                    onOpenChange={setIsAddStudentOpen}
                    allCourses={allCourses || []}
                    courseSessions={courseSessions || []}
                    addStudentMutation={addStudentMutation as any}
                />

                <StudentTable 
                    students={students}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    setSelectedStudentId={setSelectedStudentId}
                    setIsDetailsOpen={setIsDetailsOpen}
                    isLoading={isLoading}
                    error={error}
                    page={page}
                    totalCount={totalCount}
                    setPage={setPage}
                    pageSize={pageSize}
                    bulkDeleteMutation={bulkDeleteMutation}
                    bulkEmailMutation={bulkEmailMutation}
                    bulkStatusUpdateMutation={bulkStatusUpdateMutation}
                    courseFilter={courseFilter}
                    setCourseFilter={setCourseFilter}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    allCourses={allCourses || []}
                    sortConfig={sortConfig}
                    setSortConfig={setSortConfig}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onOpenBulkEmail={() => setIsBulkEmailOpen(true)}
                />

                <StudentDetailsSheet
                    open={isDetailsOpen}
                    onOpenChange={setIsDetailsOpen}
                    selectedStudent={selectedStudent}
                    isLoadingProfile={isLoadingProfile}
                    fullProfile={fullProfile}
                    academicForm={academicForm}
                    setAcademicForm={setAcademicForm}
                    updateProfileFieldsMutation={updateProfileFieldsMutation}
                    isLoadingCourses={isLoadingCourses}
                    studentCoursesDetails={studentCoursesDetails}
                    studentStrategiesDetails={studentStrategiesDetails}
                    studentIndicatorsDetails={studentIndicatorsDetails}
                    allStrategies={allStrategies || []}
                    allIndicators={allIndicators || []}
                    enrollMutation={enrollResourcesMutation}
                    deleteMutation={deleteMutation}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    userActionMutation={userActionMutation}
                    selectedStudentId={selectedStudentId}
                    setSelectedPurchase={setSelectedPurchase}
                    setIsInstallmentsOpen={setIsInstallmentsOpen}
                    setManualPaymentAmount={setManualPaymentAmount}
                    setIsManualPaymentOpen={setIsEnrollDialogOpen}
                    setIsEnrollDialogOpen={setIsEnrollDialogOpen}
                />

                <UnifiedPaymentDialog 
                    open={isEnrollDialogOpen}
                    onOpenChange={setIsEnrollDialogOpen}
                    studentId={selectedStudentId}
                    studentName={selectedStudent?.full_name || ""}
                    allCourses={allCourses || []}
                    existingPurchases={studentCoursesDetails || []}
                    onApply={(data) => unifiedPaymentMutation.mutate(data)}
                    isPending={unifiedPaymentMutation.isPending}
                />

                <BulkEmailDialog 
                    open={isBulkEmailOpen}
                    onOpenChange={setIsBulkEmailOpen}
                    selectedCount={selectedIds.length}
                    isPending={bulkEmailMutation.isPending}
                    onSend={(subject, message) => bulkEmailMutation.mutate({ userIds: selectedIds, subject, message }, {
                        onSuccess: () => {
                            setIsBulkEmailOpen(false);
                            setSelectedIds([]);
                        }
                    })}
                />

                <InstallmentsHistoryDialog
                    open={isInstallmentsOpen}
                    onOpenChange={setIsInstallmentsOpen}
                    selectedPurchase={selectedPurchase}
                    installments={installments}
                    isLoadingInstallments={isLoadingInstallments}
                />
            </div>
        </div>
    );
};

export default StudentManagement;
