-- Supabase Migration: Check-In Gates & Per-Gate Passcodes
-- 1. Add checkin_gates column to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS checkin_gates JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_events_checkin_gates ON public.events USING GIN(checkin_gates);

-- 2. Add checkin_gate column to participants
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS checkin_gate TEXT;
CREATE INDEX IF NOT EXISTS idx_participants_checkin_gate ON public.participants(checkin_gate);

-- 3. Add checkin_gate column to rsvps
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS checkin_gate TEXT;
CREATE INDEX IF NOT EXISTS idx_rsvps_checkin_gate ON public.rsvps(checkin_gate);
