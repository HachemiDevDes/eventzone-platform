-- ==============================================================================
-- EVENTZONE PLATFORM - INVOICING & QUOTES MODULE MIGRATION
-- Run in Supabase SQL Editor (Project: gknglowozpewwrtjumuc)
-- ==============================================================================

-- 1. Invoicing Profiles (Organisation Company Profile, Fiscal IDs, Bank Details)
CREATE TABLE IF NOT EXISTS public.invoicing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Eventzone',
  company_name TEXT DEFAULT 'SPASU Eventzone',
  manager_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  wilaya TEXT DEFAULT '16 - Alger',
  activity_sector TEXT DEFAULT 'Events Management',
  logo_url TEXT DEFAULT '',
  signature_url TEXT DEFAULT '',
  
  -- Algerian Fiscal Identification
  nif TEXT DEFAULT '',
  nis TEXT DEFAULT '',
  rc TEXT DEFAULT '',
  article_imposition TEXT DEFAULT '',

  -- Default Settings
  invoice_prefix TEXT DEFAULT 'EZ-26-',
  quote_prefix TEXT DEFAULT 'DEV-26-',
  proforma_prefix TEXT DEFAULT 'PRO-26-',
  next_invoice_seq INTEGER DEFAULT 1,
  next_quote_seq INTEGER DEFAULT 1,
  next_proforma_seq INTEGER DEFAULT 1,
  default_payment_delay_days INTEGER DEFAULT 30,
  default_tva_rate NUMERIC DEFAULT 19,
  default_currency TEXT DEFAULT 'DZD',
  default_notes TEXT DEFAULT 'Merci pour votre confiance. Paiement par virement bancaire dans le délai convenu.',
  
  -- Treasury & Bank Details
  initial_balance NUMERIC DEFAULT 0,
  bank_name TEXT DEFAULT '',
  account_holder TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  rib TEXT DEFAULT '',
  iban TEXT DEFAULT '',
  swift_bic TEXT DEFAULT '',
  bank_agency_address TEXT DEFAULT '',
  
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Invoicing Clients (Customer Address Book)
CREATE TABLE IF NOT EXISTS public.invoicing_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  nif TEXT DEFAULT '',
  rc TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Invoices & Quotes Table (Factures, Devis, Factures Proforma)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.invoicing_profiles(id) ON DELETE SET NULL,
  profile_name TEXT DEFAULT 'Eventzone',
  
  -- Document Classification & Sequence
  document_type TEXT NOT NULL DEFAULT 'facture', -- 'facture', 'devis', 'proforma'
  document_number TEXT NOT NULL,                -- e.g. 'EZ-26-0003'
  status TEXT DEFAULT 'brouillon',               -- 'brouillon', 'envoye', 'partiel', 'encaisse', 'en_retard'
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_terms_type TEXT DEFAULT '30_jours',    -- 'reception', '15_jours', '30_jours', '60_jours', 'custom'
  currency TEXT DEFAULT 'DZD',
  logo_url TEXT DEFAULT '',

  -- Issuer Details Snapshot
  emitter_company_name TEXT DEFAULT '',
  emitter_manager_name TEXT DEFAULT '',
  emitter_address TEXT DEFAULT '',
  emitter_email TEXT DEFAULT '',
  emitter_phone TEXT DEFAULT '',
  emitter_nif TEXT DEFAULT '',
  emitter_rc TEXT DEFAULT '',
  emitter_nis TEXT DEFAULT '',
  emitter_article_imposition TEXT DEFAULT '',
  emitter_bank_details JSONB DEFAULT '{}'::jsonb,

  -- Recipient / Client Details
  client_id UUID REFERENCES public.invoicing_clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL DEFAULT '',
  client_contact_name TEXT DEFAULT '',
  client_address TEXT DEFAULT '',
  client_email TEXT DEFAULT '',
  client_phone TEXT DEFAULT '',
  client_nif TEXT DEFAULT '',
  client_rc TEXT DEFAULT '',

  -- Line items (JSONB array of { id, description, quantity, unit_price, total_ht })
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Taxes, Discounts, and Totals
  subtotal_ht NUMERIC DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage',       -- 'percentage', 'fixed'
  discount_value NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  tva_rate NUMERIC DEFAULT 19,
  tva_amount NUMERIC DEFAULT 0,
  has_fiscal_stamp BOOLEAN DEFAULT false,
  fiscal_stamp_amount NUMERIC DEFAULT 0,
  total_ttc NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  amount_words TEXT DEFAULT '',

  -- Additional Options & Legal Notes
  show_signature_stamp BOOLEAN DEFAULT true,
  signature_stamp_url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_invoicing_profiles_user_id ON public.invoicing_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_invoicing_clients_user_id ON public.invoicing_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_event_id ON public.invoices(event_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_document_type ON public.invoices(document_type);
CREATE INDEX IF NOT EXISTS idx_invoices_share_token ON public.invoices(share_token);

-- Row Level Security (RLS)
ALTER TABLE public.invoicing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoicing_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Invoicing profiles access policy" ON public.invoicing_profiles;
CREATE POLICY "Invoicing profiles access policy" ON public.invoicing_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Invoicing clients access policy" ON public.invoicing_clients;
CREATE POLICY "Invoicing clients access policy" ON public.invoicing_clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Invoices access policy" ON public.invoices;
CREATE POLICY "Invoices access policy" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
