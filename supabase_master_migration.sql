-- ==============================================================================
-- EVENTZONE PLATFORM - COMPLETE MASTER DATABASE MIGRATION SCRIPT
-- Project: https://supabase.com/dashboard/project/gknglowozpewwrtjumuc/sql/new
-- ==============================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Profiles Table (User Accounts & Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'organizer',
  avatar_url TEXT,
  job_title TEXT,
  company_name TEXT,
  bio TEXT,
  location TEXT,
  phone TEXT,
  industry TEXT,
  onboarding_completed BOOLEAN DEFAULT TRUE,
  interests JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Untitled Event',
  tagline TEXT,
  category TEXT DEFAULT 'Technology & Software',
  location TEXT DEFAULT 'Online',
  type TEXT DEFAULT 'Hybrid',
  start_date TEXT,
  end_date TEXT,
  date TEXT,
  description TEXT,
  banner TEXT,
  cover_url TEXT,
  logo_url TEXT,
  capacity INTEGER DEFAULT 500,
  status TEXT DEFAULT 'published',
  organizer_id UUID,
  owner_id UUID,
  template_id TEXT,
  slug TEXT,
  wilaya TEXT,
  visibility TEXT DEFAULT 'public',
  checkin_passcode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sessions Table (Agenda & Schedule)
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  description TEXT,
  speakers JSONB DEFAULT '[]'::jsonb,
  moderators JSONB DEFAULT '[]'::jsonb,
  logos JSONB DEFAULT '[]'::jsonb,
  speaker_id UUID,
  location TEXT,
  track TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Participants Table (Attendees)
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  wilaya TEXT,
  type TEXT,
  ticket_type TEXT DEFAULT 'Standard Admission',
  status_participation TEXT DEFAULT 'registered',
  status_badge TEXT,
  badge_code TEXT,
  image TEXT,
  is_speaker BOOLEAN DEFAULT FALSE,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT,
  referral_code TEXT,
  influencer_id UUID,
  discount_applied NUMERIC DEFAULT 0,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Pending Registrations Table
CREATE TABLE IF NOT EXISTS public.pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  note TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  address TEXT,
  logo TEXT,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  type TEXT,
  tier TEXT,
  brochures JSONB DEFAULT '[]'::jsonb,
  contact TEXT,
  status TEXT DEFAULT 'active',
  event_id UUID,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Sponsors Table
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tier TEXT DEFAULT 'Silver',
  industry TEXT,
  website TEXT,
  logo TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'confirmed',
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Exhibitors Table
CREATE TABLE IF NOT EXISTS public.exhibitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  booth_number TEXT,
  booth TEXT,
  booth_type TEXT,
  industry TEXT,
  contact_email TEXT,
  contact TEXT,
  email TEXT,
  logo_url TEXT,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  staff_count INTEGER DEFAULT 1,
  description TEXT,
  status TEXT DEFAULT 'confirmed',
  phone TEXT,
  contact_phone TEXT,
  contact_person TEXT,
  products TEXT,
  badge_count INTEGER DEFAULT 2,
  job_title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  total_quantity INTEGER DEFAULT 100,
  quantity_available INTEGER DEFAULT 100,
  sold_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  color TEXT DEFAULT 'blue',
  badge_type TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Team Members Table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Main Floor Plan',
  elements JSONB DEFAULT '[]'::jsonb,
  blueprint JSONB DEFAULT '{}'::jsonb,
  floors JSONB DEFAULT '[]'::jsonb,
  font_family TEXT DEFAULT 'Inter',
  background_url TEXT,
  width NUMERIC,
  height NUMERIC,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Communications Table
CREATE TABLE IF NOT EXISTS public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT,
  recipient_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Sent',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Forms Table
CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 15. Form Submissions Table
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID,
  respondent_name TEXT,
  respondent_email TEXT,
  ticket_tier TEXT,
  answers JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. RSVPs Table
CREATE TABLE IF NOT EXISTS public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID,
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

-- 17. RSVP Settings Table
CREATE TABLE IF NOT EXISTS public.rsvp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 18. Influencers Table
CREATE TABLE IF NOT EXISTS public.influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  platform TEXT,
  handle TEXT,
  followers INTEGER DEFAULT 0,
  referral_code TEXT,
  code TEXT,
  discount_rate NUMERIC DEFAULT 10,
  commission_rate NUMERIC DEFAULT 5,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Opportunities Table
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  value NUMERIC DEFAULT 0,
  stage TEXT DEFAULT 'lead',
  probability INTEGER DEFAULT 20,
  expected_close_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Connections Table
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  connected_user_id UUID,
  event_id UUID,
  name TEXT,
  title TEXT,
  company TEXT,
  department TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  avatar_url TEXT,
  source TEXT,
  is_new BOOLEAN DEFAULT TRUE,
  pipeline_stage TEXT DEFAULT 'lead',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Developer API Keys Table
CREATE TABLE IF NOT EXISTS public.developer_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Developer Webhooks Table
CREATE TABLE IF NOT EXISTS public.developer_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  endpoint_url TEXT NOT NULL,
  secret_key TEXT,
  subscribed_events TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 23. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
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
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_webhooks ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    AND tablename IN (
      'profiles', 'events', 'sessions', 'participants', 'pending_registrations', 
      'organizations', 'sponsors', 'exhibitors', 'tickets', 'team_members', 
      'floor_plans', 'communications', 'forms', 'form_submissions', 'rsvps', 
      'rsvp_settings', 'influencers', 'opportunities', 'connections', 
      'developer_api_keys', 'developer_webhooks'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public access policy" ON public.%I;', tbl);
    EXECUTE format('CREATE POLICY "Public access policy" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;

-- ==============================================================================
-- 24. STORAGE BUCKETS CONFIGURATION
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('event-images', 'event-images', true),
  ('floor-plans', 'floor-plans', true),
  ('documents', 'documents', true),
  ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public bucket access" ON storage.objects;
CREATE POLICY "Public bucket access" ON storage.objects
FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 25. SEED STARTER DEFAULT EVENT
-- ==============================================================================
INSERT INTO public.events (
  id,
  name,
  tagline,
  category,
  location,
  type,
  start_date,
  end_date,
  date,
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
  '2026-10-12',
  'Strategic executive convention gathering global legal experts, state energy leaders, and infrastructure developers.',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80',
  1200,
  'published'
) ON CONFLICT (id) DO NOTHING;
