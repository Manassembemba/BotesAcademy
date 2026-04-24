-- Migration: Manual Payment Recording Function
-- Description: Adds a function to record manual payments for course purchases.

CREATE OR REPLACE FUNCTION public.record_manual_payment(
  p_user_id UUID,
  p_course_id UUID,
  p_amount NUMERIC(10, 2),
  p_payment_method TEXT,
  p_admin_id UUID -- ID of the admin recording the payment
)
RETURNS JSON AS $$
DECLARE
  current_purchase RECORD;
  course_details RECORD;
  new_paid_amount NUMERIC;
  new_status TEXT;
  updated_purchase_id UUID;
BEGIN
  -- Check admin or staff rights
  IF NOT public.is_staff(p_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Staff access required';
  END IF;

  -- Get course details to determine total amount and payment options
  SELECT * INTO course_details FROM public.courses WHERE id = p_course_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Course not found for ID %', p_course_id; END IF;

  -- Find existing purchase for this user and course
  SELECT * INTO current_purchase FROM purchases 
  WHERE user_id = p_user_id AND course_id = p_course_id;

  IF NOT FOUND THEN
    -- If no existing purchase, create a new one based on the first payment
    IF course_details.payment_option = 'full_only' THEN
      IF p_amount < course_details.price THEN
        RAISE EXCEPTION 'Full payment required for this course. Amount paid (%) is less than total price (%).', p_amount, course_details.price;
      END IF;
      new_status := 'completed';
    ELSIF course_details.payment_option = 'partial_allowed' THEN
      IF p_amount >= course_details.price THEN
        new_status := 'completed';
      ELSE
        new_status := 'partial';
      END IF;
    ELSE -- Default to full payment if option is unknown or invalid
      IF p_amount < course_details.price THEN
        RAISE EXCEPTION 'Full payment required for this course. Amount paid (%) is less than total price (%).', p_amount, course_details.price;
      END IF;
      new_status := 'completed';
    END IF;

    INSERT INTO purchases (
      user_id, course_id, amount, total_amount, paid_amount, 
      payment_status, validation_status, validated_at, validated_by, 
      payment_proof_id, -- Manual payment, so no proof_id here directly, but we could log transaction_id if available
      session_id, vacation_id, due_date, payment_method
    )
    VALUES (
      p_user_id, p_course_id, p_amount, 
      course_details.price, p_amount, new_status, 'approved', 
      NOW(), p_admin_id, 
      NULL, -- No proof_id for manual payment recording
      NULL, -- Assuming session/vacation are not set for manual enrollment
      CASE 
        WHEN new_status = 'partial' AND course_details.payment_option = 'partial_allowed' THEN 
          NOW() + INTERVAL '1 month' -- Default due date for remaining balance
        ELSE NULL 
      END,
      p_payment_method
    )
    RETURNING id INTO updated_purchase_id;
    
  ELSE -- Existing purchase, add to paid amount
    new_paid_amount := current_purchase.paid_amount + p_amount;
    
    IF new_paid_amount >= course_details.price THEN
      new_status := 'completed';
    ELSE
      new_status := 'partial';
    END IF;

    UPDATE purchases 
    SET 
      paid_amount = new_paid_amount,
      payment_status = new_status,
      -- Update payment_proof_id if you want to link manual payments too, or use a transaction_id field if added.
      -- For now, let's leave payment_proof_id as is or update if needed.
      -- payment_proof_id = proof_id, -- Not applicable for manual
      validated_at = NOW(),
      validated_by = p_admin_id,
      due_date = CASE 
                   WHEN new_status = 'partial' AND course_details.payment_option = 'partial_allowed' THEN 
                     -- If it was already partial, keep existing due date or recalculate.
                     -- For simplicity, let's assume due_date is set on initial purchase and stays.
                     -- If it's a new partial payment that makes it partial, set it.
                     COALESCE(current_purchase.due_date, NOW() + INTERVAL '1 month') 
                   ELSE NULL -- Clear due date if completed
                 END,
      amount = p_amount, -- Record the latest payment amount
      payment_method = p_payment_method -- Record the method for this manual payment
    WHERE id = current_purchase.id;
    updated_purchase_id := current_purchase.id;
  END IF;

  -- Log this action if audit logging is needed
  -- INSERT INTO admin_audit_logs (action, admin_id, target_id, target_type) VALUES ('RECORD_PAYMENT', p_admin_id, updated_purchase_id, 'purchase');

  RETURN json_build_object('success', true, 'message', 'Paiement manuel enregistré avec succès.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;