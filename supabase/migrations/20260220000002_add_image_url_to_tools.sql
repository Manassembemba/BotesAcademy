-- Migration: Add image_url to strategies and indicators
-- Date: 2026-02-20

ALTER TABLE strategies ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS image_url TEXT;
