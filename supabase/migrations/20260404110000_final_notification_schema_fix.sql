-- Migration: Comprehensive Notification Fix and Secrets Schema Placeholder
-- Description: Re-defines all notification functions to remove secrets.settings dependency 
--              and creates the schema if it's missing to avoid "relation does not exist" crashes.

-- 1. Create a dummy secrets schema and table to prevent crashes
CREATE SCHEMA IF NOT EXISTS secrets;
CREATE TABLE IF NOT EXISTS secrets.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Redefine Order Received Notification
CREATE OR REPLACE FUNCTION public.notify_indicator_order_received()
RETURNS TRIGGER AS $$
DECLARE
    v_supabase_url TEXT;
    v_service_role_key TEXT;
BEGIN
    -- Only act if it's an indicator purchase
    IF (NEW.indicator_id IS NOT NULL) THEN
        -- Safely try to get values from site_settings
        SELECT value INTO v_supabase_url FROM public.site_settings WHERE key = 'supabase_url';
        SELECT value INTO v_service_role_key FROM public.site_settings WHERE key = 'supabase_service_role_key';

        -- If values are missing, log a warning but don't crash
        IF (v_supabase_url IS NULL OR v_service_role_key IS NULL) THEN
            RAISE NOTICE 'Missing supabase_url or supabase_service_role_key in site_settings. Notification skipped.';
            RETURN NEW;
        END IF;

        PERFORM net.http_post(
            url := v_supabase_url || '/functions/v1/indicator-order-received',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_role_key
            ),
            body := jsonb_build_object('record', row_to_json(NEW))
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Redefine Ready for Delivery Notification
CREATE OR REPLACE FUNCTION public.notify_indicator_ready()
RETURNS TRIGGER AS $$
DECLARE
    v_supabase_url TEXT;
    v_service_role_key TEXT;
BEGIN
    -- Check if status changed to 'delivered'
    IF (OLD.delivery_status != 'delivered' AND NEW.delivery_status = 'delivered') THEN
        SELECT value INTO v_supabase_url FROM public.site_settings WHERE key = 'supabase_url';
        SELECT value INTO v_service_role_key FROM public.site_settings WHERE key = 'supabase_service_role_key';

        IF (v_supabase_url IS NOT NULL AND v_service_role_key IS NOT NULL) THEN
            PERFORM net.http_post(
                url := v_supabase_url || '/functions/v1/indicator-ready-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || v_service_role_key
                ),
                body := jsonb_build_object('record', row_to_json(NEW))
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Redefine Course Application Notification (if exists)
CREATE OR REPLACE FUNCTION public.notify_course_application_received()
RETURNS TRIGGER AS $$
DECLARE
    v_supabase_url TEXT;
    v_service_role_key TEXT;
BEGIN
    SELECT value INTO v_supabase_url FROM public.site_settings WHERE key = 'supabase_url';
    SELECT value INTO v_service_role_key FROM public.site_settings WHERE key = 'supabase_service_role_key';

    IF (v_supabase_url IS NOT NULL AND v_service_role_key IS NOT NULL) THEN
        PERFORM net.http_post(
            url := v_supabase_url || '/functions/v1/notification-service',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_role_key
            ),
            body := jsonb_build_object(
                'type', 'COURSE_APPLICATION',
                'record', row_to_json(NEW)
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
