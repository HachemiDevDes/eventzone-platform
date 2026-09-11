-- ==============================================================================
-- EVENTZONE PLATFORM - REQUEST A QUOTE SCHEMA & RLS
-- Migration for public quote requests and super admin back-office management
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT,
  city_wilaya TEXT,
  event_name TEXT,
  event_type TEXT,
  attendees_count TEXT,
  event_date TEXT,
  duration TEXT,
  venue_status TEXT,
  services JSONB DEFAULT '[]'::jsonb,
  budget_range TEXT,
  additional_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'contacted', 'quoted', 'won', 'archived'
  admin_notes TEXT,
  quoted_amount NUMERIC DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast status and date queries
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON public.quote_requests (status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON public.quote_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_requests_ref ON public.quote_requests (reference_code);

-- Enable RLS
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Allow public access on quote_requests (aligned with newsletter_subscribers & form_submissions)
DROP POLICY IF EXISTS "Public access on quote_requests" ON public.quote_requests;
CREATE POLICY "Public access on quote_requests"
ON public.quote_requests
FOR ALL
TO public
USING (true)
WITH CHECK (true);
