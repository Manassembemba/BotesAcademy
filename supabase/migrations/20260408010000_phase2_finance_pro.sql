-- Migration: Phase 2 - Advanced Finance (Expenses & Installment Plans)
-- Description: Creates expenses table and installment schedules for better financial tracking.

-- 1. Create Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
    category TEXT NOT NULL CHECK (category IN ('loyer', 'salaire', 'electricite', 'marketing', 'materiel', 'autre')),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expenses" 
ON public.expenses FOR ALL 
USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
));

-- 2. Create Installment Schedules table (The "Plan")
CREATE TABLE IF NOT EXISTS public.installment_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for installment_schedules
ALTER TABLE public.installment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage installment schedules" 
ON public.installment_schedules FOR ALL 
USING (public.is_staff(auth.uid()));

CREATE POLICY "Users can view own schedules" 
ON public.installment_schedules FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.purchases WHERE id = purchase_id));

-- 3. Create a Financial Performance View
CREATE OR REPLACE VIEW public.v_financial_summary AS
WITH monthly_income AS (
    SELECT 
        date_trunc('month', created_at)::DATE as month,
        SUM(amount) as income
    FROM public.payment_installments
    GROUP BY 1
),
monthly_expenses AS (
    SELECT 
        date_trunc('month', date)::DATE as month,
        SUM(amount) as total_expenses
    FROM public.expenses
    GROUP BY 1
)
SELECT 
    COALESCE(i.month, e.month) as month,
    COALESCE(i.income, 0) as total_income,
    COALESCE(e.total_expenses, 0) as total_expenses,
    (COALESCE(i.income, 0) - COALESCE(e.total_expenses, 0)) as net_profit
FROM monthly_income i
FULL OUTER JOIN monthly_expenses e ON i.month = e.month
ORDER BY month DESC;

-- 4. Function to mark overdue installments automatically
CREATE OR REPLACE FUNCTION public.check_overdue_installments()
RETURNS VOID AS $$
BEGIN
    UPDATE public.installment_schedules
    SET status = 'overdue'
    WHERE status = 'pending' AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
