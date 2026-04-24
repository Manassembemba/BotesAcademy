-- Migration: Update progress function to include financial data
-- Description: Adds total_amount, paid_amount, payment_status, and due_date to get_enrolled_courses_with_progress

DROP FUNCTION IF EXISTS public.get_enrolled_courses_with_progress();

CREATE OR REPLACE FUNCTION public.get_enrolled_courses_with_progress()
RETURNS TABLE (
  course_id UUID,
  course_title TEXT,
  course_category TEXT,
  estimated_duration TEXT,
  progress FLOAT,
  vacation_name TEXT,
  vacation_time TEXT,
  total_amount NUMERIC(10,2),
  paid_amount NUMERIC(10,2),
  payment_status TEXT,
  due_date TIMESTAMP WITH TIME ZONE
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
      (COUNT(DISTINCT lc.lesson_id)::FLOAT / NULLIF(COUNT(DISTINCT l.id), 0)) * 100,
      0
    ) as progress,
    v.name as vacation_name,
    v.time_range as vacation_time,
    p.total_amount,
    p.paid_amount,
    p.payment_status,
    p.due_date
  FROM public.purchases p
  JOIN public.courses c ON p.course_id = c.id
  LEFT JOIN public.lessons l ON c.id = l.course_id
  LEFT JOIN public.lesson_completions lc ON l.id = lc.lesson_id AND lc.user_id = auth.uid()
  LEFT JOIN public.course_vacations v ON p.vacation_id = v.id
  WHERE p.user_id = auth.uid()
  GROUP BY 
    c.id, c.title, c.category, c.estimated_duration, 
    v.name, v.time_range, p.total_amount, p.paid_amount, 
    p.payment_status, p.due_date;
END;
$$;
