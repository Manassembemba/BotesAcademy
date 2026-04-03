-- Migration: Add Receptionist Role
-- Description: Adds 'receptionist' role to app_role enum and updates permissions.

-- 1. Add 'receptionist' to app_role enum
-- Note: PostgreSQL doesn't support ALTER TYPE ... ADD VALUE in a transaction block easily in some versions/environments.
-- We use this check to ensure it's added.
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'receptionist') THEN
    ALTER TYPE public.app_role ADD VALUE 'receptionist';
  END IF;
END $$;

-- 2. Update validate_payment function to allow receptionists
CREATE OR REPLACE FUNCTION public.validate_payment(
  proof_id UUID,
  admin_notes_text TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  proof_record RECORD;
  purchase_id UUID;
BEGIN
  -- Check admin or receptionist rights
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'receptionist')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin or Receptionist access required';
  END IF;

  -- Get proof
  SELECT * INTO proof_record FROM payment_proofs WHERE id = proof_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment proof not found'; END IF;
  IF proof_record.status != 'pending' THEN RAISE EXCEPTION 'Payment proof already processed'; END IF;

  -- Case 1: COURSE
  IF proof_record.course_id IS NOT NULL THEN
    INSERT INTO purchases (user_id, course_id, amount, payment_status, validation_status, validated_at, validated_by, payment_proof_id, session_id, vacation_id)
    VALUES (proof_record.user_id, proof_record.course_id, proof_record.amount, 'completed', 'approved', NOW(), auth.uid(), proof_id, proof_record.session_id, proof_record.vacation_id)
    ON CONFLICT (user_id, course_id) DO UPDATE 
    SET validation_status = 'approved', validated_at = NOW(), validated_by = auth.uid(), payment_proof_id = proof_id
    RETURNING id INTO purchase_id;

    -- Increment session if present
    IF proof_record.session_id IS NOT NULL THEN
      PERFORM increment_session_students(proof_record.session_id);
    END IF;

  -- Case 2: STRATEGY
  ELSIF proof_record.strategy_id IS NOT NULL THEN
    INSERT INTO strategy_purchases (user_id, strategy_id, created_at, payment_proof_id)
    VALUES (proof_record.user_id, proof_record.strategy_id, NOW(), proof_id)
    ON CONFLICT (user_id, strategy_id) DO UPDATE
    SET created_at = NOW(), payment_proof_id = proof_id;
    purchase_id := proof_id;

  -- Case 3: INDICATOR
  ELSIF proof_record.indicator_id IS NOT NULL THEN
    INSERT INTO indicator_purchases (
      user_id, 
      indicator_id, 
      created_at, 
      mt5_id, 
      subscription_duration, 
      expires_at,
      payment_proof_id
    )
    VALUES (
      proof_record.user_id, 
      proof_record.indicator_id, 
      NOW(), 
      proof_record.mt5_id, 
      proof_record.subscription_duration,
      CASE 
        WHEN proof_record.subscription_duration = '1m' THEN NOW() + INTERVAL '1 month'
        WHEN proof_record.subscription_duration = '3m' THEN NOW() + INTERVAL '3 months'
        WHEN proof_record.subscription_duration = 'lifetime' THEN NOW() + INTERVAL '100 years'
        ELSE NULL
      END,
      proof_id
    )
    ON CONFLICT (user_id, indicator_id) DO UPDATE
    SET 
      mt5_id = EXCLUDED.mt5_id,
      subscription_duration = EXCLUDED.subscription_duration,
      expires_at = EXCLUDED.expires_at,
      created_at = NOW(),
      payment_proof_id = proof_id;
    purchase_id := proof_id;
  END IF;

  -- Update proof status
  UPDATE payment_proofs
  SET status = 'approved', validated_at = NOW(), validated_by = auth.uid(), admin_notes = admin_notes_text
  WHERE id = proof_id;

  RETURN json_build_object('success', true, 'message', 'Payment validated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS policies for Receptionist

-- Helper function to check for admin or receptionist
CREATE OR REPLACE FUNCTION public.is_staff(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND role IN ('admin', 'receptionist')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing policies to use is_staff instead of just 'admin'
-- Attendance
DROP POLICY IF EXISTS "Admins can manage attendance" ON public.attendance;
CREATE POLICY "Staff can manage attendance" ON public.attendance FOR ALL USING (public.is_staff(auth.uid()));

-- Payment Proofs
DROP POLICY IF EXISTS "Admins can view all proofs" ON public.payment_proofs;
CREATE POLICY "Staff can view all proofs" ON public.payment_proofs FOR SELECT USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins can update proofs" ON public.payment_proofs;
CREATE POLICY "Staff can update proofs" ON public.payment_proofs FOR UPDATE USING (public.is_staff(auth.uid()));

-- Indicator Purchases
DROP POLICY IF EXISTS "Admins can manage indicator purchases" ON public.indicator_purchases;
CREATE POLICY "Staff can manage indicator purchases" ON public.indicator_purchases FOR ALL USING (public.is_staff(auth.uid()));

-- Profiles (to allow editing student info)
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Staff can manage profiles" ON public.profiles FOR ALL USING (public.is_staff(auth.uid()));

-- Student View
-- The student_management_view doesn't have RLS itself, it depends on underlying tables.

-- Purchases
DROP POLICY IF EXISTS "Admins can manage purchases" ON public.purchases;
CREATE POLICY "Staff can manage purchases" ON public.purchases FOR ALL USING (public.is_staff(auth.uid()));

-- 4. Update Storage Permissions for receptionist
-- This is harder via SQL for Supabase internal storage policies if they were created via Dashboard,
-- but let's try to update the ones we know from migrations.

-- Example for payment-proofs bucket
-- Assuming the policies were named like in migrations or standard names.
-- Since storage policies are in the 'storage' schema, we need to be careful.

DO $$
BEGIN
    -- Update policy for marketplace (delivery of indicators)
    -- We can't easily DROP/CREATE storage policies via standard SQL without knowing their exact names
    -- but usually they use the same 'role' check.
    NULL; -- Placeholder for manual dashboard check if needed
END $$;
