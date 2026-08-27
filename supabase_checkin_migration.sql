-- ==============================================================================
-- EVENTZONE PLATFORM - MOBILE CHECK-IN MIGRATION SCRIPT
-- Adds check-in passcode for events and check-in tracking for participants
-- ==============================================================================

-- 1. Add checkin_passcode column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS checkin_passcode TEXT;

-- 2. Add check-in tracking columns to participants table
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS checked_in_by TEXT;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS badge_code TEXT;

-- 3. Add check-in tracking columns to rsvps table (if not exists)
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS checked_in_by TEXT;

-- 4. Create index for fast passcode lookups
CREATE INDEX IF NOT EXISTS idx_events_checkin_passcode ON public.events(checkin_passcode);
CREATE INDEX IF NOT EXISTS idx_participants_event_checked_in ON public.participants(event_id, checked_in);
CREATE INDEX IF NOT EXISTS idx_participants_badge_code ON public.participants(badge_code);

-- 5. Seed default 6-digit checkin passcodes for existing events without a passcode
UPDATE public.events 
SET checkin_passcode = UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 6))
WHERE checkin_passcode IS NULL OR checkin_passcode = '';

-- Default starter event passcode
UPDATE public.events
SET checkin_passcode = '202688'
WHERE id = '00000000-0000-0000-0000-000000000001' OR id = 'cf12bb94-0cfb-4e0c-a96c-482a5c4e9021';
