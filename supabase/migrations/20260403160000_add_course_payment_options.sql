-- Migration: Add Course Payment Options
-- Description: Adds payment options to courses to allow full payment or partial payments.

-- 1. Add payment_option column to courses table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS payment_option TEXT DEFAULT 'full_only';

-- Add constraint for valid payment options
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_payment_option_check;
ALTER TABLE public.courses
ADD CONSTRAINT courses_payment_option_check
CHECK (payment_option IN ('full_only', 'partial_allowed'));

-- 2. Add payment_installments_percentage column to courses table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS payment_installments_percentage NUMERIC(5, 2) DEFAULT 0.50; -- Default to 50%

-- Ensure percentage is between 0 and 1 (or 0 and 100 depending on use)
-- For simplicity, assuming it's a decimal like 0.50 for 50%
ALTER TABLE public.courses
ADD CONSTRAINT courses_payment_installments_percentage_check
CHECK (payment_installments_percentage >= 0 AND payment_installments_percentage <= 1);

-- Update existing courses to have default values if they were missing
UPDATE public.courses
SET payment_option = 'full_only'
WHERE payment_option IS NULL;

UPDATE public.courses
SET payment_installments_percentage = 0.50
WHERE payment_installments_percentage IS NULL;

-- Note: The validate_payment function will need to be updated to use payment_option and payment_installments_percentage
-- when calculating the initial due_date and paid_amount for partial payments.
