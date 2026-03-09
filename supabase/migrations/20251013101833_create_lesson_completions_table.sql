-- Create lesson_completions table
CREATE TABLE public.lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_completions
CREATE POLICY "Users can view their own lesson completions"
  ON public.lesson_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson completions"
  ON public.lesson_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson completions"
  ON public.lesson_completions FOR DELETE
  USING (auth.uid() = user_id);
