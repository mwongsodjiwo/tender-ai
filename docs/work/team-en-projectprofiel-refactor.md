# Team & Projectprofiel Refactor — Implementatieplan (Fasen 27-38)

## Design referentie

Zie `Design-inspo/Remote Web 67.png` voor het visuele voorbeeld van de team UI: zoekbalk, filterknop, tabs, tabelweergave met drawer.

## Fasen

| Fase | Wat | Agent(s) | Afhankelijk van |
|------|-----|----------|----------------|
| 27 | Team: database uitbreiding (status, manager_id) | 1 | — |
| 28 | Team: API uitbreidingen (search, filter, status) | 1 | Fase 27 |
| 29 | Team: UI redesign (tabel, zoekbalk, tabs, drawer) | 2 | Fase 27, 28 |
| 30 | Documentrollen koppeling aan teamleden | 1 | Fase 27 |
| 31 | Documentrollen UI in drawer | 2 | Fase 29, 30 |
| 32 | Projectprofiel: tab Organisatie (read-only) | 2 | — |
| 33 | Projectprofiel: opslaan vs. bevestigen | 1, 2 | — |
| 34 | Planning: termijnberekening logica | 1 | Fase 20 |
| 35 | Planning: UI sleutelmomenten met cascade | 2 | Fase 34 |
| 36 | Projectprofiel: sidebar samenvatting | 2 | Fase 34, 35 |
| 37 | Opschonen: oude velden en tabs verwijderen | 1, 2 | Fase 29, 31, 32, 35 |
| 38 | Tests & validatie | 6 | Alles |

---

## Ralph Loop prompts per fase

### Fase 27 — Team database uitbreiding

```
/ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD en docs/agent-1-backend.md. Bouw Fase 27: Team database uitbreiding. Maak migratie met: (1) member_status ENUM ('active','inactive') DEFAULT 'active', (2) kolom status member_status DEFAULT 'active' op organization_members, (3) kolom manager_id UUID REFERENCES organization_members(id) ON DELETE SET NULL op organization_members, (4) index op manager_id, (5) index op (organization_id, status). Update TypeScript types in src/lib/types/db/base.ts: voeg status en manager_id toe aan OrganizationMember. Schrijf unit test. Kwaliteitscheck: functies max 30 regels, bestanden max 200 regels, geen console.log. Output <promise>COMPLETE</promise> wanneer migratie, types en test klaar zijn." --completion-promise "COMPLETE" --max-iterations 20
```

### Fase 28 — Team API uitbreidingen

```
/ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD en docs/agent-1-backend.md. Bouw Fase 28: Team API uitbreidingen. Maak of update API route src/routes/api/organizations/[orgId]/members/+server.ts met: (1) GET met query params search (zoekt op naam/email), status filter ('active'/'inactive'/'all'), pagination (limit/offset), (2) PATCH op /[memberId] voor status toggle en manager_id wijziging. Voeg Zod schemas toe in src/lib/schemas/. Documenteer in contracts/api.md. Schrijf unit tests. Kwaliteitscheck: functies max 30 regels, bestanden max 200 regels. Output <promise>COMPLETE</promise> wanneer API, schemas, tests en docs klaar zijn." --completion-promise "COMPLETE" --max-iterations 20
```

### Fase 29 — Team UI redesign

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md, AGENTS.MD en docs/agent-2-frontend.md. Bouw Fase 29: Team UI redesign naar voorbeeld Design-inspo/Remote Web 67.png. Vervang huidige TeamManager.svelte door nieuwe componenten: (1) TeamPage.svelte met zoekbalk, filterknop en 'Teamlid toevoegen' button, (2) tabs Actief/Inactief, (3) TeamTable.svelte met kolommen naam, email, telefoon, functie, rol, leidinggevende, (4) TeamDrawer.svelte die opent bij klik op rij met volledig overzicht. Gebruik Svelte classic syntax (export let, $:). Tailwind styling. Alle UI-tekst Nederlands. Kwaliteitscheck: bestanden max 200 regels, functies max 30 regels. Output <promise>COMPLETE</promise> wanneer alle componenten werken met zoeken, filteren, tabs en drawer." --completion-promise "COMPLETE" --max-iterations 30
```

### Fase 30 — Documentrollen koppeling aan teamleden

```
/ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD en docs/agent-1-backend.md. Bouw Fase 30: Documentrollen koppeling aan teamleden. Maak migratie: (1) voeg project_member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL toe aan project_document_roles, (2) maak person_name/person_email/person_phone/person_function nullable (backwards compatible). Update API route voor documentrollen: bij POST/PATCH met project_member_id worden person_* velden automatisch uit organization_members overgenomen. Update TypeScript types. Schrijf unit test. Output <promise>COMPLETE</promise> wanneer migratie, API update, types en test klaar zijn." --completion-promise "COMPLETE" --max-iterations 20
```

### Fase 31 — Documentrollen UI in drawer

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md, AGENTS.MD en docs/agent-2-frontend.md. Bouw Fase 31: Documentrollen UI in team drawer. Voeg aan TeamDrawer.svelte een sectie 'Documentrollen' toe met checkboxes voor elke rol uit DOCUMENT_ROLE_KEYS. Wanneer een rol aangevinkt wordt, wordt via API het teamlid gekoppeld aan die documentrol (project_document_roles.project_member_id). Toon huidige rollen als badges. Svelte classic syntax, Tailwind, Nederlands UI. Output <promise>COMPLETE</promise> wanneer rollen zichtbaar en koppelbaar zijn in de drawer." --completion-promise "COMPLETE" --max-iterations 20
```

### Fase 32 — Projectprofiel tab Organisatie

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md, AGENTS.MD en docs/agent-2-frontend.md. Bouw Fase 32: Projectprofiel tab Organisatie. Hernoem de tab 'Opdrachtgever' naar 'Organisatie' in src/routes/(app)/projects/[id]/profile/+page.svelte. Maak OrganizationTab.svelte: read-only weergave van organisatiegegevens (naam, adres, KVK-nummer, NUTS-code) uit de gekoppelde organization. Data wordt geladen via page.server.ts uit organizations tabel. Svelte classic syntax, Tailwind, Nederlands UI. Output <promise>COMPLETE</promise> wanneer de tab Organisatie read-only organisatiedata toont." --completion-promise "COMPLETE" --max-iterations 20
```

### Fase 33 — Opslaan vs. bevestigen

```
/ralph-loop "Je bent Agent 1+2. Lees CLAUDE.md, AGENTS.MD, docs/agent-1-backend.md en docs/agent-2-frontend.md. Bouw Fase 33: Opslaan vs. bevestigen voor projectprofiel. Backend (Agent 1): voeg profile_status ENUM ('concept','confirmed') DEFAULT 'concept' toe aan projects, plus confirmed_at TIMESTAMPTZ en confirmed_by UUID. Maak API endpoints: PATCH /api/projects/[id]/profile voor opslaan (blijft concept), POST /api/projects/[id]/profile/confirm voor bevestigen (zet status op confirmed, locked). POST /api/projects/[id]/profile/unlock voor owner/admin om te ontgrendelen. Frontend (Agent 2): toon twee knoppen 'Opslaan' en 'Bevestigen' in profielpagina. Bij confirmed status zijn velden disabled met 'Ontgrendelen' knop voor owner/admin. Output <promise>COMPLETE</promise> wanneer opslaan, bevestigen en ontgrendelen werken." --completion-promise "COMPLETE" --max-iterations 25
```

### Fase 34 — Planning termijnberekening logica

```
/ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD en docs/agent-1-backend.md. Bouw Fase 34: Planning termijnberekening. Maak src/lib/utils/procurement-timeline.ts met: (1) PROCEDURE_DEADLINES config per procedure type (europees_openbaar: publicatie→inschrijving 35d, inschrijving→beoordeling 0d, beoordeling→voorlopige_gunning 0d, voorlopige_gunning→definitieve_gunning 20d Alcatel; nationaal_openbaar: publicatie→inschrijving 20d; etc.), (2) functie calculateTimeline(anchorDate, procedureType) die milestones berekent, (3) functie cascadeDates(milestones, changedMilestone, newDate) die afhankelijke datums verschuift als ze minimumtermijnen schenden maar handmatige datums die nog geldig zijn behoudt. Voeg source veld ('manual'|'calculated') toe aan milestones tabel via migratie. Schrijf unit tests. Output <promise>COMPLETE</promise> wanneer logica, migratie en tests klaar zijn." --completion-promise "COMPLETE" --max-iterations 25
```

### Fase 35 — Planning UI sleutelmomenten met cascade

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md, AGENTS.MD en docs/agent-2-frontend.md. Bouw Fase 35: Planning UI met sleutelmomenten. Vervang de huidige timeline_start/timeline_end velden in de Planning tab door een milestones-lijst. Maak PlanningMilestones.svelte: (1) toon verticale tijdlijn met milestones (publicatiedatum, inschrijvingsdatum, beoordelingsperiode, voorlopige gunning, Alcatel standstill, definitieve gunning), (2) datepickers per milestone, (3) bij wijziging datum: roep cascadeDates aan en update afhankelijke velden, (4) toon wettelijke minimumtermijn als hint bij elk veld, (5) markeer overschrijdingen in rood. Svelte classic syntax, Tailwind, Nederlands UI. Output <promise>COMPLETE</promise> wanneer milestones zichtbaar zijn met werkende cascade." --completion-promise "COMPLETE" --max-iterations 25
```

### Fase 36 — Projectprofiel sidebar samenvatting

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md, AGENTS.MD en docs/agent-2-frontend.md. Bouw Fase 36: Sidebar samenvatting. Vervang het huidige statusblok in de projectprofiel sidebar door ProjectSummary.svelte met: (1) projectnaam en status badge, (2) procedure type, (3) geraamde waarde, (4) CPV-code(s), (5) belangrijkste datums uit milestones (publicatie, inschrijving, gunning), (6) drempeladvies (boven/onder EU drempel). Data uit project, milestones en procedure-advice. Svelte classic syntax, Tailwind, Nederlands UI. Output <promise>COMPLETE</promise> wanneer de sidebar een complete samenvatting toont." --completion-promise "COMPLETE" --max-iterations 20
```

### Fase 37 — Opschonen

```
/ralph-loop "Je bent Agent 1+2. Lees CLAUDE.md, AGENTS.MD. Bouw Fase 37: Opschonen. (1) Verwijder de tab 'Documentrollen' uit projectprofiel page (documentrollen zitten nu in team drawer), (2) verwijder oude opdrachtgever-velden uit project form als die vervangen zijn door tab Organisatie, (3) verwijder timeline_start/timeline_end velden uit project form (vervangen door milestones), (4) verwijder ongebruikte componenten en imports, (5) controleer dat geen broken references overblijven. Draai bestaande tests om regressies te vangen. Output <promise>COMPLETE</promise> wanneer alle oude velden/tabs verwijderd zijn en tests slagen." --completion-promise "COMPLETE" --max-iterations 20
```

### Fase 38 — Tests & validatie

```
/ralph-loop "Je bent Agent 6 (Testing & DevOps). Lees CLAUDE.md, AGENTS.MD en docs/agent-6-devops.md. Bouw Fase 38: Tests & validatie voor fasen 27-37. (1) Integratietests voor team API (search, filter, status toggle, manager), (2) integratietests voor documentrollen koppeling, (3) integratietests voor opslaan/bevestigen/ontgrendelen flow, (4) unit tests voor procurement-timeline.ts cascade logica, (5) e2e test: maak teamlid, wijs documentrol toe, bekijk in drawer, (6) e2e test: wijzig milestone datum en verifieer cascade. Kwaliteitscheck: alle bestanden, functies, geen console.log. Output <promise>COMPLETE</promise> wanneer alle tests slagen en kwaliteitscheck ok is." --completion-promise "COMPLETE" --max-iterations 30
```

---

## Uitvoeringsvolgorde per ronde

| Ronde | Terminal 1 | Terminal 2 | Terminal 3 |
|-------|-----------|-----------|-----------|
| 1 | Fase 27 (team DB) — Agent 1 | Fase 32 (tab Organisatie) — Agent 2 | Fase 34 (termijnberekening) — Agent 1 |
| 2 | Fase 28 (team API) — Agent 1 | Fase 33 (opslaan/bevestigen) — Agent 1+2 | Fase 35 (planning UI) — Agent 2 |
| 3 | Fase 29 (team UI) + Fase 30 (docrollen DB) — Agent 2, dan Agent 1 | Fase 36 (sidebar) — Agent 2 | — |
| 4 | Fase 31 (docrollen drawer) — Agent 2 | — | — |
| 5 | Fase 37 (opschonen) — Agent 1+2 | — | — |
| 6 | Fase 38 (tests) — Agent 6 | — | — |
