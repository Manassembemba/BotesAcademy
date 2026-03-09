-- Migration: Update Attendance Schema
-- Description: Adds session_id for better tracking and updates constraints.

-- 1. Add session_id to attendance
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.course_sessions(id) ON DELETE CASCADE;

-- 2. Update the unique constraint to include session_id
-- We drop the old one and create a more precise one
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_student_id_course_id_date_key;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_unique_daily_record UNIQUE (student_id, course_id, session_id, date);
