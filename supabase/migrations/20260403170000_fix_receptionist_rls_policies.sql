-- Migration: Fix Receptionist RLS Policies - Complete
-- Description: Updates all remaining RLS policies to allow receptionist access
--              Uses the is_staff() helper function from previous migration

-- ========================================
-- 1. COURSES - Staff can manage
-- ========================================
DROP POLICY IF EXISTS "Only admins can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Only admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Only admins can delete courses" ON public.courses;

CREATE POLICY "Staff can insert courses" ON public.courses FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update courses" ON public.courses FOR UPDATE
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete courses" ON public.courses FOR DELETE
  USING (public.is_staff(auth.uid()));

-- ========================================
-- 2. LESSONS - Staff can manage
-- ========================================
DROP POLICY IF EXISTS "Only admins can insert lessons" ON public.lessons;
DROP POLICY IF EXISTS "Only admins can update lessons" ON public.lessons;
DROP POLICY IF EXISTS "Only admins can delete lessons" ON public.lessons;

CREATE POLICY "Staff can insert lessons" ON public.lessons FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update lessons" ON public.lessons FOR UPDATE
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete lessons" ON public.lessons FOR DELETE
  USING (public.is_staff(auth.uid()));

-- ========================================
-- 3. STRATEGIES - Staff can manage
-- ========================================
DROP POLICY IF EXISTS "Only admins can insert strategies" ON public.strategies;
DROP POLICY IF EXISTS "Only admins can update strategies" ON public.strategies;
DROP POLICY IF EXISTS "Only admins can delete strategies" ON public.strategies;

CREATE POLICY "Staff can insert strategies" ON public.strategies FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update strategies" ON public.strategies FOR UPDATE
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete strategies" ON public.strategies FOR DELETE
  USING (public.is_staff(auth.uid()));

-- ========================================
-- 4. INDICATORS - Staff can manage
-- ========================================
DROP POLICY IF EXISTS "Only admins can insert indicators" ON public.indicators;
DROP POLICY IF EXISTS "Only admins can update indicators" ON public.indicators;
DROP POLICY IF EXISTS "Only admins can delete indicators" ON public.indicators;

CREATE POLICY "Staff can insert indicators" ON public.indicators FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update indicators" ON public.indicators FOR UPDATE
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete indicators" ON public.indicators FOR DELETE
  USING (public.is_staff(auth.uid()));

-- ========================================
-- 5. SITE_SETTINGS - Staff can manage
-- ========================================
DROP POLICY IF EXISTS "Allow admin to manage settings" ON public.site_settings;

CREATE POLICY "Staff can manage settings" ON public.site_settings FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ========================================
-- 6. COURSE_APPLICATIONS - Staff can manage
-- ========================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own applications" ON public.course_applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.course_applications;
DROP POLICY IF EXISTS "Users can update own applications" ON public.course_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.course_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.course_applications;

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON public.course_applications FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- Users can create their own applications
CREATE POLICY "Users can create applications" ON public.course_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own applications (before admin reviews)
CREATE POLICY "Users can update own applications" ON public.course_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Staff can view and update all applications
CREATE POLICY "Staff can manage applications" ON public.course_applications FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ========================================
-- 7. STRATEGY_PURCHASES - Staff can manage
-- ========================================
DROP POLICY IF EXISTS "Users can view own strategy purchases" ON public.strategy_purchases;
DROP POLICY IF EXISTS "Users can insert own strategy purchases" ON public.strategy_purchases;

CREATE POLICY "Users can view own strategy purchases" ON public.strategy_purchases FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "Users can insert own strategy purchases" ON public.strategy_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can manage strategy purchases" ON public.strategy_purchases FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ========================================
-- 8. INDICATOR_SECRETS - Staff can manage
-- ========================================
DROP POLICY IF EXISTS "Admins can manage indicator secrets" ON public.indicator_secrets;

CREATE POLICY "Staff can manage indicator secrets" ON public.indicator_secrets FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ========================================
-- 9. STRATEGY_SECRETS - Staff can manage
-- ========================================
DROP POLICY IF EXISTS "Admins can manage strategy secrets" ON public.strategy_secrets;

CREATE POLICY "Staff can manage strategy secrets" ON public.strategy_secrets FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ========================================
-- 10. COURSE_SESSIONS - Staff can manage
-- ========================================
DROP POLICY IF EXISTS "Anyone can view active sessions" ON public.course_sessions;
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.course_sessions;

CREATE POLICY "Anyone can view active sessions" ON public.course_sessions FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage sessions" ON public.course_sessions FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ========================================
-- 11. COURSE_VACATIONS - Staff can manage
-- ========================================
DROP POLICY IF EXISTS "Anyone can view vacations" ON public.course_vacations;
DROP POLICY IF EXISTS "Admins can manage vacations" ON public.course_vacations;

CREATE POLICY "Anyone can view vacations" ON public.course_vacations FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage vacations" ON public.course_vacations FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ========================================
-- 12. PAYMENT_METHODS - Staff can manage (if table exists)
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
    DROP POLICY IF EXISTS "Anyone can view payment methods" ON public.payment_methods;
    DROP POLICY IF EXISTS "Admins can manage payment methods" ON public.payment_methods;

    CREATE POLICY "Anyone can view payment methods" ON public.payment_methods FOR SELECT
      USING (true);

    CREATE POLICY "Staff can manage payment methods" ON public.payment_methods FOR ALL
      USING (public.is_staff(auth.uid()))
      WITH CHECK (public.is_staff(auth.uid()));
  END IF;
END $$;

-- ========================================
-- 13. COMMENTS - Staff can delete
-- ========================================
-- Users can already delete their own comments, add staff delete permission
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

CREATE POLICY "Users and staff can delete comments" ON public.comments FOR DELETE
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- ========================================
-- 14. LESSON_COMPLETIONS - Staff can view all
-- ========================================
DROP POLICY IF EXISTS "Users can view their own lesson completions" ON public.lesson_completions;

CREATE POLICY "Users can view own, staff can view all lesson completions" ON public.lesson_completions FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- ========================================
-- 15. ATTENDANCE - Staff can view all (already done, but ensure consistency)
-- ========================================
-- Already handled in previous migration, but let's ensure SELECT works for staff
DROP POLICY IF EXISTS "Staff can view attendance" ON public.attendance;

CREATE POLICY "Staff can view attendance" ON public.attendance FOR SELECT
  USING (public.is_staff(auth.uid()));

-- ========================================
-- 16. NOTIFICATIONS - Staff can manage
-- ========================================
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;

CREATE POLICY "Users can view own, staff can view all notifications" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage notifications" ON public.notifications FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
