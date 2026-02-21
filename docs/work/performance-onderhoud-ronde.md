# Performance & Onderhoud Ronde — Implementatieplan (Fasen 43-56)

## Samenvatting audit

**Codebase:** 433 bestanden, 49.102 regels, 111 API routes, 61 migraties.

**Goed:** Nul `any`/`@ts-ignore`, nul console.log, correcte Svelte syntax, consistente API error handling (110/111), zware deps server-side geïsoleerd.

**Problemen:**

- **48 bestanden boven 200-regellimiet** (8 pagina's >600 regels, 7 componenten >300 regels)
- **0 testbestanden** voor 433 bronbestanden
- **6 server-utils >200 regels** (generation.ts 408, rag.ts 305, export.ts 301, briefing.ts 286, ai-planning-prompt.ts 214, market-research.ts 209)
- **enums.ts = 515 regels** (alle enums in één bestand)
- **gantt-utils.ts = 463 regels** (berekeningen + rendering gemixed)

---

## Strategie

Drie sporen, parallel uitvoerbaar:

1. **Splitsen** — Grote bestanden opdelen (fasen 43-50)
2. **Testen** — Testfundament bouwen (fasen 51-54)
3. **Opschonen** — Dode code, openstaande bugs, ongebruikte queries (fasen 55-56)

---

## Fasen

| Fase | Wat | Agent(s) | Regels bespaard | Prioriteit |
|------|-----|----------|-----------------|------------|
| **Spoor 1: Splitsen** | | | | |
| 43 | Enums splitsen per domein | 1 | 515 → 6×~85 | Hoog |
| 44 | Pagina's splitsen: Planning (830), Profile (675) | 2 | ~1500 → componenten | Hoog |
| 45 | Pagina's splitsen: Requirements (632), EMVI (632), Time-tracking (606) | 2 | ~1870 → componenten | Hoog |
| 46 | Pagina's splitsen: Marktverkenning (526), Evaluations (396), Correspondence (462) | 2 | ~1384 → componenten | Midden |
| 47 | Componenten splitsen: TiptapEditor (526), PlanningWizard (522) | 2, 3 | ~1048 → sub-componenten | Hoog |
| 48 | Componenten splitsen: Navigation (352), GanttChart (316), overige >250 | 2 | ~1500 → sub-componenten | Midden |
| 49 | Server utils splitsen: generation.ts (408), rag.ts (305), export.ts (301) | 1, 4 | ~1014 → modules | Midden |
| 50 | Server utils splitsen: briefing.ts (286), gantt-utils.ts (463) | 1, 2 | ~749 → modules | Midden |
| **Spoor 2: Testen** | | | | |
| 51 | Unit tests: core utils (procurement-timeline, procedure-advice, governance, week) | 6 | — | Hoog |
| 52 | Unit tests: server utils (generation, rag, export, briefing) | 6 | — | Hoog |
| 53 | Integratietests: API routes (top 20 kritieke endpoints) | 6 | — | Hoog |
| 54 | Integratietests: validatie schemas + edge cases | 6 | — | Midden |
| **Spoor 3: Opschonen** | | | | |
| 55 | Fase 31 afmaken: documentrollen UI in team drawer | 2 | — | Hoog |
| 56 | Fase 37 afmaken: oude velden/tabs verwijderen + dead code sweep | 1, 2 | — | Hoog |

---

## Ralph Loop prompts per fase

### Fase 43 — Enums splitsen per domein

```
/ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md en AGENTS.MD. Bouw Fase 43: Split src/lib/types/enums.ts (515 regels) in domein-bestanden. Maak: (1) src/lib/types/enums/project.ts — project_status, project_phase, procedure_type en hun labels, (2) src/lib/types/enums/document.ts — artifact_status, document_role_keys, milestone_type en hun labels, (3) src/lib/types/enums/user.ts — user_role, member_status, org types, (4) src/lib/types/enums/governance.ts — data_classification, archive_status, retention types, (5) src/lib/types/enums/planning.ts — activity_status, activity_type, dependency_type, (6) src/lib/types/enums/index.ts — re-exporteert alles zodat bestaande imports niet breken. Elk bestand max 200 regels. Zoek alle imports van $types/enums en verifieer dat ze blijven werken. Output <promise>COMPLETE</promise> wanneer alle bestanden gesplitst zijn, imports werken en elk bestand <200 regels." --completion-promise "COMPLETE" --max-iterations 25
```

### Fase 44 — Pagina's splitsen: Planning + Profile

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md en docs/agent-2-frontend.md. Bouw Fase 44: Split de twee grootste pagina's. (A) Planning page (830 regels): extract naar sub-componenten: PlanningHeader.svelte, PlanningFilters.svelte, PlanningContent.svelte (switch op activeView), PlanningActions.svelte. Verplaats data-logica naar planning-helpers.ts. Hoofdpagina max 200 regels, componenten max 200 regels. (B) Profile page (675 regels): extract naar sub-componenten: ProfileForm.svelte, ProfileTabs.svelte, ProfileSidebar.svelte. Verplaats savePlanningMilestones, saveProfile, confirmProfile naar profile-actions.ts. Hoofdpagina max 200 regels. Svelte classic syntax. Output <promise>COMPLETE</promise> wanneer beide pagina's en alle sub-componenten <200 regels zijn." --completion-promise "COMPLETE" --max-iterations 30
```

### Fase 45 — Pagina's splitsen: Requirements, EMVI, Time-tracking

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md en docs/agent-2-frontend.md. Bouw Fase 45: Split drie pagina's. (A) Requirements (632): extract RequirementsTable, RequirementsForm, RequirementsActions. (B) EMVI (632): extract EmviCriteriaList, EmviWeightForm, EmviScoring. (C) Time-tracking (606): extract TimeEntryForm, TimeWeekView, TimeProjectSelector. Elke hoofdpagina en component max 200 regels. Svelte classic syntax. Output <promise>COMPLETE</promise> wanneer alle 3 pagina's en sub-componenten <200 regels zijn." --completion-promise "COMPLETE" --max-iterations 30
```

### Fase 46 — Pagina's splitsen: Marktverkenning, Evaluations, Correspondence

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md en docs/agent-2-frontend.md. Bouw Fase 46: Split drie pagina's. (A) Marktverkenning (526): extract MarktverkenningSearch, MarktverkenningResults, MarktverkenningDetail. (B) Evaluations (396): extract EvaluationTable, EvaluationForm, EvaluationScoring. (C) Correspondence letter page (462): extract LetterEditor, LetterPreview, LetterActions. Elke hoofdpagina en component max 200 regels. Svelte classic syntax. Output <promise>COMPLETE</promise> wanneer alle 3 pagina's en sub-componenten <200 regels zijn." --completion-promise "COMPLETE" --max-iterations 30
```

### Fase 47 — Componenten splitsen: TiptapEditor, PlanningWizard

```
/ralph-loop "Je bent Agent 2+3. Lees CLAUDE.md, docs/agent-2-frontend.md en docs/agent-3-editor.md. Bouw Fase 47: Split twee grote componenten. (A) TiptapEditor (526): extract EditorToolbar.svelte (formatting knoppen), EditorSearch.svelte (zoek/vervang), EditorBubbleMenu.svelte, editor-config.ts (extensies setup). Core TiptapEditor max 200 regels. (B) PlanningWizard (522): extract WizardStepNav.svelte, WizardStepContent.svelte per stap (goals, timeline, resources, review), wizard-state.ts (state management). Core PlanningWizard max 200 regels. Svelte classic syntax. Output <promise>COMPLETE</promise> wanneer alle componenten <200 regels zijn." --completion-promise "COMPLETE" --max-iterations 30
```

### Fase 48 — Componenten splitsen: Navigation, GanttChart, overige

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md en docs/agent-2-frontend.md. Bouw Fase 48: Split overige grote componenten. (A) Navigation (352): extract NavProjectMenu.svelte, NavUserMenu.svelte, NavBreadcrumbs.svelte. (B) GanttChart (316): extract GanttHeader.svelte, GanttRow.svelte, GanttTimeline.svelte. (C) Alle overige componenten >250 regels: DeadlineCalendar (316), CorrespondenceTable (305), PhaseIndicator (292) — extract logica naar helpers, template naar sub-componenten. Elk bestand max 200 regels. Output <promise>COMPLETE</promise> wanneer alle genoemde componenten <200 regels zijn." --completion-promise "COMPLETE" --max-iterations 30
```

### Fase 49 — Server utils splitsen: generation, rag, export

```
/ralph-loop "Je bent Agent 1+4. Lees CLAUDE.md, docs/agent-1-backend.md en docs/agent-4-ai.md. Bouw Fase 49: Split drie server modules. (A) generation.ts (408): split in generation-core.ts (prompt building), generation-sections.ts (sectie-specifieke logica), generation-types.ts. (B) rag.ts (305): split in rag-retrieval.ts (embedding + search), rag-context.ts (context building), rag-types.ts. (C) export.ts (301): split in export-docx.ts, export-pdf.ts, export-utils.ts. Elk bestand max 200 regels. Update alle imports. Output <promise>COMPLETE</promise> wanneer alle modules gesplitst zijn en imports werken." --completion-promise "COMPLETE" --max-iterations 25
```

### Fase 50 — Server utils splitsen: briefing, gantt-utils

```
/ralph-loop "Je bent Agent 1+2. Lees CLAUDE.md. Bouw Fase 50: Split twee modules. (A) briefing.ts (286): split in briefing-prompts.ts (prompt templates), briefing-processor.ts (verwerking). (B) gantt-utils.ts (463): split in gantt-calculations.ts (datumberekeningen, critical path), gantt-layout.ts (positionering, collision detection), gantt-types.ts (interfaces). Elk bestand max 200 regels. Update alle imports in planning/ componenten. Output <promise>COMPLETE</promise> wanneer alle modules gesplitst zijn en imports werken." --completion-promise "COMPLETE" --max-iterations 25
```

### Fase 51 — Unit tests: core utils

```
/ralph-loop "Je bent Agent 6 (Testing & DevOps). Lees CLAUDE.md en docs/agent-6-devops.md. Bouw Fase 51: Unit tests voor core utilities. Setup Vitest config als die nog niet bestaat. Schrijf tests voor: (1) procurement-timeline.ts — calculateTimeline voor elk procedure type, cascadeDates met manual/calculated source, edge cases. (2) procedure-advice.ts — getProcedureAdvice boven/onder drempel, alle procedure types. (3) governance.ts — retentie berekeningen, classificatie logica. (4) week.ts — weeknummer berekeningen, datum ranges. Minimaal 5 test cases per functie. Output <promise>COMPLETE</promise> wanneer alle tests slagen." --completion-promise "COMPLETE" --max-iterations 25
```

### Fase 52 — Unit tests: server utils

```
/ralph-loop "Je bent Agent 6 (Testing & DevOps). Lees CLAUDE.md en docs/agent-6-devops.md. Bouw Fase 52: Unit tests voor server utilities. Mock Supabase client en OpenAI client. Schrijf tests voor: (1) generation — prompt building, section assembly. (2) rag — context building, relevance scoring. (3) export — DOCX structuur, PDF output. (4) briefing — prompt templates, response parsing. Minimaal 3 test cases per module. Output <promise>COMPLETE</promise> wanneer alle tests slagen." --completion-promise "COMPLETE" --max-iterations 25
```

### Fase 53 — Integratietests: API routes

```
/ralph-loop "Je bent Agent 6 (Testing & DevOps). Lees CLAUDE.md en docs/agent-6-devops.md. Bouw Fase 53: Integratietests voor top 20 API routes. Mock Supabase. Test: (1) Auth guard — 401 bij geen user, (2) Validatie — 400 bij ongeldige input, (3) Happy path — 200/201 bij correcte input, (4) Not found — 404 bij onbekend ID. Routes: projects CRUD, profile save/confirm, milestones CRUD, team members, document roles, archive/unarchive, correspondence, planning apply. Output <promise>COMPLETE</promise> wanneer alle integratietests slagen." --completion-promise "COMPLETE" --max-iterations 30
```

### Fase 54 — Integratietests: validatie schemas

```
/ralph-loop "Je bent Agent 6 (Testing & DevOps). Lees CLAUDE.md en docs/agent-6-devops.md. Bouw Fase 54: Tests voor alle Zod validatie schemas in src/lib/server/api/validation/. Test per schema: (1) valid input passeert, (2) missing required fields faalt, (3) wrong types faalt, (4) edge cases (lege strings, null, grenswaarden). Minimaal 4 test cases per schema. Output <promise>COMPLETE</promise> wanneer alle schema tests slagen." --completion-promise "COMPLETE" --max-iterations 20
```

### Fase 55 — Fase 31 afmaken: documentrollen in team drawer

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md, docs/agent-2-frontend.md en docs/team-en-projectprofiel-refactor.md (Fase 31). Bouw Fase 55: Voeg documentrollen toe aan TeamDrawer. (1) Laad bestaande documentrollen voor het project via API. (2) Voeg sectie 'Documentrollen' toe in TeamDrawer.svelte met checkboxes voor elke rol uit DOCUMENT_ROLE_KEYS. (3) Bij aanvinken: POST/PATCH naar /api/projects/:id/roles met project_member_id van het teamlid. (4) Bij uitvinken: verwijder koppeling. (5) Toon huidige rollen als badges in TeamTable rij. Svelte classic syntax, Tailwind, Nederlands UI. Output <promise>COMPLETE</promise> wanneer rollen zichtbaar en koppelbaar zijn." --completion-promise "COMPLETE" --max-iterations 25
```

### Fase 56 — Fase 37 afmaken: opschonen + dead code sweep

```
/ralph-loop "Je bent Agent 1+2. Lees CLAUDE.md en AGENTS.MD. Bouw Fase 56: Opschonen codebase. (1) Verwijder tab 'Documentrollen' uit projectprofiel (zit nu in team drawer). (2) Verwijder oude timeline_start/timeline_end velden uit profile form (vervangen door milestones). (3) Verwijder ongebruikte component TeamManager.svelte als die vervangen is door team/ componenten. (4) Verwijder ongebruikte imports en variabelen in alle bestanden >200 regels. (5) Zoek naar TODO/FIXME/HACK comments en los op of documenteer. (6) Controleer dat geen broken references overblijven na alle splits. Draai bestaande tests. Output <promise>COMPLETE</promise> wanneer alle cleanup klaar is en geen broken imports." --completion-promise "COMPLETE" --max-iterations 25
```

---

## Uitvoeringsvolgorde per ronde

| Ronde | Terminal 1 | Terminal 2 | Terminal 3 |
|-------|-----------|-----------|-----------|
| 1 | Fase 43 (enums split) — Agent 1 | Fase 51 (unit tests utils) — Agent 6 | Fase 55 (docrollen drawer) — Agent 2 |
| 2 | Fase 44 (planning+profile split) — Agent 2 | Fase 52 (unit tests server) — Agent 6 | Fase 49 (server utils split) — Agent 1+4 |
| 3 | Fase 45 (req+emvi+time split) — Agent 2 | Fase 53 (API integratie tests) — Agent 6 | Fase 50 (briefing+gantt split) — Agent 1+2 |
| 4 | Fase 46 (markt+eval+corr split) — Agent 2 | Fase 54 (schema tests) — Agent 6 | — |
| 5 | Fase 47 (tiptap+wizard split) — Agent 2+3 | Fase 56 (opschonen) — Agent 1+2 | — |
| 6 | Fase 48 (nav+gantt+rest split) — Agent 2 | — | — |

**Totaal: 6 rondes, max 3 terminals parallel.**

Spoor 1 (splitsen) en Spoor 2 (testen) lopen grotendeels parallel. Spoor 3 (opschonen) start in ronde 1 (fase 55) en eindigt in ronde 5 (fase 56) zodat de splits al klaar zijn.

---

## Verwacht resultaat

| Metric | Nu | Na |
|--------|-----|------|
| Bestanden >200 regels | 48 | 0 |
| Testbestanden | 0 | ~25 |
| Test coverage (utils) | 0% | ~80% |
| Test coverage (API routes) | 0% | ~60% |
| Grootste bestand | 830 regels | <200 regels |
| enums.ts | 515 regels | 6×~85 regels |
| Dead code / ongebruikte queries | aanwezig | verwijderd |
| Fase 31 (docrollen drawer) | niet af | af |
| Fase 37 (opschonen oude velden) | niet af | af |
