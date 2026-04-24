-- Migration: Fix Indicator Notifications (Remove secrets schema dependency)
-- Description: Replaces the call to secrets.settings with environment variables or site_settings.
--              In Supabase, we should ideally usevault or environment variables.
--              To fix the error immediately, we use a simpler approach or hardcoded if necessary, 
--              but here we'll assume the URL and Role Key should be stored safely.

-- 1. Create a helper function if needed or modify the existing one
-- Actually, the URL can be retrieved from the request or hardcoded for the project.
-- For now, let's fix the SQL syntax that causes the error.

CREATE OR REPLACE FUNCTION public.notify_indicator_order_received()
RETURNS TRIGGER AS $$
DECLARE
    supabase_url TEXT;
    service_role_key TEXT;
BEGIN
    -- Try to get from site_settings if they exist there, otherwise we might need to set them
    SELECT value INTO supabase_url FROM public.site_settings WHERE key = 'supabase_url';
    SELECT value INTO service_role_key FROM public.site_settings WHERE key = 'supabase_service_role_key';

    -- If not found in site_settings, we fallback to a notice or do nothing to avoid crash
    IF (supabase_url IS NOT NULL AND service_role_key IS NOT NULL AND NEW.indicator_id IS NOT NULL) THEN
        PERFORM net.http_post(
            url := supabase_url || '/functions/v1/indicator-order-received',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || service_role_key
            ),
            body := jsonb_build_object('record', row_to_json(NEW))
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Do the same for the "ready" notification if it exists
CREATE OR REPLACE FUNCTION public.notify_indicator_ready()
RETURNS TRIGGER AS $$
DECLARE
    supabase_url TEXT;
    service_role_key TEXT;
BEGIN
    -- Check if status changed to 'delivered'
    IF (OLD.delivery_status != 'delivered' AND NEW.delivery_status = 'delivered') THEN
        SELECT value INTO supabase_url FROM public.site_settings WHERE key = 'supabase_url';
        SELECT value INTO service_role_key FROM public.site_settings WHERE key = 'supabase_service_role_key';

        IF (supabase_url IS NOT NULL AND service_role_key IS NOT NULL) THEN
            PERFORM net.http_post(
                url := supabase_url || '/functions/v1/indicator-ready-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || service_role_key
                ),
                body := jsonb_build_object('record', row_to_json(NEW))
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
