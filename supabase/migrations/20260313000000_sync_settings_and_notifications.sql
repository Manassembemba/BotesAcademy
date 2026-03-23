-- 1. Création du type et de la table notifications (si elle n'existe pas déjà)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'course', 'payment', 'comment');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'info',
    link TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS pour notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own notifications') THEN
        CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own notifications') THEN
        CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 2. Initialisation des réglages d'apparence dans site_settings
-- On insère la clé 'appearance' si elle n'existe pas avec des valeurs par défaut
INSERT INTO public.site_settings (key, value)
VALUES (
    'appearance',
    '{
        "hero_image_url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80",
        "hero_title": "L''Excellence dans chaque [Discipline]",
        "hero_description": "Informatique, Business, Langues et Trading. Apprenez avec des experts passionnés et obtenez les compétences concrètes pour réussir votre carrière.",
        "primary_color": "#3b82f6"
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
