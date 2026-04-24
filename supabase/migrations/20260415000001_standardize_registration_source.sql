-- Standardisation de la source d'inscription
-- Migration: 20260415000001_standardize_registration_source.sql

-- 1. Mettre à jour la valeur par défaut pour être plus explicite (optionnel, 'self' est déjà là)
ALTER TABLE public.profiles ALTER COLUMN registration_source SET DEFAULT 'self';

-- 2. Mettre à jour les enregistrements existants qui pourraient être NULL
UPDATE public.profiles SET registration_source = 'self' WHERE registration_source IS NULL;

-- 3. Mettre à jour le trigger handle_new_user pour assurer la source 'self'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, registration_source)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student'),
    NEW.raw_user_meta_data->>'avatar_url',
    'self'
  );
  
  -- Assign default student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;
