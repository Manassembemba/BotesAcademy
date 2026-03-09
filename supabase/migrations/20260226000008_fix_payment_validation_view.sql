-- Migration: Fix Payment Validation Display
-- Description: Ensures relations and RLS policies allow admins to view all payment proofs.

-- 1. Fix relations for explicit joins
DO $$ BEGIN
    -- Ensure user_id points to profiles
    ALTER TABLE public.payment_proofs DROP CONSTRAINT IF EXISTS payment_proofs_user_id_fkey;
    ALTER TABLE public.payment_proofs ADD CONSTRAINT payment_proofs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- Ensure course_id points to courses
    ALTER TABLE public.payment_proofs DROP CONSTRAINT IF EXISTS payment_proofs_course_id_fkey;
    ALTER TABLE public.payment_proofs ADD CONSTRAINT payment_proofs_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

    -- Ensure session_id points to course_sessions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_proofs' AND column_name = 'session_id') THEN
        ALTER TABLE public.payment_proofs DROP CONSTRAINT IF EXISTS payment_proofs_session_id_fkey;
        ALTER TABLE public.payment_proofs ADD CONSTRAINT payment_proofs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.course_sessions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Update RLS Policies
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own proofs" ON public.payment_proofs;
CREATE POLICY "Users can view own proofs" ON public.payment_proofs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all proofs" ON public.payment_proofs;
CREATE POLICY "Admins can view all proofs" ON public.payment_proofs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update proofs" ON public.payment_proofs;
CREATE POLICY "Admins can update proofs" ON public.payment_proofs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
