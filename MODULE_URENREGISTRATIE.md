# MODULE — Urenregistratie

> **Referentie:** Volg alle regels uit [AGENTS.MD](./AGENTS.MD) (Regels 1–22, Territory Map, Sprint Werkwijze).
> **Positie:** Losse module, buiten projectcontext. Eigen item in hoofdnavigatie naast "Projecten".

---

## Doel

Inkopers registreren uren per project. Puur eigen inzicht — geen goedkeuringsflow, geen niet-projecturen. Rapportage toont waar tijd naartoe gaat per project, per fase, per periode.

---

## Navigatie

Urenregistratie krijgt een eigen item in de **hoofdnavigatie** (sidebar op organisatieniveau), naast "Projecten" en "Leveranciers". Het is geen onderdeel van een specifiek project.

```
Hoofdnavigatie (sidebar)
├── Projecten
├── Leveranciers
├── Urenregistratie       ← NIEUW
│   ├── Weekoverzicht     (default)
│   └── Rapportage
└── Instellingen
```

---

## Weekoverzicht (default view)

De hoofdweergave bij openen. Design gebaseerd op Remote.com time tracking.

### Layout
- **Header:** Weeknummer + datumbereik (bijv. "Week 7 — 9 feb – 15 feb 2026"), navigatiepijltjes (◀ ▶), knop "Vandaag"
- **Rechts:** Samenvattingscard met totaal gewerkte uren deze week + "Opslaan" knop
- **Content:** Dagen onder elkaar als cards (maandag t/m vrijdag, optioneel weekend)

### Per dag
- Datum als header (bijv. "Maandag 9 feb")
- Eén of meerdere uurregistraties als rijen
- Per rij:
  - **Project** — dropdown met actieve projecten van de gebruiker (projectnaam + projectnummer)
  - **Activiteit** — dropdown: specificeren, beoordeling, NvI, correspondentie, marktverkenning, overleg, overig
  - **Uren** — numeriek invoerveld (0.5 stappen, of vrij getal)
  - **Notitie** — optioneel tekstveld
  - **Verwijder** — icon button (trash)
- Knop "+ Uren toevoegen" onderaan elke dag
- Dagtotaal rechts

### Dagweergave

Klik op een dag in het weekoverzicht → dagweergave. Meer ruimte per registratie, makkelijker voor dagen met veel projectwisselingen. Terug naar weekoverzicht via breadcrumb of backknop.

---

## Rapportage

Tweede tab binnen de urenregistratie module.

### Filters
- **Periode:** week / maand / kwartaal / jaar / custom datumbereik
- **Project:** alle projecten of specifiek project

### Overzichten

**Per project:**
- Staafgrafiek: uren per project in geselecteerde periode
- Tabel eronder: projectnaam, totaal uren, percentage van totaal

**Per activiteit:**
- Donut/cirkelgrafiek: verdeling uren over activiteittypes
- Hoe veel tijd gaat naar specificeren vs. beoordeling vs. NvI etc.

**Per week/maand (trend):**
- Lijngrafiek: uren per week over de afgelopen periode
- Zicht op werkdruk over tijd

### Exporteren
- CSV export van gefilterde data

---

## Database

### time_entries

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| organization_id | uuid | FK → organizations |
| project_id | uuid | FK → projects |
| date | date | Datum van registratie |
| hours | numeric(4,2) | Aantal uren (bijv. 2.50) |
| activity_type | enum | specificeren/beoordeling/nvi/correspondentie/marktverkenning/overleg/overig |
| notes | text | Optionele notitie |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Constraints:**
- `hours > 0 AND hours <= 24`
- Composite index op `(user_id, date)` voor weekoverzicht queries
- Index op `(project_id)` voor rapportage per project
- RLS: gebruiker ziet alleen eigen uren

### Enum: activity_type

```sql
CREATE TYPE activity_type AS ENUM (
  'specifying',
  'evaluation',
  'nvi',
  'correspondence',
  'market_research',
  'meeting',
  'other'
);
```

> **Regel 10 uit AGENTS.MD:** Enum values zijn Engels (database), labels zijn Nederlands (UI).

UI labels mapping:

| Enum value | Nederlands label |
|------------|-----------------|
| specifying | Specificeren |
| evaluation | Beoordeling |
| nvi | NvI |
| correspondence | Correspondentie |
| market_research | Marktverkenning |
| meeting | Overleg |
| other | Overig |

---

## Agent Taakverdeling

Conform de Territory Map in [AGENTS.MD](./AGENTS.MD):

| Taak | Agent |
|------|-------|
| time_entries tabel, migratie, RLS policies, API endpoints | Platform Engineer |
| Weekoverzicht UI, dagweergave, rapportage pagina, grafieken | Product Engineer |
| — | AI Architect (geen AI in deze module) |
| Tests (unit, integration, E2E) | Quality Architect |

---

## Sprint Stappen

### Stap 1 — Database & API
**Agent: Platform Engineer**

1. Migratie: `time_entries` tabel aanmaken met enum `activity_type`
2. RLS policy: gebruiker ziet alleen eigen uren (`user_id = auth.uid()`)
3. API endpoints:
   - `GET /api/time-entries?week=2026-W07` — alle entries van een week
   - `GET /api/time-entries?from=2026-01-01&to=2026-03-31&project_id=xxx` — voor rapportage
   - `POST /api/time-entries` — nieuwe entry
   - `PUT /api/time-entries/[id]` — entry wijzigen
   - `DELETE /api/time-entries/[id]` — entry verwijderen
4. Validatie (Zod): hours > 0, hours ≤ 24, date is valid, project_id bestaat en hoort bij user's organisatie

### Stap 2 — Weekoverzicht UI
**Agent: Product Engineer**

5. Route: `/time-tracking` (weekoverzicht, default)
6. Navigatie: item toevoegen aan hoofdnavigatie sidebar
7. Week-header met datumbereik, pijltjes, "Vandaag" knop
8. Dagen als cards met registratierijen (project dropdown, activiteit dropdown, uren input, notitie, verwijder)
9. "+ Uren toevoegen" knop per dag
10. Samenvattingscard rechts met weektotaal
11. Opslaan: batch save van alle wijzigingen

### Stap 3 — Dagweergave
**Agent: Product Engineer**

12. Route: `/time-tracking/[date]`
13. Uitgebreide weergave per dag
14. Breadcrumb terug naar weekoverzicht

### Stap 4 — Rapportage
**Agent: Product Engineer**

15. Route: `/time-tracking/reports`
16. Periodefilter (week/maand/kwartaal/jaar/custom)
17. Projectfilter
18. Staafgrafiek: uren per project (gebruik Recharts of Chart.js via Svelte wrapper)
19. Donut: verdeling per activiteit
20. Lijngrafiek: trend per week
21. Tabel met details
22. CSV export knop

### Stap 5 — Test
**Agent: Quality Architect**

23. Uurregistratie toevoegen, wijzigen, verwijderen
24. Weekoverzicht toont correcte week met navigatie
25. Dagtotaal en weektotaal kloppen
26. Rapportage: filters werken, grafieken tonen correcte data
27. RLS: gebruiker ziet alleen eigen uren (test met 2 users)
28. Validatie: uren > 24 wordt geweigerd, negatieve uren geweigerd
29. CSV export bevat gefilterde data

---

## Design Richtlijnen

Conform [AGENTS.MD](./AGENTS.MD) Regel 19–20 en het Remote.com design system:

- **Vier states:** loading (skeleton), empty ("Nog geen uren geregistreerd deze week"), data, error
- **WCAG 2.1 AA:** alle inputs gelabeld, keyboard navigatie, kleurcontrast
- **Remote.com stijl:** cards met border-radius 12px, shadow-sm, Inter font, blauw accent (#2563EB)
- **Responsive:** werkt op desktop en tablet

---

## Niet in scope

- Goedkeuringsflow (geen manager approval)
- Niet-projecturen (geen "Intern" of "Algemeen" categorie)
- Uurtarieven of facturering
- Koppeling met externe systemen (AFAS, Exact, etc.)
- Timer/stopwatch functionaliteit

Deze onderdelen kunnen als toekomstige uitbreiding worden toegevoegd.
