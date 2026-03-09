CREATE OR REPLACE FUNCTION public.get_enrolled_courses_with_progress()
RETURNS TABLE (
  -- Explicitly define the columns the function will return
  course_id UUID,
  course_title TEXT,
  course_category TEXT,
  estimated_duration TEXT,
  progress NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  WITH course_lesson_counts AS (
    -- Calculate total lessons for each course
    SELECT
      c.id as course_id,
      count(l.id) as total_lessons
    FROM public.courses c
    LEFT JOIN public.lessons l ON c.id = l.course_id
    GROUP BY c.id
  ),
  user_lesson_completions AS (
    -- Calculate completed lessons for the current user for each course
    SELECT
      l.course_id,
      count(lc.id) as completed_lessons
    FROM public.lesson_completions lc
    JOIN public.lessons l ON lc.lesson_id = l.id
    WHERE lc.user_id = auth.uid()
    GROUP BY l.course_id
  )
  -- Final select joining everything for the logged-in user's purchases
  SELECT
    c.id as course_id,
    c.title as course_title,
    c.category as course_category,
    c.estimated_duration,
    COALESCE(
      -- Calculation with division by zero protection
      (ulc.completed_lessons::decimal / NULLIF(clc.total_lessons, 0)) * 100,
      0
    ) as progress
  FROM public.purchases p
  JOIN public.courses c ON p.course_id = c.id
  LEFT JOIN course_lesson_counts clc ON p.course_id = clc.course_id
  LEFT JOIN user_lesson_completions ulc ON p.course_id = ulc.course_id
  WHERE
    p.user_id = auth.uid() AND p.payment_status = 'completed';
END;
$$ LANGUAGE plpgsql;
