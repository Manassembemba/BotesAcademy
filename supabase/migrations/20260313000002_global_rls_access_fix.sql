-- Migration: Global RLS Access Fix
-- Date: 2026-03-13
-- Author: Gemini CLI

-- 1. COURSES: Lecture publique pour le catalogue
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view published courses') THEN
        CREATE POLICY "Public can view published courses" ON public.courses FOR SELECT USING (status = 'published');
    END IF;
END $$;

-- 2. LESSONS: Lecture publique pour l'instant (à restreindre plus tard si besoin)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view lessons') THEN
        CREATE POLICY "Public can view lessons" ON public.lessons FOR SELECT USING (true);
    END IF;
END $$;

-- 3. PROFILES: Un utilisateur peut voir son propre profil
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- 4. COMMENTS: Lecture publique
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view comments') THEN
        CREATE POLICY "Public can view comments" ON public.comments FOR SELECT USING (true);
    END IF;
END $$;
