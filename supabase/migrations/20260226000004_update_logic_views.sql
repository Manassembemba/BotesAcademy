-- Migration: Update views and functions for Vacations
-- Description: Ensures the frontend receives vacation data in RPC calls and views.

-- 1. Mise à jour de la fonction de progression pour inclure la vacation
DROP FUNCTION IF EXISTS public.get_enrolled_courses_with_progress();

CREATE OR REPLACE FUNCTION public.get_enrolled_courses_with_progress()
RETURNS TABLE (
  course_id UUID,
  course_title TEXT,
  course_category TEXT,
  estimated_duration TEXT,
  progress FLOAT,
  vacation_name TEXT,
  vacation_time TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as course_id,
    c.title as course_title,
    c.category as course_category,
    c.estimated_duration,
    COALESCE(
      (COUNT(lc.lesson_id)::FLOAT / NULLIF(COUNT(l.id), 0)::FLOAT) * 100, 
      0
    ) as progress,
    cv.name as vacation_name,
    cv.time_range as vacation_time
  FROM purchases p
  JOIN courses c ON p.course_id = c.id
  LEFT JOIN lessons l ON c.id = l.course_id
  LEFT JOIN lesson_completions lc ON l.id = lc.lesson_id AND lc.user_id = auth.uid()
  LEFT JOIN course_vacations cv ON p.vacation_id = cv.id
  WHERE p.user_id = auth.uid()
  GROUP BY c.id, c.title, c.category, c.estimated_duration, cv.name, cv.time_range;
END;
$$;

-- 2. Mise à jour de la vue de gestion des étudiants
DROP VIEW IF EXISTS student_management_view;

CREATE OR REPLACE VIEW student_management_view AS
SELECT 
  p.id as student_id,
  p.full_name,
  p.avatar_url,
  au.email,
  COUNT(pur.id) as enrolled_courses_count,
  ARRAY_AGG(c.title) FILTER (WHERE c.title IS NOT NULL) as course_titles,
  ARRAY_AGG(pur.id) FILTER (WHERE pur.id IS NOT NULL) as course_purchase_ids,
  ARRAY_AGG(cv.name) FILTER (WHERE cv.name IS NOT NULL) as vacation_names,
  MAX(pur.created_at) as last_enrollment_date,
  COALESCE(SUM(pur.amount), 0) as total_spent
FROM profiles p
JOIN auth.users au ON p.id = au.id
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN purchases pur ON p.id = pur.user_id
LEFT JOIN courses c ON pur.course_id = c.id
LEFT JOIN course_vacations cv ON pur.vacation_id = cv.id
WHERE ur.role = 'student' OR ur.role IS NULL
GROUP BY p.id, p.full_name, p.avatar_url, au.email;
