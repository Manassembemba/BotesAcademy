-- Migration: Automate Access Unlocking
-- Description: Unlocks course access (purchases) automatically when a payment proof is approved.

CREATE OR REPLACE FUNCTION public.handle_payment_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only act if status changes to 'approved'
    IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')) THEN
        
        -- 1. Handle Courses
        IF NEW.course_id IS NOT NULL THEN
            UPDATE public.purchases
            SET 
                validation_status = 'approved',
                payment_status = 'completed',
                validated_at = NOW(),
                payment_proof_id = NEW.id
            WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
        END IF;

        -- 2. Handle Strategies
        IF NEW.strategy_id IS NOT NULL THEN
            -- Check if purchase record exists, otherwise insert (for marketplace tools)
            INSERT INTO public.strategy_purchases (user_id, strategy_id, created_at)
            VALUES (NEW.user_id, NEW.strategy_id, NOW())
            ON CONFLICT (user_id, strategy_id) DO NOTHING;
        END IF;

        -- 3. Handle Indicators
        IF NEW.indicator_id IS NOT NULL THEN
            INSERT INTO public.indicator_purchases (user_id, indicator_id, created_at)
            VALUES (NEW.user_id, NEW.indicator_id, NOW())
            ON CONFLICT (user_id, indicator_id) DO NOTHING;
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_on_payment_approval ON public.payment_proofs;
CREATE TRIGGER trigger_on_payment_approval
AFTER UPDATE ON public.payment_proofs
FOR EACH ROW
EXECUTE FUNCTION public.handle_payment_approval();
