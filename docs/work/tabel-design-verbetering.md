# Tabel Design Verbetering — Implementatieplan (Fasen 57-62)

## Gevonden problemen

1. **Scrollbar verschuift content** — Wanneer scrollbar verschijnt/verdwijnt verandert de breedte van `.scroll-area`, waardoor tabel-content verspringt. Oorzaak: geen `scrollbar-gutter: stable` in DataTableCard.
2. **Records-rij niet sticky** — De footer met "X records" zit binnen de scroll-area (DataTable regel 169). Scrollt dus mee. Moet buiten de scroll-container, altijd zichtbaar onderaan.
3. **Datum kolom leeg bij documenten** — `build-rows.ts` zet `date: ''` voor documenten (regel 47). Er is geen koppeling met milestone deadlines. De `formatDate('')` geeft `Invalid Date`. Documenten moeten hun eerstvolgende deadline uit milestones tonen, of "Geen deadline".
4. **Lege cellen rechts van Type** — Voortgang kolom toont `—` voor sommige items, maar Datum en Export kolommen zijn helemaal leeg. Geeft een visueel "afgekapte" rij.

## Betrokken bestanden

**Shared (raakt alle tabellen in de app):**
- `src/lib/components/DataTableCard.svelte` (95 regels)
- `src/lib/components/DataTable.svelte` (202 regels)

**Documenten-specifiek:**
- `src/lib/components/documents/DocumentsTable.svelte` (78 regels)
- `src/lib/components/documents/types.ts` (12 regels)
- `src/lib/components/documents/build-rows.ts` (120 regels)
- `src/routes/(app)/projects/[id]/documents/+page.server.ts` (86 regels)
- `src/routes/(app)/projects/[id]/documents/+page.svelte` (266 regels)

---

## Fasen

| Fase | Wat | Agent(s) | Afhankelijk van | Raakt |
|------|-----|----------|-----------------|-------|
| 57 | Scrollbar fix: `scrollbar-gutter: stable` + overlay CSS | 2 | — | DataTableCard.svelte |
| 58 | Records footer buiten scroll-area, sticky onderaan | 2 | — | DataTable.svelte, DataTableCard.svelte |
| 59 | Backend: milestone deadlines laden voor documenten | 1 | — | documents/+page.server.ts |
| 60 | Datum kolom fixen + lege cellen opvullen | 2 | Fase 59 | DocumentsTable, build-rows, types |
| 61 | Regressietest: alle pagina's met DataTable controleren | 6 | Fase 57, 58 | — |
| 62 | Visuele verificatie + edge cases | 6 | Fase 60, 61 | — |

---

## Ralph Loop prompts per fase

### Fase 57 — Scrollbar fix

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md en docs/agent-2-frontend.md. Bouw Fase 57: Fix scrollbar content shift in DataTableCard.svelte. Probleem: wanneer scrollbar verschijnt/verdwijnt verspringt de tabel-content. Oplossing: (1) Voeg scrollbar-gutter: stable toe aan .scroll-area CSS. (2) Verwijder de scrollbar-width: none voor Firefox — vervang door scrollbar-width: thin met transparante thumb die alleen zichtbaar wordt bij hover/scroll. (3) Voor Webkit: gebruik overlay scrollbar die niet de layout beïnvloedt, thumb transparent bij rust, rgba bij hover. (4) Test dat content niet meer verschuift bij scrollen. Svelte classic syntax. Max 200 regels. Output <promise>COMPLETE</promise> wanneer scrollbar geen layout shift meer veroorzaakt." --completion-promise "COMPLETE" --max-iterations 15
```

### Fase 58 — Records footer buiten scroll-area

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md en docs/agent-2-frontend.md. Bouw Fase 58: Verplaats de records-teller uit de scroll-area. Probleem: de footer met 'X records' in DataTable.svelte (regel 169) zit binnen de scroll-container en scrollt mee. Oplossing: (1) Verwijder de footer div uit DataTable.svelte. (2) Expose het recordLabel als een prop of via een event/slot zodat de parent het kan tonen. (3) Voeg in DataTableCard.svelte een sticky footer toe BUITEN de scroll-area div, met dezelfde styling (border-t, bg-gray-50, px-5 py-3). (4) DataTableCard leest het aantal rijen uit een nieuwe prop of slot. (5) Verifieer dat de thead sticky top-0 nog werkt — scrollbar moet beginnen onder de header en eindigen boven de footer. Svelte classic syntax. Elk bestand max 200 regels. Output <promise>COMPLETE</promise> wanneer de footer altijd zichtbaar is en niet meescrollt." --completion-promise "COMPLETE" --max-iterations 20
```

### Fase 59 — Backend: milestone deadlines voor documenten

```
/ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md en docs/agent-1-backend.md. Bouw Fase 59: Laad milestone deadlines voor de documentenpagina. In src/routes/(app)/projects/[id]/documents/+page.server.ts: (1) Laad milestones voor het project uit de milestones tabel (milestone_type, target_date, title). (2) Bouw een mapping van document relevantie: publicatiedatum geldt voor alle documenten, inschrijfdeadline als meest relevante deadline. (3) Geef nextDeadline mee als string (ISO date) in de return data — de eerstvolgende milestone target_date die in de toekomst ligt, of de dichtstbijzijnde als alle in het verleden liggen. (4) Als er geen milestones zijn, geef null. Kwaliteitscheck: functies max 30 regels, geen any. Output <promise>COMPLETE</promise> wanneer nextDeadline beschikbaar is in page data." --completion-promise "COMPLETE" --max-iterations 15
```

### Fase 60 — Datum kolom fixen + lege cellen

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md en docs/agent-2-frontend.md. Bouw Fase 60: Fix de datum kolom en lege cellen in DocumentsTable. (1) In build-rows.ts: voor documenten, gebruik de nextDeadline uit page data als date veld. Als null, zet date op ''. (2) In DocumentsTable.svelte: bij lege date string, toon 'Geen deadline' in grijs in plaats van Invalid Date. (3) In de export kolom: voor niet-exporteerbare rijen, toon '—' in plaats van leeg span. (4) Verifieer dat brieven nog steeds hun created_at datum tonen. (5) In types.ts: voeg optioneel deadline veld toe als dat nodig is voor het onderscheid. Svelte classic syntax, Tailwind, Nederlands UI. Output <promise>COMPLETE</promise> wanneer alle cellen gevuld zijn en geen lege ruimte meer zichtbaar is." --completion-promise "COMPLETE" --max-iterations 20
```

### Fase 61 — Regressietest DataTable wijzigingen

```
/ralph-loop "Je bent Agent 6 (Testing & DevOps). Lees CLAUDE.md en docs/agent-6-devops.md. Bouw Fase 61: Regressietest voor DataTable en DataTableCard wijzigingen. De shared componenten worden op meerdere pagina's gebruikt. (1) Zoek alle pagina's die DataTable of DataTableCard gebruiken (grep). (2) Controleer per pagina dat de records footer correct wordt doorgegeven. (3) Schrijf unit tests voor DataTable: render met 0 rijen (empty state), render met 5 rijen, records label correct. (4) Schrijf unit tests voor DataTableCard: scrollable mode, filter toggle, search binding. (5) Verifieer dat geen pagina broken is door de footer-refactor. Output <promise>COMPLETE</promise> wanneer alle tests slagen en geen regressies gevonden." --completion-promise "COMPLETE" --max-iterations 20
```

### Fase 62 — Visuele verificatie + edge cases

```
/ralph-loop "Je bent Agent 6 (Testing & DevOps). Lees CLAUDE.md en docs/agent-6-devops.md. Bouw Fase 62: Edge case tests voor documenten tabel. (1) Test: project zonder milestones — datum kolom moet 'Geen deadline' tonen. (2) Test: project met milestones in het verleden — toon dichtstbijzijnde datum. (3) Test: mix van documenten en brieven — documenten tonen deadline, brieven tonen created_at. (4) Test: tabel met 0 rijen — empty state correct. (5) Test: tabel met 50+ rijen — scrollbar werkt, footer sticky, header sticky. (6) Test: smalle viewport — verborgen kolommen (visibleFrom) werken correct. Output <promise>COMPLETE</promise> wanneer alle edge cases getest en gedocumenteerd zijn." --completion-promise "COMPLETE" --max-iterations 15
```

---

## Uitvoeringsvolgorde — 6 terminals

| Ronde | Terminal 1 | Terminal 2 | Terminal 3 | Terminal 4 | Terminal 5 | Terminal 6 |
|-------|-----------|-----------|-----------|-----------|-----------|-----------|
| 1 | Fase 57 (scrollbar) | Fase 58 (footer refactor) | Fase 59 (deadlines backend) | Fase 60 (datum kolom)* | Fase 61 (regressietest)* | Fase 62 (edge cases)* |

*Fase 60 wacht op 59, fase 61 wacht op 57+58, fase 62 wacht op 60+61. Start deze terminals zodra hun dependencies klaar zijn. In de praktijk draaien 57, 58, 59 direct en starten 60, 61, 62 kort daarna.

---

## Verwacht resultaat

| Wat | Nu | Na |
|-----|-----|------|
| Content shift bij scrollbar | Ja | Nee (scrollbar-gutter: stable) |
| Records footer | Scrollt mee | Sticky onderaan, altijd zichtbaar |
| Datum kolom documenten | Leeg / Invalid Date | Deadline uit milestones of "Geen deadline" |
| Lege cellen rechts | Wit/leeg | "—" of relevante data |
| Scrollbar bereik | Hele card | Onder header, boven footer |
