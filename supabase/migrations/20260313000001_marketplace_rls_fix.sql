-- Migration: Marketplace RLS Fix
-- Date: 2026-03-13
-- Author: Gemini CLI

-- Policies for public access to strategies
CREATE POLICY "Public can view strategies" 
ON public.strategies FOR SELECT 
USING (true);

-- Policies for public access to indicators
CREATE POLICY "Public can view indicators" 
ON public.indicators FOR SELECT 
USING (true);
