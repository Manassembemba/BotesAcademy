-- Create strategy_purchases table
CREATE TABLE public.strategy_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, strategy_id)
);
ALTER TABLE public.strategy_purchases ENABLE ROW LEVEL SECURITY;

-- Create indicator_purchases table
CREATE TABLE public.indicator_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  indicator_id UUID REFERENCES public.indicators(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, indicator_id)
);
ALTER TABLE public.indicator_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for strategy_purchases
CREATE POLICY "Users can view own strategy purchases"
  ON public.strategy_purchases FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own strategy purchases"
  ON public.strategy_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for indicator_purchases
CREATE POLICY "Users can view own indicator purchases"
  ON public.indicator_purchases FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own indicator purchases"
  ON public.indicator_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);
