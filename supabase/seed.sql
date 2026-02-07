-- Seed data for Tendermanager development

-- =============================================================================
-- DOCUMENT TYPES (templates for aanbestedingsdocumenten)
-- =============================================================================

INSERT INTO document_types (name, slug, description, template_structure, applicable_procedures, sort_order) VALUES
(
    'Programma van Eisen',
    'programma-van-eisen',
    'Het Programma van Eisen beschrijft de functionele en technische eisen waaraan de te leveren dienst, product of werk moet voldoen.',
    '[
        {"key": "introduction", "title": "Inleiding", "description": "Beschrijving van het project en de context"},
        {"key": "scope", "title": "Scope en afbakening", "description": "Wat valt wel en niet binnen het project"},
        {"key": "functional_requirements", "title": "Functionele eisen", "description": "Wat moet het resultaat kunnen"},
        {"key": "technical_requirements", "title": "Technische eisen", "description": "Technische specificaties en standaarden"},
        {"key": "quality_requirements", "title": "Kwaliteitseisen", "description": "Eisen aan kwaliteit, certificeringen, normen"},
        {"key": "planning", "title": "Planning en doorlooptijd", "description": "Tijdlijn, milestones, deadlines"},
        {"key": "budget", "title": "Budget en financiering", "description": "Beschikbaar budget en betalingsvoorwaarden"}
    ]'::jsonb,
    ARRAY['open', 'restricted', 'negotiated_with_publication', 'competitive_dialogue', 'national_open', 'national_restricted']::procedure_type[],
    1
),
(
    'Selectieleidraad',
    'selectieleidraad',
    'De Selectieleidraad beschrijft de eisen waaraan gegadigden moeten voldoen en de criteria voor selectie.',
    '[
        {"key": "introduction", "title": "Inleiding", "description": "Aanleiding en doel van de aanbesteding"},
        {"key": "contracting_authority", "title": "Aanbestedende dienst", "description": "Informatie over de opdrachtgever"},
        {"key": "procedure", "title": "Procedure", "description": "Beschrijving van de aanbestedingsprocedure"},
        {"key": "exclusion_grounds", "title": "Uitsluitingsgronden", "description": "Gronden voor uitsluiting van deelname"},
        {"key": "suitability_requirements", "title": "Geschiktheidseisen", "description": "Eisen aan technische en financiële geschiktheid"},
        {"key": "selection_criteria", "title": "Selectiecriteria", "description": "Criteria voor het selecteren van gegadigden"},
        {"key": "submission", "title": "Inschrijving", "description": "Wijze van indienen en vereiste documenten"},
        {"key": "timeline", "title": "Planning", "description": "Tijdlijn van de aanbestedingsprocedure"}
    ]'::jsonb,
    ARRAY['restricted', 'negotiated_with_publication', 'competitive_dialogue']::procedure_type[],
    2
),
(
    'Beschrijvend Document',
    'beschrijvend-document',
    'Het Beschrijvend Document bevat alle informatie die inschrijvers nodig hebben voor het opstellen van hun inschrijving.',
    '[
        {"key": "introduction", "title": "Inleiding", "description": "Context en aanleiding"},
        {"key": "assignment", "title": "Opdrachtbeschrijving", "description": "Gedetailleerde beschrijving van de opdracht"},
        {"key": "requirements", "title": "Eisen en wensen", "description": "Eisen waaraan moet worden voldaan"},
        {"key": "award_criteria", "title": "Gunningscriteria", "description": "Criteria waarop inschrijvingen worden beoordeeld"},
        {"key": "contract_terms", "title": "Contractvoorwaarden", "description": "Voorwaarden van de overeenkomst"},
        {"key": "submission_requirements", "title": "Inschrijvingsvereisten", "description": "Wat moet de inschrijving bevatten"},
        {"key": "procedure_rules", "title": "Procedureregels", "description": "Regels en voorwaarden van de procedure"}
    ]'::jsonb,
    ARRAY['open', 'restricted', 'negotiated_with_publication', 'competitive_dialogue', 'national_open']::procedure_type[],
    3
),
(
    'Nota van Inlichtingen',
    'nota-van-inlichtingen',
    'De Nota van Inlichtingen bevat antwoorden op vragen van gegadigden/inschrijvers en eventuele wijzigingen op de aanbestedingsdocumenten.',
    '[
        {"key": "introduction", "title": "Inleiding", "description": "Verwijzing naar de oorspronkelijke aanbesteding"},
        {"key": "questions_answers", "title": "Vragen en antwoorden", "description": "Overzicht van gestelde vragen met antwoorden"},
        {"key": "amendments", "title": "Wijzigingen", "description": "Wijzigingen op eerder gepubliceerde documenten"},
        {"key": "timeline_updates", "title": "Planningswijzigingen", "description": "Eventuele aanpassingen in de planning"}
    ]'::jsonb,
    ARRAY['open', 'restricted', 'negotiated_with_publication', 'competitive_dialogue', 'national_open', 'national_restricted']::procedure_type[],
    4
),
(
    'Aankondiging van Opdracht',
    'aankondiging-van-opdracht',
    'De Aankondiging van een Opdracht is de officiële publicatie op TenderNed waarmee de aanbesteding wordt gestart.',
    '[
        {"key": "contracting_authority", "title": "Aanbestedende dienst", "description": "Gegevens van de aanbestedende dienst"},
        {"key": "object", "title": "Voorwerp van de opdracht", "description": "Beschrijving van de opdracht"},
        {"key": "legal_info", "title": "Juridische informatie", "description": "Toepasselijke wetgeving en voorwaarden"},
        {"key": "procedure_info", "title": "Procedure-informatie", "description": "Type procedure en termijnen"},
        {"key": "complementary_info", "title": "Aanvullende inlichtingen", "description": "Overige relevante informatie"}
    ]'::jsonb,
    ARRAY['open', 'restricted', 'negotiated_with_publication', 'competitive_dialogue', 'innovation_partnership', 'national_open', 'national_restricted']::procedure_type[],
    5
);
