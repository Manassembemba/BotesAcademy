-- Migration: Fix Payment Validation SQL Error
-- Description: Centralizes access unlocking logic in triggers and simplifies the RPC function.

-- 1. Update handle_payment_approval to be more robust for courses
CREATE OR REPLACE FUNCTION public.handle_payment_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only act if status changes to 'approved'
    IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')) THEN
        
        -- 1. Handle Courses (with INSERT if not exists)
        IF NEW.course_id IS NOT NULL THEN
            INSERT INTO public.purchases (
                user_id, 
                course_id, 
                amount, 
                payment_status, 
                validation_status, 
                validated_at, 
                validated_by, 
                payment_proof_id,
                session_id,
                vacation_id
            )
            VALUES (
                NEW.user_id, 
                NEW.course_id, 
                NEW.amount, 
                'completed', 
                'approved', 
                NOW(), 
                NEW.validated_by, -- Use the person who validated the proof
                NEW.id,
                NEW.session_id,
                NEW.vacation_id
            )
            ON CONFLICT (user_id, course_id) DO UPDATE
            SET 
                validation_status = 'approved',
                payment_status = 'completed',
                validated_at = NOW(),
                validated_by = NEW.validated_by,
                payment_proof_id = NEW.id,
                session_id = COALESCE(NEW.session_id, public.purchases.session_id),
                vacation_id = COALESCE(NEW.vacation_id, public.purchases.vacation_id);
            
            -- Incrementation de la capacité si une session est présente
            IF NEW.session_id IS NOT NULL THEN
                PERFORM public.increment_session_students(NEW.session_id);
            END IF;
        END IF;

        -- 2. Handle Strategies
        IF NEW.strategy_id IS NOT NULL THEN
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

-- 2. Simplify validate_payment RPC to avoid constraint errors
CREATE OR REPLACE FUNCTION public.validate_payment(
  proof_id UUID,
  admin_notes_text TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  proof_record RECORD;
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get and check payment proof
  SELECT * INTO proof_record FROM public.payment_proofs WHERE id = proof_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment proof not found'; END IF;
  IF proof_record.status != 'pending' THEN RAISE EXCEPTION 'Payment proof already processed'; END IF;

  -- Simply update the status. The trigger handle_payment_approval will do the rest (UNLOCK ACCESS)
  UPDATE public.payment_proofs
  SET status = 'approved', 
      validated_at = NOW(), 
      validated_by = auth.uid(), 
      admin_notes = admin_notes_text
  WHERE id = proof_id;

  RETURN json_build_object(
    'success', true, 
    'message', 'Payment validated successfully. Access granted via trigger.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
