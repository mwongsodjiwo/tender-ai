# Documenten navigatiepanel & voortgangsmodel — Fasen 67-71

## Probleem

1. **Navigatiepanel in editor**: elk document (Selectieleidraad, Conceptovereenkomst, UEA, etc.) heeft secties/hoofdstukken. Op de editor-pagina (`/projects/[id]/documents/[docTypeId]`) moet links een navigatiepanel staan met die hoofdstukken. PvE is uitgezonderd (heeft eigen pagina). Momenteel staat daar een `PageThumbnails` component met miniatuurpreviews — dit wordt een netter navigatiepanel.
2. **Voortgangsmodel vereenvoudigen**: voortgang is nu `goedgekeurde artifacts / totaal artifacts` → percentage per document. Dit wordt drie statussen per document: **Open**, **Gestart**, **Afgerond**. Secties tellen niet meer individueel mee.
3. **Voortgang op beide plekken**: zowel op het documenten-overzicht (tabel) als in het navigatiepanel van de editor.

## Huidige situatie

### Editor-pagina

- `PageThumbnails.svelte`: mini-preview cards per sectie met status badge
- Voortgang: `approvedCount/totalCount` met ProgressBar in sidebar
- Locatie: `src/routes/(app)/projects/[id]/documents/[docTypeId]/+page.svelte`

### Documenten-overzicht

- Voortgang: `Math.round((approved / total) * 100)` percentage + progress bar
- Locatie: `src/routes/(app)/projects/[id]/documents/+page.svelte`

## Gewenste situatie

### Editor-pagina

- Links: schone navigatielijst met hoofdstuknamen + nummering, actief item highlighted
- Klik op hoofdstuk → scroll naar die sectie
- Document-status (Open/Gestart/Afgerond) als badge in de header
- Geen progress bar of percentage meer

### Documenten-overzicht

- Status badge (Open/Gestart/Afgerond) i.p.v. progress bar per document

---

## Voortgangsmodel

| Status | Conditie | Badge |
|--------|----------|-------|
| **Open** | Geen artifacts, of alle artifacts `draft` zonder content | `bg-gray-100 text-gray-600` |
| **Gestart** | ≥1 artifact met content of status `generated`/`review`/`approved` | `bg-blue-50 text-blue-700` |
| **Afgerond** | Alle artifacts status `approved` | `bg-green-50 text-green-700` |

Afgeleid uit bestaande data — geen nieuwe DB kolom nodig.

---

## Uitvoering — Ralph Loop prompts

### Parallellisatie

```
Terminal 1: Fase 67  (types + backend)                ──┐
Terminal 2: Fase 68  (DocumentChapterNav component)   ──┤── parallel
                                                        │
Terminal 3: Fase 69+70 (editor layout + overzicht)    ──┘── na T1+T2
Terminal 4: Fase 71    (tests)                        ──── na T3
```

### Terminal 1 — Fase 67: DocumentStatus type + afleiding

```
/ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md en docs/documenten-navigatie-voortgang.md. TAAK: 1) Voeg aan src/lib/types/enums/document.ts toe: export const DOCUMENT_STATUSES = ['open', 'gestart', 'afgerond'] as const; export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]; export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = { open: 'Open', gestart: 'Gestart', afgerond: 'Afgerond' }; 2) Pas buildBlocks() aan in src/routes/(app)/projects/[id]/documents/+page.server.ts: voeg status veld toe per block. Logica: als total===0 return 'open'. Als approved===total return 'afgerond'. Anders als minstens 1 item status !== 'draft' return 'gestart', anders 'open'. 3) Update ProductBlock interface in src/lib/components/documents/build-rows.ts: voeg status: DocumentStatus toe (import uit enums). 4) Update DocumentRow in src/lib/components/documents/types.ts: vervang progress: number|null door documentStatus: 'open'|'gestart'|'afgerond'|null (null voor brieven). 5) Pas buildDocRows aan in build-rows.ts: zet documentStatus vanuit block.status i.p.v. progress. REGELS: TypeScript strict, geen any, geen console.log, max 200 regels per bestand, max 30 regels per functie." --completion-promise "COMPLETE" --max-iterations 6
```

### Terminal 2 — Fase 68: DocumentChapterNav component

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md en docs/documenten-navigatie-voortgang.md. TAAK: Maak nieuw bestand src/lib/components/editor/DocumentChapterNav.svelte — een compact navigatiepanel voor hoofdstukken binnen een document. Props: chapters (array met id: string, title: string), currentIndex: number, onChapterClick: (index: number) => void. Render een verticale lijst (<nav>) met per hoofdstuk: een genummerd item (1, 2, 3...), de titel (truncate met line-clamp-1), click handler. Het actieve item krijgt bg-primary-50, text-primary-700, font-medium en een linkerborder (border-l-2 border-primary-500). Niet-actieve items: text-gray-600 hover:bg-gray-50 hover:text-gray-900. Elk item: px-4 py-2 text-sm cursor-pointer flex items-center gap-2.5. De nummering is een kleine cirkel (h-5 w-5 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600, actief: bg-primary-100 text-primary-700). Geen scroll-preview, geen status badges per sectie — alleen een schone navigatielijst. REGELS: Svelte classic syntax (export let, $:). Max 200 regels. Geen any, geen console.log. Engels code, Nederlands UI. Schrijf ook tests/unit/document-chapter-nav.test.ts met happy path + 1 error case." --completion-promise "COMPLETE" --max-iterations 6
```

### Terminal 3 — Fase 69+70: Editor layout + overzicht (NA Terminal 1+2)

```
/ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md en docs/documenten-navigatie-voortgang.md. TWEE TAKEN: TAAK 1 (fase 69) — Editor-pagina: Pas src/routes/(app)/projects/[id]/documents/[docTypeId]/+page.svelte aan. a) Vervang PageThumbnails import door DocumentChapterNav import uit $lib/components/editor/DocumentChapterNav.svelte. b) Vervang de sidebar inhoud: verwijder ProgressBar + approvedCount/totalCount. Vervang <PageThumbnails> door <DocumentChapterNav chapters={artifacts.map(a => ({ id: a.id, title: a.title }))} currentIndex={currentSectionIndex} onChapterClick={(i) => scrollToSection(i)} />. c) Toon document-status als badge in de header naast documentType.name. Bereken status: als artifacts.length===0 dan 'open', als alle approved dan 'afgerond', als minstens 1 niet-draft dan 'gestart', anders 'open'. Badge kleuren: open=bg-gray-100 text-gray-600, gestart=bg-blue-50 text-blue-700, afgerond=bg-green-50 text-green-700. d) Verwijder approvedCount en totalCount reactieve variabelen. e) pageSections kan weg als PageThumbnails niet meer gebruikt wordt. TAAK 2 (fase 70) — Documenten-overzicht: Pas src/lib/components/documents/DocumentsTable.svelte aan. a) Vervang de Voortgang kolom (key='progress', visibleFrom:'md') door een Status kolom (key='status', geen visibleFrom — altijd zichtbaar). b) In de cell slot rendering: vervang de ProgressBar rendering bij column.key === 'progress' door column.key === 'status'. Toon een badge: als row.type==='document' toon documentStatus badge (Open/Gestart/Afgerond met juiste kleuren), als row.type==='brief' toon bestaande StatusBadge. c) Pas kolom-breedtes aan: naam w-[40%], type w-[12%], status w-[15%], datum w-[18%] visibleFrom:'lg', export w-[15%]. d) Verwijder ProgressBar import als die niet meer nodig is. REGELS: Svelte classic syntax. Max 200 regels per bestand. Geen any, geen console.log." --completion-promise "COMPLETE" --max-iterations 8
```

### Terminal 4 — Fase 71: Tests + verificatie (NA Terminal 3)

```
/ralph-loop "Je bent Agent 6 (Testing & DevOps). Lees CLAUDE.md en docs/documenten-navigatie-voortgang.md. TAAK 1: Schrijf unit tests in tests/unit/document-status.test.ts voor de document status afleiding. Test cases: open (total===0), open (alleen drafts zonder content), gestart (mix van statussen), afgerond (alle approved). TAAK 2: Draai npx vitest run tests/unit/document-chapter-nav.test.ts en npx vitest run tests/unit/document-status.test.ts. TAAK 3: Kwaliteitscheck: DocumentChapterNav.svelte ≤ 200 regels, DocumentsTable.svelte ≤ 200 regels, build-rows.ts ≤ 200 regels, editor +page.svelte ≤ 200 regels, geen console.log, alle functies ≤ 30 regels, TypeScript strict geen any geen @ts-ignore. REGELS: Testbestanden mogen > 200 regels. Geen any." --completion-promise "COMPLETE" --max-iterations 8
```

---

## Samenvatting

| Terminal | Fase | Agent | Bestand(en) | Parallel |
|----------|------|-------|-------------|----------|
| 1 | 67 | Agent 1 | enums, +page.server.ts, build-rows.ts, types.ts | ✅ met T2 |
| 2 | 68 | Agent 2 | DocumentChapterNav.svelte (nieuw) | ✅ met T1 |
| 3 | 69+70 | Agent 2 | editor +page.svelte, DocumentsTable.svelte | ⏳ na T1+T2 |
| 4 | 71 | Agent 6 | tests + verificatie | ⏳ na T3 |
