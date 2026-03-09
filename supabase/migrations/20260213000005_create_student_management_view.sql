-- Migration: Update student_management_view to include Tools (Strategies & Indicators)
-- Date: 2026-02-13

DROP VIEW IF EXISTS public.student_management_view;

CREATE OR REPLACE VIEW public.student_management_view AS
WITH course_stats AS (
    SELECT 
        user_id,
        COUNT(id) as count,
        ARRAY_AGG(c.title) as titles,
        ARRAY_AGG(pur.id) as ids,
        MAX(pur.created_at) as last_date
    FROM public.purchases pur
    JOIN public.courses c ON pur.course_id = c.id
    GROUP BY user_id
),
strategy_stats AS (
    SELECT 
        user_id,
        COUNT(id) as count,
        ARRAY_AGG(s.title) as titles,
        ARRAY_AGG(sp.id) as ids,
        SUM(COALESCE(s.price, 0)) as total_spent
    FROM public.strategy_purchases sp
    JOIN public.strategies s ON sp.strategy_id = s.id
    GROUP BY user_id
),
indicator_stats AS (
    SELECT 
        user_id,
        COUNT(id) as count,
        ARRAY_AGG(i.name) as titles,
        ARRAY_AGG(ip.id) as ids,
        SUM(COALESCE(i.price, 0)) as total_spent
    FROM public.indicator_purchases ip
    JOIN public.indicators i ON ip.indicator_id = i.id
    GROUP BY user_id
)
SELECT 
    p.id as student_id,
    p.full_name,
    p.avatar_url,
    u.email,
    COALESCE(cs.count, 0) as enrolled_courses_count,
    COALESCE(cs.titles, ARRAY[]::text[]) as course_titles,
    COALESCE(cs.ids, ARRAY[]::uuid[]) as course_purchase_ids,
    COALESCE(ss.count, 0) as purchased_strategies_count,
    COALESCE(ss.titles, ARRAY[]::text[]) as strategy_titles,
    COALESCE(ss.ids, ARRAY[]::uuid[]) as strategy_purchase_ids,
    COALESCE(is_s.count, 0) as purchased_indicators_count,
    COALESCE(is_s.titles, ARRAY[]::text[]) as indicator_titles,
    COALESCE(is_s.ids, ARRAY[]::uuid[]) as indicator_purchase_ids,
    COALESCE(cs.total_spent, 0) + COALESCE(ss.total_spent, 0) + COALESCE(is_s.total_spent, 0) as total_spent,
    cs.last_date as last_enrollment_date
FROM 
    public.profiles p
JOIN 
    auth.users u ON p.id = u.id
LEFT JOIN course_stats cs ON p.id = cs.user_id
LEFT JOIN strategy_stats ss ON p.id = ss.user_id
LEFT JOIN indicator_stats is_s ON p.id = is_s.user_id;

GRANT SELECT ON public.student_management_view TO authenticated;
GRANT SELECT ON public.student_management_view TO service_role;
