-- Migration: Performance Indexes + Admin Audit Logs
-- Date: 2026-03-09
-- Axes 3 & 4 du plan d'amélioration

-- =====================================================
-- AXE 3 : INDEX DE PERFORMANCE
-- Accélère la vue student_management_view qui fait
-- des jointures coûteuses sur ces colonnes.
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_purchases_user_id 
  ON public.purchases(user_id);

CREATE INDEX IF NOT EXISTS idx_strategy_purchases_user_id 
  ON public.strategy_purchases(user_id);

CREATE INDEX IF NOT EXISTS idx_indicator_purchases_user_id 
  ON public.indicator_purchases(user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_completions_user_id 
  ON public.lesson_completions(user_id);

CREATE INDEX IF NOT EXISTS idx_purchases_session_vacation 
  ON public.purchases(session_id, vacation_id);

CREATE INDEX IF NOT EXISTS idx_payment_proofs_status 
  ON public.payment_proofs(status);

-- =====================================================
-- AXE 4 : TABLE D'AUDIT DES ACTIONS ADMIN
-- Trace toutes les actions sensibles effectuées par
-- les administrateurs (validation, inscription, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL, -- ex: 'validate_payment', 'manual_enrollment', 'reject_payment'
  target_type TEXT,          -- ex: 'payment_proof', 'purchase', 'user'
  target_id   UUID,          -- L'ID de la ressource affectée
  details     JSONB,         -- Données contextuelles (montant, email, etc.)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour filtrer rapidement par admin ou par action
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id 
  ON public.admin_audit_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
  ON public.admin_audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
  ON public.admin_audit_logs(created_at DESC);

-- Activer RLS sur la table d'audit
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques si elles existent déjà (idempotence)
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.admin_audit_logs;

-- Seuls les admins peuvent lire les logs
CREATE POLICY "Admins can read audit logs" 
  ON public.admin_audit_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Le service_role (Edge Functions) peut insérer
CREATE POLICY "Service role can insert audit logs" 
  ON public.admin_audit_logs 
  FOR INSERT 
  WITH CHECK (true);

GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT INSERT ON public.admin_audit_logs TO service_role;
