-- Fase 5: NUTS referentietabel + postcode-NUTS mapping
-- NUTS = Nomenclature des Unités Territoriales Statistiques

-- NUTS codes table (NL only, levels 0-3)
CREATE TABLE nuts_codes (
  code VARCHAR(5) PRIMARY KEY,
  label_nl TEXT NOT NULL,
  level SMALLINT NOT NULL CHECK (level BETWEEN 0 AND 3),
  parent_code VARCHAR(5) REFERENCES nuts_codes(code),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_nuts_codes_level ON nuts_codes(level);
CREATE INDEX idx_nuts_codes_parent ON nuts_codes(parent_code);
CREATE INDEX idx_nuts_codes_label ON nuts_codes
  USING gin(to_tsvector('dutch', label_nl));

ALTER TABLE nuts_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "NUTS codes zijn publiek leesbaar"
  ON nuts_codes FOR SELECT
  USING (true);

-- Postcode prefix → NUTS3 mapping
CREATE TABLE postcode_nuts_mapping (
  postcode_prefix VARCHAR(4) PRIMARY KEY,
  nuts3_code VARCHAR(5) NOT NULL REFERENCES nuts_codes(code),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE postcode_nuts_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Postcode mapping publiek leesbaar"
  ON postcode_nuts_mapping FOR SELECT
  USING (true);
