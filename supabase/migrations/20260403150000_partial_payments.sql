-- Migration: Partial Payments and Reminders
-- Description: Adds tracking for partial payments, balance, and due dates.

-- 1. Update public.purchases table
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Update existing records to match total_amount with amount (initial migration fix)
-- This ensures that existing purchases have a total_amount set if it's missing
UPDATE public.purchases 
SET total_amount = amount
WHERE total_amount IS NULL;

-- Ensure paid_amount is set for existing purchases if amount is present
UPDATE public.purchases
SET paid_amount = amount
WHERE paid_amount IS NULL AND amount IS NOT NULL;


-- 2. Update payment_status check constraint
ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS purchases_payment_status_check;
ALTER TABLE public.purchases ADD CONSTRAINT purchases_payment_status_check 
CHECK (payment_status IN ('pending', 'partial', 'completed', 'overdue', 'failed'));

-- 3. Update validate_payment function to handle increments and partial payments
CREATE OR REPLACE FUNCTION public.validate_payment(
  proof_id UUID,
  admin_notes_text TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  proof_record RECORD;
  current_purchase RECORD;
  course_details RECORD;
  new_paid_amount NUMERIC;
  new_status TEXT;
  initial_payment_amount NUMERIC;
BEGIN
  -- Check admin or staff rights
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Staff access required';
  END IF;

  -- Get proof
  SELECT * INTO proof_record FROM payment_proofs WHERE id = proof_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment proof not found'; END IF;
  IF proof_record.status != 'pending' THEN RAISE EXCEPTION 'Payment proof already processed'; END IF;

  -- Update proof status first
  UPDATE payment_proofs
  SET status = 'approved', validated_at = NOW(), validated_by = auth.uid(), admin_notes = admin_notes_text
  WHERE id = proof_id;

  -- Case 1: COURSE
  IF proof_record.course_id IS NOT NULL THEN
    SELECT * INTO course_details FROM public.courses WHERE id = proof_record.course_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Course not found for proof ID %', proof_id; END IF;

    -- Find existing purchase or create one
    SELECT * INTO current_purchase FROM purchases 
    WHERE user_id = proof_record.user_id AND course_id = proof_record.course_id;

    initial_payment_amount := proof_record.amount;

    IF FOUND THEN -- Existing purchase, add to paid amount
      new_paid_amount := current_purchase.paid_amount + initial_payment_amount;
      
      IF new_paid_amount >= course_details.price THEN
        new_status := 'completed';
      ELSE
        new_status := 'partial';
      END IF;

      UPDATE purchases 
      SET 
        paid_amount = new_paid_amount,
        payment_status = new_status,
        payment_proof_id = proof_id, -- Keep track of last proof
        validated_at = NOW(),
        validated_by = auth.uid()
      WHERE id = current_purchase.id;
    ELSE -- Initial purchase
      IF course_details.payment_option = 'full_only' THEN
        IF initial_payment_amount < course_details.price THEN
          RAISE EXCEPTION 'Full payment required for this course. Amount paid is less than total price.';
        END IF;
        new_status := 'completed';
        initial_payment_amount := course_details.price; -- Ensure total amount is set correctly
      ELSIF course_details.payment_option = 'partial_allowed' THEN
        IF initial_payment_amount >= course_details.price THEN
          new_status := 'completed';
        ELSE
          new_status := 'partial';
        END IF;
      ELSE -- Default to full payment if option is unknown or invalid
        IF initial_payment_amount < course_details.price THEN
          RAISE EXCEPTION 'Full payment required for this course. Amount paid is less than total price.';
        END IF;
        new_status := 'completed';
        initial_payment_amount := course_details.price;
      END IF;

      INSERT INTO purchases (
        user_id, course_id, amount, total_amount, paid_amount, 
        payment_status, validation_status, validated_at, validated_by, 
        payment_proof_id, session_id, vacation_id, due_date
      )
      VALUES (
        proof_record.user_id, proof_record.course_id, initial_payment_amount, 
        course_details.price, initial_payment_amount, new_status, 'approved', 
        NOW(), auth.uid(), proof_id, proof_record.session_id, 
        proof_record.vacation_id, 
        CASE 
          WHEN new_status = 'partial' AND course_details.payment_option = 'partial_allowed' THEN 
            -- Calculate due date for the remaining balance, e.g., 1 month from NOW()
            NOW() + INTERVAL '1 month' 
          ELSE NULL 
        END
      )
      RETURNING id INTO purchase_id;
    END IF;

    -- Increment session if present
    IF proof_record.session_id IS NOT NULL THEN
      PERFORM increment_session_students(proof_record.session_id);
    END IF;

  -- Case 2: STRATEGY
  ELSIF proof_record.strategy_id IS NOT NULL THEN
    -- Note: Strategy and Indicator purchases currently don't use total_amount/paid_amount/due_date logic.
    -- If needed, these tables should also be updated similarly to purchases.
    INSERT INTO strategy_purchases (user_id, strategy_id, created_at, payment_proof_id)
    VALUES (proof_record.user_id, proof_record.strategy_id, NOW(), proof_id)
    ON CONFLICT (user_id, strategy_id) DO UPDATE
    SET created_at = NOW(), payment_proof_id = proof_id;
    purchase_id := proof_id;

  -- Case 3: INDICATOR
  ELSIF proof_record.indicator_id IS NOT NULL THEN
    -- Note: Indicator purchases also don't use total_amount/paid_amount/due_date logic.
    INSERT INTO indicator_purchases (user_id, indicator_id, created_at, mt5_id, subscription_duration, expires_at, payment_proof_id)
    VALUES (proof_record.user_id, proof_record.indicator_id, NOW(), proof_record.mt5_id, proof_record.subscription_duration,
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

  RETURN json_build_object('success', true, 'message', 'Payment validated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to check for overdue payments and notify
CREATE OR REPLACE FUNCTION public.check_overdue_payments()
RETURNS VOID AS $$
BEGIN
  -- Mark overdue payments
  UPDATE public.purchases
  SET payment_status = 'overdue'
  WHERE payment_status = 'partial' 
    AND due_date < NOW();

  -- Send notifications for overdue (if not already sent recently)
  INSERT INTO public.notifications (user_id, title, message, type, link, created_at)
  SELECT 
    p.user_id,
    'Paiement en retard pour votre formation',
    'Votre paiement pour la formation ' || c.title || ' est maintenant en retard. Merci de régulariser votre situation pour conserver l'accès. Échéance initiale : ' || TO_CHAR(p.due_date, 'DD/MM/YYYY'),
    'warning',
    '/profile', -- Link to user profile or payment section
    NOW()
  FROM public.purchases p
  JOIN public.courses c ON p.course_id = c.id
  WHERE p.payment_status = 'overdue'
    -- Prevent sending multiple overdue notifications rapidly
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.user_id = p.user_id 
        AND n.title = 'Paiement en retard pour votre formation'
        AND n.created_at > NOW() - INTERVAL '7 days' -- Send at most once a week for overdue
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;