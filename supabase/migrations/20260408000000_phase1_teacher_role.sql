-- Migration: Phase 1 - Teacher Role Implementation
-- Description: Adds 'teacher' role, creates course_teachers link table, and sets up RLS.

-- 1. Add 'teacher' to app_role enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'teacher') THEN
    ALTER TYPE public.app_role ADD VALUE 'teacher';
  END IF;
END;
$$;

-- 2. Create course_teachers table
CREATE TABLE IF NOT EXISTS public.course_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, teacher_id)
);

-- 3. Enable RLS
ALTER TABLE public.course_teachers ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for course_teachers
CREATE POLICY "Admins can manage course assignments" 
ON public.course_teachers FOR ALL 
USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Teachers can view their own assignments" 
ON public.course_teachers FOR SELECT 
USING (teacher_id = auth.uid());

-- 5. Helper function for Teacher check
CREATE OR REPLACE FUNCTION public.is_teacher(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid
    AND role = 'teacher'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Helper function to check if a teacher is assigned to a course
CREATE OR REPLACE FUNCTION public.is_course_teacher(user_uuid UUID, c_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM course_teachers
    WHERE teacher_id = user_uuid AND course_id = c_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update Attendance Policies to include Teachers for THEIR courses
DROP POLICY IF EXISTS "Staff can manage attendance" ON public.attendance;

CREATE POLICY "Staff can manage attendance" 
ON public.attendance FOR ALL 
USING (
    public.is_staff(auth.uid()) -- Admins and Receptionists
    OR 
    (public.is_teacher(auth.uid()) AND public.is_course_teacher(auth.uid(), course_id)) -- Teachers for their courses
);

-- 8. Update Profiles Access
-- Teachers should be able to see profiles of students enrolled in their courses
DROP POLICY IF EXISTS "Staff can manage profiles" ON public.profiles;

CREATE POLICY "Staff can manage profiles" 
ON public.profiles FOR ALL 
USING (public.is_staff(auth.uid()));

CREATE POLICY "Teachers can view their students' profiles" 
ON public.profiles FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM purchases p
        JOIN course_teachers ct ON p.course_id = ct.course_id
        WHERE p.user_id = public.profiles.id 
        AND ct.teacher_id = auth.uid()
    )
);

-- 9. Ensure Teachers can view courses and lessons
-- (Existing policies might already allow 'authenticated', but let's be sure if we want restricted access)
-- Currently, courses are likely viewable by all students/authenticated users.
