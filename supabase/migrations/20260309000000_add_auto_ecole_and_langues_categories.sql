-- Migration: Add Auto-École and Langues Categories
-- Description: Adds new categories to the academy.

INSERT INTO public.course_categories (name) VALUES 
  ('Auto-École'),
  ('Langues')
ON CONFLICT (name) DO NOTHING;
