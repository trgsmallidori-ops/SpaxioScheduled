-- Migration: Add subscription tracking for $20/year annual subscription
-- Run in Supabase Dashboard → SQL Editor

-- Add subscription fields to user_quota
ALTER TABLE public.user_quota
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_current_period_start TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_uploads_quota INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_uploads_used INT DEFAULT 0;

-- Add check constraint for subscription_status (PostgreSQL doesn't support IF NOT EXISTS for constraints easily)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_quota_subscription_status_check'
  ) THEN
    ALTER TABLE public.user_quota
      ADD CONSTRAINT user_quota_subscription_status_check
      CHECK (subscription_status IS NULL OR subscription_status IN ('active', 'canceled', 'past_due', 'incomplete'));
  END IF;
END $$;

-- Add subscription payment tracking to payments table
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS subscription_id TEXT DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_payment_type_check'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_payment_type_check
      CHECK (payment_type IN ('one_time', 'subscription'));
  END IF;
END $$;
