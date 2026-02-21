# Documentenpagina — Bugfix & Archivering Implementatieplan (Fasen 39-42)

## Gevonden problemen

1. **Archiveren werkt niet** — `handleArchive` roept `POST /api/projects/:id/documents/:docId/archive` aan, maar die endpoint bestaat niet (404).
2. **Archief tab is hardcoded leeg** — Toont altijd `Archief (0)` met statische placeholder. Gearchiveerde items worden niet geladen of getoond.
3. **Geen error handling bij archiveren** — Als de API faalt, blijft `archiving = true` in de drawer hangen. Geen foutmelding naar gebruiker.
4. **Ongebruikte data** — `uploadedDocuments` en `evaluations` worden geladen in page.server.ts maar nergens gebruikt in de pagina.
5. **Archief datamodel is er al** — `archive_status` kolom bestaat op `artifacts`, `correspondence` en `documents` (migratie 20260218002000). Enum: `'active' | 'archived' | 'retention_expired' | 'anonymized' | 'destroyed'`.

## Design referentie

Bestaande UI: `src/routes/(app)/projects/[id]/documents/+page.svelte` met tabs Documenten/Archief, zoekbalk, filter, DocumentsTable en DocumentDrawer.

## Fasen

| Fase | Wat | Agent(s) | Afhankelijk van |
|------|-----|----------|----------------|
| 39 | API: archive/unarchive endpoints voor documenten en brieven | 1 | — |
| 40 | Frontend: archivering flow + error handling in drawer | 2 | Fase 39 |
| 41 | Frontend: archief tab met data loading en weergave | 2 | Fase 39, 40 |
| 42 | Opschonen: ongebruikte data verwijderen, tests | 6 | Fase 39, 40, 41 |

---

## Ralph Loop prompts per fase

### Fase 39 — API: archive/unarchive endpoints

```
/ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD en docs/agent-1-backend.md. Bouw Fase 39: Archive API endpoints. De archive_status kolom bestaat al op artifacts, correspondence en documents (enum: active, archived, retention_expired, anonymized, destroyed). Maak: (1) POST /api/projects/[id]/documents/[docId]/archive — zet archive_status op 'archived' voor alle artifacts met document_type_id = docId in dit project. (2) POST /api/projects/[id]/documents/[docId]/unarchive — zet archive_status terug naar 'active'. (3) POST /api/projects/[id]/correspondence/[corrId]/archive — zet archive_status op 'archived' voor correspondence record. (4) POST /api/projects/[id]/correspondence/[corrId]/unarchive — zet archive_status terug naar 'active'. Valideer dat project bestaat en user ingelogd is. Log audit trail. Voeg Zod schemas toe. Schrijf unit test. Kwaliteitscheck: functies max 30 regels, bestanden max 200 regels. Output <promise>COMPLETE</promise> wanneer alle 4 endpoints, schemas en tests klaar zijn." --completion-promise "COMPLETE" --max-iterations 20
```

### Fase 40 — Frontend: archivering flow + error handling

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md, AGENTS.MD en docs/agent-2-frontend.md. Bouw Fase 40: Archivering flow in DocumentDrawer. Fix problemen: (1) Update handleArchive in +page.svelte: bepaal of het een document of brief is (row.type), roep juiste endpoint aan (/documents/:id/archive of /correspondence/:id/archive). (2) Voeg error handling toe: bij fout toon melding, reset archiving state. (3) Voeg bevestigingsdialoog toe voor archiveren (Weet u zeker dat u dit wilt archiveren?). (4) Na succesvol archiveren: sluit drawer, invalidate data, toon success toast. (5) Reset archiving state in DocumentDrawer bij API fout. Svelte classic syntax, Tailwind, Nederlands UI. Kwaliteitscheck: functies max 30 regels, bestanden max 200 regels. Output <promise>COMPLETE</promise> wanneer archiveren werkt met error handling en bevestiging." --completion-promise "COMPLETE" --max-iterations 20
```

### Fase 41 — Frontend: archief tab met data loading

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md, AGENTS.MD en docs/agent-2-frontend.md. Bouw Fase 41: Archief tab op documentenpagina. (1) Update page.server.ts: laad gearchiveerde items apart — artifacts met archive_status='archived' gegroepeerd per document_type, plus correspondence met archive_status='archived'. (2) Geef archivedRows mee aan frontend. (3) Update +page.svelte: toon archief count in tab label. Gebruik DocumentsTable ook voor archief tab met archivedRows. (4) Voeg 'Terugzetten' knop toe in DocumentDrawer wanneer item gearchiveerd is (roept unarchive endpoint aan). (5) Filter actieve documenten op archive_status='active' (of IS NULL voor backward compatibility). Svelte classic syntax, Tailwind, Nederlands UI. Kwaliteitscheck: functies max 30 regels, bestanden max 200 regels. Output <promise>COMPLETE</promise> wanneer archief tab items toont en terugzetten werkt." --completion-promise "COMPLETE" --max-iterations 25
```

### Fase 42 — Opschonen en tests

```
/ralph-loop "Je bent Agent 6 (Testing & DevOps). Lees CLAUDE.md, AGENTS.MD en docs/agent-6-devops.md. Bouw Fase 42: Opschonen en tests voor documentenpagina. (1) Verwijder ongebruikte data uit page.server.ts: uploadedDocuments en evaluations worden geladen maar niet gebruikt — verwijder queries en return values tenzij ze elders nodig zijn. (2) Integratietest: archiveer document via API, controleer dat archive_status='archived'. (3) Integratietest: unarchive, controleer status terug naar 'active'. (4) Integratietest: archiveer correspondence. (5) Test dat gearchiveerde items niet in de actieve lijst verschijnen. (6) Test dat gearchiveerde items wel in archief lijst verschijnen. Kwaliteitscheck: alle bestanden, functies, geen console.log. Output <promise>COMPLETE</promise> wanneer alle tests slagen en ongebruikte code verwijderd is." --completion-promise "COMPLETE" --max-iterations 20
```

---

## Uitvoeringsvolgorde per ronde

| Ronde | Terminal 1 | Terminal 2 |
|-------|-----------|-----------|
| 1 | Fase 39 (archive API) — Agent 1 | — |
| 2 | Fase 40 (archive flow UI) — Agent 2 | — |
| 3 | Fase 41 (archief tab) — Agent 2 | — |
| 4 | Fase 42 (opschonen + tests) — Agent 6 | — |

NB: Fasen 40 en 41 kunnen theoretisch parallel, maar delen dezelfde bestanden (+page.svelte, DocumentDrawer.svelte) dus sequentieel is veiliger.

---

## Betrokken bestanden

**Nieuw aan te maken:**
- `src/routes/api/projects/[id]/documents/[docId]/archive/+server.ts`
- `src/routes/api/projects/[id]/documents/[docId]/unarchive/+server.ts`
- `src/routes/api/projects/[id]/correspondence/[corrId]/archive/+server.ts`
- `src/routes/api/projects/[id]/correspondence/[corrId]/unarchive/+server.ts`

**Te wijzigen:**
- `src/routes/(app)/projects/[id]/documents/+page.server.ts` — filter op archive_status, laad archief apart
- `src/routes/(app)/projects/[id]/documents/+page.svelte` — handleArchive fix, archief tab data, error handling
- `src/lib/components/documents/DocumentDrawer.svelte` — bevestigingsdialoog, unarchive knop, error state
- `src/lib/components/documents/types.ts` — optioneel: `archived` veld toevoegen aan DocumentRow

**Bestaand datamodel (geen migratie nodig):**
- `archive_status` kolom bestaat al op `artifacts`, `correspondence`, `documents` (migratie 20260218002000)
- Enum `archive_status`: `'active' | 'archived' | 'retention_expired' | 'anonymized' | 'destroyed'`
