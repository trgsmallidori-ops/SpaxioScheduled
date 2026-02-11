-- Add columns to courses if they don't exist (for existing databases)
-- Run this in Supabase Dashboard → SQL Editor

alter table public.courses add column if not exists class_schedule jsonb;
alter table public.courses add column if not exists raw_schedule jsonb;
alter table public.courses add column if not exists assignment_weights jsonb;
