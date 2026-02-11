-- SpaxioScheduled: run this in Supabase SQL Editor

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  locale text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Upload quota: 2 free, then Stripe for +7
create table if not exists public.user_quota (
  user_id uuid primary key references auth.users(id) on delete cascade,
  free_uploads_used int default 0,
  paid_uploads_used int default 0,
  paid_uploads_purchased int default 0,
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Courses (parsed from syllabus)
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  code text,
  class_time_start time,
  class_time_end time,
  class_days text[], -- e.g. ['Mon','Wed'] (legacy single block)
  class_schedule jsonb, -- [{ "days": ["Mon","Wed"], "start": "09:00", "end": "10:00" }, ...]
  raw_schedule jsonb, -- tentative schedule from syllabus
  assignment_weights jsonb, -- { "Assignments": 30, "Midterm": 30, ... }
  file_path text, -- storage path of uploaded syllabus
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- If you already have courses table, add the new column:
-- alter table public.courses add column if not exists class_schedule jsonb;

-- Calendar events (from parsed schedule + manual)
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  event_type text not null check (event_type in ('class', 'assignment', 'test', 'exam', 'other')),
  event_date date not null,
  event_time time,
  end_time time,
  weight_percent numeric,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notification preferences
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  remind_days_before int default 3,
  remind_weeks_before int default 0,
  frequency text default 'daily' check (frequency in ('daily', 'weekly', 'custom')),
  locale text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Payments (Stripe)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_payment_id text,
  amount_cents int,
  uploads_granted int,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.user_quota enable row level security;
alter table public.courses enable row level security;
alter table public.calendar_events enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.payments enable row level security;

-- Profiles: own row
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- User quota: own row
create policy "Users can read own quota" on public.user_quota for select using (auth.uid() = user_id);
create policy "Users can insert own quota" on public.user_quota for insert with check (auth.uid() = user_id);
create policy "Users can update own quota" on public.user_quota for update using (auth.uid() = user_id);
-- Service role will update quota on payment; no policy needed for that from client

-- Courses: own rows
create policy "Users can crud own courses" on public.courses for all using (auth.uid() = user_id);

-- Calendar events: own rows
create policy "Users can crud own events" on public.calendar_events for all using (auth.uid() = user_id);

-- Notification preferences: own row
create policy "Users can crud own notification prefs" on public.notification_preferences for all using (auth.uid() = user_id);

-- Payments: users can read own
create policy "Users can read own payments" on public.payments for select using (auth.uid() = user_id);

-- Storage bucket for syllabi
insert into storage.buckets (id, name, public) values ('syllabi', 'syllabi', false) on conflict (id) do nothing;
create policy "Users can upload own syllabi" on storage.objects for insert with check (bucket_id = 'syllabi' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can read own syllabi" on storage.objects for select using (bucket_id = 'syllabi' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own syllabi" on storage.objects for delete using (bucket_id = 'syllabi' and auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  insert into public.user_quota (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
