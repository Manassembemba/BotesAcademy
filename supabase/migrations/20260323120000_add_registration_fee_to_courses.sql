-- Migration: Add registration_fee to courses table
-- Date: 2026-03-23

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS registration_fee numeric;
