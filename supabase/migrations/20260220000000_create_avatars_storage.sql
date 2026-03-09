-- Migration: Create avatars storage bucket
-- Date: 2026-02-20

-- 1. Création du bucket 'avatars' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Politiques RLS pour le bucket 'avatars'

-- Autoriser l'accès public en lecture aux avatars
CREATE POLICY "Avatar Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Autoriser les utilisateurs connectés à uploader leur propre avatar
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Autoriser les utilisateurs à mettre à jour leur propre avatar
CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Autoriser les utilisateurs à supprimer leur propre avatar
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
