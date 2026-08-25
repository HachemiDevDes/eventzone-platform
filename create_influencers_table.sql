-- ==============================================================================
-- EVENTZONE PLATFORM - INFLUENCERS & AFFILIATE TRACKING SCHEMA
-- ==============================================================================

-- 1. Create Influencers Table
CREATE TABLE IF NOT EXISTS public.influencers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  platform TEXT DEFAULT 'Instagram',
  handle TEXT,
  avatar_url TEXT,
  ticket_id UUID,
  ticket_tier TEXT,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  commission_percent NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  target_goal INTEGER DEFAULT 50,
  clicks INTEGER DEFAULT 0,
  payout_status TEXT DEFAULT 'unpaid',
  payout_notes TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for fast lookups by event and referral code
CREATE INDEX IF NOT EXISTS idx_influencers_event_id ON public.influencers(event_id);
CREATE INDEX IF NOT EXISTS idx_influencers_code ON public.influencers(code);

-- 3. Add referral attribution columns to participants table
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS influencer_id UUID;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS discount_applied NUMERIC DEFAULT 0;
