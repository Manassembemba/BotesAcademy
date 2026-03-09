-- Migration: Extend payment_proofs to support Marketplace products
-- Date: 2026-02-20

-- 1. Rendre course_id optionnel dans payment_proofs
ALTER TABLE payment_proofs ALTER COLUMN course_id DROP NOT NULL;

-- 2. Ajouter les colonnes pour les produits du Marketplace
ALTER TABLE payment_proofs ADD COLUMN IF NOT EXISTS strategy_id UUID REFERENCES strategies(id);
ALTER TABLE payment_proofs ADD COLUMN IF NOT EXISTS indicator_id UUID REFERENCES indicators(id);

-- 3. Mettre à jour la fonction validate_payment pour gérer les produits
CREATE OR REPLACE FUNCTION validate_payment(
  proof_id UUID,
  admin_notes_text TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  proof_record RECORD;
  purchase_id UUID;
BEGIN
  -- Check admin rights
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get proof
  SELECT * INTO proof_record FROM payment_proofs WHERE id = proof_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment proof not found'; END IF;
  IF proof_record.status != 'pending' THEN RAISE EXCEPTION 'Payment proof already processed'; END IF;

  -- Case 1: COURSE
  IF proof_record.course_id IS NOT NULL THEN
    INSERT INTO purchases (user_id, course_id, amount, payment_status, validation_status, validated_at, validated_by, payment_proof_id, session_id)
    VALUES (proof_record.user_id, proof_record.course_id, proof_record.amount, 'completed', 'approved', NOW(), auth.uid(), proof_id, proof_record.session_id)
    ON CONFLICT (user_id, course_id) DO UPDATE 
    SET validation_status = 'approved', validated_at = NOW(), validated_by = auth.uid(), payment_proof_id = proof_id
    RETURNING id INTO purchase_id;

    -- Increment session if present
    IF proof_record.session_id IS NOT NULL THEN
      PERFORM increment_session_students(proof_record.session_id);
    END IF;

  -- Case 2: STRATEGY
  ELSIF proof_record.strategy_id IS NOT NULL THEN
    INSERT INTO strategy_purchases (user_id, strategy_id, created_at)
    VALUES (proof_record.user_id, proof_record.strategy_id, NOW())
    ON CONFLICT DO NOTHING;
    purchase_id := proof_id; -- Use proof_id as a reference

  -- Case 3: INDICATOR
  ELSIF proof_record.indicator_id IS NOT NULL THEN
    INSERT INTO indicator_purchases (user_id, indicator_id, created_at)
    VALUES (proof_record.user_id, proof_record.indicator_id, NOW())
    ON CONFLICT DO NOTHING;
    purchase_id := proof_id;
  END IF;

  -- Update proof status
  UPDATE payment_proofs
  SET status = 'approved', validated_at = NOW(), validated_by = auth.uid(), admin_notes = admin_notes_text
  WHERE id = proof_id;

  RETURN json_build_object('success', true, 'message', 'Payment validated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
