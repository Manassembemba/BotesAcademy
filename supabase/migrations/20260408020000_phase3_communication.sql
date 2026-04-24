-- Migration: Phase 3 - Communication (Announcements & Chat)
-- Description: Creates tables for targeted announcements and course-specific group chats.

-- 1. Create Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    vacation_id UUID REFERENCES public.course_vacations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage announcements" 
ON public.announcements FOR ALL 
USING (public.is_staff(auth.uid()) OR public.is_teacher(auth.uid()));

CREATE POLICY "Users can view relevant announcements" 
ON public.announcements FOR SELECT 
USING (
    -- Public announcements (global - course_id is null)
    (course_id IS NULL)
    OR 
    -- Course specific (for students enrolled in the course)
    (auth.uid() IN (SELECT user_id FROM public.purchases WHERE course_id = public.announcements.course_id))
    OR
    -- Vacation specific
    (auth.uid() IN (SELECT user_id FROM public.purchases WHERE vacation_id = public.announcements.vacation_id))
);

-- 2. Create Course Chat Messages table
CREATE TABLE IF NOT EXISTS public.course_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for course_messages
ALTER TABLE public.course_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all messages" 
ON public.course_messages FOR SELECT 
USING (public.is_staff(auth.uid()));

CREATE POLICY "Teachers can view messages in their courses" 
ON public.course_messages FOR SELECT 
USING (public.is_course_teacher(auth.uid(), course_id));

CREATE POLICY "Enrolled students can chat" 
ON public.course_messages FOR ALL 
USING (
    auth.uid() IN (SELECT user_id FROM public.purchases WHERE course_id = public.course_messages.course_id)
);

-- 3. Notification system for announcements
-- This function will be called whenever a new announcement is created to notify users.
CREATE OR REPLACE FUNCTION public.on_announcement_created()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Notify students in the target course/vacation
    FOR v_user_id IN 
        SELECT p.user_id FROM public.purchases p
        WHERE (NEW.course_id IS NULL OR p.course_id = NEW.course_id)
        AND (NEW.vacation_id IS NULL OR p.vacation_id = NEW.vacation_id)
    LOOP
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (v_user_id, 'Annonce: ' || NEW.title, left(NEW.message, 100), 'info');
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_announcement_notification
AFTER INSERT ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.on_announcement_created();
