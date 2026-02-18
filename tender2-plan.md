# TenderManager v2 — Volledig Bouwplan

> **Status**: Brainstorm afgerond — wacht op "akkoord" voor implementatie
> **Datum**: 17 februari 2026
> **Auteur**: Melissa (Mevrouw de Adviseur) + Claude

---

## Inhoudsopgave

1. [Projectoverzicht](#1-projectoverzicht)
2. [Agents & Rolverdeling](#2-agents--rolverdeling)
3. [Feature Plan](#3-feature-plan)
4. [Architectuur](#4-architectuur)
5. [Database Schema — Huidige Staat](#5-database-schema--huidige-staat)
6. [Database Wijzigingen — Nieuwe Tabellen & Kolommen](#6-database-wijzigingen--nieuwe-tabellen--kolommen)
7. [KVK API Integratie](#7-kvk-api-integratie)
8. [Multi-Organisatie Model](#8-multi-organisatie-model)
9. [Leveranciers CRM](#9-leveranciers-crm)
10. [Correspondentie als Documenten](#10-correspondentie-als-documenten)
11. [Binnenkomende Vragen Module](#11-binnenkomende-vragen-module)
12. [Document Template Engine](#12-document-template-engine)
13. [Editor Refactoring](#13-editor-refactoring)
14. [Data Governance & Retentie](#14-data-governance--retentie)
15. [Implementatievolgorde](#15-implementatievolgorde)
16. [Testplan](#16-testplan)
17. [Open Vragen & Beslissingen](#17-open-vragen--beslissingen)

---

## 1. Projectoverzicht

TenderManager is een AI-gedreven aanbestedingsplatform voor de Nederlandse overheid, gebouwd met SvelteKit + Supabase. Het begeleidt inkoopadviseurs door vijf projectfasen: Voorbereiden, Marktverkennen, Specificeren, Aanbesteden en Contracteren.

### Wat wordt er gebouwd (v2)

v2 breidt het platform uit met:

- KVK API-koppeling voor organisatie- en leveranciersgegevens
- NUTS-codes automatisch koppelen op basis van postcode
- CPV-referentietabel met filtering (focus: diensten & leveringen)
- Document template engine via docxtemplater (vervangt programmatische docx-generatie)
- Multi-organisatie architectuur (Optie C: volwaardige organisaties met relaties)
- Leveranciers-CRM op organisatieniveau met lifecycle tracking
- Correspondentie behandeld als documenten met templates (11 brieftypes)
- Binnenkomende vragen module met email-parsing
- Data governance & retentie (Archiefwet 2015, AVG, configureerbaar per organisatie)
- Editor redesign (paginaminiaturen, lettertype-controle, markdown→HTML transformatie)
- Procedure-advies op basis van drempelbedragen (configureerbaar)
- Documentrollen voor template-placeholders

### Tech Stack

- **Frontend**: SvelteKit (Svelte classic syntax — `export let`, `$:`)
- **Database**: Supabase (PostgreSQL + Storage + RLS)
- **Editor**: TipTap met extensies
- **AI**: OpenAI GPT-4o
- **Templates**: docxtemplater (JS)
- **Extern**: KVK Zoeken API + Basisprofiel API
- **Taal**: TypeScript strict, code Engels, UI Nederlands

---

## 2. Agents & Rolverdeling

> Volledige agent-definities, territoriumkaart en alle 25 regels staan in `AGENTS.MD`.
> Per-agent instructies staan in `docs/agent-{nr}-{naam}.md`.

| Agent | Naam | Domein | Volgorde |
|-------|------|--------|----------|
| 1 | Data & Backend | Database, API routes, validatie, types, RLS | Eerst |
| 2 | Frontend & UI | Svelte pagina's, componenten, stores | Na Agent 1 |
| 3 | Editor & Documents | TipTap, docxtemplater, templates, export | Na Agent 1 |
| 4 | AI & Integratie | LLM, KVK API, email-parsing, markdown→HTML | Parallel met 2/3 |
| 5 | Platform & Governance | Multi-org admin, retentie, analytics | Na Agent 1 |
| 6 | Testing & DevOps | Tests, CI/CD, quality checks, deployment | Doorlopend |

### Agent-toewijzing per feature

| Feature | Agent(s) |
|---------|----------|
| KVK API | 1 (backend) + 4 (API client) + 2 (UI) |
| NUTS-codes | 1 (tabel + mapping) + 2 (selector) |
| CPV-codes | 1 (tabel + import) + 2 (selector) |
| Document Templates | 1 (storage) + 3 (docxtemplater) + 2 (upload UI) |
| Multi-Organisatie | 1 (schema + RLS) + 2 (context-switcher) + 5 (settings) |
| Leveranciers CRM | 1 (schema + API) + 2 (UI + drawer) + 4 (KVK lookup) |
| Binnenkomende Vragen | 1 (schema + API) + 2 (UI) + 4 (email parsing + AI) |
| Data Governance | 1 (schema) + 5 (cron + admin) + 6 (tests) |
| Editor Refactoring | 3 (editor + templates) + 2 (UI) + 4 (markdown→HTML) |
| Correspondentie Merge | 1 (schema) + 3 (templates) + 2 (UI refactor) |
| Procedure-advies | 1 (drempelwaarden) + 2 (UI + waarschuwing) |

---

## 3. Feature Plan

### 3.1 KVK API Integratie

| # | Deelstap | Agent | Omschrijving |
|---|---------|-------|-------------|
| 1.1 | KVK-lookup endpoint | 1 | Server-side API route die KVK Zoeken + Basisprofiel aanroept |
| 1.2 | Organization tabel uitbreiding | 1 | Kolommen: kvk_nummer, handelsnaam, rechtsvorm, straat, postcode, plaats, sbi_codes |
| 1.3 | Organization aanmaak UI | 2 | KVK-zoek formulier bij organisatie registratie, auto-fill velden |
| 1.4 | TypeScript types update | 1 | Types uitbreiden met nieuwe velden |

### 3.2 NUTS-codes Automatisch Koppelen

| # | Deelstap | Agent | Omschrijving |
|---|---------|-------|-------------|
| 2.1 | NUTS referentietabel | 1 | Alle NL NUTS-codes met hiërarchie (level 0-3) |
| 2.2 | Postcode-NUTS mapping | 1 | Koppeltabel postcode_prefix → nuts3_code |
| 2.3 | Auto-linking bij KVK import | 4 | Na ophalen KVK-adres, automatisch NUTS koppelen |
| 2.4 | NUTS-selector UI | 2 | Doorzoekbare dropdown met hiërarchie |

### 3.3 CPV-codes met Filtering

| # | Deelstap | Agent | Omschrijving |
|---|---------|-------|-------------|
| 3.1 | CPV referentietabel | 1 | Tabel met code, beschrijving, divisie, groep, klasse, categorie |
| 3.2 | CPV Excel import script | 1 | Eenmalige migratie vanuit bestaand Excel-bestand |
| 3.3 | Categorie-filter endpoint | 1 | API endpoint met filter op werken/leveringen/diensten |
| 3.4 | CPV-selector component | 2 | Doorzoekbare dropdown met hiërarchisch filter |
| 3.5 | CPV → ordertype mapping | 1 | Logic die CPV-divisie koppelt aan ordertype |

### 3.4 Document Template Engine

| # | Deelstap | Agent | Omschrijving |
|---|---------|-------|-------------|
| 4.1 | Template opslagsysteem | 1 | Supabase Storage bucket + metadata tabel |
| 4.2 | docxtemplater integratie | 3 | Server-side rendering van .docx templates |
| 4.3 | Placeholder definitie | 3 | Standaard set: {org_name}, {kvk_nummer}, {scope}, etc. |
| 4.4 | Template upload UI | 2 | Admin pagina voor uploaden en beheren templates |
| 4.5 | Export refactor | 3 | Huidige export.ts vervangen door template-based flow |
| 4.6 | Logo/briefpapier in template | 3 | Logo's en huisstijl vanuit template (niet code) |
| 4.7 | CPV-type → template mapping | 1 | Juiste template selecteren op basis van ordertype |
| 4.8 | Vast vs dynamisch content | 3 | Drie content-typen: vast, database, AI-gegenereerd |

### 3.5 Multi-Organisatie (Optie C)

| # | Deelstap | Agent | Omschrijving |
|---|---------|-------|-------------|
| 5.1 | Organisatie uitbreiding | 1 | parent_organization_id, organization_type, aanbestedende_dienst_type |
| 5.2 | Organization relationships tabel | 1 | Relaties tussen organisaties (consultant↔klant) |
| 5.3 | Organization members uitbreiding | 1 | source_organization_id voor externe leden |
| 5.4 | Context-switcher UI | 2 | Dropdown in sidebar om van organisatie te wisselen |
| 5.5 | RLS policies aanpassing | 1 | Alle queries scoped naar actieve organisatie |
| 5.6 | Organization settings pagina | 2+5 | Instellingen per organisatie |

### 3.6 Leveranciers CRM (Organisatieniveau)

| # | Deelstap | Agent | Omschrijving |
|---|---------|-------|-------------|
| 6.1 | Suppliers tabel | 1 | KVK data, contacten, tags, beoordeling |
| 6.2 | Project-suppliers koppeltabel | 1 | Status lifecycle: prospect→ingeschreven→gewonnen/afgewezen→gecontracteerd |
| 6.3 | KVK lookup voor leveranciers | 4 | Zelfde KVK endpoint hergebruiken |
| 6.4 | Leveranciers lijstpagina | 2 | Organisatieniveau overzicht |
| 6.5 | Leverancier drawer | 2 | 40% breed, tabs: Overzicht, Aanbestedingen, Correspondentie, Kwalificatie, Notities |
| 6.6 | Contactpersonen als aparte records | 1 | Meerdere contacten per leverancier |
| 6.7 | Leverancier in projectcontext | 2 | Leverancier koppelen aan project met status |
| 6.8 | Auto-linking correspondentie | 4 | Brieven automatisch koppelen aan leverancier |

### 3.7 Binnenkomende Vragen Module

| # | Deelstap | Agent | Omschrijving |
|---|---------|-------|-------------|
| 7.1 | incoming_questions tabel | 1 | Vraagnummer, tekst, documentreferentie, status-flow |
| 7.2 | Vraag registratie UI | 2 | Formulier voor handmatige invoer + email import |
| 7.3 | Vragen beantwoorden (AI via RAG) | 4 | AI-suggestie op basis van projectdocumenten |
| 7.4 | NvI genereren uit vragen | 3+4 | Alle goedgekeurde Q&A's samenvoegen tot document |

### 3.8 Data Governance & Retentie

| # | Deelstap | Agent | Omschrijving |
|---|---------|-------|-------------|
| 8.1 | Governance velden op tabellen | 1 | data_classification, retention_until, anonymized_at, archive_status |
| 8.2 | Organization settings tabel | 1 | Configureerbare retentietermijnen per organisatie |
| 8.3 | Selectielijst profielen | 5 | VNG 2020, PROVISA als voorgedefinieerde profielen |
| 8.4 | Retentie signalering | 5 | Cron job detecteert verlopen termijnen, notificeert admin |
| 8.5 | Anonimisatiefunctie | 5 | PII vervangen door pseudoniemen (Persoon A, Bedrijf B) |

### 3.9 Editor Refactoring

| # | Deelstap | Agent | Omschrijving |
|---|---------|-------|-------------|
| 9.1 | Paginaminiaturen | 3 | Vervang StepperSidebar door Word-achtige previews |
| 9.2 | Lettertype controle in toolbar | 3 | Font-family + font-size per selectie (TipTap extensies) |
| 9.3 | Markdown → TipTap HTML transformatie | 4 | Conversielaag (markdown-it/remark) vóór editor |
| 9.4 | Template in editor laden | 3 | Template opmaak zichtbaar, huisstijl respecteren |
| 9.5 | Correspondentie merge | 3+2 | Brieftypes worden document-types met eigen templates |
| 9.6 | Document-level voortgang | 1+2 | Eén status per document i.p.v. per sectie |

---

## 4. Architectuur

### Lagen

| Laag | Technologie | Verantwoordelijk voor | Backend? |
|------|------------|----------------------|----------|
| Word Template | Microsoft Word | Vaste tekst, briefpapier, logo's, opmaak | Nee |
| Frontend | SvelteKit (Svelte) | UI componenten, formulieren, selectors | Nee |
| API Routes | SvelteKit (server) | Data ophalen, validatie, business logic, doc generatie | Ja |
| Database | Supabase (PostgreSQL) | Data opslag, referentietabellen, RLS policies | Ja |
| Storage | Supabase Storage | Bestanden: templates, logo's, exports | Ja |
| AI/LLM | OpenAI GPT-4o | Dynamische tekst genereren vanuit briefing | Ja |
| External API | KVK Zoeken API | Bedrijfsgegevens ophalen | Ja (server-side) |

### Wanneer is backend nodig?

1. **Data ophalen**: KVK API, database queries, leveranciersgegevens
2. **AI-content genereren**: Briefing → artifacts via LLM
3. **Samenvoegen**: Template + database-data + AI-artifacts → .docx

### Drie content-typen in templates

1. **Vast**: Al in template aanwezig — juridische clausules, standaardtekst, huisstijl
2. **Database**: `{org_name}`, `{kvk_nummer}`, `{adres}` — systeem vult automatisch in
3. **AI-gegenereerd**: `{scope_description}`, `{requirements}` — vanuit briefingflow, gebruiker reviewt

---

## 5. Database Schema — Huidige Staat

### Bestaande Tabellen (28 migraties)

#### Kern

| Tabel | Beschrijving | Belangrijke kolommen |
|-------|-------------|---------------------|
| `organizations` | Aanbestedende diensten | id, name, slug, logo_url, deleted_at |
| `profiles` | Gebruikersprofielen (extends Supabase auth) | id, first_name, last_name, email, avatar_url |
| `organization_members` | Organisatie lidmaatschap | user_id, organization_id, role (owner/admin/member) |
| `projects` | Aanbestedingsprojecten | id, organization_id, name, status, scoring_methodology |
| `project_members` | Projectteamleden | project_id, user_id |
| `project_member_roles` | Multi-role per projectlid | member_id, role (project_leader, procurement_advisor, etc.) |
| `project_profiles` | Projectdetails | project_id, contracting_authority, scope, cpv_codes[], nuts_codes[] |

#### Documenten & Content

| Tabel | Beschrijving | Belangrijke kolommen |
|-------|-------------|---------------------|
| `document_types` | Template definities | id, name, slug, category, template_structure (JSONB) |
| `artifacts` | Gegenereerde documentsecties | id, project_id, document_type_id, section_key, title, content, status |
| `artifact_versions` | Versiegeschiedenis | artifact_id, version_number, content, created_by |
| `documents` | Geüploade bestanden | id, project_id, name, storage_path, embedding |
| `document_chunks` | Chunks voor RAG | document_id, content, embedding |
| `document_comments` | Annotaties | artifact_id, content, quote_text, quote_from, quote_to |

#### Aanbestedingsinhoud

| Tabel | Beschrijving |
|-------|-------------|
| `requirements` | Programma van Eisen (eis/wens) |
| `emvi_criteria` | EMVI scoringsmethodiek |
| `contract_standard_texts` | Standaard contractartikelen (ARVODI, ARIV) |
| `uea_sections` | UEA documentonderdelen (II, III, IV) |
| `uea_questions` | UEA vragenlijst |
| `uea_project_selections` | Per-project vraag aan/uit |

#### Planning & Uitvoering

| Tabel | Beschrijving |
|-------|-------------|
| `phase_activities` | Activiteiten per projectfase |
| `milestones` | Tijdlijn ankers (publicatie, inschrijfdeadline, gunning, etc.) |
| `activity_dependencies` | Afhankelijkheden tussen activiteiten |
| `correspondence` | Brieven/communicatie per fase |
| `evaluations` | Beoordelingen en scores |

#### Knowledge Base (apart schema)

| Tabel | Beschrijving |
|-------|-------------|
| `knowledge_base.tenders` | Geharveste TenderNed aanbestedingen |
| `knowledge_base.requirements` | Eisen uit geharveste aanbestedingen |
| `knowledge_base.requirement_chunks` | Chunks met embeddings |
| `knowledge_base.harvest_log` | Harvest operatie tracking |

#### Administratief

| Tabel | Beschrijving |
|-------|-------------|
| `time_entries` | Urenregistratie per projectfase |
| `notifications` | Systeemnotificaties |
| `notification_preferences` | Notificatie-instellingen per gebruiker |
| `section_reviewers` | Externe review uitnodigingen (magic links) |
| `audit_log` | Uitgebreide audit trail |
| `conversations` | Chat gesprekken met AI |
| `messages` | Berichten in gesprekken |

### Bestaande Enums

```sql
-- Organisatierollen
CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member');

-- Projectstatus
CREATE TYPE project_status AS ENUM ('draft', 'briefing', 'generating', 'review', 'approved', 'published', 'archived');

-- Projectfasen
CREATE TYPE project_phase AS ENUM ('preparing', 'exploring', 'specifying', 'tendering', 'contracting');

-- Projectrollen
CREATE TYPE project_role AS ENUM ('project_leader', 'procurement_advisor', 'legal_advisor', 'budget_holder', 'subject_expert', 'viewer');

-- Artifact status
CREATE TYPE artifact_status AS ENUM ('draft', 'generated', 'review', 'approved', 'rejected');

-- Eisen
CREATE TYPE requirement_type AS ENUM ('eis', 'wens');
CREATE TYPE requirement_category AS ENUM ('functional', 'technical', 'process', 'quality', 'sustainability');

-- Scoring
CREATE TYPE scoring_methodology AS ENUM ('lowest_price', 'emvi', 'best_price_quality');

-- Milestones
CREATE TYPE milestone_type AS ENUM ('phase_start', 'phase_end', 'publication', 'submission_deadline', 'nota_van_inlichtingen', 'award_decision', 'standstill_end', 'contract_signed', 'custom');
```

---

## 6. Database Wijzigingen — Nieuwe Tabellen & Kolommen

### 6.1 Nieuwe Enums

```sql
-- Organisatietype
CREATE TYPE organization_type AS ENUM ('client', 'consultancy', 'government');

-- Aanbestedende dienst type
CREATE TYPE contracting_authority_type AS ENUM ('centraal', 'decentraal');

-- CPV categorie
CREATE TYPE cpv_category_type AS ENUM ('werken', 'leveringen', 'diensten');

-- Leverancier status in project
CREATE TYPE supplier_project_status AS ENUM (
  'prospect', 'geinteresseerd', 'ingeschreven',
  'gewonnen', 'afgewezen', 'gecontracteerd'
);

-- Leverancier rol in project
CREATE TYPE supplier_project_role AS ENUM (
  'genodigde', 'vragensteller', 'inschrijver',
  'winnaar', 'contractpartij'
);

-- Vraag status
CREATE TYPE question_status AS ENUM (
  'received', 'in_review', 'answered', 'approved', 'published'
);

-- Relatietype
CREATE TYPE organization_relationship_type AS ENUM (
  'consultancy', 'audit', 'legal', 'other'
);

-- Relatiestatus
CREATE TYPE relationship_status AS ENUM ('active', 'inactive', 'pending');

-- Data classificatie
CREATE TYPE data_classification AS ENUM ('archive', 'personal', 'operational');

-- Archief status
CREATE TYPE archive_status AS ENUM (
  'active', 'archived', 'retention_expired', 'anonymized', 'destroyed'
);

-- Anonimisatie strategie
CREATE TYPE anonymization_strategy AS ENUM ('replace', 'remove');

-- Correspondentie status (bestaat al, maar ter referentie)
-- CREATE TYPE correspondence_status AS ENUM ('draft', 'ready', 'sent', 'archived');
```

### 6.2 Bestaande Tabellen Uitbreiden

#### profiles — Uitbreiden

```sql
ALTER TABLE profiles ADD COLUMN is_superadmin BOOLEAN DEFAULT false;
```

#### organizations — Uitbreiden

```sql
ALTER TABLE organizations ADD COLUMN kvk_nummer VARCHAR(8) UNIQUE;
ALTER TABLE organizations ADD COLUMN handelsnaam TEXT;
ALTER TABLE organizations ADD COLUMN rechtsvorm TEXT;
ALTER TABLE organizations ADD COLUMN straat TEXT;
ALTER TABLE organizations ADD COLUMN postcode VARCHAR(7);
ALTER TABLE organizations ADD COLUMN plaats TEXT;
ALTER TABLE organizations ADD COLUMN sbi_codes TEXT[];
ALTER TABLE organizations ADD COLUMN nuts_codes TEXT[];
ALTER TABLE organizations ADD COLUMN parent_organization_id UUID REFERENCES organizations(id);
ALTER TABLE organizations ADD COLUMN organization_type organization_type DEFAULT 'client';
ALTER TABLE organizations ADD COLUMN aanbestedende_dienst_type contracting_authority_type;
```

#### organization_members — Uitbreiden

```sql
-- Voor externe leden (via relatie)
ALTER TABLE organization_members ADD COLUMN source_organization_id UUID REFERENCES organizations(id);

-- Rollen uitbreiden
ALTER TYPE organization_role ADD VALUE 'external_advisor';
ALTER TYPE organization_role ADD VALUE 'auditor';
```

#### Governance velden op alle data-tabellen

```sql
-- Toe te voegen aan: correspondence, artifacts, evaluations, documents,
-- suppliers, project_suppliers, incoming_questions, time_entries,
-- conversations, messages, document_comments, section_reviewers

ALTER TABLE {tabel} ADD COLUMN data_classification data_classification DEFAULT 'operational';
ALTER TABLE {tabel} ADD COLUMN retention_until TIMESTAMPTZ;
ALTER TABLE {tabel} ADD COLUMN anonymized_at TIMESTAMPTZ;
ALTER TABLE {tabel} ADD COLUMN archive_status archive_status DEFAULT 'active';
```

### 6.3 Nieuwe Tabellen

#### cpv_codes — CPV Referentietabel

```sql
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

CREATE INDEX idx_cpv_codes_division ON cpv_codes(division);
CREATE INDEX idx_cpv_codes_category ON cpv_codes(category_type);
CREATE INDEX idx_cpv_codes_parent ON cpv_codes(parent_code);

-- RLS: leesbaar voor iedereen (referentiedata)
ALTER TABLE cpv_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CPV codes zijn publiek leesbaar"
  ON cpv_codes FOR SELECT
  USING (true);
```

#### nuts_codes — NUTS Referentietabel

```sql
CREATE TABLE nuts_codes (
  code VARCHAR(5) PRIMARY KEY,
  label_nl TEXT NOT NULL,
  level SMALLINT NOT NULL CHECK (level BETWEEN 0 AND 3),
  parent_code VARCHAR(5) REFERENCES nuts_codes(code),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_nuts_codes_level ON nuts_codes(level);
CREATE INDEX idx_nuts_codes_parent ON nuts_codes(parent_code);

-- RLS: publiek leesbaar
ALTER TABLE nuts_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "NUTS codes zijn publiek leesbaar"
  ON nuts_codes FOR SELECT
  USING (true);
```

#### postcode_nuts_mapping — Postcode naar NUTS

```sql
CREATE TABLE postcode_nuts_mapping (
  postcode_prefix VARCHAR(4) PRIMARY KEY,
  nuts3_code VARCHAR(5) NOT NULL REFERENCES nuts_codes(code),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: publiek leesbaar
ALTER TABLE postcode_nuts_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Postcode mapping publiek leesbaar"
  ON postcode_nuts_mapping FOR SELECT
  USING (true);
```

#### document_templates — Document Templates

```sql
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  category_type cpv_category_type,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  placeholders JSONB DEFAULT '[]',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_document_templates_org ON document_templates(organization_id);
CREATE INDEX idx_document_templates_type ON document_templates(document_type_id);

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates zichtbaar voor org leden"
  ON document_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Templates beheerbaar door admin/owner"
  ON document_templates FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

#### suppliers — Leveranciers Register

```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kvk_nummer VARCHAR(8),
  company_name TEXT NOT NULL,
  trade_name TEXT,
  legal_form TEXT,
  street TEXT,
  postal_code VARCHAR(7),
  city TEXT,
  sbi_codes TEXT[],
  website TEXT,
  tags TEXT[],
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  -- Governance
  data_classification data_classification DEFAULT 'personal',
  retention_until TIMESTAMPTZ,
  anonymized_at TIMESTAMPTZ,
  archive_status archive_status DEFAULT 'active',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX idx_suppliers_kvk ON suppliers(kvk_nummer);
CREATE INDEX idx_suppliers_name ON suppliers(company_name);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leveranciers zichtbaar voor org leden"
  ON suppliers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );
```

#### supplier_contacts — Contactpersonen Leverancier

```sql
CREATE TABLE supplier_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  function_title TEXT,
  is_primary BOOLEAN DEFAULT false,
  -- Governance
  data_classification data_classification DEFAULT 'personal',
  retention_until TIMESTAMPTZ,
  anonymized_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_supplier_contacts_supplier ON supplier_contacts(supplier_id);
```

#### project_suppliers — Leverancier-Project Koppeling

```sql
CREATE TABLE project_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status supplier_project_status DEFAULT 'prospect',
  role supplier_project_role DEFAULT 'genodigde',
  invitation_sent_at TIMESTAMPTZ,
  submission_received_at TIMESTAMPTZ,
  submission_complete BOOLEAN,
  offer_amount DECIMAL(15,2),
  evaluation_id UUID REFERENCES evaluations(id),
  signer_name TEXT,
  signer_title TEXT,
  metadata JSONB DEFAULT '{}',
  -- Governance
  data_classification data_classification DEFAULT 'archive',
  retention_until TIMESTAMPTZ,
  anonymized_at TIMESTAMPTZ,
  archive_status archive_status DEFAULT 'active',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, supplier_id)
);

CREATE INDEX idx_project_suppliers_project ON project_suppliers(project_id);
CREATE INDEX idx_project_suppliers_supplier ON project_suppliers(supplier_id);
CREATE INDEX idx_project_suppliers_status ON project_suppliers(status);
```

#### incoming_questions — Binnenkomende Vragen

```sql
CREATE TABLE incoming_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  question_number SERIAL,
  supplier_id UUID REFERENCES suppliers(id),
  question_text TEXT NOT NULL,
  reference_document TEXT,
  reference_artifact_id UUID REFERENCES artifacts(id),
  answer_text TEXT,
  is_rectification BOOLEAN DEFAULT false,
  rectification_text TEXT,
  status question_status DEFAULT 'received',
  approved_by UUID REFERENCES profiles(id),
  received_at TIMESTAMPTZ DEFAULT now(),
  answered_at TIMESTAMPTZ,
  -- Governance
  data_classification data_classification DEFAULT 'archive',
  retention_until TIMESTAMPTZ,
  anonymized_at TIMESTAMPTZ,
  archive_status archive_status DEFAULT 'active',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_incoming_questions_project ON incoming_questions(project_id);
CREATE INDEX idx_incoming_questions_status ON incoming_questions(status);
CREATE UNIQUE INDEX idx_incoming_questions_number ON incoming_questions(project_id, question_number);
```

#### organization_relationships — Organisatie Relaties

```sql
CREATE TABLE organization_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  relationship_type organization_relationship_type NOT NULL,
  status relationship_status DEFAULT 'pending',
  contract_reference TEXT,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_organization_id, target_organization_id, relationship_type),
  CHECK (source_organization_id != target_organization_id)
);

CREATE INDEX idx_org_rel_source ON organization_relationships(source_organization_id);
CREATE INDEX idx_org_rel_target ON organization_relationships(target_organization_id);
```

#### organization_settings — Organisatie Instellingen

```sql
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  -- Retentie
  retention_profile TEXT DEFAULT 'vng_2020',
  retention_archive_years_granted SMALLINT DEFAULT 7,
  retention_archive_years_not_granted SMALLINT DEFAULT 5,
  retention_personal_data_years SMALLINT DEFAULT 1,
  retention_operational_years SMALLINT DEFAULT 1,
  -- Anonimisatie
  anonymization_strategy anonymization_strategy DEFAULT 'replace',
  auto_archive_on_contract_end BOOLEAN DEFAULT true,
  notify_retention_expired BOOLEAN DEFAULT true,
  -- Drempelwaarden (EUR)
  threshold_works DECIMAL(15,2) DEFAULT 5538000,
  threshold_services_central DECIMAL(15,2) DEFAULT 143000,
  threshold_services_decentral DECIMAL(15,2) DEFAULT 221000,
  threshold_social_services DECIMAL(15,2) DEFAULT 750000,
  -- Standaardinstellingen
  default_currency VARCHAR(3) DEFAULT 'EUR',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### retention_profiles — Selectielijst Profielen

```sql
CREATE TABLE retention_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  source TEXT,
  archive_years_granted SMALLINT NOT NULL,
  archive_years_not_granted SMALLINT NOT NULL,
  personal_data_years SMALLINT NOT NULL,
  operational_years SMALLINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed data
INSERT INTO retention_profiles (id, name, description, source, archive_years_granted, archive_years_not_granted, personal_data_years, operational_years) VALUES
  ('vng_2020', 'VNG Selectielijst 2020', 'Standaard voor gemeenten', 'VNG Selectielijst gemeentelijke en intergemeentelijke organen 2020', 7, 5, 1, 1),
  ('provisa', 'PROVISA', 'Provinciale selectielijst', 'Selectielijst archiefbescheiden provinciale organen', 7, 5, 1, 1);
```

#### project_document_roles — Documentrollen

```sql
CREATE TABLE project_document_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_key TEXT NOT NULL,
  role_label TEXT NOT NULL,
  person_name TEXT,
  person_email TEXT,
  person_phone TEXT,
  person_function TEXT,
  -- Governance
  data_classification data_classification DEFAULT 'personal',
  retention_until TIMESTAMPTZ,
  anonymized_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, role_key)
);

-- Standaard rollen
-- contactpersoon, inkoper, projectleider, budgethouder, juridisch_adviseur
```

### 6.4 Migratie Volgorde

```
migration_029_new_enums.sql
migration_030_cpv_codes.sql
migration_031_nuts_codes.sql
migration_032_postcode_nuts_mapping.sql
migration_033_extend_organizations.sql
migration_034_organization_relationships.sql
migration_035_organization_settings.sql
migration_036_retention_profiles.sql
migration_037_extend_organization_members.sql
migration_038_suppliers.sql
migration_039_supplier_contacts.sql
migration_040_project_suppliers.sql
migration_041_incoming_questions.sql
migration_042_document_templates.sql
migration_043_project_document_roles.sql
migration_044_governance_fields.sql
migration_045_cpv_seed_data.sql
migration_046_nuts_seed_data.sql
migration_047_postcode_nuts_seed.sql
migration_048_retention_profiles_seed.sql
```

---

## 7. KVK API Integratie

### 7.1 API Overzicht

**Base URL Production**: `https://api.kvk.nl/api/v2`
**Base URL Test**: `https://api.kvk.nl/test/api/v2`
**Authenticatie**: API Key in header (`apikey: {key}`)
**Methode**: Alleen GET requests
**Response**: JSON

### 7.2 Endpoints

#### Zoeken API

```
GET /zoeken
```

**Query Parameters**:

| Parameter | Type | Beschrijving |
|-----------|------|-------------|
| `naam` | string | Bedrijfsnaam |
| `kvkNummer` | string | KVK-nummer (8 cijfers) |
| `type` | string | `hoofdvestiging` of `nevenvestiging` |
| `plaats` | string | Plaatsnaam |
| `straatnaam` | string | Straatnaam |
| `huisnummerToevoeging` | string | Huisnummer toevoeging (1-4 tekens) |
| `resultatenPerPagina` | number | Max 100, default 10 |
| `pagina` | number | Paginanummer |
| `inclusiefinactieveregistraties` | boolean | Inclusief inactieve vestigingen |

**Response voorbeeld**:

```json
{
  "pagina": 1,
  "resultatenPerPagina": 10,
  "totaal": 1,
  "resultaten": [
    {
      "kvkNummer": "12345678",
      "naam": "Bedrijf B.V.",
      "adres": {
        "straatnaam": "Hoofdstraat",
        "huisnummer": "1",
        "postcode": "1234AB",
        "plaats": "Amsterdam"
      },
      "type": "hoofdvestiging",
      "actief": "Ja"
    }
  ]
}
```

#### Basisprofiel API

```
GET /basisprofiel/{kvkNummer}
```

**Path Parameters**:

| Parameter | Type | Beschrijving |
|-----------|------|-------------|
| `kvkNummer` | string | KVK-nummer (8 cijfers) |

**Query Parameters**:

| Parameter | Type | Beschrijving |
|-----------|------|-------------|
| `geoData` | boolean | Inclusief BAG-coördinaten |

**Response bevat**:
- `eigenaar`: Eigenaar informatie
- `hoofdvestiging`: Hoofdvestiging details (adres, SBI-codes)
- `vestigingen`: Lijst van alle vestigingen

#### Vestigingsprofiel API

```
GET /v1/vestigingsprofielen/{vestigingsnummer}
```

**Response bevat**:
- Basisgegevens vestiging
- Bedrijfsactiviteiten (SBI-codes)
- Bezoekadres
- Postadres
- RSIN-nummer

### 7.3 Implementatie

#### Server-side KVK Client (`src/lib/server/api/kvk.ts`)

```typescript
// Agent 4 bouwt dit
interface KvkSearchParams {
  naam?: string;
  kvkNummer?: string;
  plaats?: string;
  type?: 'hoofdvestiging' | 'nevenvestiging';
  resultatenPerPagina?: number;
  pagina?: number;
}

interface KvkSearchResult {
  kvkNummer: string;
  naam: string;
  adres: {
    straatnaam: string;
    huisnummer: string;
    postcode: string;
    plaats: string;
  };
  type: string;
  actief: string;
}

interface KvkBasisProfiel {
  kvkNummer: string;
  naam: string;
  rechtsvorm: string;
  hoofdvestiging: {
    vestigingsnummer: string;
    handelsnamen: string[];
    adressen: KvkAdres[];
    sbiActiviteiten: KvkSbiActiviteit[];
  };
}

// Functies
async function searchKvk(params: KvkSearchParams): Promise<KvkSearchResult[]>
async function getKvkProfile(kvkNummer: string): Promise<KvkBasisProfiel>
```

#### API Route (`src/routes/api/kvk/search/+server.ts`)

```typescript
// Agent 1 bouwt dit
// GET /api/kvk/search?naam=...&plaats=...
// Proxy naar KVK API (API key server-side)
// Response: { data: KvkSearchResult[] }
```

#### API Route (`src/routes/api/kvk/[kvkNummer]/+server.ts`)

```typescript
// Agent 1 bouwt dit
// GET /api/kvk/12345678
// Proxy naar KVK Basisprofiel API
// Response: { data: KvkBasisProfiel }
```

### 7.4 KVK API Configuratie

```env
# .env (al aanwezig)
kvk_api_key=l7c95f41e2d02f447186022eddec9cd9d8

# .env variabele naam standaardiseren:
KVK_API_KEY=l7c95f41e2d02f447186022eddec9cd9d8
KVK_API_BASE_URL=https://api.kvk.nl/api/v2
```

### 7.5 Test Omgeving

- **Test endpoint**: Voeg `/test/` toe aan pad (bijv. `/test/api/v2/zoeken`)
- **Test API key**: `l7xx1f2691f2520d487b902f4e0b57a0b197`
- **Swagger UI**: Beschikbaar voor interactief testen

---

## 8. Multi-Organisatie Model

### 8.1 Concept (Optie C)

Elke publieke organisatie is een volwaardige organisatie. Consultants/bureaus zijn eigen organisaties en zijn lid van klantorganisaties met specifieke rollen.

### 8.2 Gebruiksscenario's

| Scenario | Org A | Relatie | Org B | A ziet bij B | Data gescheiden? |
|----------|-------|---------|-------|-------------|-----------------|
| Consultant bedient klant | Mw. de Adviseur | Extern adviseur | Prov. N-Brabant | Toegewezen projecten, leveranciers | Ja, volledig |
| Auditor/controle | Odinfo | Auditor | Prov. N-Brabant | Systeeminstellingen, config | Ja, volledig |
| Twee consultants bij klant | Adv. A + Ander Bureau | Extern adviseur | Gem. Eindhoven | Zelfde projecten & leveranciers | Data is van gemeente |
| Klant logt zelf in | Prov. N-Brabant | Eigen org | — | Alles | n.v.t. |
| Consultant zonder context | Mw. de Adviseur | Eigen org | — | Dashboard, lijst klant-orgs | n.v.t. |

### 8.3 Rechtenmodel

| Rol | Scope | Projecten | Leveranciers | Instellingen | Templates |
|-----|-------|-----------|-------------|-------------|-----------|
| **Superadmin** | **Platform** | **Alle orgs, alle projecten** | **Alle orgs, volledig** | **Alle orgs, alles** | **Alle orgs, alles** |
| Owner | Organisatie | Alles | Volledig CRM | Alle instellingen | Upload, wijzig, verwijder |
| Admin | Organisatie | Aanmaken, beheren | Toevoegen, wijzigen | Beperkt | Upload, wijzig |
| Member | Organisatie | Alleen toegewezen | Bekijken, toevoegen aan project | Alleen lezen | Alleen lezen |
| External Advisor | Org (via relatie) | Alleen toegewezen | Bekijken, toevoegen aan project | Geen toegang | Alleen lezen |
| Auditor | Org (via relatie) | Geen (tenzij toegewezen) | Geen toegang | Config instellingen | Upload, wijzig |
| Project Lead | Project | Volledig projectbeheer | Toevoegen, koppelen | Geen toegang | Kiezen per document |

**Superadmin** is de productmaker (Melissa). Deze rol staat boven de org-context:
- Kan alle organisaties zien en ernaar switchen zonder lidmaatschap
- Kan alle data lezen en schrijven in elke organisatie
- RLS policies laten superadmin altijd door (`is_superadmin = true` bypass)
- Heeft toegang tot /admin analytics
- Veld: `profiles.is_superadmin` (boolean, default false)

### 8.4 UI Elementen

1. **Organisatie-switcher** (sidebar, boven): Dropdown met alle organisaties waar gebruiker lid van is
2. **Klant-context badge** (header): Visuele indicator van actieve klantcontext
3. **Leveranciers menu-item** (sidebar): Zichtbaar in elke klantcontext
4. **Organisatie-instellingen** (sidebar, onder): Alleen voor owner/admin
5. **Relatiebeheer** (instellingen): Overzicht externe organisaties en hun rollen

### 8.5 Juridisch & Data-scheiding

| Principe | Technisch | Wettelijke basis |
|----------|----------|-----------------|
| Data volledig gescheiden | Alle queries hebben org_id filter, RLS enforced | AVG art. 5 (doelbinding) |
| KVK-data is publiek | KVK lookup onafhankelijk van context | Handelsregisterwet 2007 |
| Verwerkersovereenkomst vereist | organization_relationships.contract_reference slaat VO referentie op | AVG art. 28 |
| Consultant ziet alleen toegewezen | RLS: external_advisor ziet alleen projecten waar ze lid zijn | AVG art. 5 (minimale verwerking) |
| Org-level retentie config | organization_settings tabel | Archiefwet 2015 |

---

## 9. Leveranciers CRM

### 9.1 Data Model

Volledig gescheiden per klantorganisatie (AVG vereiste). Elke organisatie heeft eigen leveranciersregister.

### 9.2 Lifecycle

```
prospect → geïnteresseerd → ingeschreven → gewonnen/afgewezen → gecontracteerd
```

### 9.3 UI Ontwerp — Drawer (40% breed)

**Tabs**:

1. **Overzicht**: Bedrijfsgegevens (KVK), contactpersonen, tags, beoordeling
2. **Aanbestedingen**: Alle projecten waar leverancier bij betrokken is + status + resultaat
3. **Correspondentie**: Alle brieven gericht aan deze leverancier
4. **Kwalificatie**: UEA status, GVA, certificeringen, referenties
5. **Notities**: Privé (alleen gebruiker) + gedeeld (organisatieniveau)

### 9.4 KVK Koppeling

Bij toevoegen leverancier: KVK zoeken → resultaat selecteren → gegevens auto-fill → opslaan in suppliers tabel van actieve organisatie.

### 9.5 Project Context

In projectweergave: leveranciers tab toont alle gekoppelde leveranciers met hun projectrol en status. Vanuit project kun je leverancier toevoegen (bestaand of nieuw via KVK).

---

## 10. Correspondentie als Documenten

### 10.1 Huidige staat

11 brieftypes met eigen routes (`/projects/[id]/correspondence/`), simpele TipTap editor zonder toolbar.

### 10.2 Gewenste staat

Alle brieftypes worden document-types met eigen templates, dezelfde editor als alle andere documenten.

### 10.3 Brieftypes en Data-afhankelijkheden

#### Fase: Verkennen (Exploring)

**1. Uitnodiging RFI**
- Organisatiegegevens (naam, adres, KVK)
- Contactpersoon (uit documentrollen)
- Projectbeschrijving, scope, CPV/NUTS
- Deadline
- Leveranciersgegevens (meerdere ontvangers)

**2. Uitnodiging Marktconsultatie**
- Alles van RFI + datum, tijd, locatie, format, onderwerpen

**3. Bedankbrief Deelname**
- Leveranciersnaam
- Type deelname (RFI/consultatie)
- Referentie, datum

#### Fase: Aanbesteden (Tendering)

**4. Nota van Inlichtingen (NvI)**
- Alle goedgekeurde Q&A paren (uit incoming_questions)
- Rectificaties
- Datum publicatie
- Vragen zijn anoniem naar buiten, intern gekoppeld aan leverancier

**5. PV Opening Inschrijvingen**
- Lijst inschrijvers + ontvangstijd
- Volledigheidscheck
- Commissieleden
- Datum/tijd, projectgegevens

**6. PV Beoordeling**
- Commissieleden
- Scores per criterium per inschrijver
- Rangorde
- Gunningscriteria (EMVI)
- Beoordelingsmethodiek

**7. Voorlopige Gunningsbeslissing**
- Winnende inschrijver + scores
- Motivatie
- Alcatel-termijn (20 dagen)
- Klachtenprocedure
- Contactpersoon

**8. Afwijzingsbrief**
- Afgewezen inschrijver naam + scores
- Score winnaar (geanonimiseerd)
- Motivatie
- Alcatel-termijn
- Contactpersoon

**9. Definitieve Gunning**
- Bevestiging na Alcatel-termijn
- Winnende partij
- Contractgegevens
- Ondertekeningsplanning

#### Fase: Contracteren (Contracting)

**10. Uitnodiging tot Ondertekening**
- Contractgegevens
- Datum/locatie
- Ondertekenaars
- Bijlagen

**11. Begeleidende Brief**
- Generiek brieftype als dekbrief bij elk document

---

## 11. Binnenkomende Vragen Module

### 11.1 Flow

```
Ontvangen → In behandeling → Beantwoord → Goedgekeurd → Gepubliceerd (in NvI)
```

### 11.2 Kenmerken

- Automatische nummering per project
- Intern gekoppeld aan leverancier (niet zichtbaar in NvI)
- Referentie naar document/sectie waar vraag over gaat
- AI-suggestie voor antwoord via RAG (op basis van projectdocumenten)
- Rectificatie optie (correctie op eerder antwoord)
- Email-parsing voor automatische import

### 11.3 NvI Generatie

Alle goedgekeurde vragen + antwoorden worden samengevoegd in Nota van Inlichtingen document:
- Vragen genummerd
- Anoniem (leveranciersnaam niet zichtbaar)
- Rectificaties apart gemarkeerd
- Datum publicatie
- Template-based output

---

## 12. Document Template Engine

### 12.1 Flow

```
1. Template ontwerp (Word) → 2. Upload (admin) → 3. Project aanmaken →
4. Briefing flow (AI) → 5. Document generatie (merge) → 6. Review & export
```

### 12.2 Drie content-typen

| Type | Bron | Voorbeeld | Beheerd door |
|------|------|-----------|-------------|
| Vast | In template | Juridische clausules, standaardintro | Inkoopadviseur (Word) |
| Database | Supabase/KVK | `{org_name}`, `{kvk_nummer}`, `{adres}` | Systeem (automatisch) |
| AI-gegenereerd | Briefing artifacts | `{scope_description}`, `{requirements}` | AI + gebruiker review |

### 12.3 Standaard Placeholders

```
{org_name}              — Organisatienaam
{org_kvk_nummer}        — KVK-nummer
{org_adres}             — Volledig adres
{org_postcode}          — Postcode
{org_plaats}             — Plaatsnaam
{project_name}          — Projectnaam
{project_reference}     — Projectreferentie
{cpv_code}              — Hoofd CPV-code
{cpv_description}       — CPV-omschrijving
{nuts_code}             — NUTS-code
{nuts_label}            — NUTS-omschrijving
{contactpersoon_naam}   — Contactpersoon naam
{contactpersoon_email}  — Contactpersoon email
{contactpersoon_tel}    — Contactpersoon telefoon
{inkoper_naam}          — Inkoper naam
{datum_vandaag}         — Huidige datum (dd MMMM yyyy)
{deadline_inschrijving} — Inschrijfdeadline
{scope_description}     — AI: scopebeschrijving
{requirements}          — AI: eisen
{award_criteria}        — AI: gunningscriteria
{supplier_name}         — Leveranciersnaam (bij correspondentie)
{supplier_adres}        — Leveranciersadres
```

### 12.4 docxtemplater Configuratie

```typescript
// Agent 3 implementeert dit
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

interface TemplateData {
  // Database velden
  org_name: string;
  org_kvk_nummer: string;
  // ... etc
  // AI-gegenereerde velden
  scope_description: string;
  requirements: string;
  // Lijsten (voor loops in template)
  suppliers: Array<{ name: string; adres: string }>;
  questions: Array<{ number: number; question: string; answer: string }>;
}

async function renderTemplate(
  templatePath: string,
  data: TemplateData
): Promise<Buffer>
```

---

## 13. Editor Refactoring

### 13.1 Wijzigingen Overzicht

| Component | Huidig | Gewenst | Aanpak |
|-----------|--------|---------|--------|
| Links sidebar | StepperSidebar met genummerde secties | Paginaminiaturen (Word-stijl) | Vervang StepperSidebar door PageThumbnails |
| Sectiekoppen | Elke sectie heeft eigen kop boven editor | Geen aparte koppen, content stroomt door | Sectie-markers in DOM voor data-binding |
| Voortgang | Per sectie (approved/total) | Per document (één status) | Nieuw veld op document-level |
| Lettertype | Font hardcoded 'Asap' via CSS var | Font-family + size per selectie | TipTap extensies: text-style + font-family |
| Template | Niet aanwezig, programmatisch | Template geladen in editor | docxtemplater → TipTap HTML conversie |
| Markdown → HTML | AI genereert markdown als platte tekst | Conversie naar TipTap nodes | Transformatielaag (markdown-it/remark) |
| Correspondentie | Apart, simpel, zonder toolbar | Zelfde editor als documenten | Merge routes, brieftypes → document-types |

### 13.2 TipTap Extensies Toevoegen

```typescript
// @tiptap/extension-text-style (basis voor inline styling)
// @tiptap/extension-font-family (font-family per selectie)
// @tiptap/extension-font-size (custom, font-size per selectie)

import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';

const editor = new Editor({
  extensions: [
    // ... bestaande extensies
    TextStyle,
    FontFamily.configure({
      types: ['textStyle'],
    }),
    // Custom font-size extensie
  ],
});
```

### 13.3 Markdown → TipTap HTML Transformatie

```typescript
// Agent 4 bouwt dit: src/lib/utils/markdown-to-tiptap.ts

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

export async function markdownToTiptapHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);

  return String(result);
}

// Wordt aangeroepen bij:
// 1. AI artifact generatie (voordat content in editor komt)
// 2. Brief generatie
// 3. Elke plek waar AI output naar TipTap gaat
```

### 13.4 Bestanden die wijzigen

- `src/lib/components/StepperSidebar.svelte` → **Verwijderen**
- `src/lib/components/PageThumbnails.svelte` → **Nieuw**
- `src/lib/components/editor/EditorToolbar.svelte` → **Uitbreiden** (font controls)
- `src/lib/components/TiptapEditor.svelte` → **Uitbreiden** (extensies)
- `src/routes/(app)/projects/[id]/documents/[docTypeId]/+page.svelte` → **Refactoren**
- `src/routes/(app)/projects/[id]/correspondence/` → **Merge naar documents**
- `src/lib/utils/markdown-to-tiptap.ts` → **Nieuw**

---

## 14. Data Governance & Retentie

### 14.1 Wettelijk Kader

- **Archiefwet 2015**: Overheidsorganen moeten archiefbescheiden in goede, geordende en toegankelijke staat bewaren
- **VNG Selectielijst 2020**: Bewaartermijnen voor gemeentelijke organen
- **AVG (GDPR)**: Persoonsgegevens alleen bewaren zolang nodig voor het doel

### 14.2 Bewaartermijnen

| Data | Classificatie | Standaard termijn | Na verlopen |
|------|--------------|-------------------|-------------|
| Correspondentie (brieven) | Archive | 7 jaar na contracteinde (gegund) / 5 jaar (niet gegund) | Anonimiseren |
| Artifacts (PvE, specs) | Archive | 7 jaar na contracteinde | Bewaren (geen PII) |
| Evaluaties (scores) | Archive | 7 jaar na contracteinde | Anonimiseren |
| PV's (opening, beoordeling) | Archive | 7 jaar na contracteinde | Anonimiseren |
| Nota van Inlichtingen | Archive | 7 jaar na contracteinde | Bewaren (anoniem) |
| Binnenkomende vragen (intern) | Archive | 7 jaar na contracteinde | Anonimiseren |
| Contracten | Archive | 7-10 jaar na contracteinde | Anonimiseren |
| Audit trail | Archive | Met gerelateerd dossier | Vernietigen met dossier |
| Gebruikersprofielen | Personal | Account actief + 1 jaar na deactivatie | Vernietigen/anonimiseren |
| Leveranciers | Personal + Operational | Laatste project + retentietermijn | Contacten anonimiseren |
| Leverancier contactpersonen | Personal | Laatste project + retentietermijn | Anonimiseren |
| AI gesprekken | Operational | Project actief + 1 jaar | Vernietigen |
| Editor opmerkingen | Operational | Document definitief + 90 dagen | Vernietigen |
| Conceptversies | Operational | Document definitief + 1 jaar | Vernietigen |
| Interne notities (CRM) | Operational | Laatste project + 1 jaar | Vernietigen |

### 14.3 Data Levenscyclus

```
1. Active    → Zichtbaar, bewerkbaar (normaal gebruik)
2. Soft Del  → Verborgen in UI, herstelbaar vanuit DB
3. Archived  → Alleen-lezen (project afgerond, Archiefwet)
4. Ret. Exp  → Alleen-lezen + signaal naar admin
5a. Anon.    → PII vervangen door pseudoniemen (Persoon A, Bedrijf B)
5b. Destroy  → Fysiek verwijderd (alleen als zowel archief- als AVG-termijn verlopen)
```

### 14.4 Selectielijst Profielen

Voorgedefinieerde profielen die organisaties kunnen kiezen:

| Profiel | Bron | Gegund | Niet gegund |
|---------|------|--------|-------------|
| VNG 2020 | VNG Selectielijst 2020 | 7 jaar | 5 jaar |
| PROVISA | Provinciale selectielijst | 7 jaar | 5 jaar |

Organisaties kunnen standaardwaarden overschrijven in organization_settings.

### 14.5 Anonimisatie Strategie

**Replace** (standaard): PII wordt vervangen door pseudoniemen
- "Jan de Vries" → "Persoon A"
- "Bouwbedrijf Jansen B.V." → "Bedrijf A"

**Remove**: PII wordt verwijderd
- "Jan de Vries" → "[verwijderd]"

---

## 15. Implementatievolgorde

| Fase | Wat | Agent(s) | Afhankelijk van |
|------|-----|----------|----------------|
| 1 | Multi-org basisstructuur | 1 | — |
| 2 | RLS policies & rechtenmodel | 1 | Fase 1 |
| 3 | Context-switcher UI | 2 | Fase 1, 2 |
| 4 | CPV referentietabel + import | 1 | — |
| 5 | NUTS referentietabel + postcode mapping | 1 | — |
| 6 | Organization tabel uitbreiding (KVK velden) | 1 | Fase 1 |
| 7 | KVK API integratie | 1, 4 | Fase 6 |
| 8 | Leveranciers CRM (database + API) | 1 | Fase 1, 6 |
| 9 | Leveranciers UI (lijst + drawer) | 2 | Fase 8 |
| 10 | Binnenkomende vragen module | 1, 2 | Fase 8 |
| 11 | Organization settings UI | 2, 5 | Fase 1 |
| 12 | Data governance velden | 1 | Fase 1 |
| 13 | docxtemplater integratie | 3 | — |
| 14 | Template storage + upload UI | 1, 2, 3 | Fase 13 |
| 15 | Editor refactoring | 3 | Fase 13 |
| 16 | Markdown → HTML transformatie | 4 | — |
| 17 | Correspondentie → documenten | 1, 2, 3 | Fase 13, 15 |
| 18 | Document template mapping | 1, 3 | Fase 4, 14 |
| 19 | Document rollen | 1, 2 | Fase 6 |
| 20 | Procedure advies logica (drempelwaarden) | 1, 2 | Fase 11 |
| 21 | Selectielijst profielen | 5 | Fase 12 |
| 22 | Retentie signalering (cron job) | 5 | Fase 12, 21 |
| 23 | Email-parsing binnenkomende vragen | 4 | Fase 10 |
| 24 | Superadmin analytics | 5 | Fase 1-22 |
| 25 | Dashboard | 2 | Alles |
| 26 | Testing & validatie (end-to-end) | 6 | Alles |

---

## 16. Testplan

### 16.1 Teststrategie

- **Unit tests**: Elke nieuwe module krijgt direct een testbestand
- **Integratie tests**: API routes met Supabase test-database
- **E2E tests**: Kritieke flows (organisatie aanmaken, project doorlopen)
- **RLS tests**: Elke nieuwe tabel heeft RLS policy tests

### 16.2 Tests per Feature

#### KVK API Integratie

```typescript
// tests/unit/kvk-client.test.ts (Agent 4)
describe('KVK Client', () => {
  it('zoekt bedrijven op naam', async () => {});
  it('haalt basisprofiel op via KVK-nummer', async () => {});
  it('geeft foutmelding bij ongeldig KVK-nummer', async () => {});
  it('geeft foutmelding bij netwerk timeout', async () => {});
  it('filtert op type (hoofd/nevenvestiging)', async () => {});
});

// tests/integration/api/kvk-search.test.ts (Agent 1)
describe('GET /api/kvk/search', () => {
  it('vereist authenticatie', async () => {});
  it('zoekt en retourneert resultaten', async () => {});
  it('valideert query parameters', async () => {});
  it('handelt lege resultaten af', async () => {});
});

// tests/integration/api/kvk-profile.test.ts (Agent 1)
describe('GET /api/kvk/[kvkNummer]', () => {
  it('haalt profiel op', async () => {});
  it('valideert KVK-nummer formaat', async () => {});
  it('retourneert 404 bij onbekend nummer', async () => {});
});
```

#### NUTS-codes

```typescript
// tests/unit/nuts-mapping.test.ts (Agent 1)
describe('NUTS Mapping', () => {
  it('koppelt postcode aan NUTS3 code', async () => {});
  it('geeft hiërarchie terug (NUTS0 → NUTS3)', async () => {});
  it('handelt onbekende postcode af', async () => {});
});

// tests/integration/api/nuts.test.ts (Agent 1)
describe('GET /api/nuts', () => {
  it('retourneert alle NL NUTS codes', async () => {});
  it('filtert op level', async () => {});
  it('zoekt op label', async () => {});
});
```

#### CPV-codes

```typescript
// tests/unit/cpv-filter.test.ts (Agent 1)
describe('CPV Filter', () => {
  it('filtert op categorie (diensten)', async () => {});
  it('filtert op divisie', async () => {});
  it('zoekt op beschrijving', async () => {});
  it('retourneert hiërarchie', async () => {});
});

// tests/integration/api/cpv.test.ts (Agent 1)
describe('GET /api/cpv', () => {
  it('retourneert CPV codes met filter', async () => {});
  it('pagination werkt', async () => {});
  it('zoekfunctie werkt', async () => {});
});

// tests/integration/cpv-import.test.ts (Agent 1)
describe('CPV Import', () => {
  it('importeert alle codes uit Excel', async () => {});
  it('zet juiste category_type per divisie', async () => {});
  it('koppelt parent codes correct', async () => {});
});
```

#### Multi-Organisatie

```typescript
// tests/integration/multi-org.test.ts (Agent 1)
describe('Multi-Organisatie', () => {
  it('maakt organisatie met type aan', async () => {});
  it('maakt relatie tussen organisaties', async () => {});
  it('voegt extern lid toe via relatie', async () => {});
  it('extern lid ziet alleen toegewezen projecten', async () => {});
  it('owner ziet alle data van eigen org', async () => {});
  it('data is volledig gescheiden tussen orgs', async () => {});
});

// tests/rls/organization-rls.test.ts (Agent 1)
describe('Organization RLS', () => {
  it('member kan eigen org data lezen', async () => {});
  it('member kan andere org data NIET lezen', async () => {});
  it('external_advisor ziet alleen toegewezen projecten', async () => {});
  it('auditor ziet alleen instellingen', async () => {});
  it('leveranciers zijn gescheiden per org', async () => {});
});

// tests/e2e/context-switch.test.ts (Agent 2)
describe('Context Switch', () => {
  it('switcht tussen organisaties', async () => {});
  it('toont juiste data per context', async () => {});
  it('behoudt context na pagina refresh', async () => {});
});
```

#### Leveranciers CRM

```typescript
// tests/integration/api/suppliers.test.ts (Agent 1)
describe('Suppliers API', () => {
  it('POST /api/suppliers — maakt leverancier aan', async () => {});
  it('GET /api/suppliers — lijst per organisatie', async () => {});
  it('GET /api/suppliers/[id] — detail met contacten', async () => {});
  it('PATCH /api/suppliers/[id] — update gegevens', async () => {});
  it('DELETE /api/suppliers/[id] — soft delete', async () => {});
  it('leverancier niet zichtbaar in andere org', async () => {});
});

// tests/integration/api/project-suppliers.test.ts (Agent 1)
describe('Project Suppliers API', () => {
  it('koppelt leverancier aan project', async () => {});
  it('wijzigt status (prospect → ingeschreven)', async () => {});
  it('unieke combinatie project + leverancier', async () => {});
});

// tests/e2e/supplier-drawer.test.ts (Agent 2)
describe('Supplier Drawer', () => {
  it('opent drawer bij klik op leverancier', async () => {});
  it('toont alle tabs', async () => {});
  it('toont aanbestedingshistorie', async () => {});
  it('voegt contactpersoon toe', async () => {});
});
```

#### Binnenkomende Vragen

```typescript
// tests/integration/api/questions.test.ts (Agent 1)
describe('Incoming Questions API', () => {
  it('registreert nieuwe vraag', async () => {});
  it('automatische nummering per project', async () => {});
  it('koppelt intern aan leverancier', async () => {});
  it('status flow: received → approved', async () => {});
  it('genereert NvI uit goedgekeurde vragen', async () => {});
});

// tests/unit/email-parser.test.ts (Agent 4)
describe('Email Parser', () => {
  it('parseert vraag uit email body', async () => {});
  it('extraheert document referentie', async () => {});
  it('herkent afzender als leverancier', async () => {});
});
```

#### Document Templates

```typescript
// tests/unit/docxtemplater.test.ts (Agent 3)
describe('docxtemplater Integration', () => {
  it('rendert template met data', async () => {});
  it('vervangt alle placeholders', async () => {});
  it('handelt ontbrekende data af (lege string)', async () => {});
  it('rendert lijsten (leveranciers, vragen)', async () => {});
  it('behoudt opmaak en logo', async () => {});
});

// tests/integration/api/templates.test.ts (Agent 1)
describe('Templates API', () => {
  it('upload template naar storage', async () => {});
  it('lijst templates per org en type', async () => {});
  it('selecteert juiste template op basis van CPV', async () => {});
  it('verwijdert template (soft delete)', async () => {});
});
```

#### Editor

```typescript
// tests/unit/markdown-to-tiptap.test.ts (Agent 4)
describe('Markdown to TipTap HTML', () => {
  it('converteert bullets naar bulletList', async () => {});
  it('converteert headers naar heading nodes', async () => {});
  it('converteert bold/italic', async () => {});
  it('converteert geneste lijsten', async () => {});
  it('behoudt paragrafen', async () => {});
  it('handelt lege input af', async () => {});
});

// tests/e2e/editor-fonts.test.ts (Agent 3)
describe('Editor Font Controls', () => {
  it('wijzigt font-family per selectie', async () => {});
  it('wijzigt font-size per selectie', async () => {});
  it('template font wordt geladen', async () => {});
});
```

#### Data Governance

```typescript
// tests/integration/governance.test.ts (Agent 5)
describe('Data Governance', () => {
  it('zet data_classification bij aanmaak', async () => {});
  it('berekent retention_until correct', async () => {});
  it('archiveert project na contracteinde', async () => {});
  it('signaleert verlopen retentietermijn', async () => {});
  it('anonimiseert PII (replace strategie)', async () => {});
  it('anonimiseert PII (remove strategie)', async () => {});
  it('verwijdert operationele data na termijn', async () => {});
});

// tests/integration/retention-profiles.test.ts (Agent 5)
describe('Retention Profiles', () => {
  it('laadt VNG 2020 profiel', async () => {});
  it('past organisatie-specifieke waarden toe', async () => {});
  it('overschrijft standaardwaarden', async () => {});
});
```

#### Procedure Advies

```typescript
// tests/unit/procedure-advice.test.ts (Agent 1)
describe('Procedure Advice', () => {
  it('adviseert openbaar bij bedrag boven drempel diensten', async () => {});
  it('adviseert meervoudig onderhands bij bedrag onder drempel', async () => {});
  it('waarschuwt bij afwijking van advies', async () => {});
  it('gebruikt organisatie-specifieke drempelwaarden', async () => {});
  it('onderscheidt centraal/decentraal', async () => {});
});
```

### 16.3 Test Fixtures & Mock Data

```typescript
// tests/fixtures/organizations.ts
export const testOrganizations = {
  consultant: {
    name: 'Mevrouw de Adviseur',
    organization_type: 'consultancy',
    kvk_nummer: '12345678',
  },
  client: {
    name: 'Provincie Noord-Brabant',
    organization_type: 'government',
    aanbestedende_dienst_type: 'decentraal',
    kvk_nummer: '87654321',
  },
  colleague: {
    name: 'Odinfo',
    organization_type: 'consultancy',
    kvk_nummer: '11223344',
  },
};

// tests/fixtures/suppliers.ts
export const testSuppliers = {
  bouwbedrijf: {
    company_name: 'Bouwbedrijf Jansen B.V.',
    kvk_nummer: '55667788',
    city: 'Eindhoven',
    sbi_codes: ['4120', '4211'],
  },
  ictLeverancier: {
    company_name: 'TechSolutions B.V.',
    kvk_nummer: '99887766',
    city: 'Utrecht',
    sbi_codes: ['6201', '6202'],
  },
};

// tests/fixtures/kvk-responses.ts
export const kvkSearchResponse = {
  pagina: 1,
  resultatenPerPagina: 10,
  totaal: 1,
  resultaten: [{
    kvkNummer: '12345678',
    naam: 'Test Bedrijf B.V.',
    adres: {
      straatnaam: 'Teststraat',
      huisnummer: '1',
      postcode: '1234AB',
      plaats: 'Amsterdam',
    },
    type: 'hoofdvestiging',
    actief: 'Ja',
  }],
};
```

---

## 17. Open Vragen & Beslissingen

| # | Vraag | Beslissing |
|---|-------|-----------|
| 1 | KVK API key beschikbaar? | Ja — key in .env aanwezig |
| 2 | Alleen NL of ook Belgisch/EU? | Alleen NL NUTS-codes |
| 3 | Gebruikers uploaden templates? | Ja, door org admin + developer |
| 4 | Welke documenten per ordertype? | Focus op diensten & leveringen (geen bestek) |
| 5 | Briefingpapier templates in Word? | Nee, nog niet aanwezig |
| 6 | CPV import eenmalig of herhaalbaar? | Eenmalige migratie |
| 7 | NUTS koppeling per org of project? | Per organisatie |
| 8 | SvelteKit behouden of naar FastAPI? | SvelteKit behouden |
| 9 | Kan klantorganisatie zelf inloggen? | Ja, volledig account nodig |
| 10 | Leverancierskwalificatie diepte? | Uitgebreid (UEA, GVA, certificeringen) |
| 11 | Leveranciersnotities zichtbaarheid? | Beide: privé + gedeeld |
| 12 | Binnenkomende vragen: hoe? | Email-parsing |
| 13 | Verwerkersovereenkomst vereist? | Waarschuwen (niet blokkeren) — **nog te bevestigen** |

### Aanvullende Besluiten

- **Dashboard**: Laatst bouwen, wanneer datapoints duidelijk zijn
- **Design agent**: Niet opnemen, doen we aan het eind
- **Odinfo**: Collega adviseur (consultant), later klant — geen implementation_partner rol
- **Superadmin**: Productmaker kan alles zien en gebruiken voor productverbetering
- **Toekomst**: Eventueel leveranciers adviseren bij inschrijvingen
- **Procedure-advies**: Systeem adviseert op basis van drempelwaarden, gebruiker moet afwijking onderbouwen
- **Drempelwaarden**: Configureerbaar in database per organisatie
- **Aanbestedende dienst type**: Op organisatieniveau (centraal/decentraal)

---

## Kwaliteitsregels (uit AGENTS.MD)

1. Svelte classic syntax — `export let`, `$:`, geen runes
2. TypeScript strict — geen `any`, geen `@ts-ignore`
3. Engels code, Nederlands UI
4. Max 200 regels per bestand
5. Max 30 regels per functie
6. Elke nieuwe module krijgt direct een testbestand
7. snake_case database, camelCase TypeScript
8. Zod validatie op alle API routes
9. RLS op alle tabellen
10. Geen console.log in productie

---

## 18. Ralph Loop Task Prompts

> Onderstaande prompts zijn klaar om individueel te draaien met Ralph Loop.
> Gebruik: `/ralph-loop "<prompt>" --completion-promise "COMPLETE" --max-iterations <n>`
>
> **Algemene regels** (gelden voor ELKE prompt):
> - Lees `tender2-plan.md` voor volledige context
> - Lees `CLAUDE.md` en `AGENTS.MD` voor coderegels
> - Svelte classic syntax (`export let`, `$:`, geen runes)
> - TypeScript strict — geen `any`, geen `@ts-ignore`
> - Engels code, Nederlands UI-tekst
> - Max 200 regels per bestand, max 30 regels per functie
> - Elke nieuwe module krijgt direct een testbestand
> - Zod validatie op alle API routes
> - RLS policies op alle nieuwe tabellen
> - Geen console.log in productie
> - Commit na elke geslaagde stap

---

### Fase 1 — Multi-org basisstructuur

```
Lees tender2-plan.md (sectie 6, 8) voor context.

Bouw de multi-organisatie basisstructuur.

Stappen:
1. Maak migratie migration_028_extend_profiles.sql:
   - ALTER TABLE profiles ADD COLUMN is_superadmin BOOLEAN DEFAULT false;
2. Maak migratie migration_029_new_enums.sql:
   - organization_type ENUM (client, consultancy, government)
   - contracting_authority_type ENUM (centraal, decentraal)
   - organization_relationship_type ENUM (consultancy, audit, legal, other)
   - relationship_status ENUM (active, inactive, pending)
3. Maak migratie migration_033_extend_organizations.sql:
   - Voeg toe aan organizations: parent_organization_id (UUID FK self-ref, nullable),
     organization_type, aanbestedende_dienst_type
3. Maak migratie migration_034_organization_relationships.sql:
   - Tabel organization_relationships met source_organization_id, target_organization_id,
     relationship_type, status, contract_reference, valid_from, valid_until
   - UNIQUE constraint op (source, target, type)
   - CHECK constraint: source != target
   - Indexen op source en target
4. Maak migratie migration_035_organization_settings.sql:
   - Tabel organization_settings (1-to-1 met organizations)
   - Alle velden uit tender2-plan.md sectie 6.3
5. Maak migratie migration_036_retention_profiles.sql:
   - Tabel retention_profiles met id, name, description, source, termijnen
   - Seed data: vng_2020 en provisa
6. Maak migratie migration_037_extend_organization_members.sql:
   - Voeg source_organization_id toe (nullable)
   - Voeg rollen external_advisor en auditor toe aan organization_role enum
7. Genereer TypeScript types voor alle nieuwe tabellen
8. Schrijf tests in tests/integration/multi-org.test.ts:
   - Maakt organisatie met type aan
   - Maakt relatie tussen organisaties
   - Voegt extern lid toe via relatie
   - Organization settings aanmaken en ophalen
9. Draai alle migraties en tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 30

---

### Fase 2 — RLS policies & rechtenmodel

```
Lees tender2-plan.md (sectie 8.3, 8.5) voor context.

Bouw RLS policies voor het multi-organisatie rechtenmodel.

Stappen:
1. Maak superadmin bypass helper functie:
   - CREATE FUNCTION is_superadmin() die profiles.is_superadmin checkt
   - Alle RLS policies krijgen OR is_superadmin() bypass
2. Pas RLS aan op organizations:
   - Gebruiker ziet alleen organisaties waar ze lid van zijn
   - Superadmin ziet ALLE organisaties
   - Owner/admin kan organisatie wijzigen
3. Voeg RLS toe aan organization_relationships:
   - Zichtbaar als je lid bent van source OF target org
   - Superadmin ziet alle relaties
   - Alleen owner van source of target kan aanmaken/wijzigen
4. Voeg RLS toe aan organization_settings:
   - Leesbaar voor alle leden van de organisatie
   - Superadmin leest en schrijft overal
   - Schrijfbaar alleen voor owner/admin
5. Voeg RLS toe aan organization_members (uitgebreid):
   - External_advisor ziet alleen projecten waar ze project_member zijn
   - Auditor ziet alleen organization_settings
6. Pas RLS aan op projects:
   - Scoped naar organization_id van actieve context
   - Superadmin ziet alle projecten in alle organisaties
   - External_advisor alleen toegewezen projecten
7. Pas RLS aan op suppliers, project_suppliers, incoming_questions:
   - Superadmin bypass op alle leveranciers- en vragentabellen
8. Schrijf RLS tests in tests/rls/organization-rls.test.ts:
   - Superadmin kan ALLE org data lezen en schrijven
   - Superadmin kan switchen naar elke org zonder lidmaatschap
   - Member kan eigen org data lezen
   - Member kan andere org data NIET lezen
   - External_advisor ziet alleen toegewezen projecten
   - Auditor ziet alleen instellingen
   - Data volledig gescheiden tussen organisaties (voor niet-superadmins)
9. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 25

---

### Fase 3 — Context-switcher UI

```
Lees tender2-plan.md (sectie 8.4) voor context.

Bouw de organisatie context-switcher UI.

Stappen:
1. Maak store: src/lib/stores/organization-context.ts
   - activeOrganizationId (writable store)
   - availableOrganizations (derived, uit organization_members)
   - switchOrganization(orgId) functie
   - Persisteer in localStorage
2. Maak component: src/lib/components/OrganizationSwitcher.svelte
   - Dropdown met alle organisaties waar gebruiker lid van is
   - Huidige context gemarkeerd
   - Bij switch: update store, herlaad relevante data
3. Maak component: src/lib/components/ContextBadge.svelte
   - Visuele indicator in header van actieve klantcontext
   - Kleur per organisatie (hash van org naam)
4. Integreer in bestaande layout:
   - OrganizationSwitcher in sidebar (bovenaan)
   - ContextBadge in header
5. Pas bestaande data-loading aan:
   - Alle +page.server.ts bestanden gebruiken activeOrganizationId
   - Projects, correspondence, etc. gefilterd op actieve org
6. Schrijf test: tests/e2e/context-switch.test.ts
   - Switcht tussen organisaties
   - Toont juiste data per context
   - Behoudt context na pagina refresh
7. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 25

---

### Fase 4 — CPV referentietabel + import

```
Lees tender2-plan.md (sectie 3.3, 6.3) voor context.

Bouw de CPV referentietabel en importeer data.

Stappen:
1. Maak migratie migration_030_cpv_codes.sql:
   - Tabel cpv_codes: code (PK), description_nl, division, group_code,
     class_code, category_type (werken/leveringen/diensten), parent_code (FK self-ref)
   - Indexen op division, category_type, parent_code
   - RLS: publiek leesbaar
2. Maak import script: scripts/import-cpv-codes.ts
   - Lees bestaand Excel-bestand met CPV codes
   - Map elke code naar juiste category_type op basis van divisie:
     * 45xxxxxx = werken
     * 03-44 en 50-51 = leveringen
     * 50-98 = diensten (overlap met leveringen bij 50-51)
   - Insert met parent_code relaties
3. Maak API route: src/routes/api/cpv/+server.ts
   - GET met query params: category_type, division, search (beschrijving)
   - Pagination (limit/offset)
   - Zod validatie
4. Schrijf tests:
   - tests/integration/cpv-import.test.ts (import correct, parent relaties)
   - tests/integration/api/cpv.test.ts (filter, paginatie, zoek)
5. Draai import en alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 20

---

### Fase 5 — NUTS referentietabel + postcode mapping

```
Lees tender2-plan.md (sectie 3.2, 6.3) voor context.

Bouw de NUTS referentietabel en postcode-NUTS mapping. Alleen NL codes.

Stappen:
1. Maak migratie migration_031_nuts_codes.sql:
   - Tabel nuts_codes: code (PK), label_nl, level (0-3), parent_code (FK self-ref)
   - Indexen, RLS publiek leesbaar
2. Maak migratie migration_032_postcode_nuts_mapping.sql:
   - Tabel postcode_nuts_mapping: postcode_prefix (4 cijfers, PK), nuts3_code (FK)
   - RLS publiek leesbaar
3. Maak seed script: scripts/seed-nuts-codes.ts
   - NL NUTS hiërarchie:
     * NL (level 0)
     * NL1-NL4 (level 1: Noord, Oost, West, Zuid)
     * NL11-NL42 (level 2: provincies)
     * NL111-NL423 (level 3: COROP-gebieden)
4. Maak seed script: scripts/seed-postcode-nuts.ts
   - Mapping van 4-cijferige postcode-prefix naar NUTS3 code
   - Bron: CBS postcodetabel
5. Maak API route: src/routes/api/nuts/+server.ts
   - GET met query params: level, search, parent_code
   - Zod validatie
6. Maak util: src/lib/utils/postcode-to-nuts.ts
   - Functie: getNutsFromPostcode(postcode: string): Promise<NutsHierarchy>
7. Schrijf tests:
   - tests/unit/nuts-mapping.test.ts
   - tests/integration/api/nuts.test.ts
8. Draai seeds en alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 20

---

### Fase 6 — Organization tabel uitbreiding (KVK velden)

```
Lees tender2-plan.md (sectie 3.1, 6.2) voor context.

Breid de organizations tabel uit met KVK-gerelateerde velden.

Stappen:
1. Maak migratie migration_033_extend_organizations.sql (als nog niet gedaan in Fase 1):
   - Voeg toe: kvk_nummer (VARCHAR 8, UNIQUE), handelsnaam, rechtsvorm,
     straat, postcode (VARCHAR 7), plaats, sbi_codes (TEXT[]), nuts_codes (TEXT[])
2. Update TypeScript types: src/lib/types/organization.ts
   - Voeg nieuwe velden toe aan Organization interface
   - Maak OrganizationCreate en OrganizationUpdate types
3. Update Zod schema: src/lib/schemas/organization.ts
   - Validatie voor kvk_nummer (exact 8 cijfers)
   - Validatie voor postcode (NL formaat: 1234AB)
4. Update bestaande API routes voor organizations:
   - PATCH route accepteert nieuwe velden
   - GET retourneert nieuwe velden
5. Schrijf tests:
   - tests/integration/api/organizations.test.ts (update met KVK data)
   - Validatie tests (ongeldig KVK-nummer, ongeldig postcode)
6. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 15

---

### Fase 7 — KVK API integratie

```
Lees tender2-plan.md (sectie 7) voor volledige KVK API documentatie.

Bouw de KVK API integratie (server-side).

Stappen:
1. Maak KVK client: src/lib/server/api/kvk.ts
   - KVK_API_KEY en KVK_API_BASE_URL uit env
   - searchKvk(params): zoek op naam, kvkNummer, plaats
   - getKvkProfile(kvkNummer): basisprofiel ophalen
   - Error handling: timeout, 404, rate limiting
   - TypeScript interfaces voor request/response
2. Maak API route: src/routes/api/kvk/search/+server.ts
   - GET /api/kvk/search?naam=...&plaats=...
   - Zod validatie op query params
   - Proxy naar KVK Zoeken API (API key server-side)
3. Maak API route: src/routes/api/kvk/[kvkNummer]/+server.ts
   - GET /api/kvk/12345678
   - Valideer KVK-nummer formaat (8 cijfers)
   - Proxy naar KVK Basisprofiel API
4. Maak auto-link util: src/lib/utils/kvk-to-org.ts
   - Functie die KVK profiel omzet naar organization update
   - Automatisch NUTS koppelen via postcode (hergebruik Fase 5)
5. Schrijf tests:
   - tests/unit/kvk-client.test.ts (mock KVK responses)
   - tests/integration/api/kvk-search.test.ts
   - tests/integration/api/kvk-profile.test.ts
   - Test: ongeldig nummer, timeout, lege resultaten
6. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 25

---

### Fase 8 — Leveranciers CRM (database + API)

```
Lees tender2-plan.md (sectie 6.3, 9) voor context.

Bouw het leveranciers CRM: database tabellen en API routes.

Stappen:
1. Maak migratie migration_038_suppliers.sql:
   - Tabel suppliers: alle velden uit tender2-plan.md sectie 6.3
   - Inclusief governance velden (data_classification, retention_until, etc.)
   - RLS: leveranciers gescheiden per organisatie
2. Maak migratie migration_039_supplier_contacts.sql:
   - Tabel supplier_contacts: name, email, phone, function_title, is_primary
   - FK naar suppliers
3. Maak migratie migration_040_project_suppliers.sql:
   - Tabel project_suppliers: status lifecycle, role, alle velden
   - UNIQUE(project_id, supplier_id)
   - Indexen op project, supplier, status
4. Maak TypeScript types en Zod schemas
5. Maak API routes:
   - POST /api/suppliers — aanmaken (org-scoped)
   - GET /api/suppliers — lijst per organisatie (met zoek, filter)
   - GET /api/suppliers/[id] — detail met contacten
   - PATCH /api/suppliers/[id] — update
   - DELETE /api/suppliers/[id] — soft delete
   - POST /api/suppliers/[id]/contacts — contact toevoegen
   - POST /api/projects/[projectId]/suppliers — koppelen aan project
   - PATCH /api/projects/[projectId]/suppliers/[supplierId] — status wijzigen
   - GET /api/projects/[projectId]/suppliers — lijst per project
6. Schrijf tests:
   - tests/integration/api/suppliers.test.ts (CRUD, org-scoping)
   - tests/integration/api/project-suppliers.test.ts (koppeling, status)
   - tests/rls/suppliers-rls.test.ts (data-scheiding)
7. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 30

---

### Fase 9 — Leveranciers UI (lijst + drawer)

```
Lees tender2-plan.md (sectie 9) voor context.

Bouw de leveranciers UI: lijstpagina en detaildrawer.

Stappen:
1. Maak route: src/routes/(app)/suppliers/+page.svelte
   - Tabel met leveranciers van actieve organisatie
   - Zoeken op naam, KVK, stad
   - Filter op tags
   - "Nieuwe leverancier" knop met KVK-zoek dialog
2. Maak route: src/routes/(app)/suppliers/+page.server.ts
   - Load leveranciers met contacten, gefilterd op org context
3. Maak component: src/lib/components/SupplierDrawer.svelte
   - 40% breed, opent bij klik op leverancier
   - 5 tabs: Overzicht, Aanbestedingen, Correspondentie, Kwalificatie, Notities
   - Tab Overzicht: bedrijfsgegevens, contactpersonen, tags, beoordeling
   - Tab Aanbestedingen: projecten + status + resultaat
   - Tab Correspondentie: brieven aan leverancier
   - Tab Kwalificatie: UEA, GVA, certificeringen
   - Tab Notities: privé + gedeeld
4. Maak component: src/lib/components/KvkSearchDialog.svelte
   - Zoekformulier (naam/KVK/plaats)
   - Resultatenlijst met selectie
   - Auto-fill leveranciersvelden bij selectie
5. Maak component: src/lib/components/SupplierInProject.svelte
   - Leverancier koppelen vanuit project
   - Status wijzigen (dropdown)
6. Voeg "Leveranciers" toe aan sidebar navigatie (org-level)
7. Schrijf test: tests/e2e/supplier-drawer.test.ts
8. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 30

---

### Fase 10 — Binnenkomende vragen module

```
Lees tender2-plan.md (sectie 6.3, 11) voor context.

Bouw de binnenkomende vragen module (database + API + UI).

Stappen:
1. Maak migratie migration_041_incoming_questions.sql:
   - Tabel incoming_questions: alle velden uit plan
   - question_number SERIAL per project
   - Status flow: received → in_review → answered → approved → published
   - Governance velden
2. Maak TypeScript types en Zod schemas
3. Maak API routes:
   - POST /api/projects/[projectId]/questions — registreer vraag
   - GET /api/projects/[projectId]/questions — lijst (met filter op status)
   - PATCH /api/projects/[projectId]/questions/[id] — beantwoorden/status wijzigen
   - POST /api/projects/[projectId]/questions/[id]/approve — goedkeuren
4. Maak route: src/routes/(app)/projects/[id]/questions/+page.svelte
   - Lijst met binnenkomende vragen
   - Status badges
   - Inline beantwoorden
   - Filter op status
   - "Nieuwe vraag" formulier
5. Maak route: src/routes/(app)/projects/[id]/questions/+page.server.ts
6. Schrijf tests:
   - tests/integration/api/questions.test.ts
   - Test automatische nummering
   - Test status flow
   - Test NvI data ophalen (alle approved vragen)
7. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 25

---

### Fase 11 — Organization settings UI

```
Lees tender2-plan.md (sectie 8) voor context.

Bouw de organisatie-instellingen pagina.

Stappen:
1. Maak route: src/routes/(app)/settings/+page.svelte
   - Tabs: Algemeen, Retentie, Drempelwaarden, Relaties
   - Tab Algemeen: org type, aanbestedende dienst type
   - Tab Retentie: selectielijst profiel kiezen, termijnen overschrijven,
     anonimisatie strategie
   - Tab Drempelwaarden: bedragen voor werken, diensten centraal/decentraal,
     sociale diensten
   - Tab Relaties: overzicht externe organisaties, rollen, status,
     verwerkersovereenkomst referentie
2. Maak route: src/routes/(app)/settings/+page.server.ts
   - Load organization_settings
   - Load retention_profiles (voor dropdown)
   - Load organization_relationships
3. Maak API routes:
   - PATCH /api/organizations/[orgId]/settings — update instellingen
   - POST /api/organizations/[orgId]/relationships — relatie toevoegen
   - PATCH /api/organizations/[orgId]/relationships/[id] — relatie wijzigen
4. Alleen zichtbaar voor owner/admin (RLS + UI check)
5. Schrijf tests
6. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 20

---

### Fase 12 — Data governance velden

```
Lees tender2-plan.md (sectie 6.2, 14) voor context.

Voeg governance velden toe aan alle relevante data-tabellen.

Stappen:
1. Maak migratie migration_044_governance_fields.sql:
   - Voeg toe aan correspondence: data_classification, retention_until,
     anonymized_at, archive_status
   - Voeg toe aan artifacts: idem
   - Voeg toe aan evaluations: idem
   - Voeg toe aan documents: idem
   - Voeg toe aan time_entries: idem
   - Voeg toe aan conversations: idem
   - Voeg toe aan messages: idem
   - Voeg toe aan document_comments: idem
   - Voeg toe aan section_reviewers: idem
   - Default: data_classification='operational', archive_status='active'
2. Maak util: src/lib/utils/governance.ts
   - calculateRetentionDate(orgSettings, dataClassification, contractEndDate)
   - getDataClassification(tableName): returns juiste classificatie
3. Maak database functie (Supabase):
   - set_retention_dates(project_id): berekent en zet retention_until
     voor alle gerelateerde records op basis van organization_settings
4. Update TypeScript types met governance velden
5. Schrijf tests:
   - tests/integration/governance.test.ts
   - Test correcte berekening retention_until
   - Test classificatie per tabel
6. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 20

---

### Fase 13 — docxtemplater integratie

```
Lees tender2-plan.md (sectie 12) voor context.

Integreer docxtemplater voor server-side document rendering.

Stappen:
1. Installeer dependencies: docxtemplater, pizzip
2. Maak module: src/lib/server/templates/renderer.ts
   - renderTemplate(templateBuffer, data): Promise<Buffer>
   - Foutafhandeling: ontbrekende placeholders → lege string
   - Lijst-support: {#suppliers}{name}{/suppliers}
3. Maak module: src/lib/server/templates/data-collector.ts
   - collectTemplateData(projectId, documentTypeId): Promise<TemplateData>
   - Haalt op: org data, project data, document rollen, leveranciers,
     artifacts content, vragen/antwoorden
4. Maak module: src/lib/server/templates/placeholder-registry.ts
   - Registry van alle standaard placeholders (zie tender2-plan sectie 12.3)
   - Validatie: welke placeholders verwacht dit template?
5. Maak API route: src/routes/api/projects/[projectId]/export/+server.ts
   - POST met documentTypeId
   - Haalt template, verzamelt data, rendert, retourneert .docx
6. Schrijf tests:
   - tests/unit/docxtemplater.test.ts (render, placeholders, lijsten, logo)
   - Test met een simpel test-template (.docx met placeholders)
7. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 25

---

### Fase 14 — Template storage + upload UI

```
Lees tender2-plan.md (sectie 3.4, 6.3) voor context.

Bouw template opslag en upload functionaliteit.

Stappen:
1. Maak migratie migration_042_document_templates.sql:
   - Tabel document_templates: alle velden uit plan
   - RLS: zichtbaar voor org leden, beheerbaar door admin/owner
2. Maak Supabase Storage bucket: document-templates
   - Pad: {organization_id}/{document_type_id}/{filename}
3. Maak API routes:
   - POST /api/templates — upload template (multipart form)
   - GET /api/templates — lijst per org en document type
   - GET /api/templates/[id] — download template
   - DELETE /api/templates/[id] — soft delete
   - PATCH /api/templates/[id] — metadata update (naam, is_default)
4. Maak route: src/routes/(app)/settings/templates/+page.svelte
   - Template beheer pagina (onderdeel van org settings)
   - Upload formulier (selecteer document type, CPV categorie)
   - Lijst met templates, default markering
   - Preview/download knop
5. Schrijf tests:
   - tests/integration/api/templates.test.ts
   - Upload, lijst, download, delete, default selectie
6. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 25

---

### Fase 15 — Editor refactoring

```
Lees tender2-plan.md (sectie 13) voor context.

Refactor de document editor: vervang StepperSidebar door paginaminiaturen.

Stappen:
1. Verwijder of archiveer: src/lib/components/StepperSidebar.svelte
2. Maak component: src/lib/components/PageThumbnails.svelte
   - Canvas-based miniatuurweergave van documentpagina's
   - Klikbaar voor navigatie naar pagina
   - Scroll-sync met editor content
   - Actieve pagina gemarkeerd
3. Refactor: src/routes/(app)/projects/[id]/documents/[docTypeId]/+page.svelte
   - Vervang StepperSidebar door PageThumbnails
   - Content stroomt als één doorlopend document
   - Sectie-markers in DOM voor data-binding (onzichtbaar voor gebruiker)
4. Voeg document-level status toe:
   - Nieuw veld op project-document koppeling: document_status
     (concept → in_review → approved)
   - Vervangt per-sectie voortgang
5. Update EditorToolbar.svelte:
   - Verwijder sectie-gerelateerde elementen
   - Pas progress indicator aan (document-level)
6. Schrijf tests:
   - tests/e2e/editor-refactoring.test.ts
   - Paginaminiaturen renderen
   - Navigatie via thumbnails
   - Document status wijzigen
7. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 30

---

### Fase 16 — Markdown → HTML transformatie

```
Lees tender2-plan.md (sectie 13.3) voor context.

Bouw de markdown-naar-TipTap HTML conversielaag.

Stappen:
1. Installeer dependencies: unified, remark-parse, remark-rehype, rehype-stringify
2. Maak util: src/lib/utils/markdown-to-tiptap.ts
   - markdownToTiptapHtml(markdown: string): Promise<string>
   - Converteert: bullets → bulletList, headers → heading, bold/italic,
     geneste lijsten, paragrafen
   - Lege input → lege string
3. Integreer in artifact opslag:
   - Bij AI generatie: converteer markdown naar HTML vóór opslaan in artifact.content
   - Pas aan in relevante API routes die AI content verwerken
4. Schrijf tests: tests/unit/markdown-to-tiptap.test.ts
   - Bullets worden bulletList nodes
   - Headers worden heading nodes
   - Bold/italic correct
   - Geneste lijsten
   - Lege input
   - Mixed content (tekst + bullets + headers)
5. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 15

---

### Fase 17 — Correspondentie → documenten

```
Lees tender2-plan.md (sectie 10, 13) voor context.

Merge correspondentie in het documentensysteem.

Stappen:
1. Maak document_types voor alle 11 brieftypes:
   - Migratie die document_types toevoegt met category='correspondence'
   - Per brief: slug, naam, template_structure met verwachte placeholders
2. Migreer bestaande correspondentie data:
   - Koppel correspondence records aan nieuwe document_types
   - Content overzetten naar artifacts
3. Maak brief-specifieke placeholder sets:
   - Per brief de verwachte data (zie tender2-plan sectie 10.3)
   - Registreer in placeholder-registry
4. Verwijder of archiveer:
   - src/routes/(app)/projects/[id]/correspondence/[letterId]/+page.svelte
   - Redirect oude routes naar nieuwe document routes
5. Update sidebar navigatie:
   - "Correspondentie" wordt filter op documents met category='correspondence'
6. Schrijf tests:
   - Brieftypes correct aangemaakt als document_types
   - Bestaande data gemigreerd
   - Oude routes redirecten
7. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 30

---

### Fase 18 — Document template mapping

```
Lees tender2-plan.md (sectie 3.4, 12) voor context.

Bouw de logica die het juiste template selecteert per document.

Stappen:
1. Maak util: src/lib/server/templates/template-selector.ts
   - selectTemplate(orgId, documentTypeId, categoryType?): Promise<DocumentTemplate>
   - Logica: zoek template voor org + type + categorie
   - Fallback: org + type (zonder categorie)
   - Fallback: default template
2. Integreer in export flow:
   - Bij document generatie: automatisch juiste template selecteren
   - Bij brief generatie: brief-template selecteren
3. Maak UI: template-keuze bij document aanmaken
   - Als meerdere templates beschikbaar: dropdown
   - Als één template: automatisch selecteren
4. Schrijf tests:
   - Template selectie logica (exacte match, fallback, default)
   - CPV-type → template mapping
5. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 15

---

### Fase 19 — Document rollen

```
Lees tender2-plan.md (sectie 6.3) voor context.

Bouw het documentrollen systeem voor template placeholders.

Stappen:
1. Maak migratie migration_043_project_document_roles.sql:
   - Tabel project_document_roles met alle velden uit plan
   - Standaard rollen: contactpersoon, inkoper, projectleider,
     budgethouder, juridisch_adviseur
2. Maak API routes:
   - GET /api/projects/[projectId]/roles — lijst rollen
   - POST /api/projects/[projectId]/roles — rol toewijzen
   - PATCH /api/projects/[projectId]/roles/[roleKey] — wijzigen
3. Maak UI in projectprofiel:
   - Sectie "Documentrollen" met formulier per rol
   - Naam, email, telefoon, functie per rol
4. Integreer in template data collector:
   - Rollen beschikbaar als placeholders: {contactpersoon_naam},
     {inkoper_naam}, etc.
5. Schrijf tests
6. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 15

---

### Fase 20 — Procedure advies logica

```
Lees tender2-plan.md (sectie 3.1, 17) voor context.

Bouw het procedure-adviessysteem op basis van drempelwaarden.

Stappen:
1. Maak util: src/lib/utils/procedure-advice.ts
   - getProcedureAdvice(amount, orgSettings, categoryType): ProcedureAdvice
   - Logica:
     * Boven drempel diensten centraal (143k) → Europees openbaar
     * Boven drempel diensten decentraal (221k) → Europees openbaar
     * Boven drempel werken (5.538k) → Europees openbaar
     * Boven drempel sociaal (750k) → Vereenvoudigd
     * Onder drempel → Meervoudig onderhands / enkelvoudig
   - Retourneert: advies, motivatie, waarschuwing bij afwijking
2. Maak component: src/lib/components/ProcedureAdvisor.svelte
   - Toont advies bij invullen bedrag in projectprofiel
   - Waarschuwing als gebruiker afwijkt
   - Tekstveld voor onderbouwing afwijking (verplicht)
3. Integreer in projectprofiel pagina
4. Schrijf tests: tests/unit/procedure-advice.test.ts
   - Alle drempelvarianten
   - Centraal vs decentraal
   - Org-specifieke waarden
   - Afwijking detectie
5. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 15

---

### Fase 21 — Selectielijst profielen

```
Lees tender2-plan.md (sectie 14.4) voor context.

Bouw selectielijst profielen voor retentie-configuratie.

Stappen:
1. Maak API route: GET /api/retention-profiles — lijst beschikbare profielen
2. Maak component: src/lib/components/RetentionProfileSelector.svelte
   - Dropdown met profielen (VNG 2020, PROVISA)
   - Bij selectie: vul retentietermijnen automatisch in organization_settings
   - Toon toelichting per profiel (bron, termijnen)
   - Mogelijkheid om waarden te overschrijven
3. Integreer in Organization Settings pagina (tab Retentie)
4. Schrijf tests
5. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 10

---

### Fase 22 — Retentie signalering (cron job)

```
Lees tender2-plan.md (sectie 14) voor context.

Bouw de retentie-signalering als cron job.

Stappen:
1. Maak Supabase Edge Function of scheduled API route:
   - src/lib/server/cron/retention-check.ts
   - Query alle records waar retention_until < NOW() en archive_status = 'archived'
   - Update archive_status naar 'retention_expired'
   - Stuur notificatie naar org admin
2. Maak database functie:
   - archive_project(project_id): zet alle gerelateerde records op
     archive_status='archived' en berekent retention_until
   - Trigger: wanneer project status → 'archived' of contract eindigt
3. Maak anonimisatie functie:
   - anonymize_records(table_name, record_ids, strategy):
     * 'replace': vervang PII door pseudoniemen (Persoon A, Bedrijf B)
     * 'remove': vervang PII door '[verwijderd]'
4. Maak admin UI: retentie-overzicht
   - Lijst met records waar retentie verlopen is
   - Actieknoppen: anonimiseren / verlengen / vernietigen
5. Schrijf tests:
   - tests/integration/governance.test.ts (uitbreiden)
   - Retentie berekening correct
   - Archivering correct
   - Anonimisatie replace strategie
   - Anonimisatie remove strategie
6. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 25

---

### Fase 23 — Email-parsing binnenkomende vragen

```
Lees tender2-plan.md (sectie 11) voor context.

Bouw email-parsing voor automatische import van binnenkomende vragen.

Stappen:
1. Maak module: src/lib/server/email/parser.ts
   - parseQuestionEmail(rawEmail: string): ParsedQuestion
   - Extraheert: afzender, onderwerp, vraag tekst, bijlagen
   - Herkent afzender als bekende leverancier (match op email domein)
   - Extraheert document referentie uit onderwerp/body
2. Maak API route: POST /api/projects/[projectId]/questions/import
   - Accepteert email content (forward of webhook)
   - Parseert en maakt incoming_question record
   - Koppelt intern aan leverancier indien herkend
3. Maak UI: import dialoog
   - Plak email tekst of forward
   - Preview van geparseerde vraag
   - Bevestig import
4. Schrijf tests: tests/unit/email-parser.test.ts
   - Parse email body
   - Extraheer document referentie
   - Herken afzender als leverancier
   - Meerdere vragen in één email
5. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 20

---

### Fase 24 — Superadmin analytics

```
Lees tender2-plan.md voor context.

Bouw superadmin analytics view voor productverbetering.

Stappen:
1. Maak superadmin role check:
   - Nieuw veld op profiles: is_superadmin (boolean, default false)
   - RLS: superadmin kan alle organisaties en data lezen
2. Maak route: src/routes/(app)/admin/+page.svelte
   - Overzicht: aantal organisaties, projecten, gebruikers, documenten
   - Per organisatie: activiteit, gebruikte features, document types
   - Trends: groei over tijd
   - Feature usage: welke modules worden gebruikt
3. Maak route: src/routes/(app)/admin/+page.server.ts
   - Aggregatie queries (geen PII tonen, alleen statistieken)
4. Bescherm met is_superadmin check
5. Schrijf tests
6. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 20

---

### Fase 25 — Dashboard

```
Lees tender2-plan.md voor context. Dashboard wordt als LAATSTE gebouwd.

Bouw het projectleider dashboard met alle beschikbare datapoints.

Stappen:
1. Inventariseer beschikbare datapoints uit alle eerdere fasen:
   - Projecten per fase, status, voortgang
   - Leveranciers per status
   - Binnenkomende vragen (open/beantwoord)
   - Documenten per status
   - Deadlines en milestones
   - Retentie waarschuwingen
2. Maak route: src/routes/(app)/dashboard/+page.svelte
   - Verwijder oude dashboard content (behalve phasebar)
   - KPI cards bovenaan
   - Projecten overzicht met fase-indicatie
   - Recente activiteit
   - Aankomende deadlines
   - Open actiepunten
3. Maak route: src/routes/(app)/dashboard/+page.server.ts
   - Aggregatie queries per organisatie context
4. Schrijf tests
5. Draai alle tests

Alle tests moeten slagen. Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 25

---

### Fase 26 — End-to-end testing & validatie

```
Lees tender2-plan.md (sectie 16) voor context.

Volledige end-to-end test suite en kwaliteitsvalidatie.

Stappen:
1. Schrijf E2E tests voor kritieke flows:
   - Organisatie aanmaken met KVK lookup
   - Context switchen tussen organisaties
   - Project aanmaken met CPV/NUTS selectie
   - Leverancier toevoegen via KVK
   - Document genereren met template
   - Binnenkomende vraag registreren en NvI genereren
   - Brief versturen naar leverancier
2. Draai volledige test suite:
   - Alle unit tests
   - Alle integratie tests
   - Alle RLS tests
   - Alle E2E tests
3. Kwaliteitscheck:
   - Geen bestand > 200 regels
   - Geen functie > 30 regels
   - Geen console.log in src/
   - Geen TypeScript any of @ts-ignore
   - Alle tabellen hebben RLS
   - Alle API routes hebben Zod validatie
4. Fix alle failures
5. Genereer test coverage rapport

Alle tests moeten slagen en kwaliteitscheck moet 100% zijn.
Output <promise>COMPLETE</promise> wanneer klaar.
```

**Max iterations**: 40

---

### Ralph Loop Cheat Sheet

```bash
# Fase 1 — Multi-org basis
/ralph-loop "$(cat tender2-plan.md | head -1) ..." --completion-promise "COMPLETE" --max-iterations 30

# Of gebruik een apart prompt-bestand per fase:
# prompts/fase-01-multi-org.md
# prompts/fase-02-rls.md
# etc.

# Start een fase:
/ralph-loop "$(cat prompts/fase-01-multi-org.md)" --completion-promise "COMPLETE" --max-iterations 30

# Cancel als het vastzit:
/cancel-ralph
```

| Fase | Max Iterations | Geschatte tijd | Agent(s) |
|------|---------------|----------------|----------|
| 1 | 30 | 45-60 min | 1 |
| 2 | 25 | 30-45 min | 1 |
| 3 | 25 | 30-45 min | 2 |
| 4 | 20 | 20-30 min | 1 |
| 5 | 20 | 20-30 min | 1 |
| 6 | 15 | 15-20 min | 1 |
| 7 | 25 | 30-45 min | 1, 4 |
| 8 | 30 | 45-60 min | 1 |
| 9 | 30 | 45-60 min | 2 |
| 10 | 25 | 30-45 min | 1, 2 |
| 11 | 20 | 20-30 min | 2, 5 |
| 12 | 20 | 20-30 min | 1 |
| 13 | 25 | 30-45 min | 3 |
| 14 | 25 | 30-45 min | 1, 2, 3 |
| 15 | 30 | 45-60 min | 3 |
| 16 | 15 | 15-20 min | 4 |
| 17 | 30 | 45-60 min | 1, 2, 3 |
| 18 | 15 | 15-20 min | 1, 3 |
| 19 | 15 | 15-20 min | 1, 2 |
| 20 | 15 | 15-20 min | 1, 2 |
| 21 | 10 | 10-15 min | 5 |
| 22 | 25 | 30-45 min | 5 |
| 23 | 20 | 20-30 min | 4 |
| 24 | 20 | 20-30 min | 5 |
| 25 | 25 | 30-45 min | 2 |
| 26 | 40 | 60-90 min | 6 |
| **Totaal** | **560** | **~12-18 uur** | |
