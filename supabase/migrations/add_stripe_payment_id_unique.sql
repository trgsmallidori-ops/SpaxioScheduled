-- Idempotency for Stripe webhook: ensure we don't credit the same session twice.
-- Run in Supabase Dashboard → SQL Editor if you use the payments table for webhook idempotency.

-- Allow null for legacy rows; unique only on non-null values
create unique index if not exists payments_stripe_payment_id_key
  on public.payments (stripe_payment_id)
  where stripe_payment_id is not null;
