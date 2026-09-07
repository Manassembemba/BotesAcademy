-- Migration: Fix attendance unique constraint for flexible daily pointage
-- Fixes error: there is no unique or exclusion constraint matching the ON CONFLICT specification

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_unique_daily_record;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_unique_daily_record UNIQUE (student_id, course_id, date);
