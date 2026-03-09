-- Migration: Add foreign keys to profiles table for payment_proofs
-- Date: 2026-02-13

DO $$ 
BEGIN 
  -- Add user_id FK to profiles if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_proofs_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.payment_proofs
    ADD CONSTRAINT payment_proofs_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id);
  END IF;

  -- Add validated_by FK to profiles if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_proofs_validated_by_profiles_fkey'
  ) THEN
    ALTER TABLE public.payment_proofs
    ADD CONSTRAINT payment_proofs_validated_by_profiles_fkey 
    FOREIGN KEY (validated_by) REFERENCES public.profiles(id);
  END IF;
END $$;
