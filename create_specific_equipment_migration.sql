-- ==============================================================================
-- Migration: Add specific_equipment column to exhibitors table
-- Platform: Eventzone Platform
-- ==============================================================================

-- 1. Add specific_equipment JSONB column to public.exhibitors
ALTER TABLE public.exhibitors 
ADD COLUMN IF NOT EXISTS specific_equipment JSONB DEFAULT '[]'::jsonb;

-- 2. Add documentation comment
COMMENT ON COLUMN public.exhibitors.specific_equipment IS 
'Array of assigned specific equipment items: [{ id, equipmentId, name, category, unitPrice, quantity, subtotal, status, notes, assignedAt }]';

-- 3. Verify column addition
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'exhibitors' 
      AND column_name = 'specific_equipment'
  ) THEN
    RAISE NOTICE 'Column specific_equipment successfully ensured on public.exhibitors.';
  ELSE
    RAISE WARNING 'Column specific_equipment could not be verified on public.exhibitors.';
  END IF;
END $$;
