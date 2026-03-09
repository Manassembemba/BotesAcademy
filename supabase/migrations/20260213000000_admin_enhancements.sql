-- Migration pour les fonctionnalités avancées de l'administrateur
-- Date: 2026-02-13

-- 1. Table de configuration globale du site
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertion des paramètres par défaut
INSERT INTO site_settings (key, value, description)
VALUES 
  ('payment_methods', '{"mobile_money": ["+243 000 000 000"], "bank": "Banque X - Compte: 0000-0000"}', 'Coordonnées de paiement affichées aux étudiants'),
  ('academy_info', '{"email": "contact@botesacademy.com", "phone": "+243 999 999 999"}', 'Informations de contact de l''académie'),
  ('categories', '["Finance", "Technologie", "Communication"]', 'Liste des catégories de formations')
ON CONFLICT (key) DO NOTHING;

-- 2. Vue simplifiée pour la gestion des étudiants (Lecture seule pour l'admin)
CREATE OR REPLACE VIEW student_management_view AS
SELECT 
  p.id as student_id,
  p.full_name,
  p.avatar_url,
  au.email,
  COUNT(pur.id) as enrolled_courses_count,
  ARRAY_AGG(c.title) as course_titles,
  MAX(pur.created_at) as last_enrollment_date
FROM profiles p
JOIN auth.users au ON p.id = au.id
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN purchases pur ON p.id = pur.user_id
LEFT JOIN courses c ON pur.course_id = c.id
WHERE ur.role = 'student' OR ur.role IS NULL
GROUP BY p.id, p.full_name, p.avatar_url, au.email;

-- 3. Sécurité RLS pour site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only of settings" 
ON site_settings FOR SELECT 
USING (true);

CREATE POLICY "Allow admin to manage settings" 
ON site_settings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);
