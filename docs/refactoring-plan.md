# Refactoring Plan — TenderManager

> **Doel:** De technische kwaliteit van de codebase systematisch verbeteren. Dit plan is gebaseerd op een volledige audit van 167 bronbestanden (33.892 regels code) en volgt de regels uit `AGENTS.md`.

---

## Samenvatting audit

| Categorie | Bevindingen | Ernst |
|-----------|-------------|-------|
| Bestanden > 200 regels | 111 bestanden (66%) | Hoog |
| Functies > 30 regels | 81 functies | Hoog |
| Mega-componenten (>1500 regels) | 2 bestanden | Kritiek |
| Unsafe type casts (`as unknown`) | 6 locaties | Hoog |
| Console.log in productie | 5 statements | Medium |
| Componenten die zelf data fetchen | 2 componenten | Medium |
| Ontbrekende page states (loading/empty/error) | 5 pagina's | Medium |
| Inconsistente error handling | 8 patronen | Medium |
| Accessibility (WCAG 2.1 AA) gaten | 12+ issues | Hoog |
| Ontbrekende tests (AI modules) | 20 modules | Hoog |
| Ongebruikte env vars | 5 variabelen | Laag |
| TODO/FIXME comments | 0 | Geen |
| Commented-out code | 0 | Geen |
| Naming inconsistenties | 0 | Geen |

---

## Fase 1 — Kritieke splits (mega-componenten)

### Prioriteit: KRITIEK
### Agent: Agent 2 (Frontend)

De twee grootste pijnpunten zijn Svelte-bestanden die 8x over de 200-regelrichtlijn gaan. Deze zijn onmogelijk te onderhouden en testen.

---

### 1.1 — Split `documents/[docTypeId]/+page.svelte` (1686 regels)

**Huidig bestand:** `src/routes/(app)/projects/[id]/documents/[docTypeId]/+page.svelte`

**Voorgestelde opsplitsing:**

```
src/lib/components/documents/
├── DocumentEditor.svelte          ← TipTap editor wrapper (~200 regels)
├── DocumentSidebar.svelte         ← AI chat sidebar (~250 regels)
├── DocumentToolbar.svelte         ← Acties: genereren, exporteren, review (~150 regels)
├── DocumentVersionHistory.svelte  ← Versiegeschiedenis panel (~150 regels)
├── SectionList.svelte             ← Navigatie tussen secties (~100 regels)
└── ReviewPanel.svelte             ← Kennishouder review interface (~150 regels)
```

**Aanpak:**
1. Identificeer logische blokken in het huidige bestand
2. Extract elk blok naar een eigen component met props
3. Behoud de pagina als dunne orchestratielaag (<200 regels)
4. Alle data komt uit `+page.server.ts`, componenten krijgen alleen props

---

### 1.2 — Split `contract/+page.svelte` (1597 regels)

**Huidig bestand:** `src/routes/(app)/projects/[id]/contract/+page.svelte`

**Voorgestelde opsplitsing:**

```
src/lib/components/contract/
├── ContractWizard.svelte          ← Stappen-wizard container (~150 regels)
├── ContractStepGeneral.svelte     ← Stap 1: algemene voorwaarden (~200 regels)
├── ContractStepParties.svelte     ← Stap 2: partijen (~150 regels)
├── ContractStepTerms.svelte       ← Stap 3: voorwaarden (~200 regels)
├── ContractStepReview.svelte      ← Stap 4: review en goedkeuring (~150 regels)
├── ContractPreview.svelte         ← Documentpreview (~200 regels)
└── ContractConditionsSelect.svelte ← ARVODI/ARIV/UAV selector (~100 regels)
```

---

### Acceptatiecriteria Fase 1
- [ ] Beide mega-bestanden zijn < 200 regels
- [ ] Alle child-componenten ontvangen data via props (geen eigen fetching)
- [ ] Bestaande functionaliteit werkt identiek
- [ ] Geen TypeScript fouten

---

## Fase 2 — Type safety

### Prioriteit: HOOG
### Agent: Agent 1 (Backend)

---

### 2.1 — Elimineer `as unknown as Type` casts

**Probleem:** 6 locaties waar TypeScript-veiligheid wordt omzeild.

| Bestand | Regel | Huidige cast | Oplossing |
|---------|-------|-------------|-----------|
| `dashboard/+page.server.ts` | 155, 175 | `as unknown as { name: string }` | Maak `MilestoneWithProject` type voor Supabase joined query |
| `lib/server/ai/rag.ts` | 167 | `as unknown as { name, deleted_at }` | Maak `DocumentChunkResult` interface |
| `lib/server/ai/rag.ts` | 188 | `as unknown as { title }` | Maak `TenderNedChunkResult` interface |
| `lib/server/ai/requirements.ts` | 122 | `as unknown[]` na `JSON.parse` | Zod `.parse()` na JSON.parse met `requirementArraySchema` |
| `api/planning/deadlines/+server.ts` | 94, 117 | Joined project/profile data | Maak `DeadlineQueryResult` type |
| `projects/[id]/+page.server.ts` | 98 | `as Record<string, unknown>` | Gebruik Supabase generic: `.select<ArtifactWithDocType>()` |

**Nieuw bestand aanmaken:** `src/lib/types/query-results.ts`

```typescript
// Types voor Supabase joined queries — vervangt alle unsafe casts

export interface MilestoneWithProject extends Milestone {
    projects: { name: string; organization_id: string };
}

export interface DocumentChunkResult {
    documents: { name: string; deleted_at: string | null } | null;
}

export interface ArtifactWithDocType extends Artifact {
    document_type: { id: string; name: string; slug: string } | null;
}

// etc.
```

---

### 2.2 — Split grote type-bestanden

De drie type-bestanden zijn te groot:

| Bestand | Regels | Actie |
|---------|--------|-------|
| `types/api.ts` | 759 | Split naar domein: `types/api/projects.ts`, `types/api/artifacts.ts`, `types/api/planning.ts`, etc. |
| `types/database.ts` | 645 | Split naar domein: `types/db/projects.ts`, `types/db/artifacts.ts`, `types/db/planning.ts`, etc. |
| `server/api/validation.ts` | 702 | Split naar domein: `server/api/validation/projects.ts`, `server/api/validation/milestones.ts`, etc. |

**Behoud `types/index.ts` als barrel export** zodat bestaande imports (`from '$types'`) blijven werken.

---

### Acceptatiecriteria Fase 2
- [ ] Geen `as unknown` meer in de hele codebase
- [ ] Alle joined queries hebben een expliciet type
- [ ] Type-bestanden zijn < 200 regels per stuk
- [ ] Alle bestaande imports blijven werken via barrel exports

---

## Fase 3 — Consistente patronen

### Prioriteit: HOOG
### Agent: Agent 1 (Backend) + Agent 2 (Frontend)

---

### 3.1 — Standaardiseer `+page.server.ts` patroon

**Probleem:** Auth checks, error handling en data loading zijn inconsistent.

**Standaard patroon (afdwingen in alle page loaders):**

```typescript
export const load: PageServerLoad = async ({ params, locals, parent }) => {
    const { supabase } = locals;
    const parentData = await parent(); // Auth guard vanuit layout

    const { data, error: dbError } = await supabase
        .from('table')
        .select('*')
        .eq('id', params.id)
        .single();

    if (dbError || !data) {
        throw error(404, 'Item niet gevonden');
    }

    return { data };
};
```

**Bestanden die moeten worden aangepast:**

| Bestand | Probleem |
|---------|----------|
| `dashboard/+page.server.ts` | Geen expliciete auth check |
| `kennisbank/+page.server.ts` | Handmatige `if (!user)` check i.p.v. parent guard |
| `admin/+page.server.ts` | Gebruikt `createServiceClient()` i.p.v. `locals.supabase` |
| `projects/[id]/briefing/+page.server.ts` | Throws 404 bij missing project |
| `projects/[id]/documents/+page.server.ts` | Geeft stilletjes lege data bij DB fout |
| `projects/[id]/requirements/+page.server.ts` | Throws 500 bij DB fout |

---

### 3.2 — Standaardiseer API error responses

**Huidig probleem:** Sommige endpoints returnen `{ message, code, status }`, andere alleen `{ error }` of `{ message }`.

**Standaard response format:**

```typescript
// Succes
return json({ data: result }, { status: 200 });

// Fout
return json({
    message: 'Beschrijving van de fout',
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'DB_ERROR' | 'INTERNAL_ERROR',
    status: 400 | 401 | 403 | 404 | 500
}, { status: ... });
```

**Maak helper functie:** `src/lib/server/api/response.ts`

```typescript
export function apiError(status: number, code: string, message: string) {
    return json({ message, code, status }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
    return json({ data }, { status });
}
```

---

### 3.3 — Vier states per pagina afdwingen

**Pagina's met ontbrekende states:**

| Pagina | Ontbreekt | Actie |
|--------|-----------|-------|
| `kennisbank/+page.svelte` | Loading state | Voeg skeleton loader toe tijdens laden |
| `dashboard/+page.svelte` | Error state voor gefaalde deadline loads | Voeg error boundary toe |
| `briefing/+page.svelte` | Empty state als er nog geen conversatie is | Toon "Start briefing" prompt |
| `documents/[docTypeId]/+page.svelte` | Loading state voor editor | Voeg PageSkeleton toe |
| `audit/+page.svelte` | Server-side loading (fetcht nu in onMount) | Verplaats naar page.server.ts |

---

### Acceptatiecriteria Fase 3
- [ ] Alle page loaders volgen hetzelfde patroon
- [ ] Alle API endpoints gebruiken `apiError()` / `apiSuccess()` helpers
- [ ] Elke pagina heeft loading, empty, data én error state
- [ ] `AuditLog.svelte` fetcht niet meer zelf (data via props)

---

## Fase 4 — Accessibility (WCAG 2.1 AA)

### Prioriteit: HOOG (wettelijk verplicht voor overheidsplatform)
### Agent: Agent 2 (Frontend)

---

### 4.1 — Keyboard navigatie

| Component | Probleem | Fix |
|-----------|----------|-----|
| `Navigation.svelte` | Mobile overlay niet keyboard-dismissible, svelte-ignore op a11y | Voeg Escape handler en focus trap toe; gebruik `<button>` i.p.v. `<div>` |
| `DocumentUpload.svelte` | Drop zone handelt alleen Enter af | Voeg Space-toets support toe |
| Alle modals/slide-overs | Geen focus trap | Implementeer focus trap utility |

---

### 4.2 — ARIA attributen

| Component | Ontbreekt | Fix |
|-----------|-----------|-----|
| Navigatie mobile toggle | `aria-controls` | Toevoegen: `aria-controls="sidebar"` |
| Tab-componenten | `aria-controls` op tab buttons | Koppel aan `aria-labelledby` op panels |
| Sort/filter dropdowns | `aria-label` | Toevoegen op alle interactieve elementen |
| Modals | `role="dialog"` + `aria-modal="true"` | Toevoegen op alle overlay-componenten |

---

### 4.3 — Semantische HTML

| Locatie | Probleem | Fix |
|---------|----------|-----|
| Dashboard metrics | Geen `<section>` landmark | Wrap in `<section role="region" aria-labelledby="...">` |
| `CardGrid.svelte` | Puur `<div>` structuur | Gebruik `<section>` of `<article>` elementen |
| Decoratieve SVG's | Niet overal `aria-hidden="true"` | Controleer en toevoegen op alle icon-SVGs |

---

### 4.4 — Kleurcontrast

| Element | Probleem | Fix |
|---------|----------|-----|
| `text-gray-400` tekst | Mogelijk onder 4.5:1 ratio op wit | Upgrade naar `text-gray-500` of donkerder |
| `text-gray-500` op small text | Grensgebied | Test met WebAIM contrast checker |
| Primaire kleur `#3b6fef` op wit | Verifiëren | Test ratio, pas aan indien nodig |

---

### Acceptatiecriteria Fase 4
- [ ] Alle interactieve elementen bereikbaar via Tab
- [ ] Escape sluit alle modals/overlays
- [ ] Screen reader kan alle content navigeren
- [ ] Kleurcontrast ≥ 4.5:1 voor normale tekst, ≥ 3:1 voor grote tekst
- [ ] Geen `svelte-ignore a11y-*` directives meer

---

## Fase 5 — Productie-hygiëne

### Prioriteit: MEDIUM
### Agent: Agent 4 (DevOps) + Agent 1 (Backend)

---

### 5.1 — Logging utility

**Vervang alle `console.log` / `console.error` met gestructureerde logging:**

```typescript
// src/lib/server/logger.ts
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;

const currentLevel = LOG_LEVELS[(process.env.LOG_LEVEL as keyof typeof LOG_LEVELS) ?? 'info'];

export function logDebug(msg: string, data?: unknown) {
    if (currentLevel <= LOG_LEVELS.debug) console.log(`[DEBUG] ${msg}`, data ?? '');
}

export function logInfo(msg: string, data?: unknown) {
    if (currentLevel <= LOG_LEVELS.info) console.log(`[INFO] ${msg}`, data ?? '');
}

export function logWarn(msg: string, data?: unknown) {
    if (currentLevel <= LOG_LEVELS.warn) console.warn(`[WARN] ${msg}`, data ?? '');
}

export function logError(msg: string, data?: unknown) {
    if (currentLevel <= LOG_LEVELS.error) console.error(`[ERROR] ${msg}`, data ?? '');
}
```

**Bestanden met console statements die moeten migreren:**

| Bestand | Aantal | Type |
|---------|--------|------|
| `lib/server/ai/client.ts` | 1 | `console.log` → `logDebug` |
| `api/projects/[id]/uploads/+server.ts` | 2 | `console.log`/`warn` → `logInfo`/`logWarn` |
| `api/briefing/message/+server.ts` | 5 | `console.log`/`error` → `logDebug`/`logError` |

---

### 5.2 — Opruimen ongebruikte env vars

| Variabele | Status | Actie |
|-----------|--------|-------|
| `PUBLIC_APP_NAME` | Gedefinieerd, niet gebruikt | Verwijder of implementeer |
| `PUBLIC_APP_URL` | Gedefinieerd, niet gebruikt | Verwijder of implementeer |
| `LOG_LEVEL` | Gedefinieerd, niet gebruikt | Koppel aan logger (5.1) |
| `POSTGRES_PASSWORD` | Alleen docker-compose | Documenteer in `.env.example` |
| `DATABASE_URL` | Alleen migraties | Documenteer in `.env.example` |

---

### 5.3 — Verwijder ongebruikte SQL functie

**Bestand:** `supabase/migrations/20260212000500_planning_seed_data.sql`

De `get_upcoming_deadlines()` stored procedure is gedefinieerd maar wordt nergens aangeroepen — de logica staat al in TypeScript (`api/planning/deadlines/+server.ts`). Kies één van beide en verwijder de ander.

---

### 5.4 — Ontbrekende @types packages

```bash
npm install --save-dev @types/mammoth
```

Check of `pdf-lib` en `pdf-parse` eigen types bundelen (mogelijk al aanwezig via de packages zelf).

---

### Acceptatiecriteria Fase 5
- [ ] Geen `console.log` meer in productiecode
- [ ] Logger utility gebruikt `LOG_LEVEL` env var
- [ ] Alle env vars in `.env.example` zijn gedocumenteerd
- [ ] Geen ongebruikte SQL functies

---

## Fase 6 — Testdekking

### Prioriteit: HOOG
### Agent: Agent 4 (DevOps)

---

### 6.1 — AI module tests

**20 kernmodules zonder tests:**

| Module | Prioriteit | Testtype |
|--------|-----------|----------|
| `lib/server/ai/briefing.ts` | Hoog | Unit: mock OpenAI, test prompt building |
| `lib/server/ai/generation.ts` | Hoog | Unit: mock OpenAI, test section generation |
| `lib/server/ai/rag.ts` | Hoog | Unit: test embedding search, context building |
| `lib/server/ai/requirements.ts` | Hoog | Unit: test requirement extraction/parsing |
| `lib/server/ai/client.ts` | Medium | Unit: test rate limiting, retry logic |
| `lib/server/ai/embeddings.ts` | Medium | Unit: test embedding generation |
| `lib/server/ai/parser.ts` | Medium | Unit: test JSON/content parsing |
| `lib/server/ai/sanitizer.ts` | Medium | Unit: test HTML sanitization |
| `lib/server/ai/context.ts` | Medium | Unit: test context assembly |
| `lib/server/ai/review.ts` | Laag | Unit: test review prompt/response |
| `lib/server/ai/config.ts` | Laag | Unit: test configuration loading |
| `lib/server/ai/file-validator.ts` | Laag | Unit: test file type/size validation |
| `lib/server/ai/correspondence-prompts.ts` | Laag | Unit: test prompt templates |
| `lib/server/ai/leidraad-prompts.ts` | Laag | Unit: test prompt templates |
| `lib/server/ai/market-research.ts` | Laag | Unit: test market research prompts |
| `lib/server/api/export.ts` | Medium | Unit: test docx/pdf generation |
| `lib/server/api/guards.ts` | Hoog | Unit: test auth guards, role checks |
| `lib/server/api/validation.ts` | Medium | Unit: test all Zod schemas |
| `lib/server/db/audit.ts` | Medium | Unit: test audit log creation |
| `lib/server/db/client.ts` | Laag | Unit: test client initialization |

---

### 6.2 — Teststructuur

```
tests/
├── unit/
│   ├── ai/
│   │   ├── briefing.test.ts
│   │   ├── generation.test.ts
│   │   ├── rag.test.ts
│   │   └── ...
│   ├── api/
│   │   ├── guards.test.ts
│   │   ├── validation-planning.test.ts
│   │   └── export.test.ts
│   └── db/
│       └── audit.test.ts
└── integration/
    └── ... (bestaande tests)
```

---

### Acceptatiecriteria Fase 6
- [ ] AI modules hebben minimaal 70% testdekking
- [ ] Guards en validatie 100% getest
- [ ] Alle tests slagen in CI

---

## Fase 7 — Lange functies refactoren

### Prioriteit: MEDIUM
### Agent: Alle agents (eigen domein)

---

### 7.1 — Top 10 langste functies

| Bestand | Functie | Regels | Actie |
|---------|---------|--------|-------|
| `api/evaluations/calculate-ranking/+server.ts` | POST handler | 132 | Split in: `validateInput()`, `calculateScores()`, `updateRankings()` |
| `api/documents/[docTypeId]/generate/+server.ts` | POST handler | 95 | Split in: `gatherContext()`, `generateContent()`, `saveArtifact()` |
| `api/planning/deadlines/+server.ts` | GET handler | 95 | Split in: `fetchMilestones()`, `fetchActivities()`, `mergeDeadlines()` |
| `dashboard/+page.server.ts` | load function | ~90 | Split in: `loadMetrics()`, `loadRecentProjects()`, `loadDeadlines()` |
| `projects/[id]/+page.server.ts` | load function | 143 | Split in: `loadArtifacts()`, `loadActivities()`, `calculateMetrics()` |

**Richtlijn:** Elke functie max 30 regels. Extract hulpfuncties in hetzelfde bestand of in een aparte utility.

---

### Acceptatiecriteria Fase 7
- [ ] Geen enkele functie > 30 regels
- [ ] Hulpfuncties hebben duidelijke namen
- [ ] Geen gedragsverandering

---

## Uitvoeringsplanning

| Fase | Wat | Agent(s) | Geschatte effort |
|------|-----|----------|-----------------|
| 1 | Mega-componenten splitsen | Agent 2 | 2-3 dagen |
| 2 | Type safety | Agent 1 | 1-2 dagen |
| 3 | Consistente patronen | Agent 1 + 2 | 2-3 dagen |
| 4 | Accessibility | Agent 2 | 2-3 dagen |
| 5 | Productie-hygiëne | Agent 4 + 1 | 1 dag |
| 6 | Testdekking | Agent 4 | 3-5 dagen |
| 7 | Lange functies | Alle | 2-3 dagen |
| **Totaal** | | | **13-20 dagen** |

---

## Wat er goed is

De audit vond ook veel positiefs:

- Geen `any` types of `@ts-ignore` — strict TypeScript wordt nageleefd
- Geen TODO/FIXME of commented-out code — codebase is schoon
- Naamgeving is consistent (Engels code, Nederlands UI)
- Supabase patterns zijn uniform
- Store usage is correct (geen data-stores, alleen UI-state)
- Validatie is uitgebreid met Zod op alle endpoints
- Migraties matchen 1:1 met TypeScript types
