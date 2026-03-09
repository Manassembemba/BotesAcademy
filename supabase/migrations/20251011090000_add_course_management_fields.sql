-- ====================================================
-- ADD FIELDS FOR COURSE MANAGEMENT MODULE
-- ====================================================

-- 1. Create ENUM types for new structured fields
CREATE TYPE public.course_status AS ENUM ('draft', 'published');
CREATE TYPE public.course_level AS ENUM ('beginner', 'intermediate', 'expert');
CREATE TYPE public.lesson_type AS ENUM ('video', 'pdf', 'quiz');

-- 2. Alter the 'courses' table
ALTER TABLE public.courses
ADD COLUMN status public.course_status NOT NULL DEFAULT 'draft',
ADD COLUMN level public.course_level NOT NULL DEFAULT 'beginner',
ADD COLUMN language TEXT,
ADD COLUMN estimated_duration TEXT;

-- 3. Alter the 'lessons' table
ALTER TABLE public.lessons
ADD COLUMN lesson_type public.lesson_type NOT NULL DEFAULT 'video',
ADD COLUMN pdf_url TEXT;

-- 4. Add triggers to auto-update 'updated_at' on new fields change for 'courses'
-- The function handle_updated_at() already exists from the previous migration.
-- We just need to ensure the trigger is present, creating it if it's not.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_courses_updated_at') THEN
    CREATE TRIGGER update_courses_updated_at
      BEFORE UPDATE ON public.courses
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END;
$$;
