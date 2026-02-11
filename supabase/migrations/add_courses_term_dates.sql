-- Term date range for each course (first/last day of class). Used to generate class events only within the term.
alter table public.courses add column if not exists term_start_date date;
alter table public.courses add column if not exists term_end_date date;
