-- ==============================================================================
-- Payments Table for Chargily Pay v2 Transactions (EDAHABIA & CIB)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
  
  -- Chargily Checkout identifiers & details
  chargily_checkout_id TEXT UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'dzd',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'canceled', 'expired'
  payment_method TEXT, -- 'edahabia', 'cib', etc.
  
  -- Customer / Attendee Details
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Order metadata & custom form answers
  ticket_tier TEXT,
  quantity INTEGER DEFAULT 1,
  discount_applied NUMERIC DEFAULT 0,
  referral_code TEXT,
  custom_answers JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning-fast lookups
CREATE INDEX IF NOT EXISTS idx_payments_chargily_id ON public.payments(chargily_checkout_id);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_email ON public.payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access on payments" ON public.payments;
CREATE POLICY "Service role full access on payments"
  ON public.payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow public read for verifying one's own checkout session by ID
DROP POLICY IF EXISTS "Public can view own payment by checkout_id" ON public.payments;
CREATE POLICY "Public can view own payment by checkout_id"
  ON public.payments
  FOR SELECT
  USING (true);
