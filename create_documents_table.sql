-- ==============================================================================
-- EVENTZONE PLATFORM - DOCUMENTS MANAGEMENT MIGRATION
-- Run this in your Supabase SQL Editor (https://awkreadldqmidcrrqukm.supabase.co)
-- ==============================================================================

-- 1. Create Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL DEFAULT '',
  file_name TEXT DEFAULT '',
  file_size NUMERIC DEFAULT 0,
  file_type TEXT DEFAULT 'pdf', -- 'pdf', 'word', 'excel', 'pptx', 'csv', 'image', 'zip', 'txt', 'designed', 'other'
  mime_type TEXT DEFAULT '',
  category TEXT DEFAULT 'General', -- 'Contracts & Legal', 'Permits & Licenses', 'Sponsorship & Media', 'Speaker Presentations', 'Floor Plans & Tech', 'Press & Marketing', 'Vendor & Invoices', 'Guidelines & Policies', 'General'
  access_level TEXT DEFAULT 'team', -- 'team' (Organizers & Team Only), 'public' (Public & Attendees), 'speakers' (Speakers & VIPs), 'sponsors' (Sponsors & Exhibitors)
  description TEXT DEFAULT '',
  uploaded_by TEXT DEFAULT 'Organizer',
  designer_data JSONB DEFAULT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Index for fast per-event retrieval
CREATE INDEX IF NOT EXISTS idx_documents_event_id ON public.documents(event_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_access_level ON public.documents(access_level);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON public.documents(file_type);

-- 3. Configure Row Level Security (RLS) Permissive Policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access policy" ON public.documents;
CREATE POLICY "Public access policy" ON public.documents FOR ALL USING (true) WITH CHECK (true);
