-- Migration: Fix Storage Policies for Receptionist
-- Description: Updates all storage bucket policies to allow receptionist access
--              Uses the is_staff() helper function

-- ========================================
-- 1. PAYMENT-PROOFS - Staff can manage
-- ========================================
DROP POLICY IF EXISTS "Users can upload their own proofs" ON storage.objects;

-- Users can still upload their own proofs
CREATE POLICY "Users can upload their own proofs" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Staff can view and manage all proofs (for validation)
DROP POLICY IF EXISTS "Staff can manage payment proofs" ON storage.objects;
CREATE POLICY "Staff can manage payment proofs" ON storage.objects FOR ALL
  USING (
    bucket_id = 'payment-proofs' 
    AND public.is_staff(auth.uid())
  );

-- ========================================
-- 2. LESSON-FILES - Staff can manage
-- ========================================
DROP POLICY IF EXISTS "Admins can upload lesson files" ON storage.objects;
DROP POLICY IF EXISTS "Staff can manage lesson files" ON storage.objects;

CREATE POLICY "Staff can manage lesson files" ON storage.objects FOR ALL
  USING (
    bucket_id = 'lesson-files'
    AND public.is_staff(auth.uid())
  );

-- ========================================
-- 3. COURSE-THUMBNAILS - Staff can manage
-- ========================================
DROP POLICY IF EXISTS "Admins can manage thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Staff can manage thumbnails" ON storage.objects;

CREATE POLICY "Staff can manage thumbnails" ON storage.objects FOR ALL
  USING (
    bucket_id = 'course-thumbnails'
    AND public.is_staff(auth.uid())
  );

-- ========================================
-- 4. MARKETPLACE BUCKET - Staff can manage
-- ========================================
-- Ensure marketplace bucket exists for indicator/strategy files
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace', 'marketplace', false)
ON CONFLICT (id) DO NOTHING;

-- Public read for marketplace products
DROP POLICY IF EXISTS "Public read marketplace" ON storage.objects;
CREATE POLICY "Public read marketplace" ON storage.objects FOR SELECT
  USING (bucket_id = 'marketplace');

-- Staff can manage marketplace files
DROP POLICY IF EXISTS "Staff can manage marketplace" ON storage.objects;
CREATE POLICY "Staff can manage marketplace" ON storage.objects FOR ALL
  USING (
    bucket_id = 'marketplace'
    AND public.is_staff(auth.uid())
  );

-- ========================================
-- 5. SITE-ASSETS BUCKET - Staff can manage
-- ========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for site assets
DROP POLICY IF EXISTS "Public read site-assets" ON storage.objects;
CREATE POLICY "Public read site-assets" ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

-- Staff can manage site assets
DROP POLICY IF EXISTS "Staff can manage site-assets" ON storage.objects;
CREATE POLICY "Staff can manage site-assets" ON storage.objects FOR ALL
  USING (
    bucket_id = 'site-assets'
    AND public.is_staff(auth.uid())
  );
