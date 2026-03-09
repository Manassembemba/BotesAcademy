-- Migration: Create Vacations and Attendance tables
-- Description: Adds support for course schedules and daily pointage.

-- 1. TABLE DES VACATIONS (HORAIRES)
CREATE TABLE IF NOT EXISTS public.course_vacations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  time_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE DES PRÉSENCES (POINTAGE)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  vacation_id UUID REFERENCES public.course_vacations(id) ON DELETE SET NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'late')) DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, date)
);

-- 3. MISE À JOUR DES ACHATS POUR LES VACATIONS
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS vacation_id UUID REFERENCES public.course_vacations(id) ON DELETE SET NULL;
ALTER TABLE public.payment_proofs ADD COLUMN IF NOT EXISTS vacation_id UUID REFERENCES public.course_vacations(id) ON DELETE SET NULL;

-- 4. POLITIQUES DE SÉCURITÉ (RLS)
ALTER TABLE public.course_vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view vacations') THEN
        CREATE POLICY "Anyone can view vacations" ON public.course_vacations FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage vacations') THEN
        CREATE POLICY "Admins can manage vacations" ON public.course_vacations FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage attendance') THEN
        CREATE POLICY "Admins can manage attendance" ON public.attendance FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can view their own attendance') THEN
        CREATE POLICY "Students can view their own attendance" ON public.attendance FOR SELECT USING (auth.uid() = student_id);
    END IF;
END $$;
