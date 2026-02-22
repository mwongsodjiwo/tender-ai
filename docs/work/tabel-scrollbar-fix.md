# Tabel scrollbar & kleur fix — Fasen 63-66

## Probleem

De scrollbar in `DataTableCard` loopt visueel over de sticky `<thead>` header (NAAM, TYPE, etc.). De gebruiker wil dat de scrollbar pas zichtbaar is **onder** de headerrij.

### Root cause

`.scroll-area` wraps de hele `<table>` (thead + tbody). De scrollbar loopt daarom over de volledige hoogte inclusief de header.

### Oplossing

Splits de `<table>` in twee delen: header-table (vast) en body-table (scrollbaar). De scrollbar verschijnt alleen naast de body.

---

## Uitvoering

### Parallellisatie

```
Terminal 1: Fase 63  (DataTable.svelte)      ──┐
Terminal 2: Fase 64  (DataTableCard.svelte)   ──┤── parallel
                                                │
Terminal 3: Fase 65+66 (tests + verificatie)  ──┘── na T1+T2
```

---

## Fase 63 — Terminal 1: DataTable splitsen

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md en docs/tabel-scrollbar-fix.md. TAAK: Refactor src/lib/components/DataTable.svelte — splits de ene <table> in twee aparte <table> elementen. 1) HEADER-TABLE (buiten scroll-area): wrapper <div style='overflow-x: clip'>, <table class='w-full table-fixed' aria-hidden='true'>, bevat <colgroup> + <thead>, verwijder sticky top-0 z-10 van <thead>, resize handles blijven in <th>. 2) BODY-TABLE (scrollbaar via parent): wrapper <div style='overflow-x: clip'>, <table bind:this={tableEl} class='w-full table-fixed' role='grid' aria-label={ariaLabel}>, bevat <colgroup> + <tbody>. 3) BEIDE TABELLEN delen exact dezelfde <colgroup> via {#each columns} loop, beide krijgen visibilityClass(col) en inline width-styles van colWidths. 4) INITWIDTHS: voeg headerTableEl toe (bind:this op header-table), meet <th> breedtes uit headerTableEl, colWidths reactief gedeeld tussen beide colgroups. 5) VERWIJDER de huidige <div style='overflow-x: clip'> wrapper — elke sub-table krijgt zijn eigen wrapper. 6) EMPTY STATE (rows.length === 0): ongewijzigd. REGELS: Svelte classic syntax (export let, $:). Max 200 regels. Geen any, geen console.log. VERIFICATIE: bestand ≤ 200 regels, beide colgroups identiek, initWidths gebruikt headerTableEl." --completion-promise "COMPLETE" --max-iterations 6
```

---

## Fase 64 — Terminal 2: DataTableCard scroll-area vereenvoudigen

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md en docs/tabel-scrollbar-fix.md. TAAK: Vereenvoudig src/lib/components/DataTableCard.svelte — de scroll-area wraps nu alleen de body-table (header staat erbuiten dankzij fase 63). WIJZIGINGEN: 1) VERVANG overflow-y: scroll door overflow-y: auto in de scoped <style> block van .scroll-area. 2) BEHOUD scrollbar styling: Firefox scrollbar-width: thin en scrollbar-color: transparent transparent, bij hover rgba(0,0,0,0.2) transparent. Webkit ::-webkit-scrollbar width: 6px background: transparent, thumb transparent bij rust, rgba(0,0,0,0.2) bij hover. 3) VERWIJDER scrollbar-gutter: stable — niet meer nodig nu scrollbar alleen in body-deel zit. 4) CONTROLEER dat height-constraint nog werkt: documents-card :global(.rounded-xl) { max-height: calc(100vh - 18rem); }. REGELS: Svelte classic syntax. Max 200 regels. Geen any, geen console.log. VERIFICATIE: overflow-y is auto (niet scroll), scrollbar styling compleet voor Firefox + Webkit, bestand ≤ 200 regels." --completion-promise "COMPLETE" --max-iterations 4
```

---

## Fase 65+66 — Terminal 3: Tests + verificatie (NA Terminal 1+2)

```
/ralph-loop "Je bent Agent 6 (Testing & DevOps). Lees CLAUDE.md en docs/tabel-scrollbar-fix.md. TAAK 1 — TESTS (fase 65): Update tests/unit/datatable-regression.test.ts voor de nieuwe twee-tabel structuur in DataTable.svelte. Test: er zijn twee <table> elementen wanneer rows > 0, header-table heeft aria-hidden='true', body-table heeft role='grid', sticky zit NIET meer op <thead>, beide tabellen hebben een <colgroup>, bestaande tests voor props empty state cell slot keyboard nav blijven geldig, DataTableCard overflow-y is auto niet scroll. TAAK 2 — VERIFICATIE (fase 66): kwaliteitscheck: DataTable.svelte ≤ 200 regels, DataTableCard.svelte ≤ 200 regels, geen console.log in beide bestanden, alle functies ≤ 30 regels, TypeScript strict geen any geen @ts-ignore. Draai: npx vitest run tests/unit/datatable-regression.test.ts. REGELS: Testbestanden mogen > 200 regels. Svelte classic syntax. Geen any. VERIFICATIE: alle tests slagen, kwaliteitscheck passed." --completion-promise "COMPLETE" --max-iterations 8
```

---

## Samenvatting

| Terminal | Fase | Agent | Bestand | Parallel |
|----------|------|-------|---------|----------|
| 1 | 63 | Agent 2 | DataTable.svelte | ✅ met T2 |
| 2 | 64 | Agent 2 | DataTableCard.svelte | ✅ met T1 |
| 3 | 65+66 | Agent 6 | tests + verificatie | ⏳ na T1+T2 |
