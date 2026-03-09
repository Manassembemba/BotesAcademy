-- Migration: Add New Poles (Auto-École and Langues)
-- Description: Adds the driving school and languages categories to the academy.

INSERT INTO public.course_categories (name) VALUES 
  ('Auto-École'),
  ('Langues')
ON CONFLICT (name) DO NOTHING;
