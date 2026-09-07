-- Migration: Fix Teacher Chat and Course Access Permissions
-- Description: Allows teachers to send messages in their course chats and ensures staff have full management access.

-- 1. Course Messages Policies Update
DROP POLICY IF EXISTS "Staff can view all messages" ON public.course_messages;
DROP POLICY IF EXISTS "Teachers can view messages in their courses" ON public.course_messages;
DROP POLICY IF EXISTS "Enrolled students can chat" ON public.course_messages;

-- Staff can do everything on course_messages
CREATE POLICY "Staff can manage all messages" 
ON public.course_messages FOR ALL 
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- Teachers can view and insert messages in courses they teach
CREATE POLICY "Teachers can chat in their courses" 
ON public.course_messages FOR ALL 
USING (
    public.is_teacher(auth.uid()) 
    AND public.is_course_teacher(auth.uid(), course_id)
)
WITH CHECK (
    public.is_teacher(auth.uid()) 
    AND public.is_course_teacher(auth.uid(), course_id)
);

-- Enrolled students can view and send messages in their purchased courses
CREATE POLICY "Enrolled students can chat" 
ON public.course_messages FOR ALL 
USING (
    auth.uid() IN (
        SELECT user_id FROM public.purchases 
        WHERE course_id = public.course_messages.course_id 
        AND validation_status = 'approved'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT user_id FROM public.purchases 
        WHERE course_id = public.course_messages.course_id 
        AND validation_status = 'approved'
    )
);
