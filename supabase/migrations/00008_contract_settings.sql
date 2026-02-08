-- Sprint R7: Contract settings for Conceptovereenkomst wizard
-- Adds contract type and general conditions selection to projects

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE contract_type AS ENUM ('diensten', 'leveringen', 'werken');

CREATE TYPE general_conditions_type AS ENUM (
  'arvodi_2018',
  'ariv_2018',
  'uav_gc_2005',
  'uav_2012',
  'dnr_2011',
  'custom'
);

-- =============================================================================
-- ADD COLUMNS TO PROJECTS
-- =============================================================================

ALTER TABLE projects
  ADD COLUMN contract_type contract_type DEFAULT NULL,
  ADD COLUMN general_conditions general_conditions_type DEFAULT NULL;

-- =============================================================================
-- STANDARD TEXT TABLE — reference data for article templates per conditions type
-- =============================================================================

CREATE TABLE contract_standard_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL,
  general_conditions general_conditions_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (section_key, general_conditions)
);

-- Index for fast lookups
CREATE INDEX idx_contract_standard_texts_lookup
  ON contract_standard_texts (section_key, general_conditions)
  WHERE is_active = TRUE;

-- Updated_at trigger
CREATE TRIGGER set_contract_standard_texts_updated_at
  BEFORE UPDATE ON contract_standard_texts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS POLICIES — contract_standard_texts is read-only reference data
-- =============================================================================

ALTER TABLE contract_standard_texts ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read standard texts
CREATE POLICY "Authenticated users can read standard texts"
  ON contract_standard_texts FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- =============================================================================
-- SEED STANDARD TEXTS — ARVODI-2018 (IT-diensten)
-- =============================================================================

INSERT INTO contract_standard_texts (section_key, general_conditions, title, content, sort_order) VALUES

('definities', 'arvodi_2018', 'Definities en begrippen',
'<h2>Artikel 1 — Definities</h2>
<p>In deze Overeenkomst wordt verstaan onder:</p>
<ul>
<li><strong>Opdrachtgever</strong>: de in de Overeenkomst als zodanig aangeduide partij;</li>
<li><strong>Opdrachtnemer</strong>: de in de Overeenkomst als zodanig aangeduide partij;</li>
<li><strong>Overeenkomst</strong>: de schriftelijke overeenkomst tussen Opdrachtgever en Opdrachtnemer, inclusief alle bijlagen;</li>
<li><strong>Prestatie</strong>: de door Opdrachtnemer te leveren diensten en/of producten zoals omschreven in de Overeenkomst;</li>
<li><strong>ARVODI-2018</strong>: de Algemene Rijksvoorwaarden bij IT-overeenkomsten 2018;</li>
<li><strong>Werkdagen</strong>: maandag tot en met vrijdag, uitgezonderd erkende feestdagen.</li>
</ul>', 1),

('voorwerp', 'arvodi_2018', 'Voorwerp van de overeenkomst',
'<h2>Artikel 2 — Voorwerp van de overeenkomst</h2>
<p>Opdrachtnemer verbindt zich om ten behoeve van Opdrachtgever de in de Overeenkomst omschreven Prestatie te verrichten, conform de eisen en voorwaarden zoals opgenomen in de aanbestedingsstukken en het Programma van Eisen.</p>
<p>De Prestatie omvat in ieder geval:</p>
<ul>
<li>Het leveren, implementeren en onderhouden van de in het Programma van Eisen beschreven IT-oplossing;</li>
<li>Het verlenen van de bijbehorende dienstverlening en ondersteuning;</li>
<li>Het verzorgen van kennisoverdracht en documentatie.</li>
</ul>', 2),

('looptijd', 'arvodi_2018', 'Looptijd en opzegging',
'<h2>Artikel 3 — Looptijd en opzegging</h2>
<p>De Overeenkomst wordt aangegaan voor een periode van [DUUR] jaar, ingaande op de datum van ondertekening.</p>
<p>De Overeenkomst kan door Opdrachtgever worden verlengd met maximaal [AANTAL] perioden van telkens [DUUR] jaar. Verlenging geschiedt door schriftelijke mededeling uiterlijk drie (3) maanden voor het einde van de lopende periode.</p>
<p>Opdrachtgever is te allen tijde gerechtigd de Overeenkomst geheel of gedeeltelijk op te zeggen met inachtneming van een opzegtermijn van drie (3) maanden, zonder dat Opdrachtgever tot enige schadevergoeding is gehouden.</p>', 3),

('prijs', 'arvodi_2018', 'Prijs en betaling',
'<h2>Artikel 4 — Prijs en betaling</h2>
<p>De totale prijs voor de Prestatie bedraagt € [BEDRAG] exclusief btw, conform de prijsopgave in de inschrijving van Opdrachtnemer.</p>
<p>Facturering geschiedt maandelijks achteraf op basis van daadwerkelijk verrichte werkzaamheden. Opdrachtgever betaalt binnen dertig (30) dagen na ontvangst van een correcte factuur.</p>
<p>De prijzen zijn vast gedurende het eerste contractjaar. Na het eerste jaar kunnen prijzen jaarlijks worden geïndexeerd op basis van het CBS-consumentenprijsindexcijfer.</p>', 4),

('verplichtingen', 'arvodi_2018', 'Verplichtingen partijen',
'<h2>Artikel 5 — Verplichtingen partijen</h2>
<h3>5.1 Verplichtingen Opdrachtnemer</h3>
<p>Opdrachtnemer verplicht zich:</p>
<ul>
<li>de Prestatie te verrichten naar beste inzicht en vermogen en overeenkomstig de eisen van goed vakmanschap;</li>
<li>gekwalificeerd personeel in te zetten dat beschikt over de benodigde kennis en ervaring;</li>
<li>bij vervanging van personeel vooraf toestemming te vragen aan Opdrachtgever;</li>
<li>alle relevante wet- en regelgeving na te leven.</li>
</ul>
<h3>5.2 Verplichtingen Opdrachtgever</h3>
<p>Opdrachtgever verplicht zich:</p>
<ul>
<li>tijdig alle informatie te verstrekken die Opdrachtnemer redelijkerwijs nodig heeft;</li>
<li>een contactpersoon aan te wijzen die bevoegd is namens Opdrachtgever besluiten te nemen;</li>
<li>de benodigde faciliteiten en toegang te verlenen.</li>
</ul>', 5),

('aansprakelijkheid', 'arvodi_2018', 'Aansprakelijkheid en verzekering',
'<h2>Artikel 6 — Aansprakelijkheid en verzekering</h2>
<p>De aansprakelijkheid van Opdrachtnemer voor schade als gevolg van een toerekenbare tekortkoming in de nakoming van de Overeenkomst is beperkt tot het bedrag dat de verzekeraar in het desbetreffende geval uitkeert, met een maximum van tweemaal de jaarlijkse opdrachtwaarde.</p>
<p>De beperking van aansprakelijkheid geldt niet in geval van opzet of bewuste roekeloosheid van Opdrachtnemer of diens leidinggevenden.</p>
<p>Opdrachtnemer is verplicht een adequate beroepsaansprakelijkheidsverzekering in stand te houden gedurende de looptijd van de Overeenkomst, met een dekking van ten minste € [BEDRAG] per gebeurtenis.</p>', 6),

('geheimhouding', 'arvodi_2018', 'Geheimhouding en privacy',
'<h2>Artikel 7 — Geheimhouding en privacy</h2>
<p>Partijen zijn verplicht tot geheimhouding van alle vertrouwelijke informatie die zij in het kader van de Overeenkomst van elkaar ontvangen. Deze verplichting geldt ook na beëindiging van de Overeenkomst.</p>
<p>Indien Opdrachtnemer bij de uitvoering van de Overeenkomst persoonsgegevens verwerkt, wordt een verwerkersovereenkomst conform artikel 28 AVG afgesloten als bijlage bij deze Overeenkomst.</p>
<p>Opdrachtnemer treft passende technische en organisatorische maatregelen om persoonsgegevens te beveiligen tegen verlies of onrechtmatige verwerking, conform artikel 32 AVG.</p>', 7),

('geschillen', 'arvodi_2018', 'Geschillenregeling',
'<h2>Artikel 8 — Geschillenregeling</h2>
<p>Op deze Overeenkomst is Nederlands recht van toepassing.</p>
<p>Geschillen die voortvloeien uit of verband houden met deze Overeenkomst worden in eerste instantie beslecht door middel van overleg tussen de contactpersonen van Partijen.</p>
<p>Indien het geschil niet binnen dertig (30) dagen na het eerste overleg is opgelost, kunnen Partijen het geschil voorleggen aan mediation conform het Mediationreglement van de Stichting ADR.</p>
<p>Indien mediation niet tot een oplossing leidt, wordt het geschil beslecht door de bevoegde rechter te Den Haag.</p>', 8);

-- =============================================================================
-- SEED STANDARD TEXTS — ARIV-2018 (Algemene inkoop)
-- =============================================================================

INSERT INTO contract_standard_texts (section_key, general_conditions, title, content, sort_order) VALUES

('definities', 'ariv_2018', 'Definities en begrippen',
'<h2>Artikel 1 — Definities</h2>
<p>In deze Overeenkomst wordt verstaan onder:</p>
<ul>
<li><strong>Opdrachtgever</strong>: de in de Overeenkomst als zodanig aangeduide partij;</li>
<li><strong>Opdrachtnemer</strong>: de in de Overeenkomst als zodanig aangeduide partij;</li>
<li><strong>Overeenkomst</strong>: de schriftelijke overeenkomst tussen Opdrachtgever en Opdrachtnemer;</li>
<li><strong>Levering</strong>: de door Opdrachtnemer te leveren zaken en/of diensten;</li>
<li><strong>ARIV-2018</strong>: de Algemene Rijksinkoopvoorwaarden 2018;</li>
<li><strong>Werkdagen</strong>: maandag tot en met vrijdag, uitgezonderd erkende feestdagen.</li>
</ul>', 1),

('voorwerp', 'ariv_2018', 'Voorwerp van de overeenkomst',
'<h2>Artikel 2 — Voorwerp van de overeenkomst</h2>
<p>Opdrachtnemer verbindt zich tot het leveren van de in de Overeenkomst omschreven zaken en/of diensten, conform de specificaties in het Programma van Eisen en de inschrijving van Opdrachtnemer.</p>
<p>De levering geschiedt conform de ARIV-2018, tenzij in deze Overeenkomst uitdrukkelijk anders is bepaald.</p>', 2),

('looptijd', 'ariv_2018', 'Looptijd en opzegging',
'<h2>Artikel 3 — Looptijd en opzegging</h2>
<p>De Overeenkomst wordt aangegaan voor een periode van [DUUR] jaar, ingaande op de datum van ondertekening.</p>
<p>De Overeenkomst kan worden verlengd met maximaal [AANTAL] perioden van telkens [DUUR] jaar.</p>
<p>Opzegging geschiedt schriftelijk met inachtneming van een termijn van drie (3) maanden.</p>', 3),

('prijs', 'ariv_2018', 'Prijs en betaling',
'<h2>Artikel 4 — Prijs en betaling</h2>
<p>De prijzen zijn conform de inschrijving van Opdrachtnemer. Alle prijzen zijn exclusief btw en inclusief alle overige kosten.</p>
<p>Betaling geschiedt binnen dertig (30) dagen na ontvangst van een correcte factuur.</p>
<p>Prijsindexering is mogelijk na het eerste jaar op basis van CBS-indexcijfers.</p>', 4),

('verplichtingen', 'ariv_2018', 'Verplichtingen partijen',
'<h2>Artikel 5 — Verplichtingen partijen</h2>
<p>Opdrachtnemer levert conform de overeengekomen specificaties, kwaliteitsnormen en termijnen. Opdrachtnemer informeert Opdrachtgever onverwijld bij dreigende vertraging of afwijking.</p>
<p>Opdrachtgever stelt tijdig alle benodigde informatie beschikbaar en wijst een contactpersoon aan.</p>', 5),

('aansprakelijkheid', 'ariv_2018', 'Aansprakelijkheid en verzekering',
'<h2>Artikel 6 — Aansprakelijkheid en verzekering</h2>
<p>De aansprakelijkheid van Opdrachtnemer is beperkt tot directe schade en bedraagt maximaal de factuurwaarde van de Overeenkomst op jaarbasis.</p>
<p>Opdrachtnemer houdt een adequate aansprakelijkheidsverzekering in stand gedurende de looptijd van de Overeenkomst.</p>', 6),

('geheimhouding', 'ariv_2018', 'Geheimhouding en privacy',
'<h2>Artikel 7 — Geheimhouding en privacy</h2>
<p>Partijen verplichten zich tot geheimhouding van vertrouwelijke informatie, ook na beëindiging van de Overeenkomst.</p>
<p>Bij verwerking van persoonsgegevens wordt een verwerkersovereenkomst conform de AVG afgesloten.</p>', 7),

('geschillen', 'ariv_2018', 'Geschillenregeling',
'<h2>Artikel 8 — Geschillenregeling</h2>
<p>Op deze Overeenkomst is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter te Den Haag.</p>', 8);
