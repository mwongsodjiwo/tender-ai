-- Migration 030: CPV referentietabel (v2 Fase 4)
-- CPV (Common Procurement Vocabulary) codes for public procurement classification

-- Category type enum for CPV divisions
CREATE TYPE cpv_category_type AS ENUM ('werken', 'leveringen', 'diensten');

-- CPV codes reference table
CREATE TABLE cpv_codes (
  code VARCHAR(10) PRIMARY KEY,
  description_nl TEXT NOT NULL,
  division VARCHAR(2) NOT NULL,
  group_code VARCHAR(3),
  class_code VARCHAR(4),
  category_type cpv_category_type NOT NULL,
  parent_code VARCHAR(10) REFERENCES cpv_codes(code),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_cpv_codes_division ON cpv_codes(division);
CREATE INDEX idx_cpv_codes_category ON cpv_codes(category_type);
CREATE INDEX idx_cpv_codes_parent ON cpv_codes(parent_code);
CREATE INDEX idx_cpv_codes_description ON cpv_codes
  USING gin(to_tsvector('dutch', description_nl));

-- RLS: reference data is publicly readable
ALTER TABLE cpv_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CPV codes zijn publiek leesbaar"
  ON cpv_codes FOR SELECT
  USING (true);
