-- Migration: Create Course Categories Table
-- Description: Dynamic management of course categories (poles).

-- 1. Create course_categories table
CREATE TABLE IF NOT EXISTS public.course_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.course_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.course_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. Seed initial categories
INSERT INTO public.course_categories (name) VALUES 
  ('Trading & Finance'),
  ('Intelligence Artificielle'),
  ('Développement Web & Mobile'),
  ('Marketing Digital'),
  ('Business & Entrepreneuriat'),
  ('Soft Skills & Leadership')
ON CONFLICT (name) DO NOTHING;
