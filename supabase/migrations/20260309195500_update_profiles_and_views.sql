-- Migration pour gérer le statut banni et ajouter ON DELETE CASCADE si manquant

-- 1. Ajouter une colonne banned_until sur profiles (optionnel mais utile pour l'UI, sachant que le vrai statut ban est géré dans auth.users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_until timestamp with time zone;

-- 2. Recréer la vue student_management_view avec le timestamp de bannissement
DROP VIEW IF EXISTS student_management_view;
CREATE OR REPLACE VIEW student_management_view AS 
SELECT 
    p.id AS student_id,
    p.full_name,
    p.avatar_url,
    p.banned_until,
    au.email,
    count(pur.id) AS enrolled_courses_count,
    array_agg(c.title) FILTER (WHERE c.title IS NOT NULL) AS course_titles,
    array_agg(pur.id) FILTER (WHERE pur.id IS NOT NULL) AS course_purchase_ids,
    array_agg(cv.name) FILTER (WHERE cv.name IS NOT NULL) AS vacation_names,
    max(pur.created_at) AS last_enrollment_date,
    COALESCE(sum(pur.amount), 0::numeric) AS total_spent
FROM profiles p
JOIN auth.users au ON p.id = au.id
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN purchases pur ON p.id = pur.user_id
LEFT JOIN courses c ON pur.course_id = c.id
LEFT JOIN course_vacations cv ON pur.vacation_id = cv.id
WHERE ur.role = 'student'::app_role OR ur.role IS NULL
GROUP BY p.id, p.full_name, p.avatar_url, p.banned_until, au.email;

-- 3. Si un ADMIN supprime un Auth User, cela doit se répercuter en BDD via onDelete Cascade
-- (Normalement Supabase gère ceci via le trigger original "on_auth_user_created", mais les DELETE doivent être gérés par FK)
-- Note: les clés étrangères de `profiles` pointant vers `auth.users` dans un projet Supabase typique 
-- sont gérées par : `ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;`
-- Je m'assure qu'elle l'est bien ou tente de l'alter sans bloquer
DO $$ 
BEGIN
    if not exists (select constraint_name 
                   from information_schema.table_constraints 
                   where table_name = 'profiles' and constraint_type = 'FOREIGN KEY' and constraint_name = 'profiles_id_fkey') then
        ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    end if;
END $$;
