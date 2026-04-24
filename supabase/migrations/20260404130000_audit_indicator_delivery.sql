-- Migration: Audit Logs for Indicator Delivery
-- Description: Automatically logs indicator deliveries in the admin_audit_logs table.

CREATE OR REPLACE FUNCTION public.log_indicator_delivery_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log when delivered_file_url changes from NULL to something
    IF (NEW.delivered_file_url IS NOT NULL AND OLD.delivered_file_url IS NULL) THEN
        INSERT INTO public.admin_audit_logs (
            action, 
            admin_id, 
            target_id, 
            target_type,
            details
        ) VALUES (
            'DELIVER_INDICATOR', 
            NEW.admin_id, 
            NEW.id, 
            'indicator_purchase',
            jsonb_build_object(
                'student_id', NEW.user_id,
                'indicator_id', NEW.indicator_id,
                'file_url', NEW.delivered_file_url
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_indicator_delivery ON public.indicator_purchases;
CREATE TRIGGER trigger_log_indicator_delivery
AFTER UPDATE ON public.indicator_purchases
FOR EACH ROW
EXECUTE FUNCTION public.log_indicator_delivery_action();
