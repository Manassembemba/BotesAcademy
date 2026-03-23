-- Migration: Force create site-assets storage bucket and fix RLS
-- Date: 2026-03-23

-- 1. Création du bucket 'site-assets' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Nettoyage des anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Site Assets Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage site assets" ON storage.objects;
DROP POLICY IF EXISTS "Any authenticated user can upload assets" ON storage.objects;

-- 3. Politique d'accès public en lecture
CREATE POLICY "Site Assets Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'site-assets');

-- 4. Politique d'accès total pour les administrateurs
-- On vérifie le rôle dans la table user_roles
CREATE POLICY "Admins can manage site assets" 
ON storage.objects FOR ALL 
TO authenticated
USING (
  bucket_id = 'site-assets' AND 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'site-assets' AND 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- 5. Politique de secours pour les tests (Optionnelle, à restreindre plus tard)
-- CREATE POLICY "Temp Access" ON storage.objects FOR ALL USING (bucket_id = 'site-assets');
