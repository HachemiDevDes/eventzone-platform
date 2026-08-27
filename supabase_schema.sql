-- ==============================================================================
-- EVENTZONE PLATFORM - FULL DATABASE SCHEMA & MIGRATION SCRIPT
-- Run this complete script in the SQL Editor of your new Supabase Project:
-- (https://awkreadldqmidcrrqukm.supabase.co)
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (User Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'organizer',
  avatar_url TEXT,
  job_title TEXT,
  company_name TEXT,
  bio TEXT,
  location TEXT,
  phone TEXT,
  interests JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on profiles table if pre-existing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Events Table (Ensure all columns exist)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Untitled Event',
  tagline TEXT,
  category TEXT DEFAULT 'Technology & Software',
  location TEXT DEFAULT 'Online',
  type TEXT DEFAULT 'Hybrid',
  start_date DATE,
  end_date DATE,
  description TEXT,
  banner TEXT,
  cover_url TEXT,
  capacity INTEGER DEFAULT 500,
  status TEXT DEFAULT 'published',
  organizer_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on events if table was pre-existing
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Technology & Software';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Online';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Hybrid';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 500;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_id UUID;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS checkin_passcode TEXT;

-- 4. Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  description TEXT,
  speakers JSONB DEFAULT '[]'::jsonb,
  moderators JSONB DEFAULT '[]'::jsonb,
  logos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Participants / Attendees Table
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  ticket_type TEXT DEFAULT 'Standard Admission',
  status_participation TEXT DEFAULT 'registered',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  image TEXT,
  is_speaker BOOLEAN DEFAULT FALSE,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT,
  badge_code TEXT
);

-- 6. Pending Registrations Table
CREATE TABLE IF NOT EXISTS public.pending_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  note TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  address TEXT,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Sponsors Table
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tier TEXT DEFAULT 'Silver',
  industry TEXT,
  website TEXT,
  logo TEXT,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Exhibitors Table
CREATE TABLE IF NOT EXISTS public.exhibitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  booth_number TEXT,
  industry TEXT,
  contact_email TEXT,
  logo_url TEXT,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  total_quantity INTEGER DEFAULT 100,
  sold_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Team Members Table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  department TEXT,
  role TEXT DEFAULT 'Member',
  avatar TEXT,
  status TEXT DEFAULT 'Active',
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Floor Plans Table
CREATE TABLE IF NOT EXISTS public.floor_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Main Floor Plan',
  elements JSONB DEFAULT '[]'::jsonb,
  blueprint JSONB DEFAULT '{}'::jsonb,
  floors JSONB DEFAULT '[]'::jsonb,
  font_family TEXT DEFAULT 'Inter',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Communications Table
CREATE TABLE IF NOT EXISTS public.communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT,
  recipient_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Sent',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Forms Table (Form Builder for Tickets & Feedback)
CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Form',
  description TEXT,
  type TEXT DEFAULT 'ticket_registration', -- 'ticket_registration', 'feedback_survey', 'session_survey', 'general_inquiry'
  ticket_id TEXT DEFAULT 'all', -- 'all' or specific ticket tier ID
  fields JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active', -- 'active', 'draft', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Form Submissions Table (Attendee Responses)
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

-- 16. RSVPs Table (Attendance & Headcount Management)
CREATE TABLE IF NOT EXISTS public.rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  status TEXT NOT NULL DEFAULT 'attending', -- 'attending', 'declined', 'waitlisted', 'tentative'
  plus_ones INTEGER DEFAULT 0,
  plus_ones_names JSONB DEFAULT '[]'::jsonb,
  dietary_preference TEXT DEFAULT 'None', -- 'None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free', 'Nut Allergy', 'Other'
  dietary_notes TEXT,
  notes TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. RSVP Settings Table (Per-event Capacity, Deadline & Plus-ones Config)
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

-- 18. Configure Row Level Security (RLS) Permissive Policies for Web App Access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'events', 'sessions', 'participants', 'pending_registrations', 'organizations', 'sponsors', 'exhibitors', 'tickets', 'team_members', 'floor_plans', 'communications', 'forms', 'form_submissions', 'rsvps', 'rsvp_settings')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public access policy" ON public.%I;', tbl);
    EXECUTE format('CREATE POLICY "Public access policy" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;

-- 15. Create Storage Bucket for Floor Plans & Media
INSERT INTO storage.buckets (id, name, public)
VALUES ('floor-plans', 'floor-plans', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage bucket access policy
DROP POLICY IF EXISTS "Public floor plans access" ON storage.objects;
CREATE POLICY "Public floor plans access" ON storage.objects
FOR ALL USING (bucket_id = 'floor-plans')
WITH CHECK (bucket_id = 'floor-plans');

-- 16. Seed Default Starter Event
INSERT INTO public.events (
  id,
  name,
  tagline,
  category,
  location,
  type,
  start_date,
  end_date,
  description,
  banner,
  cover_url,
  capacity,
  status
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Algeria Hydrogen Law Conference 2026',
  'Strategic Energy Law & Infrastructure Conference',
  'Technology & Energy',
  'Algiers International Conference Center (CIC)',
  'Hybrid',
  '2026-10-12',
  '2026-10-18',
  'Strategic executive convention gathering global legal experts, state energy leaders, and infrastructure developers.',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80',
  1200,
  'published'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  category = EXCLUDED.category,
  location = EXCLUDED.location,
  description = EXCLUDED.description;
