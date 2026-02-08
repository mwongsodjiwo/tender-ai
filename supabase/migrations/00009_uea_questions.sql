-- Sprint R8: UEA (Uniform Europees Aanbestedingsdocument) question configurator
-- Template tables for predefined UEA sections/questions + per-project selections

-- =============================================================================
-- UEA SECTIONS — template data (Parts II, III, IV with sections)
-- =============================================================================

CREATE TABLE uea_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_number INTEGER NOT NULL CHECK (part_number BETWEEN 2 AND 4),
    part_title TEXT NOT NULL,
    section_key TEXT NOT NULL UNIQUE,
    section_title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_uea_sections_part ON uea_sections(part_number) WHERE is_active = TRUE;
CREATE INDEX idx_uea_sections_sort ON uea_sections(sort_order) WHERE is_active = TRUE;

CREATE TRIGGER set_updated_at_uea_sections
    BEFORE UPDATE ON uea_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- UEA QUESTIONS — template data (predefined questions per section)
-- =============================================================================

CREATE TABLE uea_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES uea_sections(id) ON DELETE CASCADE,
    question_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_uea_questions_section ON uea_questions(section_id) WHERE is_active = TRUE;
CREATE INDEX idx_uea_questions_sort ON uea_questions(section_id, sort_order) WHERE is_active = TRUE;
CREATE INDEX idx_uea_questions_mandatory ON uea_questions(is_mandatory) WHERE is_active = TRUE;

CREATE TRIGGER set_updated_at_uea_questions
    BEFORE UPDATE ON uea_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- UEA PROJECT SELECTIONS — per-project question toggles
-- =============================================================================

CREATE TABLE uea_project_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES uea_questions(id) ON DELETE CASCADE,
    is_selected BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, question_id)
);

CREATE INDEX idx_uea_selections_project ON uea_project_selections(project_id);
CREATE INDEX idx_uea_selections_question ON uea_project_selections(question_id);

CREATE TRIGGER set_updated_at_uea_selections
    BEFORE UPDATE ON uea_project_selections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE uea_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE uea_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE uea_project_selections ENABLE ROW LEVEL SECURITY;

-- Sections and questions are read-only template data for authenticated users
CREATE POLICY "Authenticated users can read UEA sections"
    ON uea_sections FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

CREATE POLICY "Authenticated users can read UEA questions"
    ON uea_questions FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- Project selections: project members can read/write
CREATE POLICY uea_selections_select ON uea_project_selections FOR SELECT USING (
    is_project_member(project_id)
);

CREATE POLICY uea_selections_insert ON uea_project_selections FOR INSERT WITH CHECK (
    is_project_member(project_id)
);

CREATE POLICY uea_selections_update ON uea_project_selections FOR UPDATE USING (
    is_project_member(project_id)
);

CREATE POLICY uea_selections_delete ON uea_project_selections FOR DELETE USING (
    is_project_member(project_id)
);

-- =============================================================================
-- SEED — UEA SECTIONS
-- =============================================================================

-- Part II: Informatie over de ondernemer
INSERT INTO uea_sections (part_number, part_title, section_key, section_title, description, sort_order) VALUES
(2, 'Informatie over de ondernemer', 'II.A', 'Identificatie', 'Basisgegevens van de ondernemer: naam, adres, KvK-nummer en contactpersoon.', 1),
(2, 'Informatie over de ondernemer', 'II.B', 'Informatie over vertegenwoordigers', 'Gegevens van de natuurlijke persoon/personen die bevoegd is/zijn om de ondernemer te vertegenwoordigen.', 2),
(2, 'Informatie over de ondernemer', 'II.C', 'Informatie over onderaanneming', 'Of de ondernemer een beroep doet op de draagkracht van onderaannemers.', 3),
(2, 'Informatie over de ondernemer', 'II.D', 'Informatie over combinatievorming', 'Of de inschrijving plaatsvindt als onderdeel van een combinatie (samenwerkingsverband).', 4);

-- Part III: Uitsluitingsgronden
INSERT INTO uea_sections (part_number, part_title, section_key, section_title, description, sort_order) VALUES
(3, 'Uitsluitingsgronden', 'III.A', 'Strafrechtelijke veroordelingen', 'Verplichte uitsluitingsgronden op basis van strafrechtelijke veroordelingen (art. 2.86 Aanbestedingswet 2012).', 5),
(3, 'Uitsluitingsgronden', 'III.B', 'Betaling belastingen en premies', 'Verplichte uitsluitingsgrond betreffende het niet-betalen van belastingen of sociale premies.', 6),
(3, 'Uitsluitingsgronden', 'III.C', 'Milieu, sociaal en arbeidsrecht', 'Facultatieve uitsluitingsgrond betreffende schending van milieu-, sociaal- en arbeidsrecht.', 7),
(3, 'Uitsluitingsgronden', 'III.D', 'Overige uitsluitingsgronden', 'Facultatieve uitsluitingsgronden: faillissement, ernstige beroepsfout, belangenconflict, vervalsing mededinging.', 8);

-- Part IV: Selectiecriteria
INSERT INTO uea_sections (part_number, part_title, section_key, section_title, description, sort_order) VALUES
(4, 'Selectiecriteria', 'IV.A', 'Geschiktheid', 'Geschiktheidseisen zoals inschrijving in beroeps- of handelsregisters.', 9),
(4, 'Selectiecriteria', 'IV.B', 'Economische en financiële draagkracht', 'Eisen aan de economische en financiële draagkracht van de ondernemer.', 10),
(4, 'Selectiecriteria', 'IV.C', 'Technische en beroepsbekwaamheid', 'Eisen aan de technische bekwaamheid en beroepsbekwaamheid.', 11),
(4, 'Selectiecriteria', 'IV.D', 'Kwaliteitsbewaking en milieubeheer', 'Kwaliteitsmanagement- en milieubeheersnormen.', 12);

-- =============================================================================
-- SEED — UEA QUESTIONS
-- =============================================================================

-- Part II.A — Identificatie (all mandatory)
INSERT INTO uea_questions (section_id, question_number, title, description, is_mandatory, sort_order)
SELECT s.id, q.question_number, q.title, q.description, q.is_mandatory, q.sort_order
FROM uea_sections s
CROSS JOIN (VALUES
    ('II.A.1', 'Naam van de onderneming', 'De officiële naam van de inschrijvende onderneming zoals geregistreerd in het handelsregister.', TRUE, 1),
    ('II.A.2', 'Adresgegevens', 'Volledig adres, postcode en vestigingsplaats van de onderneming.', TRUE, 2),
    ('II.A.3', 'KvK-nummer', 'Inschrijvingsnummer bij de Kamer van Koophandel.', TRUE, 3),
    ('II.A.4', 'Contactpersoon en communicatiegegevens', 'Naam, telefoon en e-mailadres van de contactpersoon voor deze aanbesteding.', TRUE, 4)
) AS q(question_number, title, description, is_mandatory, sort_order)
WHERE s.section_key = 'II.A';

-- Part II.B — Vertegenwoordigers (optional)
INSERT INTO uea_questions (section_id, question_number, title, description, is_mandatory, sort_order)
SELECT s.id, q.question_number, q.title, q.description, q.is_mandatory, q.sort_order
FROM uea_sections s
CROSS JOIN (VALUES
    ('II.B.1', 'Naam en functie vertegenwoordiger', 'Volledige naam en functie van de persoon/personen bevoegd om de onderneming te vertegenwoordigen.', FALSE, 1),
    ('II.B.2', 'Bewijs van vertegenwoordigingsbevoegdheid', 'Eventueel vereist bewijs dat de vertegenwoordiger gemachtigd is namens de onderneming op te treden.', FALSE, 2)
) AS q(question_number, title, description, is_mandatory, sort_order)
WHERE s.section_key = 'II.B';

-- Part II.C — Onderaanneming (optional)
INSERT INTO uea_questions (section_id, question_number, title, description, is_mandatory, sort_order)
SELECT s.id, q.question_number, q.title, q.description, q.is_mandatory, q.sort_order
FROM uea_sections s
CROSS JOIN (VALUES
    ('II.C.1', 'Beroep op draagkracht onderaannemers', 'Geeft de ondernemer aan een beroep te doen op de draagkracht van onderaannemers om aan de selectiecriteria te voldoen?', FALSE, 1),
    ('II.C.2', 'Gegevens onderaannemers', 'Naam en vestigingsplaats van de onderaannemers waarop een beroep wordt gedaan, inclusief het gedeelte van de opdracht dat wordt uitbesteed.', FALSE, 2)
) AS q(question_number, title, description, is_mandatory, sort_order)
WHERE s.section_key = 'II.C';

-- Part II.D — Combinatievorming (optional)
INSERT INTO uea_questions (section_id, question_number, title, description, is_mandatory, sort_order)
SELECT s.id, q.question_number, q.title, q.description, q.is_mandatory, q.sort_order
FROM uea_sections s
CROSS JOIN (VALUES
    ('II.D.1', 'Inschrijving als combinatie', 'Wordt de inschrijving ingediend door een combinatie van ondernemers (samenwerkingsverband)?', FALSE, 1),
    ('II.D.2', 'Samenstelling en taakverdeling combinatie', 'De deelnemende ondernemers in de combinatie, hun rolverdeling en het aandeel in de uitvoering van de opdracht.', FALSE, 2)
) AS q(question_number, title, description, is_mandatory, sort_order)
WHERE s.section_key = 'II.D';

-- Part III.A — Strafrechtelijke veroordelingen (all mandatory per art. 2.86 Aanbestedingswet)
INSERT INTO uea_questions (section_id, question_number, title, description, is_mandatory, sort_order)
SELECT s.id, q.question_number, q.title, q.description, q.is_mandatory, q.sort_order
FROM uea_sections s
CROSS JOIN (VALUES
    ('III.A.1', 'Deelname aan een criminele organisatie', 'Is de ondernemer of een bestuurder veroordeeld voor deelname aan een criminele organisatie (art. 140 Sr)?', TRUE, 1),
    ('III.A.2', 'Corruptie', 'Is de ondernemer of een bestuurder veroordeeld voor corruptie (art. 177/178 Sr)?', TRUE, 2),
    ('III.A.3', 'Fraude', 'Is de ondernemer of een bestuurder veroordeeld voor fraude die de financiële belangen van de EU schaadt?', TRUE, 3),
    ('III.A.4', 'Terroristische misdrijven', 'Is de ondernemer of een bestuurder veroordeeld voor terroristische misdrijven of daaraan gerelateerde activiteiten?', TRUE, 4),
    ('III.A.5', 'Witwassen van geld of financiering van terrorisme', 'Is de ondernemer of een bestuurder veroordeeld voor witwassen van geld of financiering van terrorisme?', TRUE, 5),
    ('III.A.6', 'Kinderarbeid en mensenhandel', 'Is de ondernemer of een bestuurder veroordeeld voor kinderarbeid of andere vormen van mensenhandel?', TRUE, 6)
) AS q(question_number, title, description, is_mandatory, sort_order)
WHERE s.section_key = 'III.A';

-- Part III.B — Belastingen en premies (mandatory)
INSERT INTO uea_questions (section_id, question_number, title, description, is_mandatory, sort_order)
SELECT s.id, q.question_number, q.title, q.description, q.is_mandatory, q.sort_order
FROM uea_sections s
CROSS JOIN (VALUES
    ('III.B.1', 'Betaling van belastingen', 'Heeft de ondernemer voldaan aan alle verplichtingen betreffende de betaling van belastingen in het land van vestiging?', TRUE, 1),
    ('III.B.2', 'Betaling van sociale premies', 'Heeft de ondernemer voldaan aan alle verplichtingen betreffende de betaling van sociale verzekeringspremies?', TRUE, 2)
) AS q(question_number, title, description, is_mandatory, sort_order)
WHERE s.section_key = 'III.B';

-- Part III.C — Milieu, sociaal en arbeidsrecht (optional)
INSERT INTO uea_questions (section_id, question_number, title, description, is_mandatory, sort_order)
SELECT s.id, q.question_number, q.title, q.description, q.is_mandatory, q.sort_order
FROM uea_sections s
CROSS JOIN (VALUES
    ('III.C.1', 'Naleving milieuwetgeving', 'Heeft de ondernemer naar weten de milieuwetgeving niet geschonden?', FALSE, 1),
    ('III.C.2', 'Naleving sociaal recht', 'Heeft de ondernemer het sociaal recht nageleefd?', FALSE, 2),
    ('III.C.3', 'Naleving arbeidsrecht', 'Heeft de ondernemer het arbeidsrecht nageleefd, inclusief CAO-verplichtingen?', FALSE, 3)
) AS q(question_number, title, description, is_mandatory, sort_order)
WHERE s.section_key = 'III.C';

-- Part III.D — Overige uitsluitingsgronden (optional)
INSERT INTO uea_questions (section_id, question_number, title, description, is_mandatory, sort_order)
SELECT s.id, q.question_number, q.title, q.description, q.is_mandatory, q.sort_order
FROM uea_sections s
CROSS JOIN (VALUES
    ('III.D.1', 'Faillissement of surseance van betaling', 'Verkeert de ondernemer in staat van faillissement, surseance van betaling of liquidatie?', FALSE, 1),
    ('III.D.2', 'Ernstige beroepsfout', 'Heeft de ondernemer een ernstige beroepsfout begaan die zijn integriteit in twijfel trekt?', FALSE, 2),
    ('III.D.3', 'Belangenconflict', 'Is er sprake van een belangenconflict vanwege deelname aan de voorbereiding van de aanbestedingsprocedure?', FALSE, 3),
    ('III.D.4', 'Vervalsing van de mededinging', 'Heeft de ondernemer met andere ondernemers overeenkomsten gesloten die tot doel hadden de mededinging te vervalsen?', FALSE, 4),
    ('III.D.5', 'Wanprestatie bij eerdere overeenkomsten', 'Is bij een eerdere overheidsopdracht sprake geweest van aanzienlijke tekortkomingen die hebben geleid tot voortijdige beëindiging of schadevergoeding?', FALSE, 5)
) AS q(question_number, title, description, is_mandatory, sort_order)
WHERE s.section_key = 'III.D';

-- Part IV.A — Geschiktheid (optional)
INSERT INTO uea_questions (section_id, question_number, title, description, is_mandatory, sort_order)
SELECT s.id, q.question_number, q.title, q.description, q.is_mandatory, q.sort_order
FROM uea_sections s
CROSS JOIN (VALUES
    ('IV.A.1', 'Inschrijving beroeps- of handelsregister', 'Is de ondernemer ingeschreven in het relevante beroeps- of handelsregister in de lidstaat van vestiging?', FALSE, 1),
    ('IV.A.2', 'Specifieke vergunning vereist', 'Beschikt de ondernemer over de specifieke vergunning of het lidmaatschap dat voor deze opdracht vereist is?', FALSE, 2),
    ('IV.A.3', 'Lidmaatschap beroepsorganisatie', 'Is de ondernemer lid van een bepaalde beroepsorganisatie die voor de uitvoering van deze opdracht vereist is?', FALSE, 3)
) AS q(question_number, title, description, is_mandatory, sort_order)
WHERE s.section_key = 'IV.A';

-- Part IV.B — Economische en financiële draagkracht (optional)
INSERT INTO uea_questions (section_id, question_number, title, description, is_mandatory, sort_order)
SELECT s.id, q.question_number, q.title, q.description, q.is_mandatory, q.sort_order
FROM uea_sections s
CROSS JOIN (VALUES
    ('IV.B.1', 'Minimale jaaromzet', 'Kan de ondernemer aantonen dat de jaaromzet voldoet aan het vereiste minimum?', FALSE, 1),
    ('IV.B.2', 'Jaarrekeningen', 'Kan de ondernemer balansen of uittreksels uit balansen overleggen van de afgelopen drie boekjaren?', FALSE, 2),
    ('IV.B.3', 'Beroepsaansprakelijkheidsverzekering', 'Beschikt de ondernemer over een beroepsrisicoverzekering met een dekking van het vereiste minimum?', FALSE, 3),
    ('IV.B.4', 'Financiële ratio''s', 'Voldoet de ondernemer aan de vereiste financiële ratio''s (bijv. solvabiliteit, liquiditeit)?', FALSE, 4)
) AS q(question_number, title, description, is_mandatory, sort_order)
WHERE s.section_key = 'IV.B';

-- Part IV.C — Technische en beroepsbekwaamheid (optional)
INSERT INTO uea_questions (section_id, question_number, title, description, is_mandatory, sort_order)
SELECT s.id, q.question_number, q.title, q.description, q.is_mandatory, q.sort_order
FROM uea_sections s
CROSS JOIN (VALUES
    ('IV.C.1', 'Referenties vergelijkbare opdrachten', 'Kan de ondernemer referenties overleggen van vergelijkbare opdrachten uitgevoerd in de afgelopen drie jaar?', FALSE, 1),
    ('IV.C.2', 'Technisch personeel', 'Beschikt de ondernemer over voldoende gekwalificeerd technisch personeel voor de uitvoering van de opdracht?', FALSE, 2),
    ('IV.C.3', 'Technische uitrusting en middelen', 'Beschikt de ondernemer over de technische uitrusting en middelen die nodig zijn voor de uitvoering?', FALSE, 3),
    ('IV.C.4', 'Kwaliteitsbewakingsmaatregelen', 'Welke kwaliteitsbewakingsmaatregelen past de ondernemer toe bij de uitvoering van opdrachten?', FALSE, 4),
    ('IV.C.5', 'Opleidingen en beroepskwalificaties', 'Beschikken de leidinggevenden en het sleutelpersoneel over de vereiste opleidingen en beroepskwalificaties?', FALSE, 5),
    ('IV.C.6', 'Milieubeheermaatregelen', 'Welke milieubeheermaatregelen kan de ondernemer toepassen bij de uitvoering van de opdracht?', FALSE, 6)
) AS q(question_number, title, description, is_mandatory, sort_order)
WHERE s.section_key = 'IV.C';

-- Part IV.D — Kwaliteitsbewaking en milieubeheer (optional)
INSERT INTO uea_questions (section_id, question_number, title, description, is_mandatory, sort_order)
SELECT s.id, q.question_number, q.title, q.description, q.is_mandatory, q.sort_order
FROM uea_sections s
CROSS JOIN (VALUES
    ('IV.D.1', 'Kwaliteitscertificaten (ISO 9001 e.d.)', 'Kan de ondernemer certificaten overleggen van onafhankelijke instanties die aantonen dat de ondernemer voldoet aan kwaliteitsnormen?', FALSE, 1),
    ('IV.D.2', 'Milieucertificaten (ISO 14001 e.d.)', 'Kan de ondernemer certificaten of bewijs overleggen van milieubeheermaatregelen of milieubeheersystemen?', FALSE, 2)
) AS q(question_number, title, description, is_mandatory, sort_order)
WHERE s.section_key = 'IV.D';
