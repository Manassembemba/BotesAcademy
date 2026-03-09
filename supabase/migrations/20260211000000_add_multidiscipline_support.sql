-- Migration: Add multi-discipline support and course modes
-- Created: 2026-02-11

-- 1. Add new columns to courses table for mode and session management
ALTER TABLE courses
ADD COLUMN mode TEXT DEFAULT 'online' CHECK (mode IN ('online', 'presentiel', 'hybrid')),
ADD COLUMN max_students INTEGER,
ADD COLUMN location TEXT,
ADD COLUMN is_special_session BOOLEAN DEFAULT false,
ADD COLUMN session_start_date TIMESTAMPTZ,
ADD COLUMN session_end_date TIMESTAMPTZ;

-- 2. Create payment_proofs table
CREATE TABLE payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  proof_url TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mobile_money', 'bank_transfer', 'cash_deposit', 'other')),
  amount DECIMAL(10,2) NOT NULL,
  transaction_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id)
);

-- Create index for faster queries
CREATE INDEX idx_payment_proofs_user_id ON payment_proofs(user_id);
CREATE INDEX idx_payment_proofs_status ON payment_proofs(status);
CREATE INDEX idx_payment_proofs_course_id ON payment_proofs(course_id);

-- RLS Policies for payment_proofs
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment proofs"
  ON payment_proofs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment proofs"
  ON payment_proofs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment proofs"
  ON payment_proofs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update payment proofs"
  ON payment_proofs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Create course_sessions table
CREATE TABLE course_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  session_name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  max_students INTEGER NOT NULL CHECK (max_students > 0),
  current_students INTEGER DEFAULT 0 CHECK (current_students >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_course_sessions_course_id ON course_sessions(course_id);
CREATE INDEX idx_course_sessions_is_active ON course_sessions(is_active);

-- RLS Policies for course_sessions
ALTER TABLE course_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sessions"
  ON course_sessions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage sessions"
  ON course_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Modify purchases table
ALTER TABLE purchases
ADD COLUMN payment_proof_id UUID REFERENCES payment_proofs(id),
ADD COLUMN session_id UUID REFERENCES course_sessions(id),
ADD COLUMN validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN validated_at TIMESTAMPTZ,
ADD COLUMN validated_by UUID REFERENCES auth.users(id);

-- Create index for validation status
CREATE INDEX idx_purchases_validation_status ON purchases(validation_status);

-- 5. Migrate existing data: mark all existing purchases as approved
UPDATE purchases 
SET validation_status = 'approved', 
    validated_at = created_at 
WHERE validation_status = 'pending';

-- 6. Create function to validate payment and create purchase
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
        payment_proof_id = proof_id
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
      payment_proof_id
    )
    VALUES (
      proof_record.user_id, 
      proof_record.course_id, 
      proof_record.amount, 
      'completed', 
      'approved', 
      NOW(), 
      auth.uid(), 
      proof_id
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

  RETURN json_build_object(
    'success', true, 
    'purchase_id', purchase_id,
    'message', 'Payment validated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to reject payment
CREATE OR REPLACE FUNCTION reject_payment(
  proof_id UUID,
  admin_notes_text TEXT
)
RETURNS JSON AS $$
DECLARE
  proof_record RECORD;
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

  -- Check if payment is already processed
  IF proof_record.status != 'pending' THEN
    RAISE EXCEPTION 'Payment proof already processed';
  END IF;

  -- Update payment proof
  UPDATE payment_proofs
  SET status = 'rejected', 
      validated_at = NOW(), 
      validated_by = auth.uid(), 
      admin_notes = admin_notes_text
  WHERE id = proof_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Payment rejected'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to increment session student count
CREATE OR REPLACE FUNCTION increment_session_students(session_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE course_sessions
  SET current_students = current_students + 1,
      updated_at = NOW()
  WHERE id = session_id
    AND current_students < max_students;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session is full or does not exist';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Add comment for documentation
COMMENT ON TABLE payment_proofs IS 'Stores payment proof uploads from users for manual validation';
COMMENT ON TABLE course_sessions IS 'Manages in-person course sessions with date, location and capacity';
COMMENT ON COLUMN courses.mode IS 'Learning mode: online, presentiel (in-person), or hybrid';
COMMENT ON COLUMN courses.is_special_session IS 'Marks time-limited promotional sessions';
