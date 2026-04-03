-- Migration: Fix Indicator Purchases and Payment Proofs Schema
-- Description: Adds missing columns for MT5 ID, subscription duration, and file delivery.
-- Also fixes foreign key relationships for better PostgREST join support.

-- 1. Update public.payment_proofs
ALTER TABLE public.payment_proofs 
ADD COLUMN IF NOT EXISTS mt5_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_duration TEXT;

-- 2. Update public.indicator_purchases
ALTER TABLE public.indicator_purchases 
ADD COLUMN IF NOT EXISTS mt5_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_duration TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_file_url TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_id UUID REFERENCES public.payment_proofs(id) ON DELETE SET NULL;

-- 2b. Update public.strategy_purchases
ALTER TABLE public.strategy_purchases
ADD COLUMN IF NOT EXISTS payment_proof_id UUID REFERENCES public.payment_proofs(id) ON DELETE SET NULL;

-- 3. Fix Foreign Keys to reference public.profiles(id) for better PostgREST support
-- indicator_purchases
ALTER TABLE public.indicator_purchases 
DROP CONSTRAINT IF EXISTS indicator_purchases_user_id_fkey;

ALTER TABLE public.indicator_purchases 
ADD CONSTRAINT indicator_purchases_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- strategy_purchases
ALTER TABLE public.strategy_purchases 
DROP CONSTRAINT IF EXISTS strategy_purchases_user_id_fkey;

ALTER TABLE public.strategy_purchases 
ADD CONSTRAINT strategy_purchases_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Update validate_payment function to handle new fields
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

-- 5. Update student_management_view to include indicator and strategy counts
DROP VIEW IF EXISTS public.student_management_view;
CREATE OR REPLACE VIEW public.student_management_view AS 
SELECT 
    p.id AS student_id,
    p.full_name,
    p.avatar_url,
    p.banned_until,
    au.email,
    count(DISTINCT pur.id) AS enrolled_courses_count,
    count(DISTINCT sp.id) AS purchased_strategies_count,
    count(DISTINCT ip.id) AS purchased_indicators_count,
    array_agg(DISTINCT c.title) FILTER (WHERE c.title IS NOT NULL) AS course_titles,
    array_agg(DISTINCT pur.id) FILTER (WHERE pur.id IS NOT NULL) AS course_purchase_ids,
    array_agg(DISTINCT cv.name) FILTER (WHERE cv.name IS NOT NULL) AS vacation_names,
    max(pur.created_at) AS last_enrollment_date,
    COALESCE(sum(DISTINCT pur.amount), 0::numeric) AS total_spent
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
LEFT JOIN public.purchases pur ON p.id = pur.user_id
LEFT JOIN public.courses c ON pur.course_id = c.id
LEFT JOIN public.course_vacations cv ON pur.vacation_id = cv.id
LEFT JOIN public.strategy_purchases sp ON p.id = sp.user_id
LEFT JOIN public.indicator_purchases ip ON p.id = ip.user_id
WHERE ur.role = 'student'::app_role OR ur.role IS NULL
GROUP BY p.id, p.full_name, p.avatar_url, p.banned_until, au.email;

-- 6. Function to notify user when indicator is ready
CREATE OR REPLACE FUNCTION public.notify_indicator_ready()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.delivered_file_url IS NOT NULL AND (OLD.delivered_file_url IS NULL OR OLD.delivered_file_url != NEW.delivered_file_url)) THEN
    -- Create in-app notification
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      'Indicateur prêt !',
      'Votre indicateur est maintenant disponible au téléchargement dans votre profil.',
      'success',
      '/profile'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_indicator_ready ON public.indicator_purchases;
CREATE TRIGGER trigger_indicator_ready
AFTER UPDATE ON public.indicator_purchases
FOR EACH ROW
EXECUTE FUNCTION public.notify_indicator_ready();
