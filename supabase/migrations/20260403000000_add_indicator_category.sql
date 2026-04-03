-- Migration: Add category to indicators
-- Description: Adds a technical category field to the indicators table.

ALTER TABLE public.indicators 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Indicateur';

-- Ensure existing rows have a default value
UPDATE public.indicators 
SET category = 'Indicateur' 
WHERE category IS NULL;
