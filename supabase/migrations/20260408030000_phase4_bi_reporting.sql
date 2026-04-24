-- Migration: Phase 4 - BI & Reporting
-- Description: Creates analytics views for tracking KPIs like churn, completion and marketing effectiveness.

-- 1. Student Churn View
-- Students who haven't completed a lesson in 30 days but aren't finished with the course.
CREATE OR REPLACE VIEW public.v_kpi_student_churn AS
WITH last_activity AS (
    SELECT 
        user_id, 
        MAX(created_at) as last_lesson_at
    FROM public.lesson_completions
    GROUP BY 1
),
student_progress AS (
    -- Assuming a view or function exists for progress, but we'll calculate it roughly here
    SELECT 
        p.user_id,
        p.course_id,
        COUNT(lc.lesson_id)::FLOAT / NULLIF(COUNT(l.id), 0) as progress
    FROM public.purchases p
    JOIN public.lessons l ON p.course_id = l.course_id
    LEFT JOIN public.lesson_completions lc ON p.user_id = lc.user_id AND l.id = lc.lesson_id
    GROUP BY 1, 2
)
SELECT 
    sp.user_id,
    pr.full_name,
    c.title as course_title,
    sp.progress,
    la.last_lesson_at,
    CASE 
        WHEN la.last_lesson_at < NOW() - INTERVAL '30 days' AND sp.progress < 1 THEN true
        ELSE false
    END as is_churned
FROM student_progress sp
JOIN public.profiles pr ON sp.user_id = pr.id
JOIN public.courses c ON sp.course_id = c.id
LEFT JOIN last_activity la ON sp.user_id = la.user_id;

-- 2. Completion Time View
-- Average time to complete a course
CREATE OR REPLACE VIEW public.v_kpi_course_completion_time AS
WITH enrollment_dates AS (
    SELECT user_id, course_id, MIN(created_at) as enrolled_at
    FROM public.purchases
    GROUP BY 1, 2
),
completion_dates AS (
    SELECT 
        lc.user_id, 
        l.course_id, 
        MAX(lc.created_at) as completed_at
    FROM public.lesson_completions lc
    JOIN public.lessons l ON lc.lesson_id = l.id
    GROUP BY 1, 2
    HAVING COUNT(lc.lesson_id) = (SELECT COUNT(*) FROM public.lessons WHERE course_id = l.course_id)
)
SELECT 
    c.title as course_title,
    AVG(EXTRACT(DAY FROM (cd.completed_at - ed.enrolled_at))) as avg_days_to_complete,
    COUNT(cd.user_id) as total_graduates
FROM completion_dates cd
JOIN enrollment_dates ed ON cd.user_id = ed.user_id AND cd.course_id = ed.course_id
JOIN public.courses c ON cd.course_id = c.id
GROUP BY 1;

-- 3. Marketing Effectiveness View
-- Sales by registration source
CREATE OR REPLACE VIEW public.v_kpi_marketing_sources AS
SELECT 
    p.registration_source,
    COUNT(p.id) as total_students,
    SUM(pur.amount) as total_revenue
FROM public.profiles p
JOIN public.purchases pur ON p.id = pur.user_id
GROUP BY 1
ORDER BY 3 DESC;
