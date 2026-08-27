-- ==============================================================================
-- EVENTZONE APP & WEB UNIFICATION COMPATIBILITY PATCH
-- Run this in your Supabase SQL Editor (https://awkreadldqmidcrrqukm.supabase.co)
-- ==============================================================================

-- 1. Events additional columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS wilaya TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS template_id UUID;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Sessions additional columns
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS speaker_id UUID;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS track TEXT;

-- 2. Events additional columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS checkin_passcode TEXT;

-- 3. Participants additional columns
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS wilaya TEXT;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS status_badge TEXT;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS checked_in_by TEXT;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS badge_code TEXT;

-- 4. Organizations additional columns
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS brochures JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact TEXT;

-- 5. Sponsors additional columns
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 6. Exhibitors additional columns
ALTER TABLE public.exhibitors ADD COLUMN IF NOT EXISTS booth TEXT;
ALTER TABLE public.exhibitors ADD COLUMN IF NOT EXISTS contact TEXT;
ALTER TABLE public.exhibitors ADD COLUMN IF NOT EXISTS email TEXT;

-- 7. Tickets additional columns
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS quantity_available INTEGER DEFAULT 100;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- 8. Team Members additional columns
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- 9. Floor Plans additional columns
ALTER TABLE public.floor_plans ADD COLUMN IF NOT EXISTS background_url TEXT;
ALTER TABLE public.floor_plans ADD COLUMN IF NOT EXISTS width NUMERIC;
ALTER TABLE public.floor_plans ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE public.floor_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 10. Forms and Submissions Tables
CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Form',
  description TEXT,
  type TEXT DEFAULT 'ticket_registration',
  ticket_id TEXT DEFAULT 'all',
  fields JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID,
  respondent_name TEXT,
  respondent_email TEXT,
  ticket_tier TEXT,
  answers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access policy" ON public.forms;
CREATE POLICY "Public access policy" ON public.forms FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public access policy" ON public.form_submissions;
CREATE POLICY "Public access policy" ON public.form_submissions FOR ALL USING (true) WITH CHECK (true);

-- 11. RSVPs & RSVP Settings Tables
CREATE TABLE IF NOT EXISTS public.rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  status TEXT NOT NULL DEFAULT 'attending',
  plus_ones INTEGER DEFAULT 0,
  plus_ones_names JSONB DEFAULT '[]'::jsonb,
  dietary_preference TEXT DEFAULT 'None',
  dietary_notes TEXT,
  notes TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rsvp_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT TRUE,
  capacity_limit INTEGER DEFAULT 150,
  allow_plus_ones BOOLEAN DEFAULT TRUE,
  max_plus_ones INTEGER DEFAULT 2,
  allow_waitlist BOOLEAN DEFAULT TRUE,
  deadline TIMESTAMPTZ,
  collect_dietary BOOLEAN DEFAULT TRUE,
  collect_company BOOLEAN DEFAULT TRUE,
  collect_phone BOOLEAN DEFAULT TRUE,
  confirmation_message TEXT DEFAULT 'Thank you for your RSVP! We look forward to seeing you at the event.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access policy" ON public.rsvps;
CREATE POLICY "Public access policy" ON public.rsvps FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public access policy" ON public.rsvp_settings;
CREATE POLICY "Public access policy" ON public.rsvp_settings FOR ALL USING (true) WITH CHECK (true);

