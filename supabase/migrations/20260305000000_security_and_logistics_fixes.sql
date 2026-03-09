-- Migration: Security and Logistics Fixes
-- Description: Unifies RLS policies and ensures vacation_id is correctly handled.

-- 1. Fix RLS policies on payment_proofs (remove direct subqueries to user_roles)
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON public.payment_proofs;
CREATE POLICY "Admins can view all payment proofs"
  ON public.payment_proofs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update payment proofs" ON public.payment_proofs;
CREATE POLICY "Admins can update payment proofs"
  ON public.payment_proofs FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all proofs" ON public.payment_proofs;
CREATE POLICY "Admins can view all proofs" 
  ON public.payment_proofs FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update proofs" ON public.payment_proofs;
CREATE POLICY "Admins can update proofs" 
  ON public.payment_proofs FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Ensure RLS on course_sessions uses has_role
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.course_sessions;
CREATE POLICY "Admins can manage sessions"
  ON public.course_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Update the validate_payment function to also handle vacation_id
CREATE OR REPLACE FUNCTION public.validate_payment(
  proof_id UUID,
  admin_notes_text TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  proof_record RECORD;
  purchase_id UUID;
  existing_purchase UUID;
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get payment proof
  SELECT * INTO proof_record 
  FROM public.payment_proofs 
  WHERE id = proof_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment proof not found';
  END IF;

  -- Check if payment is already validated
  IF proof_record.status != 'pending' THEN
    RAISE EXCEPTION 'Payment proof already processed';
  END IF;

  -- Check if purchase already exists
  SELECT id INTO existing_purchase
  FROM public.purchases
  WHERE user_id = proof_record.user_id 
    AND course_id = proof_record.course_id;

  IF existing_purchase IS NOT NULL THEN
    -- Update existing purchase
    UPDATE public.purchases
    SET validation_status = 'approved',
        validated_at = NOW(),
        validated_by = auth.uid(),
        payment_proof_id = proof_id,
        session_id = COALESCE(proof_record.session_id, session_id),
        vacation_id = COALESCE(proof_record.vacation_id, vacation_id)
    WHERE id = existing_purchase;
    
    purchase_id := existing_purchase;
  ELSE
    -- Create new purchase
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
      proof_record.user_id, 
      proof_record.course_id, 
      proof_record.amount, 
      'completed', 
      'approved', 
      NOW(), 
      auth.uid(), 
      proof_id,
      proof_record.session_id,
      proof_record.vacation_id
    )
    RETURNING id INTO purchase_id;
  END IF;

  -- Update payment proof
  UPDATE public.payment_proofs
  SET status = 'approved', 
      validated_at = NOW(), 
      validated_by = auth.uid(), 
      admin_notes = admin_notes_text
  WHERE id = proof_id;

  RETURN json_build_object(
    'success', true, 
    'purchase_id', purchase_id,
    'message', 'Payment validated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
