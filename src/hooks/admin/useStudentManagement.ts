import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface StudentData {
    student_id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    banned_until: string | null;
    enrolled_courses_count: number;
    purchased_strategies_count: number;
    purchased_indicators_count: number;
    course_titles: string[];
    course_purchase_ids: string[];
    strategy_titles: string[];
    strategy_purchase_ids: string[];
    indicator_titles: string[];
    indicator_purchase_ids: string[];
    total_spent: number;
    last_enrollment_date: string | null;
}

export const useStudentManagement = (
    searchTerm: string = "", 
    page: number = 1, 
    pageSize: number = 20,
    filters: { courseId?: string, status?: string } = {},
    sortConfig: { column: string, ascending: boolean } = { column: 'last_enrollment_date', ascending: false }
) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch students with server-side filtering and pagination
    const { data: studentsData, isLoading, error } = useQuery({
        queryKey: ['admin-students', searchTerm, page, pageSize, filters, sortConfig],
        queryFn: async () => {
            let query = supabase
                .from('student_management_view' as any)
                .select('*', { count: 'exact' });

            if (searchTerm) {
                query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
            }

            if (filters.courseId && filters.courseId !== 'all') {
                // Use the UUID array for filtering
                query = query.contains('course_ids', [filters.courseId]);
            }

            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await query
                .range(from, to)
                .order(sortConfig.column, { ascending: sortConfig.ascending });

            if (error) throw error;
            return { students: data as StudentData[], totalCount: count || 0 };
        },
    });

    const addStudentMutation = useMutation({
        mutationFn: async ({ student, shouldNotify }: { student: any, shouldNotify: boolean }) => {
            const { data: response, error } = await supabase.functions.invoke('admin-register-student', {
                body: {
                    email: student.email,
                    fullName: student.full_name,
                    courseId: student.course_id,
                    sessionId: student.session_id || null,
                    vacationId: student.vacation_id && student.vacation_id !== "none" ? student.vacation_id : null,
                    amount: student.amount,
                    paymentMethod: student.payment_method,
                    adminId: user?.id
                }
            });

            if (error || response?.error) throw new Error(error?.message || response?.error);

            if (shouldNotify) {
                // Fetch course title for email
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
            // Utilise l'Edge Function pour envoyer des emails groupés
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
        addStudentMutation,
        userActionMutation,
        bulkDeleteMutation,
        bulkEmailMutation,
        bulkStatusUpdateMutation
    };
};
