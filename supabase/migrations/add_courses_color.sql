-- Course colour for calendar display (hex e.g. #3b82f6). User can choose when uploading or in By Course.
alter table public.courses add column if not exists color text;
