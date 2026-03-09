-- Migration: Unify Foreign Keys for Payment Proofs
-- Description: Removes duplicate constraints between payment_proofs and profiles to fix the "more than one relationship" error.

DO $$ BEGIN
    -- 1. Supprimer toutes les contraintes de clé étrangère potentielles sur user_id
    ALTER TABLE IF EXISTS public.payment_proofs DROP CONSTRAINT IF EXISTS payment_proofs_user_id_fkey;
    ALTER TABLE IF EXISTS public.payment_proofs DROP CONSTRAINT IF EXISTS payment_proofs_user_id_profiles_fkey;
    ALTER TABLE IF EXISTS public.payment_proofs DROP CONSTRAINT IF EXISTS payment_proofs_user_id_auth_fkey;

    -- 2. Recréer une contrainte unique et propre vers public.profiles
    ALTER TABLE public.payment_proofs 
    ADD CONSTRAINT payment_proofs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

END $$;
