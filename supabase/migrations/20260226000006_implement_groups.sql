-- Migration: Implementation of Course Groups (Classes)
-- Description: Groups students by Course + Session + Vacation for better management.

-- 1. Create course_groups table
CREATE TABLE IF NOT EXISTS public.course_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.course_sessions(id) ON DELETE CASCADE NOT NULL,
  vacation_id UUID REFERENCES public.course_vacations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- e.g., "Trading Group A"
  capacity INT DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, vacation_id, name) -- Prevent duplicate group names in the same slot
);

-- 2. Link Purchases to Groups
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.course_groups(id) ON DELETE SET NULL;

-- 3. Update Attendance to be Group-based
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.course_groups(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE public.course_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view groups" ON public.course_groups FOR SELECT USING (true);
CREATE POLICY "Admins can manage groups" ON public.course_groups FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. Automate Group Name Generation (Helper Function)
CREATE OR REPLACE FUNCTION generate_group_name() 
RETURNS TRIGGER AS $$
DECLARE
    course_name TEXT;
    session_name TEXT;
    vacation_name TEXT;
BEGIN
    SELECT title INTO course_name FROM courses WHERE id = NEW.course_id;
    SELECT session_name INTO session_name FROM course_sessions WHERE id = NEW.session_id;
    SELECT name INTO vacation_name FROM course_vacations WHERE id = NEW.vacation_id;
    
    NEW.name := course_name || ' - ' || session_name || ' (' || vacation_name || ')';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_group_name
BEFORE INSERT ON public.course_groups
FOR EACH ROW
EXECUTE FUNCTION generate_group_name();
