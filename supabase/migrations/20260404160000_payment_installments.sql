-- Migration: Payment Installments for Accounting
-- Description: Creates a detailed history table for all payments made towards a course.

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.payment_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL,
    admin_id UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage installments" 
ON public.payment_installments FOR ALL 
USING (public.is_staff(auth.uid()));

CREATE POLICY "Users can view own installments" 
ON public.payment_installments FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.purchases WHERE id = purchase_id));

-- 3. Trigger to auto-update purchases.paid_amount
CREATE OR REPLACE FUNCTION public.update_purchase_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.purchases 
        SET paid_amount = COALESCE(paid_amount, 0) + NEW.amount
        WHERE id = NEW.purchase_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.purchases 
        SET paid_amount = GREATEST(0, COALESCE(paid_amount, 0) - OLD.amount)
        WHERE id = OLD.purchase_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_purchase_total
AFTER INSERT OR DELETE ON public.payment_installments
FOR EACH ROW EXECUTE FUNCTION public.update_purchase_paid_amount();

-- 4. Update the record_manual_payment RPC to use this new table
DROP FUNCTION IF EXISTS public.record_manual_payment(UUID, UUID, NUMERIC, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.record_manual_payment(
  p_user_id UUID,
  p_course_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_admin_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_purchase_id UUID;
BEGIN
  -- 1. Find the purchase
  SELECT id INTO v_purchase_id 
  FROM public.purchases 
  WHERE user_id = p_user_id AND course_id = p_course_id;

  IF v_purchase_id IS NULL THEN
    RAISE EXCEPTION 'Purchase not found for this user and course';
  END IF;

  -- 2. Insert the installment (the trigger will update the purchase table)
  INSERT INTO public.payment_installments (
    purchase_id,
    amount,
    payment_method,
    admin_id
  ) VALUES (
    v_purchase_id,
    p_amount,
    p_payment_method,
    p_admin_id
  );

  -- 3. Also log in payment_proofs for backward compatibility/receipt generation
  INSERT INTO public.payment_proofs (
    user_id,
    course_id,
    amount,
    payment_method,
    status,
    validated_at,
    validator_id,
    transaction_reference
  ) VALUES (
    p_user_id,
    p_course_id,
    p_amount,
    p_payment_method,
    'approved',
    NOW(),
    p_admin_id,
    'MANUAL_PAYMENT_' || to_char(NOW(), 'YYYYMMDDHH24MISS')
  );

  RETURN v_purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
