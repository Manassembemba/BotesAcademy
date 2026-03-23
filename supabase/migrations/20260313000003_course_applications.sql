-- Migration: Course Applications System
-- Date: 2026-03-13
-- Author: Gemini CLI

CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

CREATE TABLE IF NOT EXISTS public.course_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    motivation TEXT,
    status application_status NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, course_id)
);

-- RLS
ALTER TABLE public.course_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications"
    ON public.course_applications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications"
    ON public.course_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_applications_updated_at
    BEFORE UPDATE ON public.course_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
