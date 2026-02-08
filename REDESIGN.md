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
- `SectionNav` — inhoudsopgave navigatie voor documenten
- `ChatButton` — klein chatknopje dat een chatvenster opent per sectie
- `InfoBanner` — info/waarschuwing blokken (blauw info, geel waarschuwing)
- `FilterBar` — zoekbalk + dropdown filters
- `CardGrid` — grid layout voor documentblokken

**Stap 3 · Quality Architect** — Unit tests voor alle componenten. Accessibility check: alle componenten moeten WCAG 2.1 AA compliant zijn.

> ⛔ **ALLE VOLGENDE SPRINTS WACHTEN OP SPRINT R1** — Design systeem moet klaar zijn.

✅ **Sprint R1 is klaar wanneer:** alle componenten gebouwd, getest, en visueel consistent in Remote-stijl.

---

## Sprint R2 — Organisatie-dashboard

Doel: een dashboard voor organisatie-gebruikers met overzicht van projecten en activiteit.

**Stap 4 · Platform Engineer** — API endpoints voor dashboard data: actieve projecten count, documenten in review count, recente projecten lijst, secties per status aggregatie, deadlines komende week.

**Stap 5 · Product Engineer** — Dashboard pagina met kaarten-layout:
- **Linksboven** — Actieve projecten: lijndiagram (projecten gestart/afgerond per maand)
- **Midden boven** — Grote metric: "X documenten in review" met verschil t.o.v. vorige week
- **Rechtsboven** — Recente projecten tabel: naam, fase, deadline, voortgang %
- **Linksonder** — Projectvoortgang gauge: gemiddeld % afgerond van actieve projecten
- **Midden onder** — Secties per status: horizontale bars (concept/in review/goedgekeurd/afgewezen)

**Stap 6 · Quality Architect** — Tests voor dashboard: data correct weergegeven, vier states (loading/empty/data/error), responsive check.

✅ **Sprint R2 is klaar wanneer:** dashboard toont actuele data uit de database in Remote-stijl kaarten.

---

## Sprint R3 — Project-dashboard

Doel: een dashboard per project met voortgang, documenten, team en activiteit.

**Stap 7 · Platform Engineer** — API endpoints voor project-specifieke data: project voortgang, documenten met status per sectie, teamleden met rollen, kennishouder respons status, recente activiteit uit audit log.

**Stap 8 · Product Engineer** — Project-dashboard pagina:
- **Bovenste rij — drie metric-kaarten:**
  - Voortgang: groot percentage + "X van Y secties afgerond"
  - Fase: huidige projectfase (Briefing/Generatie/Review/Export) met kleurindicator
  - Deadline: datum + "nog X dagen", rood als dichtbij
- **Midden links** — Documentblokken: klikbare kaarten per documenttype (Aanbestedingsleidraad, PvE, UEA, EMVI, Conceptovereenkomst). Per kaart: naam, voortgang, status.
- **Midden rechts** — Secties in review: tabel met sectie, reviewer, wachttijd
- **Onder links** — Team: avatars/initialen met rol
- **Onder midden** — Kennishouders: naam, sectie, status (uitgenodigd/bekeken/goedgekeurd/afgewezen)
- **Onder rechts** — Recente activiteit: timeline uit audit log

**Stap 9 · Quality Architect** — Tests voor project-dashboard. Vier states. Check dat fase correct wordt weergegeven.

✅ **Sprint R3 is klaar wanneer:** project-dashboard toont alle projectdata en documentblokken zijn klikbaar naar de juiste editor.

---

## Sprint R4 — Aanbestedingsleidraad (wizard-flow)

Doel: fullscreen wizard-flow voor de Aanbestedingsleidraad met stap-voor-stap sectie-formulier.

**Stap 10 · Platform Engineer** — Template definitie voor Aanbestedingsleidraad in document_types: hoofdstukken, secties (1.1, 1.2, etc.), per sectie de veldtypen (tekstveld, dropdown, datumveld, checkbox, numeriek). Endpoints voor sectie opslaan en ophalen.

**Stap 11 · AI Architect** — Na briefing: genereer concept-inhoud per veld van elke sectie. Sla op als artifacts. Chatfunctie per sectie: AI kent de context van die specifieke sectie.

**Stap 12 · Product Engineer** — Fullscreen wizard-flow:
- **Links:** StepperSidebar met alle secties, status per sectie (niet gestart/concept/in bewerking/ter review/goedgekeurd)
- **Rechts:** formulier voor huidige sectie, mix van velden (Tiptap editor voor tekst, dropdowns, datumvelden, checkboxes) — AI heeft concept ingevuld
- **Bovenaan:** voortgangspercentage + exit-knop (terug naar projectoverzicht)
- **Onderaan:** opslaan-knop + "Volgende sectie" knop
- **Per sectie:** ChatButton die klein chatvenster opent
- Gebruiker kan halverwege stoppen en later verdergaan

**Stap 13 · Quality Architect** — Tests: wizard navigatie, opslaan/ophalen, AI prefill correct, vier states.

✅ **Sprint R4 is klaar wanneer:** gebruiker kan de Aanbestedingsleidraad doorwerken in fullscreen wizard, secties zijn voorgevuld door AI, opslaan en later verdergaan werkt.

---

## Sprint R5 — Programma van Eisen (eisenmanager)

Doel: interactieve eisenmanager voor het PvE.

**Stap 14 · Platform Engineer** — Eisen-tabel in database (of uitbreiding van artifacts): type (knock-out/gunningscriterium/wens), categorie (Functioneel/Technisch/Proces/Kwaliteit/Duurzaamheid), weging %, prioriteit (1-5 sterren), titel, beschrijving, nummer (E-001, W-001, etc). CRUD endpoints voor eisen.

**Stap 15 · AI Architect** — Na briefing: genereer concept-eisen op basis van projecttype en briefing-resultaten. Categoriseer en wijs type/weging toe.

**Stap 16 · Product Engineer** — PvE pagina (open overzicht, geen wizard):
- **Bovenaan:** metric-kaarten (Totaal eisen, Knock-out eisen, Gunningscriteria met weging, Wensen)
- **Filters:** zoekbalk, type-filter dropdown, categorie-filter dropdown
- **Eisen per categorie:** uitklapbare groepen (Functioneel, Technisch, Proces, Kwaliteit, Duurzaamheid)
- Per eis: nummer, type-label (badge), weging %, titel, beschrijving, prioriteit (sterren), bewerk/kopieer/verwijder knoppen
- Drag-and-drop volgorde aanpassen
- "+ Nieuwe eis" knop
- Exporteren knop

**Stap 17 · Quality Architect** — Tests: CRUD eisen, filters werken, weging berekening, drag-and-drop.

✅ **Sprint R5 is klaar wanneer:** gebruiker kan eisen toevoegen, bewerken, filteren, prioriteren, en de AI genereert concept-eisen na de briefing.

---

## Sprint R6 — EMVI-criteria (wegingstool)

Doel: interactieve tool voor gunningscriteria en weging.

**Stap 18 · Platform Engineer** — Endpoints voor gunningssystematiek (Laagste prijs / EMVI / Beste PKV), criteria met weging. Validatie: totaal moet optellen tot 100%.

**Stap 19 · Product Engineer** — EMVI pagina (open overzicht):
- **Bovenaan:** Gunningssystematiek keuze (3 klikbare kaarten: Laagste prijs, EMVI, Beste PKV)
- **Rechts:** Weging overzicht kaart (criteria met percentages, totaal 100% in groen of rood als niet kloppend)
- **Links:** Criteria lijst met "+ Criterium toevoegen", per criterium: naam, type-badge, weging input (%), verwijder-knop
- **Rechtsonder:** EMVI-richtlijnen info-blok (prijs max 40-50%, minimaal 2 kwaliteitscriteria, etc.)
- "Criteria opslaan" knop

**Stap 20 · Quality Architect** — Tests: weging berekening, validatie 100%, gunningssystematiek switch.

✅ **Sprint R6 is klaar wanneer:** gebruiker kan gunningssystematiek kiezen, criteria toevoegen met weging, en het totaal valideert naar 100%.

---

## Sprint R7 — Conceptovereenkomst (wizard-flow)

Doel: fullscreen wizard-flow voor de Conceptovereenkomst met artikelen.

**Stap 21 · Platform Engineer** — Template definitie voor Conceptovereenkomst in document_types: artikelen (Definities, Onderwerp, Looptijd, Prijzen, etc.), per artikel veldtypen. Endpoint voor standaardtekst per artikel (gebaseerd op ARVODI/ARIV).

**Stap 22 · AI Architect** — "Genereer artikel" functie per artikel: AI genereert tekst op basis van type opdracht, gekozen voorwaarden, en briefing-context. Standaardtekst invoegen als alternatief.

**Stap 23 · Product Engineer** — Fullscreen wizard-flow:
- **Bovenaan:** voortgangsbalk (X/Y verplichte artikelen) + exit-knop
- **Links:** artikelenlijst met nummering, waarschuwingsicoon bij verplichte lege artikelen. Dropdowns voor "Type opdracht" en "Algemene voorwaarden" (ARVODI-2018, ARIV, etc.). "+ Artikel toevoegen" onderaan.
- **Rechts:** editor voor huidig artikel. Artikel nummer + titel + verplicht-badge. AI Assistent blok met "Genereer artikel" knop. Tiptap editor voor tekst. "Standaardtekst invoegen" link. "Volgende artikel" knop.
- Editor/Preview toggle bovenaan rechts

**Stap 24 · Quality Architect** — Tests: wizard navigatie, artikel generatie, standaardtekst invoegen, verplichte velden validatie.

✅ **Sprint R7 is klaar wanneer:** gebruiker kan de Conceptovereenkomst doorwerken in wizard-flow, AI genereert artikelen, standaardtekst beschikbaar.

---

## Sprint R8 — UEA (vragenconfigurator)

Doel: configurator voor het Uniform Europees Aanbestedingsdocument.

**Stap 25 · Platform Engineer** — UEA template in document_types: delen (II, III, IV), secties per deel, vragen per sectie met type (verplicht/optioneel), beschrijving. Endpoint voor UEA generatie (export).

**Stap 26 · Product Engineer** — UEA pagina (open overzicht):
- **Bovenaan:** info-blok ("Over het UEA" — uitleg)
- **Metric-kaarten:** Geselecteerde vragen, Verplichte vragen, Optionele vragen
- **Tabs:** Deel II, Deel III, Deel IV
- Per deel: secties met vragen als checkboxes. Verplichte vragen zijn aangevinkt en niet uit te zetten (disabled). Optionele vragen zijn aan/uit te vinken.
- Per vraag: nummer (II.A, II.B), titel, verplicht-badge, korte beschrijving
- **Onderaan:** waarschuwingsblok ("Let op bij EU-aanbestedingen" — UEA moet via TenderNed)
- "UEA Genereren" export knop

**Stap 27 · Quality Architect** — Tests: verplichte vragen niet uitschakelbaar, tellingen kloppen, export genereert correct.

✅ **Sprint R8 is klaar wanneer:** gebruiker kan UEA configureren door vragen te selecteren en het document te exporteren.

---

## Sprint R9 — Tiptap editor integratie

Doel: Tiptap editor geintegreerd in alle document-editors.

**Stap 28 · Product Engineer** — Installeer @tiptap/core, @tiptap/starter-kit, @tiptap/extension-placeholder. Bouw TiptapEditor component in src/lib/components/:
- Basisopmaak: headings, bold, italic, lijsten, tabellen
- Alle placeholder-teksten in het Nederlands
- Integratie in Aanbestedingsleidraad wizard (sectie tekstvelden)
- Integratie in Conceptovereenkomst wizard (artikel editor)
- Bij opslaan: nieuwe versie in artifacts tabel, niet overschrijven

**Stap 29 · Quality Architect** — Tests: Tiptap editor laadt, opmaak werkt, opslaan maakt nieuwe versie, vier states.

✅ **Sprint R9 is klaar wanneer:** Tiptap editor werkt in beide wizard-flows met versioning.

---

## Sprint R10 — Polish & integratie

Doel: alles samenvoegen, testen, en consistent maken.

**Stap 30 · Product Engineer** — Responsive check alle pagina's. Consistentie check: alle kaarten, badges, kleuren, spacing identiek. Loading/empty/error states overal.

**Stap 31 · AI Architect** — Optimaliseer AI prefill: briefing-resultaten correct doorvertaald naar alle 5 documenttypes. Chat-context per sectie correct afgebakend.

**Stap 32 · Quality Architect** — Volledige end-to-end test: briefing → project-dashboard → alle 5 documenttypes doorlopen → exporteren. Accessibility audit. Performance check.

✅ **Sprint R10 is klaar wanneer:** alle pagina's visueel consistent in Remote-stijl, alle documenttypes werkend, alle tests groen.
