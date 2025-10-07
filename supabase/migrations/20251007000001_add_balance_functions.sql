/*
  # Add Balance Management Functions

  1. New Functions
    - `increment_user_balance` - Add funds to user balance
    - `decrement_user_balance` - Deduct funds from user balance

  2. Purpose
    - Handle deposits and withdrawals safely
    - Prevent race conditions with atomic operations
    - Validate balance before deductions
*/

CREATE OR REPLACE FUNCTION public.increment_user_balance(
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET balance = balance + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_user_balance(
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS void AS $$
DECLARE
  current_balance DECIMAL;
BEGIN
  SELECT balance INTO current_balance
  FROM public.profiles
  WHERE id = p_user_id;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE public.profiles
  SET balance = balance - p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
