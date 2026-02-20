-- Migration: Fase 17 — Correspondence as Document Types
-- Adds 11 letter types as document_types with category='correspondence'
-- and adds a category column to document_types for filtering.

-- =============================================================================
-- STEP 1: Add category column to document_types
-- =============================================================================

ALTER TABLE document_types ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'document';
ALTER TABLE document_types ADD COLUMN IF NOT EXISTS phase TEXT;

-- Update existing document_types with category 'document'
UPDATE document_types SET category = 'document' WHERE category = 'document';

-- =============================================================================
-- STEP 2: Insert 11 correspondence letter types as document_types
-- =============================================================================

-- Exploring phase letters
INSERT INTO document_types (name, slug, description, category, phase, template_structure, applicable_procedures, sort_order) VALUES

-- 1. Uitnodiging RFI
(
  'Uitnodiging RFI',
  'correspondence-invitation-rfi',
  'Uitnodiging aan leveranciers om deel te nemen aan een Request for Information.',
  'correspondence',
  'exploring',
  '[
    {"key": "body", "title": "Inhoud", "description": "Inhoud van de uitnodiging voor RFI.", "placeholders": ["org_name", "org_adres", "org_kvk_nummer", "contactpersoon_naam", "contactpersoon_email", "contactpersoon_tel", "project_name", "project_reference", "scope_description", "cpv_code", "cpv_description", "nuts_code", "nuts_label", "deadline_inschrijving", "supplier_name", "supplier_adres", "datum_vandaag"]}
  ]'::jsonb,
  '{}',
  101
),

-- 2. Uitnodiging Marktconsultatie
(
  'Uitnodiging marktconsultatie',
  'correspondence-invitation-consultation',
  'Uitnodiging aan leveranciers om deel te nemen aan een marktconsultatie.',
  'correspondence',
  'exploring',
  '[
    {"key": "body", "title": "Inhoud", "description": "Inhoud van de uitnodiging voor marktconsultatie.", "placeholders": ["org_name", "org_adres", "org_kvk_nummer", "contactpersoon_naam", "contactpersoon_email", "contactpersoon_tel", "project_name", "project_reference", "scope_description", "cpv_code", "cpv_description", "nuts_code", "nuts_label", "datum_vandaag", "supplier_name", "supplier_adres", "consultation_date", "consultation_time", "consultation_location", "consultation_format", "consultation_topics"]}
  ]'::jsonb,
  '{}',
  102
),

-- 3. Bedankbrief Deelname
(
  'Bedankbrief deelname',
  'correspondence-thank-you',
  'Bedankbrief naar leveranciers voor deelname aan RFI of marktconsultatie.',
  'correspondence',
  'exploring',
  '[
    {"key": "body", "title": "Inhoud", "description": "Inhoud van de bedankbrief.", "placeholders": ["org_name", "supplier_name", "participation_type", "project_reference", "datum_vandaag", "contactpersoon_naam"]}
  ]'::jsonb,
  '{}',
  103
),

-- Tendering phase letters

-- 4. Nota van Inlichtingen (NvI)
(
  'Nota van Inlichtingen (brief)',
  'correspondence-nvi',
  'Begeleidende brief bij de Nota van Inlichtingen met alle goedgekeurde vragen en antwoorden.',
  'correspondence',
  'tendering',
  '[
    {"key": "body", "title": "Inhoud", "description": "Begeleidende tekst bij NvI publicatie.", "placeholders": ["org_name", "project_name", "project_reference", "datum_vandaag", "contactpersoon_naam", "contactpersoon_email", "nvi_publication_date", "questions_count", "rectifications_count"]}
  ]'::jsonb,
  '{}',
  104
),

-- 5. PV Opening Inschrijvingen
(
  'PV opening inschrijvingen',
  'correspondence-pv-opening',
  'Proces-verbaal van de opening van inschrijvingen.',
  'correspondence',
  'tendering',
  '[
    {"key": "body", "title": "Inhoud", "description": "Proces-verbaal van de opening.", "placeholders": ["org_name", "project_name", "project_reference", "datum_vandaag", "opening_date", "opening_time", "committee_members", "tenderers_list", "completeness_check"]}
  ]'::jsonb,
  '{}',
  105
),

-- 6. PV Beoordeling
(
  'PV beoordeling',
  'correspondence-pv-evaluation',
  'Proces-verbaal van de beoordeling van inschrijvingen.',
  'correspondence',
  'tendering',
  '[
    {"key": "body", "title": "Inhoud", "description": "Proces-verbaal van de beoordeling.", "placeholders": ["org_name", "project_name", "project_reference", "datum_vandaag", "committee_members", "scores_per_tenderer", "ranking", "award_criteria", "scoring_methodology"]}
  ]'::jsonb,
  '{}',
  106
),

-- 7. Voorlopige Gunningsbeslissing
(
  'Voorlopige gunningsbeslissing',
  'correspondence-provisional-award',
  'Mededeling van de voorlopige gunningsbeslissing aan de winnende inschrijver.',
  'correspondence',
  'tendering',
  '[
    {"key": "body", "title": "Inhoud", "description": "Inhoud van de voorlopige gunning.", "placeholders": ["org_name", "project_name", "project_reference", "datum_vandaag", "supplier_name", "supplier_adres", "winning_scores", "award_motivation", "alcatel_period", "complaint_procedure", "contactpersoon_naam", "contactpersoon_email"]}
  ]'::jsonb,
  '{}',
  107
),

-- 8. Afwijzingsbrief
(
  'Afwijzingsbrief',
  'correspondence-rejection',
  'Mededeling aan afgewezen inschrijvers met scores en motivatie.',
  'correspondence',
  'tendering',
  '[
    {"key": "body", "title": "Inhoud", "description": "Inhoud van de afwijzingsbrief.", "placeholders": ["org_name", "project_name", "project_reference", "datum_vandaag", "supplier_name", "supplier_adres", "supplier_scores", "winner_scores_anonymized", "rejection_motivation", "alcatel_period", "contactpersoon_naam", "contactpersoon_email"]}
  ]'::jsonb,
  '{}',
  108
),

-- 9. Definitieve Gunning
(
  'Definitieve gunning',
  'correspondence-final-award',
  'Bevestiging van de definitieve gunning na afloop van de Alcatel-termijn.',
  'correspondence',
  'tendering',
  '[
    {"key": "body", "title": "Inhoud", "description": "Inhoud van de definitieve gunning.", "placeholders": ["org_name", "project_name", "project_reference", "datum_vandaag", "supplier_name", "supplier_adres", "contract_details", "signing_schedule", "contactpersoon_naam", "contactpersoon_email"]}
  ]'::jsonb,
  '{}',
  109
),

-- Contracting phase letters

-- 10. Uitnodiging tot Ondertekening
(
  'Uitnodiging tot ondertekening',
  'correspondence-invitation-signing',
  'Uitnodiging voor het ondertekenen van het contract.',
  'correspondence',
  'contracting',
  '[
    {"key": "body", "title": "Inhoud", "description": "Inhoud van de uitnodiging tot ondertekening.", "placeholders": ["org_name", "project_name", "project_reference", "datum_vandaag", "supplier_name", "supplier_adres", "contract_details", "signing_date", "signing_location", "signatories", "attachments", "contactpersoon_naam", "contactpersoon_email"]}
  ]'::jsonb,
  '{}',
  110
),

-- 11. Begeleidende Brief
(
  'Begeleidende brief',
  'correspondence-cover-letter',
  'Generieke begeleidende brief als dekbrief bij elk document.',
  'correspondence',
  'contracting',
  '[
    {"key": "body", "title": "Inhoud", "description": "Inhoud van de begeleidende brief.", "placeholders": ["org_name", "project_name", "project_reference", "datum_vandaag", "supplier_name", "supplier_adres", "contactpersoon_naam", "contactpersoon_email"]}
  ]'::jsonb,
  '{}',
  111
);

-- =============================================================================
-- STEP 3: Create mapping table for correspondence → document_type migration
-- =============================================================================

CREATE TABLE IF NOT EXISTS correspondence_document_type_map (
  letter_type TEXT NOT NULL,
  document_type_slug TEXT NOT NULL,
  PRIMARY KEY (letter_type)
);

INSERT INTO correspondence_document_type_map (letter_type, document_type_slug) VALUES
  ('invitation_rfi', 'correspondence-invitation-rfi'),
  ('invitation_consultation', 'correspondence-invitation-consultation'),
  ('thank_you', 'correspondence-thank-you'),
  ('nvi', 'correspondence-nvi'),
  ('pv_opening', 'correspondence-pv-opening'),
  ('pv_evaluation', 'correspondence-pv-evaluation'),
  ('provisional_award', 'correspondence-provisional-award'),
  ('rejection', 'correspondence-rejection'),
  ('final_award', 'correspondence-final-award'),
  ('invitation_signing', 'correspondence-invitation-signing'),
  ('cover_letter', 'correspondence-cover-letter');

-- =============================================================================
-- STEP 4: Add document_type_id to correspondence for migration linking
-- =============================================================================

ALTER TABLE correspondence ADD COLUMN IF NOT EXISTS document_type_id UUID REFERENCES document_types(id);

-- Link existing correspondence records to their new document_types
UPDATE correspondence c
SET document_type_id = dt.id
FROM correspondence_document_type_map m
JOIN document_types dt ON dt.slug = m.document_type_slug
WHERE c.letter_type = m.letter_type
  AND c.document_type_id IS NULL;

-- =============================================================================
-- STEP 5: Create index for category-based filtering
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_document_types_category ON document_types(category);
CREATE INDEX IF NOT EXISTS idx_document_types_phase ON document_types(phase) WHERE phase IS NOT NULL;
