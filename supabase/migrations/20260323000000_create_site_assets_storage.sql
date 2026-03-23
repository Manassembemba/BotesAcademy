-- Migration: Create site-assets storage bucket
-- Date: 2026-03-23

-- 1. Création du bucket 'site-assets' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Politiques RLS pour le bucket 'site-assets'

-- Autoriser l'accès public en lecture aux ressources du site
CREATE POLICY "Site Assets Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'site-assets');

-- Seul l'admin peut uploader/modifier/supprimer des fichiers dans ce bucket
CREATE POLICY "Admins can manage site assets" ON storage.objects FOR ALL 
USING (
  bucket_id = 'site-assets' AND 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);
