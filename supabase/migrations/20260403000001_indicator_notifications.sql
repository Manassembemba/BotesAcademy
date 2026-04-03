-- Migration: Indicator Order Notifications
-- Description: Sets up automatic email confirmation when a user purchases an indicator.

-- 1. Function to trigger the Order Received email
CREATE OR REPLACE FUNCTION public.notify_indicator_order_received()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.indicator_id IS NOT NULL) THEN
        PERFORM net.http_post(
            url := (SELECT value FROM secrets.settings WHERE name = 'SUPABASE_URL') || '/functions/v1/indicator-order-received',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || (SELECT value FROM secrets.settings WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
            ),
            body := jsonb_build_object('record', row_to_json(NEW))
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on payment_proofs INSERT
DROP TRIGGER IF EXISTS trigger_indicator_order_received ON public.payment_proofs;
CREATE TRIGGER trigger_indicator_order_received
AFTER INSERT ON public.payment_proofs
FOR EACH ROW
EXECUTE FUNCTION public.notify_indicator_order_received();
