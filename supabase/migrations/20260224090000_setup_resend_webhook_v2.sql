-- 1. Activer l'extension pour les requêtes HTTP (via pg_net)
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Restaurer la structure complète de payment_proofs
-- Nous ajoutons les clés étrangères et les politiques RLS nécessaires pour l'admin
DO $$ 
BEGIN
    -- Si la table existe déjà (version simplifiée), nous ajoutons les contraintes manquantes
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'payment_proofs') THEN
        
        -- Ajout des contraintes de clés étrangères si elles manquent
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_proofs_user_id_fkey') THEN
            ALTER TABLE public.payment_proofs ADD CONSTRAINT payment_proofs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_proofs_course_id_fkey') THEN
            ALTER TABLE public.payment_proofs ADD CONSTRAINT payment_proofs_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_proofs_strategy_id_fkey') THEN
            ALTER TABLE public.payment_proofs ADD CONSTRAINT payment_proofs_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_proofs_indicator_id_fkey') THEN
            ALTER TABLE public.payment_proofs ADD CONSTRAINT payment_proofs_indicator_id_fkey FOREIGN KEY (indicator_id) REFERENCES indicators(id) ON DELETE CASCADE;
        END IF;

        -- Activation de RLS
        ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

        -- Nettoyage des anciennes politiques
        DROP POLICY IF EXISTS "Users can view their own payment proofs" ON payment_proofs;
        DROP POLICY IF EXISTS "Users can create payment proofs" ON payment_proofs;
        DROP POLICY IF EXISTS "Admins can view all payment proofs" ON payment_proofs;
        DROP POLICY IF EXISTS "Admins can update payment proofs" ON payment_proofs;

        -- Création des politiques RLS
        CREATE POLICY "Users can view their own payment proofs" ON payment_proofs FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can create payment proofs" ON payment_proofs FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Admins can view all payment proofs" ON payment_proofs FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
        CREATE POLICY "Admins can update payment proofs" ON payment_proofs FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        -- Index pour la performance
        CREATE INDEX IF NOT EXISTS idx_payment_proofs_user_id ON payment_proofs(user_id);
        CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON payment_proofs(status);
    END IF;
END $$;

-- 3. Fonction trigger pour le webhook (inchangée mais restaurée pour la sécurité)
CREATE OR REPLACE FUNCTION public.handle_payment_proof_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://koeqenilctqgytjludlt.supabase.co/functions/v1/resend-webhook',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlubm9leHN6em9mZHV0ZHVkZWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDY2MDEsImV4cCI6MjA4NTY4MjYwMX0.cQzJzNn1QzY3uHp3rsBGnlZNgUl5pjSZyGwBJXzAgA4"}'::jsonb,
    body := json_build_object(
      'type', TG_OP,
      'record', row_to_json(NEW),
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    )::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attacher le trigger
DROP TRIGGER IF EXISTS on_payment_proof_change ON payment_proofs;
CREATE TRIGGER on_payment_proof_change
AFTER INSERT OR UPDATE ON payment_proofs
FOR EACH ROW
EXECUTE FUNCTION public.handle_payment_proof_notification();

-- Note: La fonction recevra automatiquement le payload contenant record, old_record, type, etc.
