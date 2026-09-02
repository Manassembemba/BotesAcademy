-- Migration: Fix Unified Payment Trigger and Validation
-- Description: Updates handle_payment_approval() and validate_payment() to use the unified public.purchases table.
-- Eliminates all references to the non-existent public.indicator_purchases and public.strategy_purchases tables.
-- Uses explicit IF EXISTS / UPDATE / INSERT logic to avoid any ON CONFLICT constraint mismatch.

-- 1. Create or replace handle_payment_approval() trigger function
CREATE OR REPLACE FUNCTION public.handle_payment_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_existing_id UUID;
BEGIN
    -- Only act when payment proof status transitions to 'approved'
    IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')) THEN
        
        -- Calculate expiration date for indicator subscription if applicable
        IF NEW.subscription_duration = '1m' THEN
            v_expires_at := NOW() + INTERVAL '1 month';
        ELSIF NEW.subscription_duration = '3m' THEN
            v_expires_at := NOW() + INTERVAL '3 months';
        ELSIF NEW.subscription_duration = 'lifetime' THEN
            v_expires_at := NOW() + INTERVAL '100 years';
        ELSE
            v_expires_at := NULL;
        END IF;

        -- =========================================================================
        -- CASE 1: COURSE
        -- =========================================================================
        IF NEW.course_id IS NOT NULL THEN
            SELECT id INTO v_existing_id 
            FROM public.purchases 
            WHERE user_id = NEW.user_id AND course_id = NEW.course_id 
            LIMIT 1;

            IF v_existing_id IS NOT NULL THEN
                UPDATE public.purchases
                SET 
                    validation_status = 'approved',
                    payment_status = 'completed',
                    paid_amount = COALESCE(public.purchases.paid_amount, 0) + COALESCE(NEW.amount, 0),
                    validated_at = NOW(),
                    validated_by = NEW.validated_by,
                    payment_proof_id = NEW.id,
                    session_id = COALESCE(NEW.session_id, public.purchases.session_id),
                    vacation_name = COALESCE(NEW.vacation_name, public.purchases.vacation_name)
                WHERE id = v_existing_id;
            ELSE
                INSERT INTO public.purchases (
                    user_id, 
                    course_id, 
                    product_type,
                    amount, 
                    total_amount,
                    paid_amount,
                    payment_status, 
                    validation_status, 
                    validated_at, 
                    validated_by, 
                    payment_proof_id,
                    session_id,
                    vacation_name
                )
                VALUES (
                    NEW.user_id, 
                    NEW.course_id, 
                    'course',
                    COALESCE(NEW.amount, 0), 
                    COALESCE(NEW.amount, 0),
                    COALESCE(NEW.amount, 0),
                    'completed', 
                    'approved', 
                    NOW(), 
                    NEW.validated_by,
                    NEW.id,
                    NEW.session_id,
                    NEW.vacation_name
                );
            END IF;
            
            -- Increment session student count if applicable
            IF NEW.session_id IS NOT NULL THEN
                PERFORM public.increment_session_students(NEW.session_id);
            END IF;

        -- =========================================================================
        -- CASE 2: STRATEGY
        -- =========================================================================
        ELSIF NEW.strategy_id IS NOT NULL THEN
            SELECT id INTO v_existing_id 
            FROM public.purchases 
            WHERE user_id = NEW.user_id AND strategy_id = NEW.strategy_id 
            LIMIT 1;

            IF v_existing_id IS NOT NULL THEN
                UPDATE public.purchases
                SET
                    validation_status = 'approved',
                    payment_status = 'completed',
                    validated_at = NOW(),
                    validated_by = NEW.validated_by,
                    payment_proof_id = NEW.id
                WHERE id = v_existing_id;
            ELSE
                INSERT INTO public.purchases (
                    user_id,
                    strategy_id,
                    product_type,
                    amount,
                    total_amount,
                    paid_amount,
                    payment_status,
                    validation_status,
                    validated_at,
                    validated_by,
                    payment_proof_id
                )
                VALUES (
                    NEW.user_id,
                    NEW.strategy_id,
                    'strategy',
                    COALESCE(NEW.amount, 0),
                    COALESCE(NEW.amount, 0),
                    COALESCE(NEW.amount, 0),
                    'completed',
                    'approved',
                    NOW(),
                    NEW.validated_by,
                    NEW.id
                );
            END IF;

        -- =========================================================================
        -- CASE 3: INDICATOR
        -- =========================================================================
        ELSIF NEW.indicator_id IS NOT NULL THEN
            SELECT id INTO v_existing_id 
            FROM public.purchases 
            WHERE user_id = NEW.user_id AND indicator_id = NEW.indicator_id 
            LIMIT 1;

            IF v_existing_id IS NOT NULL THEN
                UPDATE public.purchases
                SET
                    validation_status = 'approved',
                    payment_status = 'completed',
                    mt5_id = COALESCE(NEW.mt5_id, public.purchases.mt5_id),
                    subscription_duration = COALESCE(NEW.subscription_duration, public.purchases.subscription_duration),
                    expires_at = COALESCE(v_expires_at, public.purchases.expires_at),
                    validated_at = NOW(),
                    validated_by = NEW.validated_by,
                    payment_proof_id = NEW.id
                WHERE id = v_existing_id;
            ELSE
                INSERT INTO public.purchases (
                    user_id,
                    indicator_id,
                    product_type,
                    amount,
                    total_amount,
                    paid_amount,
                    payment_status,
                    validation_status,
                    delivery_status,
                    mt5_id,
                    subscription_duration,
                    expires_at,
                    validated_at,
                    validated_by,
                    payment_proof_id
                )
                VALUES (
                    NEW.user_id,
                    NEW.indicator_id,
                    'indicator',
                    COALESCE(NEW.amount, 0),
                    COALESCE(NEW.amount, 0),
                    COALESCE(NEW.amount, 0),
                    'completed',
                    'approved',
                    'pending',
                    NEW.mt5_id,
                    NEW.subscription_duration,
                    v_expires_at,
                    NOW(),
                    NEW.validated_by,
                    NEW.id
                );
            END IF;
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update validate_payment RPC function
CREATE OR REPLACE FUNCTION public.validate_payment(
  proof_id UUID,
  admin_notes_text TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  proof_record RECORD;
BEGIN
  -- Check if user is staff or admin
  IF NOT public.is_staff(auth.uid()) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Staff or Admin access required';
  END IF;

  -- Get and check payment proof
  SELECT * INTO proof_record FROM public.payment_proofs WHERE id = proof_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment proof not found'; END IF;
  IF proof_record.status != 'pending' THEN RAISE EXCEPTION 'Payment proof already processed'; END IF;

  -- Update the status on payment_proofs. The handle_payment_approval trigger will populate purchases.
  UPDATE public.payment_proofs
  SET status = 'approved', 
      validated_at = NOW(), 
      validated_by = auth.uid(), 
      admin_notes = admin_notes_text
  WHERE id = proof_id;

  RETURN json_build_object(
    'success', true, 
    'message', 'Payment validated successfully and access granted.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
