-- Migration: PvE types wijzigen van (knockout, award_criterion, wish) naar (eis, wens)
-- Gunningscriteria worden apart beheerd in de EMVI-tool (emvi_criteria tabel).
-- In het PvE bestaan alleen "eis" (= knock-out) en "wens".

-- =============================================================================
-- STAP 1: Bestaande data migreren
-- =============================================================================

-- Verwijder eventuele award_criterion requirements (die horen in emvi_criteria)
-- Soft-delete zodat data niet verloren gaat
UPDATE requirements
SET deleted_at = NOW(),
    metadata = metadata || '{"migrated_reason": "award_criterion verplaatst naar EMVI-tool"}'::jsonb
WHERE requirement_type = 'award_criterion'
  AND deleted_at IS NULL;

-- Hernoem knockout → eis (via text cast, want enum wijzigt straks)
-- Hernoem wish → wens
-- We doen dit via een tijdelijke text-kolom

ALTER TABLE requirements ADD COLUMN requirement_type_new TEXT;

UPDATE requirements SET requirement_type_new = CASE
    WHEN requirement_type::text = 'knockout' THEN 'eis'
    WHEN requirement_type::text = 'wish' THEN 'wens'
    WHEN requirement_type::text = 'award_criterion' THEN 'eis'
    ELSE 'eis'
END;

-- Hernummer: KO-xxx → E-xxx voor bestaande eisen
UPDATE requirements
SET requirement_number = 'E-' || SUBSTRING(requirement_number FROM 4)
WHERE requirement_number LIKE 'KO-%'
  AND deleted_at IS NULL;

-- Hernummer: G-xxx requirements zijn al soft-deleted, geen actie nodig
-- W-xxx blijft W-xxx (wens prefix blijft W)

-- =============================================================================
-- STAP 2: Enum vervangen
-- =============================================================================

-- Drop functie die van het enum afhankelijk is
DROP FUNCTION IF EXISTS next_requirement_number(UUID, requirement_type);

-- Drop de oude kolom en enum
ALTER TABLE requirements DROP COLUMN requirement_type;

-- Drop oude enum type
DROP TYPE requirement_type;

-- Maak nieuwe enum
CREATE TYPE requirement_type AS ENUM ('eis', 'wens');

-- Voeg kolom terug met nieuwe enum
ALTER TABLE requirements ADD COLUMN requirement_type requirement_type NOT NULL DEFAULT 'eis';

-- Vul vanuit tijdelijke kolom
UPDATE requirements SET requirement_type = requirement_type_new::requirement_type;

-- Verwijder tijdelijke kolom
ALTER TABLE requirements DROP COLUMN requirement_type_new;

-- =============================================================================
-- STAP 3: Index opnieuw aanmaken (was afhankelijk van requirement_type)
-- =============================================================================

DROP INDEX IF EXISTS idx_requirements_type;
CREATE INDEX idx_requirements_type ON requirements(requirement_type) WHERE deleted_at IS NULL;

-- =============================================================================
-- STAP 4: Helper function updaten
-- =============================================================================

CREATE OR REPLACE FUNCTION next_requirement_number(
    p_project_id UUID,
    p_type requirement_type
)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    max_num INTEGER;
    next_num INTEGER;
BEGIN
    -- Prefix op basis van type
    CASE p_type
        WHEN 'eis' THEN prefix := 'E';
        WHEN 'wens' THEN prefix := 'W';
    END CASE;

    -- Hoogste nummer zoeken
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(requirement_number FROM LENGTH(prefix) + 2) AS INTEGER)
    ), 0) INTO max_num
    FROM requirements
    WHERE project_id = p_project_id
      AND requirement_number LIKE prefix || '-%'
      AND deleted_at IS NULL;

    next_num := max_num + 1;

    RETURN prefix || '-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
