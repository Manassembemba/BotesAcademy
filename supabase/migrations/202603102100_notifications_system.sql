-- Migration: Notifications System
-- Date: 2026-03-10
-- Author: Antigravity

CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'course', 'payment', 'comment');

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

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (read status)"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Gérer l'indexation pour la performance
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id) WHERE read_at IS NULL;

-- Trigger pour notification auto lors de la validation de paiement
CREATE OR REPLACE FUNCTION public.notify_on_payment_valitation()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status = 'pending' AND NEW.status = 'approved') THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.user_id,
            'Paiement Validé !',
            'Votre preuve de paiement a été approuvée. Votre accès est désormais actif.',
            'payment',
            '/formations'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_payment_validation_notify
    AFTER UPDATE ON public.payment_proofs
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_payment_valitation();

-- Fonction pour marquer tout comme lu
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.notifications
    SET read_at = now()
    WHERE user_id = p_user_id AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
