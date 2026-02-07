-- Seed document_types with standard Dutch procurement document types
-- These are used by the briefing AI to generate artifacts after briefing completion

INSERT INTO document_types (name, slug, description, template_structure, applicable_procedures, sort_order) VALUES

-- 1. Beschrijvend document (Aanbestedingsleidraad)
(
  'Aanbestedingsleidraad',
  'aanbestedingsleidraad',
  'Het hoofddocument van de aanbesteding met alle procedurele informatie, eisen en voorwaarden.',
  '[
    {"key": "inleiding", "title": "Inleiding", "description": "Introductie van de aanbesteding: doel, achtergrond en opzet van het document."},
    {"key": "opdrachtbeschrijving", "title": "Opdrachtbeschrijving", "description": "Gedetailleerde beschrijving van de opdracht: wat wordt ingekocht, scope, context en doelstellingen."},
    {"key": "procedure", "title": "Aanbestedingsprocedure", "description": "Beschrijving van de gevolgde procedure, toepasselijke wetgeving, planning en termijnen."},
    {"key": "geschiktheidseisen", "title": "Geschiktheidseisen", "description": "Eisen waaraan inschrijvers moeten voldoen: financieel, technisch, beroepsbekwaamheid (art. 2.90 Aw 2012)."},
    {"key": "uitsluitingsgronden", "title": "Uitsluitingsgronden", "description": "Verplichte en facultatieve uitsluitingsgronden conform art. 2.86-2.88 Aw 2012."},
    {"key": "gunningscriteria", "title": "Gunningscriteria", "description": "Gunningscriteria, subcriteria, weging en beoordelingsmethodiek (art. 2.114 Aw 2012)."},
    {"key": "inschrijving", "title": "Inschrijvingsvoorwaarden", "description": "Praktische voorwaarden voor het indienen van een inschrijving: format, documenten, termijnen."},
    {"key": "overig", "title": "Overige bepalingen", "description": "Aanvullende bepalingen zoals rechtsbescherming, geheimhouding, klachtenregeling."}
  ]'::jsonb,
  '{}',
  1
),

-- 2. Selectieleidraad (voor niet-openbare en mededingingsprocedures)
(
  'Selectieleidraad',
  'selectieleidraad',
  'Document voor de selectiefase bij niet-openbare procedures en mededingingsprocedures met onderhandeling.',
  '[
    {"key": "inleiding", "title": "Inleiding", "description": "Introductie van de selectieprocedure: doel en opzet."},
    {"key": "opdrachtbeschrijving", "title": "Opdrachtbeschrijving", "description": "Korte beschrijving van de opdracht waarvoor kandidaten worden geselecteerd."},
    {"key": "selectieprocedure", "title": "Selectieprocedure", "description": "Beschrijving van de selectiefase: procedure, planning, aantal te selecteren kandidaten."},
    {"key": "uitsluitingsgronden", "title": "Uitsluitingsgronden", "description": "Verplichte en facultatieve uitsluitingsgronden voor de selectiefase."},
    {"key": "geschiktheidseisen", "title": "Geschiktheidseisen", "description": "Minimumeisen waaraan kandidaten moeten voldoen om voor selectie in aanmerking te komen."},
    {"key": "selectiecriteria", "title": "Selectiecriteria", "description": "Criteria en methode voor het selecteren van kandidaten bij overselectie."},
    {"key": "aanmelding", "title": "Aanmeldingsvoorwaarden", "description": "Praktische voorwaarden voor het indienen van een aanmelding."}
  ]'::jsonb,
  '{restricted,negotiated_with_publication,competitive_dialogue,innovation_partnership,national_restricted}',
  2
),

-- 3. Programma van Eisen
(
  'Programma van Eisen',
  'programma-van-eisen',
  'Specificatie van alle functionele en technische eisen waaraan de oplossing of dienst moet voldoen.',
  '[
    {"key": "inleiding", "title": "Inleiding", "description": "Introductie en leeswijzer voor het Programma van Eisen."},
    {"key": "functionele-eisen", "title": "Functionele eisen", "description": "Eisen aan de functionaliteit en werking van de gevraagde oplossing of dienst."},
    {"key": "technische-eisen", "title": "Technische eisen", "description": "Technische specificaties, standaarden en randvoorwaarden."},
    {"key": "kwaliteitseisen", "title": "Kwaliteitseisen", "description": "Eisen aan kwaliteitsborging, certificeringen en normen."},
    {"key": "wensen", "title": "Wensen", "description": "Gewenste maar niet verplichte eigenschappen die meerwaarde leveren."}
  ]'::jsonb,
  '{}',
  3
),

-- 4. Conceptovereenkomst
(
  'Conceptovereenkomst',
  'conceptovereenkomst',
  'De conceptversie van de overeenkomst die met de winnende inschrijver wordt gesloten.',
  '[
    {"key": "definities", "title": "Definities en begrippen", "description": "Definities van gebruikte begrippen in de overeenkomst."},
    {"key": "voorwerp", "title": "Voorwerp van de overeenkomst", "description": "Beschrijving van de te leveren prestatie, scope en afbakening."},
    {"key": "looptijd", "title": "Looptijd en opzegging", "description": "Duur van de overeenkomst, verlengingsopties en opzegmogelijkheden."},
    {"key": "prijs", "title": "Prijs en betaling", "description": "Prijsafspraken, facturering, betalingstermijnen en indexering."},
    {"key": "verplichtingen", "title": "Verplichtingen partijen", "description": "Wederzijdse verplichtingen van opdrachtgever en opdrachtnemer."},
    {"key": "aansprakelijkheid", "title": "Aansprakelijkheid en verzekering", "description": "Aansprakelijkheidsbepalingen, beperkingen en verzekeringseisen."},
    {"key": "geheimhouding", "title": "Geheimhouding en privacy", "description": "Bepalingen over geheimhouding, verwerking persoonsgegevens en AVG."},
    {"key": "geschillen", "title": "Geschillenregeling", "description": "Toepasselijk recht en wijze van geschilbeslechting."}
  ]'::jsonb,
  '{}',
  4
),

-- 5. Nota van Inlichtingen
(
  'Nota van Inlichtingen',
  'nota-van-inlichtingen',
  'Document met vragen van gegadigden en antwoorden van de aanbestedende dienst.',
  '[
    {"key": "inleiding", "title": "Inleiding", "description": "Introductie met verwijzing naar de oorspronkelijke aanbestedingsstukken en wijzigingen."},
    {"key": "vragen-antwoorden", "title": "Vragen en antwoorden", "description": "Overzicht van ingediende vragen en bijbehorende antwoorden, gegroepeerd per onderwerp."},
    {"key": "wijzigingen", "title": "Wijzigingen en rectificaties", "description": "Eventuele wijzigingen in de aanbestedingsstukken naar aanleiding van de vragen."}
  ]'::jsonb,
  '{}',
  5
);
