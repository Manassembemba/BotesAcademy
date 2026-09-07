-- Migration: Allow teachers to view purchases (enrollments) of their assigned courses
-- This enables teachers to see their students in Attendance, Formation Management, and Student Management.

DROP POLICY IF EXISTS "Teachers can view purchases of their assigned courses" ON public.purchases;

CREATE POLICY "Teachers can view purchases of their assigned courses"
ON public.purchases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.course_teachers
    WHERE public.course_teachers.teacher_id = auth.uid()
      AND public.course_teachers.course_id = public.purchases.course_id
  )
);
