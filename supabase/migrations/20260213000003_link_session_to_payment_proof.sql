-- Migration: Link session_id to payment_proofs
-- Date: 2026-02-13

-- 1. Add session_id column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'payment_proofs' AND COLUMN_NAME = 'session_id') THEN
    ALTER TABLE payment_proofs ADD COLUMN session_id UUID REFERENCES course_sessions(id);
  END IF;
END $$;

-- 2. Update validate_payment function to copy session_id to purchase
CREATE OR REPLACE FUNCTION validate_payment(
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
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get payment proof
  SELECT * INTO proof_record 
  FROM payment_proofs 
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
  FROM purchases
  WHERE user_id = proof_record.user_id 
    AND course_id = proof_record.course_id;

  IF existing_purchase IS NOT NULL THEN
    -- Update existing purchase
    UPDATE purchases
    SET validation_status = 'approved',
        validated_at = NOW(),
        validated_by = auth.uid(),
        payment_proof_id = proof_id,
        session_id = COALESCE(proof_record.session_id, session_id) -- Keep original if proof has none
    WHERE id = existing_purchase;
    
    purchase_id := existing_purchase;
  ELSE
    -- Create new purchase
    INSERT INTO purchases (
      user_id, 
      course_id, 
      amount, 
      payment_status, 
      validation_status, 
      validated_at, 
      validated_by, 
      payment_proof_id,
      session_id
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
      proof_record.session_id
    )
    RETURNING id INTO purchase_id;
  END IF;

  -- Update payment proof
  UPDATE payment_proofs
  SET status = 'approved', 
      validated_at = NOW(), 
      validated_by = auth.uid(), 
      admin_notes = admin_notes_text
  WHERE id = proof_id;

  -- If session_id is present, increment student count
  IF proof_record.session_id IS NOT NULL THEN
    BEGIN
      PERFORM increment_session_students(proof_record.session_id);
    EXCEPTION WHEN OTHERS THEN
      -- Optional: log error but don't fail validation if increment fails
      -- For now, we prefer to fail if capacity is exceeded as per increment_session_students logic
      RAISE;
    END;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'purchase_id', purchase_id,
    'message', 'Payment validated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
