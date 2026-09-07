-- Migration: Fonctions d'administration des utilisateurs et des rôles
-- Date: 2026-04-08

CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
    id uuid,
    full_name text,
    avatar_url text,
    phone text,
    matricule text,
    email text,
    created_at timestamptz,
    last_sign_in_at timestamptz,
    banned_until timestamptz,
    role public.app_role,
    assigned_courses jsonb,
    courses_enrolled_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Accès réservé aux administrateurs.';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.avatar_url,
        p.phone,
        p.matricule,
        au.email::text,
        p.created_at,
        au.last_sign_in_at,
        p.banned_until,
        COALESCE(ur.role, 'student'::app_role) AS role,
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('id', c.id, 'title', c.title))
             FROM course_teachers ct
             JOIN courses c ON ct.course_id = c.id
             WHERE ct.teacher_id = p.id),
            '[]'::jsonb
        ) AS assigned_courses,
        (SELECT count(*) FROM purchases pur WHERE pur.user_id = p.id AND pur.product_type = 'course') AS courses_enrolled_count
    FROM profiles p
    JOIN auth.users au ON p.id = au.id
    LEFT JOIN user_roles ur ON p.id = ur.user_id
    ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;

-- Fonction RPC d'affectation de rôle et de cours pour l'administrateur
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
    p_target_user_id uuid,
    p_role public.app_role,
    p_course_ids uuid[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_caller_id uuid := auth.uid();
BEGIN
    -- 1. Sécurité : Vérifier que l'appelant est bien administrateur
    IF NOT public.has_role(v_caller_id, 'admin'::app_role) THEN
        RAISE EXCEPTION 'Action non autorisée. Seul un administrateur peut modifier les rôles.';
    END IF;

    -- 2. Empêcher l'auto-rétrogradation
    IF p_target_user_id = v_caller_id AND p_role != 'admin'::app_role THEN
        RAISE EXCEPTION 'Vous ne pouvez pas révoquer votre propre statut administrateur.';
    END IF;

    -- 3. Mettre à jour le rôle dans user_roles (Unicité garantie)
    DELETE FROM public.user_roles WHERE user_id = p_target_user_id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_target_user_id, p_role);

    -- 4. Gestion des cours assignés si formateur (teacher)
    DELETE FROM public.course_teachers WHERE teacher_id = p_target_user_id;
    
    IF p_role = 'teacher'::app_role AND p_course_ids IS NOT NULL AND array_length(p_course_ids, 1) > 0 THEN
        INSERT INTO public.course_teachers (teacher_id, course_id)
        SELECT p_target_user_id, unnest(p_course_ids);
    END IF;

    -- 5. Journalisation d'audit
    INSERT INTO public.admin_audit_logs (
        admin_id,
        action,
        target_id,
        target_type,
        details
    ) VALUES (
        v_caller_id,
        'role_and_courses_updated',
        p_target_user_id,
        'user',
        jsonb_build_object(
            'new_role', p_role::text,
            'course_count', COALESCE(array_length(p_course_ids, 1), 0)
        )
    );

    RETURN jsonb_build_object('success', true, 'role', p_role::text);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.app_role, uuid[]) TO authenticated;
