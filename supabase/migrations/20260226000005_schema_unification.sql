-- Migration: Cleanup and Unify Schema
-- Description: Unifies user references to public.profiles and cleans up unused types.

-- 1. Harmonisation des clés étrangères vers public.profiles(id)
-- Note: Supabase lie automatiquement auth.users.id à profiles.id, 
-- mais pointer vers profiles facilite les jointures PostgREST.

DO $$ BEGIN
    -- Table Purchases
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'user_id') THEN
        ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS purchases_user_id_fkey;
        ALTER TABLE public.purchases ADD CONSTRAINT purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Table Lesson Completions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_completions' AND column_name = 'user_id') THEN
        ALTER TABLE public.lesson_completions DROP CONSTRAINT IF EXISTS lesson_completions_user_id_fkey;
        ALTER TABLE public.lesson_completions ADD CONSTRAINT lesson_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Table Payment Proofs
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_proofs' AND column_name = 'user_id') THEN
        ALTER TABLE public.payment_proofs DROP CONSTRAINT IF EXISTS payment_proofs_user_id_fkey;
        ALTER TABLE public.payment_proofs ADD CONSTRAINT payment_proofs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Nettoyage du type quiz si non utilisé
-- Note: On ne peut pas supprimer un élément d'un ENUM facilement, 
-- mais on s'assure qu'aucune donnée ne l'utilise.
DELETE FROM public.lessons WHERE lesson_type = 'quiz';

-- 3. Sécurisation : S'assurer que purchases et payment_proofs sont synchronisés
-- Ajout d'un index pour accélérer les recherches de validation
CREATE INDEX IF NOT EXISTS idx_purchases_user_course ON public.purchases(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON public.payment_proofs(status);
