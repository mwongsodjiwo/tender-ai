# Redesign — Tendermanager UI

Dit document beschrijft de volledige UI-redesign van Tendermanager. Alle taken zijn verdeeld in sprints met agent-toewijzingen.

Lees altijd eerst `PRODUCT.md` en `AGENTS.md` voordat je begint.

## Agents

| Agent | Rol | Mapping naar AGENTS.md |
|-------|-----|----------------------|
| Platform Engineer | Database, API endpoints, types, templates | Agent 1 (Backend) |
| Product Engineer | UI componenten, routes, styling, UX | Agent 2 (Frontend) |
| AI Architect | LLM-integratie, RAG, prompt engineering | Agent 3 (AI) |
| Quality Architect | Testen, CI/CD, kwaliteitsbewaking | Agent 4 (DevOps & QA) |

## Design systeem

Visuele stijl gebaseerd op Remote.com: clean, licht, blauw accent, veel witruimte, afgeronde kaarten, subtiele schaduwen. Alle UI-teksten in het Nederlands.

## Projectfases

| Fase | Naam | Beschrijving |
|------|------|-------------|
| 1 | Voorbereiden | Briefing, projectprofiel opstellen en bevestigen |
| 2 | Verkennen | Deskresearch, RFI, consultatie, rapport |
| 3 | Specificeren | PvE, Aanbestedingsleidraad, EMVI, UEA, Conceptovereenkomst |
| 4 | Aanbesteden | Publicatie, NvI, beoordeling, gunning, afwijzingsbrieven |
| 5 | Contracteren | Definitieve overeenkomst, ondertekening |

## Projectnavigatie

```
Project [naam]
├── Overzicht           → fase-indicator, checklist per fase, metrics, activiteit
├── Projectprofiel      → de bevestigde waarheid, altijd bereikbaar
├── Documenten          → alle documenttypes
├── Correspondentie     → brieven per fase
└── Team                → teamleden, rollen, kennishouders
```

## Database schema

### Public schema (app data)

**Bestaande tabellen:**
- organizations, profiles, organization_members
- project_members, project_member_roles
- conversations, messages
- artifacts (+ phase veld)
- documents, document_types
- section_reviewers, audit_log

**projects (aangepast):**
- current_phase (enum: preparing/market_research/specifying/tendering/contracting)
- profile_confirmed (boolean), profile_confirmed_at (timestamp)

**project_profiles (nieuw):**
- id, project_id
- contracting_authority, department, contact_person
- title, description, scope
- cpv_codes (text[])
- procedure_type, is_framework_agreement (boolean)
- estimated_value, budget, duration_months
- publication_date, closing_date, award_date
- sustainability_requirements, social_return, innovation (jsonb)
- confirmed (boolean), confirmed_at, confirmed_by
- created_at, updated_at

**phase_activities (nieuw):**
- id, project_id
- phase (enum: preparing/market_research/specifying/tendering/contracting)
- activity_type (text)
- status (enum: not_started/in_progress/completed/skipped)
- created_at, updated_at

**correspondence (nieuw):**
- id, project_id
- phase (enum)
- letter_type (text)
- recipient, subject, body
- status (enum: draft/in_review/approved/sent)
- sent_at
- created_at, updated_at

**evaluations (nieuw):**
- id, project_id
- tenderer_name
- scores (jsonb)
- total_score, ranking
- status (enum: draft/final)
- created_at, updated_at

**requirements (nieuw):**
- id, project_id
- type (enum: knockout/award_criterion/preference)
- category (enum: functional/technical/process/quality/sustainability)
- number (text)
- title, description
- weight, priority (1-5)
- source (enum: manual/ai_generated/knowledge_base)
- source_requirement_id (uuid, nullable)
- created_at, updated_at

### Knowledge_base schema (TenderNed data)

**knowledge_base.tenders:**
- id, title, contracting_authority
- cpv_codes (text[]), contract_type, procedure
- estimated_value, publication_date, closing_date
- status, source_url, raw_data (jsonb)
- created_at

**knowledge_base.requirements:**
- id, tender_id
- type (enum: knockout/award_criterion/preference)
- category (enum: functional/technical/process/quality/sustainability)
- title, description, weight
- source_section
- created_at

**knowledge_base.requirement_chunks:**
- id, requirement_id
- chunk_text, embedding (vector)
- cpv_codes (text[]), category
- metadata (jsonb)
- created_at

**knowledge_base.harvest_log:**
- id, started_at, finished_at
- items_processed, status, error_message

**Verwijderd:** tenderned_items (vervangen door knowledge_base.tenders)

## Technische stack

Zie AGENTS.md voor de volledige stack. Aanvulling voor redesign:

- **Tiptap** — rich text editor voor secties (Aanbestedingsleidraad, Conceptovereenkomst)
- **Tailwind** — alle styling via Tailwind utility classes, Remote-stijl design tokens in tailwind.config.js

## Regels

Alle 22 regels uit AGENTS.md gelden. Extra nadruk op:

- Regel 10: Content is Nederlands
- Regel 15: Componenten zijn dom (data via props)
- Regel 19: WCAG 2.1 AA verplicht
- Regel 22: Elke pagina heeft vier states (loading, empty, data, error)

---

## Sprint R1 — Design systeem & componenten

Doel: een gedeeld design systeem in Remote-stijl dat alle volgende sprints gebruiken.

**Stap 1 · Product Engineer** — Definieer design tokens in tailwind.config.js: kleuren (primair blauw, grijs tinten, succes groen, warning oranje, error rood), typografie, border-radius, schaduwen. Gebaseerd op Remote.com visuele stijl: clean, licht, veel witruimte.

**Stap 2 · Product Engineer** — Bouw gedeelde UI componenten:
- `MetricCard` — getal + label (zoals "7 Totaal eisen")
- `StatusBadge` — gekleurde labels (Verplicht, Concept, Goedgekeurd, etc.)
- `ProgressBar` — horizontale voortgangsbalk met percentage
- `StepperSidebar` — verticale stappen met status (afgerond/actief/niet gestart) voor wizard-flow
- `PhaseIndicator` — fase-indicator met de 5 fases (Voorbereiden → Marktverkennen → Specificeren → Aanbesteden → Contracteren)
- `ActivityChecklist` — checklist met activiteiten per fase en status
- `SectionNav` — inhoudsopgave navigatie voor documenten
- `ChatButton` — klein chatknopje dat een chatvenster opent per sectie
- `InfoBanner` — info/waarschuwing blokken (blauw info, geel waarschuwing)
- `FilterBar` — zoekbalk + dropdown filters
- `CardGrid` — grid layout voor documentblokken

**Stap 3 · Quality Architect** — Unit tests voor alle componenten. Accessibility check: alle componenten moeten WCAG 2.1 AA compliant zijn.

> ⛔ **ALLE VOLGENDE SPRINTS WACHTEN OP SPRINT R1** — Design systeem moet klaar zijn.

✅ **Sprint R1 is klaar wanneer:** alle componenten gebouwd, getest, en visueel consistent in Remote-stijl.

---

## Sprint R2 — Database & API uitbreiding

Doel: alle nieuwe tabellen en endpoints voor fases, projectprofiel, correspondentie, eisen en beoordelingen.

**Stap 4 · Platform Engineer** — Maak nieuwe database tabellen aan: project_profiles, phase_activities, correspondence, evaluations, requirements. Pas projects tabel aan met current_phase en profile_confirmed velden. Maak knowledge_base schema met tenders, requirements, requirement_chunks, harvest_log.

**Stap 5 · Platform Engineer** — TypeScript types voor alle nieuwe tabellen. CRUD endpoints voor: project_profiles, phase_activities, correspondence, evaluations, requirements. Zoek-endpoint voor knowledge_base.

**Stap 6 · Quality Architect** — Tests voor alle nieuwe endpoints. RLS policies valideren.

✅ **Sprint R2 is klaar wanneer:** alle tabellen bestaan, endpoints werken, types beschikbaar.

---

## Sprint R3 — Organisatie-dashboard

Doel: een dashboard voor organisatie-gebruikers met overzicht van projecten en activiteit.

**Stap 7 · Platform Engineer** — API endpoints voor dashboard data: actieve projecten count, documenten in review count, recente projecten lijst, secties per status aggregatie, deadlines komende week.

**Stap 8 · Product Engineer** — Dashboard pagina met kaarten-layout:
- **Linksboven** — Actieve projecten: lijndiagram (projecten gestart/afgerond per maand)
- **Midden boven** — Grote metric: "X documenten in review" met verschil t.o.v. vorige week
- **Rechtsboven** — Recente projecten tabel: naam, fase, deadline, voortgang %
- **Linksonder** — Projectvoortgang gauge: gemiddeld % afgerond van actieve projecten
- **Midden onder** — Secties per status: horizontale bars (concept/in review/goedgekeurd/afgewezen)

**Stap 9 · Quality Architect** — Tests voor dashboard: data correct weergegeven, vier states (loading/empty/data/error), responsive check.

✅ **Sprint R3 is klaar wanneer:** dashboard toont actuele data uit de database in Remote-stijl kaarten.

---

## Sprint R4 — Project-overzicht & projectprofiel

Doel: projectoverzicht met fase-indicator en checklist, plus projectprofiel als bewerkbare pagina.

**Stap 10 · Platform Engineer** — Endpoints voor project fase-data: huidige fase, activiteiten per fase met status, voortgang per documenttype, team overzicht, recente activiteit.

**Stap 11 · Product Engineer** — Project-overzicht pagina:
- **Bovenaan:** PhaseIndicator (Voorbereiden → Marktverkennen → Specificeren → Aanbesteden → Contracteren)
- **Drie metric-kaarten:** voortgang %, huidige fase, deadline
- **Per fase:** ActivityChecklist met activiteiten en status (niet gestart/bezig/afgerond/overgeslagen)
- **Rechts:** team overzicht, recente activiteit timeline

**Stap 12 · Product Engineer** — Projectprofiel pagina:
- Fullscreen wizard-flow in fase Voorbereiden (AI briefing vult velden voor)
- Na bevestiging: leesbare pagina met "Bewerken" knop
- Velden: opdrachtgever, titel, beschrijving, scope, CPV-code, procedure, waarde, budget, looptijd, planning, kaders
- Wijzigingen na bevestiging worden gelogd in audit trail
- Badge: "Concept" of "Bevestigd"

**Stap 13 · AI Architect** — Briefing-agent vult projectprofiel velden in op basis van het gesprek. Na bevestiging: alle AI-acties gebruiken het profiel als primaire context.

**Stap 14 · Quality Architect** — Tests: fase-indicator, checklist status updates, projectprofiel bevestiging flow, audit logging bij wijzigingen.

✅ **Sprint R4 is klaar wanneer:** gebruiker ziet projectfases met checklists, kan projectprofiel invullen en bevestigen, en de AI gebruikt het profiel als waarheid.

---

## Sprint R5 — Marktverkenning activiteiten

Doel: marktverkenning activiteiten als onderdeel van de Marktverkennen fase.

**Stap 15 · Platform Engineer** — Endpoints voor marktverkenning: deskresearch resultaten (uit knowledge_base), RFI templates, upload/verwerk RFI antwoorden, marktverkenningsrapport.

**Stap 16 · AI Architect** — Deskresearch-agent: doorzoekt knowledge_base op CPV-code en opdrachttype uit projectprofiel. RFI-agent: genereert concept RFI-vragenlijst. Rapport-agent: genereert concept marktverkenningsrapport op basis van alle verzamelde input.

**Stap 17 · Product Engineer** — Marktverkenning activiteiten in project-overzicht (checklist-items klikbaar naar):
- Deskresearch: AI zoekresultaten uit kennisbank, vergelijkbare aanbestedingen
- RFI: vragenlijst editor, upload antwoorden, AI analyse
- Marktconsultatie: publicatietekst editor, upload reacties
- Gesprekken: upload gespreksverslagen, AI samenvatting
- Rapport: AI-gegenereerd concept, gebruiker bewerkt

**Stap 18 · Quality Architect** — Tests: deskresearch zoekt correct in knowledge_base, RFI generatie, activiteiten status updates.

✅ **Sprint R5 is klaar wanneer:** alle marktverkenning activiteiten bereikbaar vanuit het overzicht, deskresearch doorzoekt kennisbank, RFI en rapport worden gegenereerd door AI.

---

## Sprint R6 — Document-editor (standaard layout voor alle documenttypes)

Doel: fullscreen document-editor als standaard layout voor het bewerken van alle documenten (Aanbestedingsleidraad, Conceptovereenkomst, correspondentie, etc.).

**Stap 19 · Platform Engineer** — Template definitie voor documenttypes in document_types: hoofdstukken, secties, per sectie de veldtypen. Endpoints voor sectie opslaan en ophalen.

**Stap 20 · AI Architect** — Na bevestiging projectprofiel: genereer concept-inhoud per sectie. Context: projectprofiel + marktverkenning + kennisbank. AI is alleen bereikbaar via tekst-selectie (avatar-popup).

**Stap 21 · Product Engineer** — Fullscreen document-editor (standaard voor alle documenttypes):

**Layout: 20% / 60% / 20% drie-kolommen**
- **Links (20%):** StepperSidebar met voortgangsbalk en alle secties. Klikken op een sectie scrollt het document naar die sectie.
- **Midden (60%):** Scrollbaar documentgebied met A4-pagina styling (794×1123px, Asap lettertype, 11pt standaard). Alle secties worden onder elkaar getoond als witte pagina's. Sectieheader toont alleen nummer + titel.
- **Rechts (20%):** Sidebar met tabs "Sectievelden" en "Opmerkingen". Kan worden in-/uitgeklapt via toolbar-icoon. Document groeit naar 80% bij verborgen sidebar.

**Vaste toolbar (altijd zichtbaar bovenaan):**
- Undo/Redo
- Paragraaf/Kop selector (pill-stijl dropdown)
- Bold, Italic, Strikethrough
- Opsommingslijst, Genummerde lijst, Citaat
- Tabel invoegen/bewerken
- Lettergrootte selector (9pt–18pt, standaard 11pt)
- Zoom controls (75%–150%, basislevel = 125% schaal)
- Zoeken (Ctrl+F / Cmd+F, met highlights en navigatie)
- Opmerkingen sidebar toggle (met badge voor open opmerkingen)

**AI via tekst-selectie (avatar-popup):**
- Selecteer tekst → twee ronde knoppen verschijnen rechts:
  1. AI avatar (bovenste): opent AI-herschrijfpaneel in rechter sidebar. Gebruiker beschrijft instructie, AI vervangt geselecteerde tekst.
  2. Opmerkingen-bol (geel, onderste): opent opmerkingen-invoer in rechter sidebar.
- Geen per-sectie AI knoppen. Geen "AI genereer alles" knop.

**Opmerkingen-systeem:**
- Selecteer tekst → klik opmerkingen-bol → typ opmerking in sidebar
- Opmerkingen tonen geselecteerde tekst, commentaar, auteur, tijdstip
- Acties: Oplossen (verplaatst naar "Opgelost") of Verwijderen
- Klik op opmerking scrollt naar de bijbehorende sectie

**Overige:**
- Opslaan-knop rechtsboven in header
- Terug-link naar documentoverzicht
- Mobiele stepper met dots onderaan
- Lettertype: Asap (Google Font), standaard 11pt
- Zoom: standaard 100% = 125% werkelijke schaal

**Stap 22 · Quality Architect** — Tests: document-editor navigatie, scroll-naar-sectie, toolbar werkt op gefocuste editor, opslaan/ophalen, zoeken, opmerkingen CRUD, AI rewrite, vier states.

✅ **Sprint R6 is klaar wanneer:** de document-editor werkt als standaard layout voor alle documenttypes met A4-pagina's, vaste toolbar, opmerkingen, en AI via tekst-selectie.

---

## Sprint R7 — Programma van Eisen (eisenmanager)

Doel: interactieve eisenmanager voor het PvE met kennisbank-integratie.

**Stap 23 · Platform Engineer** — requirements tabel CRUD endpoints. Zoek-endpoint naar knowledge_base.requirement_chunks met filters op cpv_codes en category.

**Stap 24 · AI Architect** — Eisen-agent: zoekt in knowledge_base op CPV-code en opdrachttype uit projectprofiel. Vindt relevante eisen uit vergelijkbare aanbestedingen. Parafraseert en past aan op de huidige context. Stelt voor als concept-eisen met bron-referentie.

**Stap 25 · Product Engineer** — PvE pagina (open overzicht, geen wizard):
- **Bovenaan:** metric-kaarten (Totaal eisen, Knock-out eisen, Gunningscriteria met weging, Wensen)
- **Filters:** zoekbalk, type-filter dropdown, categorie-filter dropdown
- **Eisen per categorie:** uitklapbare groepen (Functioneel, Technisch, Proces, Kwaliteit, Duurzaamheid)
- Per eis: nummer, type-label (badge), weging %, titel, beschrijving, prioriteit (sterren), bewerk/kopieer/verwijder knoppen
- Bron-indicator bij AI-gegenereerde eisen (uit kennisbank)
- Drag-and-drop volgorde aanpassen
- "+ Nieuwe eis" knop
- Exporteren knop

**Stap 26 · Quality Architect** — Tests: CRUD eisen, filters werken, weging berekening, kennisbank zoeken, drag-and-drop.

✅ **Sprint R7 is klaar wanneer:** gebruiker kan eisen toevoegen, bewerken, filteren, prioriteren, en de AI stelt relevante eisen voor uit de kennisbank op basis van CPV-code en projectcontext.

---

## Sprint R8 — EMVI-criteria (wegingstool)

Doel: interactieve tool voor gunningscriteria en weging.

**Stap 27 · Platform Engineer** — Endpoints voor gunningssystematiek (Laagste prijs / EMVI / Beste PKV), criteria met weging. Validatie: totaal moet optellen tot 100%.

**Stap 28 · Product Engineer** — EMVI pagina (open overzicht):
- **Bovenaan:** Gunningssystematiek keuze (3 klikbare kaarten: Laagste prijs, EMVI, Beste PKV)
- **Rechts:** Weging overzicht kaart (criteria met percentages, totaal 100% in groen of rood als niet kloppend)
- **Links:** Criteria lijst met "+ Criterium toevoegen", per criterium: naam, type-badge, weging input (%), verwijder-knop
- **Rechtsonder:** EMVI-richtlijnen info-blok (prijs max 40-50%, minimaal 2 kwaliteitscriteria, etc.)
- "Criteria opslaan" knop

**Stap 29 · Quality Architect** — Tests: weging berekening, validatie 100%, gunningssystematiek switch.

✅ **Sprint R8 is klaar wanneer:** gebruiker kan gunningssystematiek kiezen, criteria toevoegen met weging, en het totaal valideert naar 100%.

---

## Sprint R9 — Conceptovereenkomst

Doel: Conceptovereenkomst als documenttype in de standaard document-editor (zie Sprint R6).

**Stap 30 · Platform Engineer** — Template definitie voor Conceptovereenkomst in document_types: artikelen (Definities, Onderwerp, Looptijd, Prijzen, etc.), per artikel veldtypen. Endpoint voor standaardtekst per artikel (gebaseerd op ARVODI/ARIV).

**Stap 31 · AI Architect** — AI genereert concept-artikelen via tekst-selectie (avatar-popup in document-editor). Context: projectprofiel, type opdracht, gekozen voorwaarden. Standaardtekst invoegen als alternatief.

**Stap 32 · Product Engineer** — Conceptovereenkomst gebruikt de standaard document-editor layout uit Sprint R6:
- Alle artikelen als secties in de A4-pagina view
- StepperSidebar links met artikelen en voortgang
- AI via tekst-selectie (avatar-popup), geen per-sectie AI knoppen
- Opmerkingen via selectie-popup
- Dropdowns voor "Type opdracht" en "Algemene voorwaarden" in de rechter sidebar (Sectievelden tab)

**Stap 33 · Quality Architect** — Tests: artikelen laden in document-editor, standaardtekst invoegen, AI rewrite via selectie, vier states.

✅ **Sprint R9 is klaar wanneer:** gebruiker kan de Conceptovereenkomst bewerken in de standaard document-editor, AI genereert artikelen via tekst-selectie, standaardtekst beschikbaar.

---

## Sprint R10 — UEA (vragenconfigurator)

Doel: configurator voor het Uniform Europees Aanbestedingsdocument.

**Stap 34 · Platform Engineer** — UEA template in document_types: delen (II, III, IV), secties per deel, vragen per sectie met type (verplicht/optioneel), beschrijving. Endpoint voor UEA generatie (export).

**Stap 35 · Product Engineer** — UEA pagina (open overzicht):
- **Bovenaan:** info-blok ("Over het UEA" — uitleg)
- **Metric-kaarten:** Geselecteerde vragen, Verplichte vragen, Optionele vragen
- **Tabs:** Deel II, Deel III, Deel IV
- Per deel: secties met vragen als checkboxes. Verplichte vragen zijn aangevinkt en niet uit te zetten (disabled). Optionele vragen zijn aan/uit te vinken.
- Per vraag: nummer (II.A, II.B), titel, verplicht-badge, korte beschrijving
- **Onderaan:** waarschuwingsblok ("Let op bij EU-aanbestedingen" — UEA moet via TenderNed)
- "UEA Genereren" export knop

**Stap 36 · Quality Architect** — Tests: verplichte vragen niet uitschakelbaar, tellingen kloppen, export genereert correct.

✅ **Sprint R10 is klaar wanneer:** gebruiker kan UEA configureren door vragen te selecteren en het document te exporteren.

---

## Sprint R11 — Correspondentie-module

Doel: correspondentie-module met brieftemplates per fase.

**Stap 37 · Platform Engineer** — correspondence tabel endpoints. Brieftemplates per fase en type in document_types.

**Stap 38 · AI Architect** — Brief-generatie per type: AI genereert conceptbrieven op basis van projectprofiel en fase-specifieke data. Bij afwijzingsbrieven: per inschrijver op basis van beoordelingsscores. Bij NvI: op basis van ontvangen vragen.

**Stap 39 · Product Engineer** — Correspondentie pagina (open overzicht):
- **Filters:** fase-filter, type-filter, status-filter
- **Per brief:** type-label, ontvanger, onderwerp, status (concept/ter review/goedgekeurd/verstuurd), datum
- **Brieftypes per fase:**
  - Marktverkennen: uitnodiging RFI, uitnodiging marktconsultatie, bedankbrief
  - Aanbesteden: NvI, voorlopige gunning, afwijzingsbrieven, definitieve gunning, PV opening, PV beoordeling
  - Contracteren: uitnodiging tot ondertekening, begeleidende brief
- "+ Nieuwe brief" knop met type-selectie
- Per brief: Tiptap editor, AI genereert concept, gebruiker past aan
- Verstuur-status tracking

**Stap 40 · Quality Architect** — Tests: brief generatie per type, status flow (concept → ter review → goedgekeurd → verstuurd), afwijzingsbrief met correcte scores.

✅ **Sprint R11 is klaar wanneer:** gebruiker kan brieven genereren per fase, de AI vult concepten in op basis van projectdata, en status tracking werkt.

---

## Sprint R12 — Aanbesteden & beoordelen

Doel: beoordelingsmodule voor inschrijvingen in de Aanbesteden fase.

**Stap 41 · Platform Engineer** — evaluations tabel endpoints. Beoordelingsmatrix endpoint: criteria uit EMVI × inschrijvers = scores. Ranking berekening.

**Stap 42 · Product Engineer** — Beoordeling pagina (open overzicht):
- **Bovenaan:** overzicht inschrijvers met status
- **Beoordelingsmatrix:** criteria als rijen, inschrijvers als kolommen, scores invullen
- **Ranking:** automatische berekening op basis van scores en weging
- **Per inschrijver:** detailpagina met alle scores en motivatie
- "Genereer afwijzingsbrieven" knop: genereert per verliezer een brief via correspondentie-module

**Stap 43 · Quality Architect** — Tests: score berekening, ranking, afwijzingsbrief generatie linkt correct aan evaluations.

✅ **Sprint R12 is klaar wanneer:** gebruiker kan inschrijvingen beoordelen, ranking wordt berekend, en afwijzingsbrieven worden gegenereerd op basis van scores.

---

## Sprint R13 — Tiptap editor integratie

Doel: TiptapEditor component als basis voor de standaard document-editor (Sprint R6).

**Stap 44 · Product Engineer** — TiptapEditor component (`src/lib/components/TiptapEditor.svelte`):
- Basisopmaak: headings, bold, italic, lijsten, tabellen
- Props: `content`, `editable`, `placeholder`, `showToolbar` (standaard true, false in document-editor)
- Methode: `getEditor()` — exposeert Tiptap Editor instance voor externe toolbar-besturing
- Alle placeholder-teksten in het Nederlands
- In de standaard document-editor (Sprint R6): toolbar is verborgen per editor, één gedeelde toolbar bovenaan bestuurt de gefocuste editor
- Bij opslaan: nieuwe versie in artifacts tabel, niet overschrijven

**Stap 45 · Quality Architect** — Tests: Tiptap editor laadt, opmaak werkt, `showToolbar=false` verbergt toolbar, `getEditor()` retourneert instance, opslaan maakt nieuwe versie, vier states.

✅ **Sprint R13 is klaar wanneer:** TiptapEditor component werkt standalone en in de standaard document-editor met gedeelde toolbar en versioning.

---

## Sprint R14 — Kennisbank & RAG pipeline

Doel: kennisbank gevuld en doorzoekbaar, AI gebruikt het als context.

**Stap 46 · Platform Engineer** — Knowledge_base schema aanmaken. Harvester: TenderNed data ophalen, parsen, eisen extraheren, opslaan. Embedding pipeline: eisen → chunks → pgvector embeddings.

**Stap 47 · AI Architect** — Zoekfunctie: gegeven projectprofiel (CPV-code, opdrachttype, scope), vind relevante eisen via similarity search. Context injection: bij PvE generatie, bij deskresearch, bij documentgeneratie — voeg relevante kennisbank-resultaten toe aan LLM prompt.

**Stap 48 · Quality Architect** — Tests: kennisbank zoeken retourneert relevante resultaten, embedding pipeline werkt, context injection in LLM prompts correct.

✅ **Sprint R14 is klaar wanneer:** kennisbank is doorzoekbaar, AI vindt relevante eisen op basis van CPV-code en context, en gebruikt deze bij documentgeneratie.

---

## Sprint R15 — Polish & integratie

Doel: alles samenvoegen, testen, en consistent maken.

**Stap 49 · Product Engineer** — Responsive check alle pagina's. Consistentie check: alle kaarten, badges, kleuren, spacing identiek. Loading/empty/error states overal.

**Stap 50 · AI Architect** — Optimaliseer AI context: projectprofiel correct doorvertaald naar alle documenttypes en correspondentie. Chat-context per sectie correct afgebakend. Kennisbank-resultaten relevant gefilterd.

**Stap 51 · Quality Architect** — Volledige end-to-end test: Voorbereiden → Marktverkennen → Specificeren → Aanbesteden → Contracteren. Accessibility audit. Performance check.

✅ **Sprint R15 is klaar wanneer:** alle pagina's visueel consistent in Remote-stijl, alle fases werkend, alle documenttypes werkend, correspondentie werkend, alle tests groen.
