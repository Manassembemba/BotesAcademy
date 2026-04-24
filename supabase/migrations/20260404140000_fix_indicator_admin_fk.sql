-- Migration: Fix Admin Relationship for Indicator Delivery
-- Description: Corrects the foreign key for admin_id to point to public.profiles 
--              so PostgREST can resolve the relationship.

-- 1. Drop the old FK if it exists
ALTER TABLE public.indicator_purchases 
DROP CONSTRAINT IF EXISTS indicator_purchases_admin_id_fkey;

-- 2. Re-add the FK pointing to public.profiles
ALTER TABLE public.indicator_purchases
ADD CONSTRAINT indicator_purchases_admin_id_fkey 
FOREIGN KEY (admin_id) REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- 3. Notify PostgREST to reload schema (optional but good practice)
NOTIFY pgrst, 'reload schema';
