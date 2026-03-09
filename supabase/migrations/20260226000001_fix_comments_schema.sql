-- Migration: Fix comments table relationships and schema
-- Description: Ensures comments.user_id references public.profiles(id) for easy joining.

-- 1. Drop existing table if necessary or just alter (safer to alter if data exists, but here we ensure clean state)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
        -- Alter the foreign key to point to profiles instead of auth.users
        ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
        ALTER TABLE public.comments ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    ELSE
        -- Create table if it doesn't exist
        CREATE TABLE public.comments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
            course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
            content TEXT NOT NULL,
            rating INT CHECK (rating BETWEEN 1 AND 5),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 2. Ensure RLS is enabled
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 3. Update Policies
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
CREATE POLICY "Authenticated users can insert comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
