-- Fix: Add missing archive_status column to supplier_contacts
-- The original migration (20260218001300) omitted archive_status

ALTER TABLE supplier_contacts
  ADD COLUMN IF NOT EXISTS archive_status archive_status DEFAULT 'active';
