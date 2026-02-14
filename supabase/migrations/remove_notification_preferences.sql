-- Remove notification preferences table
-- Reminders are now handled by user's calendar app after export

DROP TABLE IF EXISTS public.notification_preferences;
