-- Migration pour créer les buckets de stockage nécessaires
-- Date: 2026-02-13

-- 1. Création des buckets (S'ils n'existent pas déjà)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('payment-proofs', 'payment-proofs', true),
  ('lesson-files', 'lesson-files', true),
  ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Politiques RLS pour 'payment-proofs'
-- N'importe qui peut voir les preuves (nécessaire pour l'admin et l'affichage de confirmation)
-- Seul l'utilisateur peut uploader ses propres preuves
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');
CREATE POLICY "Users can upload their own proofs" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Politiques RLS pour 'lesson-files' (Documents de cours)
-- Lecture publique (étudiants)
-- Seul l'admin peut uploader/modifier
CREATE POLICY "Public Read Access for lessons" ON storage.objects FOR SELECT USING (bucket_id = 'lesson-files');
CREATE POLICY "Admins can upload lesson files" ON storage.objects FOR ALL 
USING (
  bucket_id = 'lesson-files' AND 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- 4. Politiques RLS pour 'course-thumbnails' (Miniatures)
-- Lecture publique
-- Seul l'admin peut gérer
CREATE POLICY "Public Read Access for thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'course-thumbnails');
CREATE POLICY "Admins can manage thumbnails" ON storage.objects FOR ALL 
USING (
  bucket_id = 'course-thumbnails' AND 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);
