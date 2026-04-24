-- Migration: Enhance Indicator Delivery
-- Description: Adds columns for better delivery tracking and security.

-- 1. Update indicator_purchases table
ALTER TABLE public.indicator_purchases 
ADD COLUMN IF NOT EXISTS delivered_file_url TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'processing', 'delivered', 'error')),
ADD COLUMN IF NOT EXISTS mt5_id TEXT;

-- 2. Update RLS policies to allow admins/staff to manage deliveries
DROP POLICY IF EXISTS "Admins can manage all indicator purchases" ON public.indicator_purchases;
CREATE POLICY "Admins can manage all indicator purchases"
  ON public.indicator_purchases FOR ALL
  USING (public.is_staff(auth.uid()));

-- 3. Trigger to automatically set delivered_at when file_url is set
CREATE OR REPLACE FUNCTION public.handle_indicator_delivery_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.delivered_file_url IS NOT NULL AND OLD.delivered_file_url IS NULL) THEN
        NEW.delivered_at = NOW();
        NEW.delivery_status = 'delivered';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_indicator_delivery_timestamp ON public.indicator_purchases;
CREATE TRIGGER trigger_indicator_delivery_timestamp
BEFORE UPDATE ON public.indicator_purchases
FOR EACH ROW
EXECUTE FUNCTION public.handle_indicator_delivery_timestamp();
