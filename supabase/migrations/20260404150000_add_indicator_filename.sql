-- Migration: Add Original Filename tracking
-- Description: Stores the original filename to preserve it during download.

ALTER TABLE public.indicator_purchases 
ADD COLUMN IF NOT EXISTS delivered_file_name TEXT;
