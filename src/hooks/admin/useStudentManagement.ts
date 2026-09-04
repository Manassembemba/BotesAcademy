import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface StudentData {
    student_id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    matricule: string | null;
    registration_source: string | null;
    profile_completed: boolean | null;
    banned_until: string | null;
    enrolled_courses_count: number;
    purchased_strategies_count: number;
    purchased_indicators_count: number;
    course_titles: string[];
    course_ids: string[];
    course_purchase_ids: string[];
    strategy_titles: string[];
    strategy_purchase_ids: string[];
    indicator_titles: string[];
    indicator_purchase_ids: string[];
    total_spent: number;
    last_enrollment_date: string | null;
    financial_status: 'completed' | 'partial' | 'overdue' | null;
    average_progress: number;
}

export const useStudentManagement = (
    searchTerm: string = "", 
    page: number = 1, 
    pageSize: number = 20,
    filters: { courseId?: string, status?: string } = {},
    sortConfig: { column: string, ascending: boolean } = { column: 'last_enrollment_date', ascending: false }
) => {
    const { user, role } = useAuth();
    const queryClient = useQueryClient();
    const isTeacher = role === 'teacher';

    // Helper pour récupérer les cours assignés au formateur
    const getTeacherCourseIds = async (): Promise<string[]> => {
        if (!isTeacher || !user?.id) return [];
        const { data: assignments } = await supabase
            .from('course_teachers')
            .select('course_id')
            .eq('teacher_id', user.id);
        return assignments?.map(a => a.course_id) || [];
    };

    // Build a reusable base query builder
    const buildBaseQuery = async (search: string, f: typeof filters) => {
        let query = supabase
            .from('student_management_view' as any)
            .select('*', { count: 'exact' });

        if (isTeacher) {
            const teacherCourseIds = await getTeacherCourseIds();
            if (teacherCourseIds.length === 0) {
                // Aucun cours assigné, filtre impossible
                query = query.in('student_id', ['00000000-0000-0000-0000-000000000000']);
            } else {
                query = query.overlaps('course_ids', teacherCourseIds);
            }
        }

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        if (f.courseId && f.courseId !== 'all') {
            query = query.contains('course_ids', [f.courseId]);
        }

        // Filtre de statut — corrigé pour couvrir tous les cas
        if (f.status && f.status !== 'all') {
            if (f.status === 'banned') {
                query = query.not('banned_until', 'is', null).gt('banned_until', new Date().toISOString());
            } else if (f.status === 'active') {
                query = query.or('banned_until.is.null,banned_until.lte.' + new Date().toISOString());
            } else if (f.status === 'completed') {
                query = (query as any).eq('financial_status', 'completed');
            } else if (f.status === 'partial') {
                query = (query as any).eq('financial_status', 'partial');
            } else if (f.status === 'overdue') {
                query = (query as any).eq('financial_status', 'overdue');
            }
        }

        return query;
    };

    // Fetch students with server-side filtering, sorting and pagination
    const { data: studentsData, isLoading, error } = useQuery({
        queryKey: ['admin-students', searchTerm, page, pageSize, filters, sortConfig, user?.id, role],
        queryFn: async () => {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const baseQuery = await buildBaseQuery(searchTerm, filters);
            const { data, error, count } = await baseQuery
                .range(from, to)
                .order(sortConfig.column, { ascending: sortConfig.ascending });

            if (error) throw error;
            return { students: data as StudentData[], totalCount: count || 0 };
        },
    });

    // Export all — no pagination, returns full dataset as CSV string
    const exportAll = async (): Promise<StudentData[]> => {
        const baseQuery = await buildBaseQuery(searchTerm, filters);
        const { data, error } = await (baseQuery as any)
            .order(sortConfig.column, { ascending: sortConfig.ascending });
        if (error) throw error;
        return (data as StudentData[]) || [];
    };

    const addStudentMutation = useMutation({
        mutationFn: async ({ student, shouldNotify }: { student: any, shouldNotify: boolean }) => {
            const { data: response, error } = await supabase.functions.invoke('admin-register-student', {
                body: {
                    email: student.email,
                    fullName: student.full_name,
                    courseId: student.course_id,
                    sessionId: student.session_id || null,
                    vacationName: student.vacation_name || null,
                    amount: student.amount,
                    paymentMethod: student.payment_method,
                    adminId: user?.id
                }
            });

            if (error || response?.error) throw new Error(error?.message || response?.error);

            if (shouldNotify) {
                const { data: course } = await supabase.from('courses').select('title').eq('id', student.course_id).single();
                
                await supabase.functions.invoke('welcome-email', {
                    body: {
                        fullName: student.full_name,
                        email: student.email,
                        courseTitle: course?.title,
                        resetLink: response?.resetLink
                    }
                });
            }
        },
        onSuccess: () => {
            toast.success("Étudiant inscrit avec succès.");
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
            queryClient.invalidateQueries({ queryKey: ['admin-accounting'] });
        },
        onError: (err: any) => toast.error(err.message)
    });

    const userActionMutation = useMutation({
        mutationFn: async ({ action, targetUserId, data }: { action: string, targetUserId: string, data?: any }) => {
            const { data: response, error } = await supabase.functions.invoke('admin-user-actions', {
                body: { action, targetUserId, data }
            });
            if (error || response?.error) throw new Error(error?.message || response?.error);
            return { action, response };
        },
        onSuccess: ({ action }) => {
            const messages: Record<string, string> = {
                'DELETE_USER': "Utilisateur supprimé définitivement.",
                'SUSPEND_USER': "Accès suspendu.",
                'RESTORE_USER': "Accès restauré.",
                'SEND_RECOVERY': "Email de récupération envoyé.",
                'UPDATE_PROFILE': "Profil mis à jour."
            };
            toast.success(messages[action] || "Opération réussie");
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
        },
        onError: (err: any) => toast.error(`Opération échouée : ${err.message}`)
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (userIds: string[]) => {
            const promises = userIds.map(id => 
                supabase.functions.invoke('admin-user-actions', {
                    body: { action: 'DELETE_USER', targetUserId: id }
                })
            );
            const results = await Promise.all(promises);
            const errors = results.filter(r => r.error);
            if (errors.length > 0) throw new Error(`${errors.length} suppressions ont échoué.`);
            return results;
        },
        onSuccess: () => {
            toast.success("Suppression groupée réussie.");
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
        },
        onError: (err: any) => toast.error(err.message)
    });

    const bulkEmailMutation = useMutation({
        mutationFn: async ({ userIds, subject, message }: { userIds: string[], subject: string, message: string }) => {
            const { data, error } = await supabase.functions.invoke('admin-bulk-email', {
                body: { userIds, subject, message }
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast.success("Emails envoyés avec succès.");
        },
        onError: (err: any) => toast.error(`Échec de l'envoi : ${err.message}`)
    });

    const bulkStatusUpdateMutation = useMutation({
        mutationFn: async ({ userIds, action }: { userIds: string[], action: 'SUSPEND_USER' | 'RESTORE_USER' }) => {
            const promises = userIds.map(id => 
                supabase.functions.invoke('admin-user-actions', {
                    body: { action, targetUserId: id }
                })
            );
            const results = await Promise.all(promises);
            const errors = results.filter(r => r.error);
            if (errors.length > 0) throw new Error(`Certaines mises à jour ont échoué.`);
            return results;
        },
        onSuccess: () => {
            toast.success("Statuts mis à jour.");
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
        },
        onError: (err: any) => toast.error(err.message)
    });

    return {
        students: studentsData?.students || [],
        totalCount: studentsData?.totalCount || 0,
        isLoading,
        error,
        exportAll,
        addStudentMutation,
        userActionMutation,
        bulkDeleteMutation,
        bulkEmailMutation,
        bulkStatusUpdateMutation
    };
};
