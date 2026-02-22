# Tabel content-fit breedte — Implementatieplan

## Doel

Elke tabel wordt maximaal zo breed als zijn inhoud. Lege tabellen krijgen een minimumbreedte van 600px. Tabellen worden nooit breder dan hun parent container.

---

## Fase 73a — SupplierTable wrapper verkleinen

**Agent:** Agent 2 (Frontend & UI)
**Bestand:** `src/lib/components/suppliers/SupplierTable.svelte`

Open het bestand en zoek regel 14, de buitenste `<div>`:

```html
<div class="rounded-card bg-white shadow-card overflow-hidden">
```

Voeg drie Tailwind-klassen toe aan het begin van de class-string:

```html
<div class="w-fit min-w-[600px] max-w-full rounded-card bg-white shadow-card overflow-hidden">
```

Geen andere wijzigingen in dit bestand.

---

## Fase 73b — Correspondentie tabel wrapper verkleinen

**Agent:** Agent 2 (Frontend & UI)
**Bestand:** `src/routes/(app)/projects/[id]/correspondence/+page.svelte`

Open het bestand en zoek regel 303, de `<div>` die de `<table>` omhult:

```html
<div class="rounded-card bg-white shadow-card overflow-hidden">
```

Voeg dezelfde drie klassen toe:

```html
<div class="w-fit min-w-[600px] max-w-full rounded-card bg-white shadow-card overflow-hidden">
```

Geen andere wijzigingen in dit bestand.

---

## Fase 73c — AuditLog wrapper verkleinen

**Agent:** Agent 2 (Frontend & UI)
**Bestand:** `src/lib/components/AuditLog.svelte`

Open het bestand en zoek regel 63, de buitenste `<div>` van het hele component:

```html
<div class="rounded-card border border-gray-200 bg-white shadow-card transition hover:shadow-sm">
```

Voeg dezelfde drie klassen toe:

```html
<div class="w-fit min-w-[600px] max-w-full rounded-card border border-gray-200 bg-white shadow-card transition hover:shadow-sm">
```

Geen andere wijzigingen in dit bestand.

---

## Fase 73d — EvaluationTable wrapper verkleinen

**Agent:** Agent 2 (Frontend & UI)
**Bestand:** `src/lib/components/evaluations/EvaluationTable.svelte`

Open het bestand en zoek regel 43, de buitenste `<div>`:

```html
<div class="overflow-x-auto rounded-card border border-gray-200 bg-white shadow-card">
```

Voeg dezelfde drie klassen toe vóór `overflow-x-auto`:

```html
<div class="w-fit min-w-[600px] max-w-full overflow-x-auto rounded-card border border-gray-200 bg-white shadow-card">
```

Geen andere wijzigingen in dit bestand.

---

## Fase 74 — DataTableCard wrapper verkleinen

**Agent:** Agent 2 (Frontend & UI)
**Bestand:** `src/lib/components/DataTableCard.svelte`

Dit component wordt gebruikt door DocumentsTable (documenten-pagina) en TeamTable (team-pagina).

Open het bestand en zoek regel 14, de buitenste `<div>`:

```html
<div class="rounded-xl bg-white shadow-sm ring-1 ring-gray-200" class:flex={scrollable} class:flex-col={scrollable} class:overflow-hidden={scrollable}>
```

Voeg dezelfde drie klassen toe aan het begin van de class-string:

```html
<div class="w-fit min-w-[600px] max-w-full rounded-xl bg-white shadow-sm ring-1 ring-gray-200" class:flex={scrollable} class:flex-col={scrollable} class:overflow-hidden={scrollable}>
```

Geen andere wijzigingen in dit bestand.

**Aandachtspunt:** DataTable (child van DataTableCard) gebruikt twee aparte `<table>` elementen voor header en body. Beide zijn `w-full` binnen dezelfde wrapper. Na deze wijziging test visueel of de kolommen van header en body nog uitlijnen.

---

## Fase 75 — Verificatie

**Agent:** Agent 6 (Testing & DevOps)

Voer de volgende controles uit:

1. Draai `npx svelte-check --threshold error` — verwacht 0 errors
2. Controleer dat geen van de gewijzigde bestanden meer dan 200 regels heeft
3. Controleer dat er geen `console.log` of TypeScript `any` is toegevoegd
4. Start de dev-server (`npm run dev`) en controleer visueel op deze pagina's:
   - `/suppliers` — tabel moet smaller zijn dan de volle paginabreedte als er weinig data is
   - `/projects/[id]/correspondence` — zelfde controle
   - `/projects/[id]/audit` — controleer dat paginering-knoppen niet afgekapt worden
   - `/projects/[id]/evaluations` — controleer bij veel criteria of horizontaal scrollen werkt
   - `/projects/[id]/documents` — controleer dat zoekbalk en tabelkolommen uitlijnen
   - `/projects/[id]/team` — controleer dat zoekbalk en tabelkolommen uitlijnen

---

## Overzicht

| Fase | Agent | Bestand | Wat te doen |
|------|-------|---------|-------------|
| 73a | Agent 2 | `suppliers/SupplierTable.svelte` r14 | Voeg `w-fit min-w-[600px] max-w-full` toe aan wrapper div |
| 73b | Agent 2 | `correspondence/+page.svelte` r303 | Voeg `w-fit min-w-[600px] max-w-full` toe aan wrapper div |
| 73c | Agent 2 | `AuditLog.svelte` r63 | Voeg `w-fit min-w-[600px] max-w-full` toe aan wrapper div |
| 73d | Agent 2 | `evaluations/EvaluationTable.svelte` r43 | Voeg `w-fit min-w-[600px] max-w-full` toe aan wrapper div |
| 74 | Agent 2 | `DataTableCard.svelte` r14 | Voeg `w-fit min-w-[600px] max-w-full` toe aan wrapper div |
| 75 | Agent 6 | — | svelte-check, bestandsregels, visuele controle 6 pagina's |
