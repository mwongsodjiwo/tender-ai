# Drawer Historie Fix — fasen 72-74

## Probleemanalyse

De historie-sectie in de DocumentDrawer is onzichtbaar omdat de `history`-array altijd leeg is. Er zijn drie oorzaken:

1. **FK join faalt stil** — `actor:profiles(full_name)` in de Supabase query kan falen als PostgREST de FK niet automatisch kan resolven (meerdere FK's naar `profiles` in `audit_log`). De try/catch vangt dit op, maar het resultaat is een lege array.
2. **`buildAuditMap` is te streng** — het matcht audit `entity_id` (artifact UUID) naar `document_type_id` via een reverse-lookup. Als de `entity_id` niet precies een artifact UUID is (bijv. het is een project-id of ontbreekt), wordt het entry geskipt.
3. **Drawer verbergt lege historie** — `{#if document.history.length > 0}` verbergt het blok volledig als er geen entries zijn, terwijl de gebruiker wél wil zien dat er geen historie is.

## Betrokken bestanden

| Bestand | Agent | Wijziging |
|---------|-------|-----------|
| `src/routes/(app)/projects/[id]/documents/+page.server.ts` | Agent 1 | Audit query fixen, mapping robuuster |
| `src/lib/components/documents/DocumentDrawer.svelte` | Agent 2 | Historie altijd tonen |
| `src/lib/components/documents/DocumentHistory.svelte` | Agent 2 | Lege-state toevoegen |

---

## Fase 72 — Audit query + mapping fixen (Agent 1)

**Probleem:** De Supabase query `actor:profiles(full_name)` faalt mogelijk omdat `audit_log` een FK `actor_id → profiles(id)` heeft en PostgREST de relatie niet eenduidig kan resolven. Daarnaast filtert `buildAuditMap` te streng: het vereist dat `entity_id` exact een artifact UUID is.

**Oplossing:**
1. Gebruik expliciete FK-naam: `actor:profiles!actor_id(full_name)` (PostgREST kolom-syntax)
2. Als backup: splits de query in twee stappen — eerst audit_log zónder join, dan een aparte profiles-lookup op de unieke `actor_id`s
3. Verbreed het `entity_type` filter: haal ALLE audit entries voor het project op (zonder `.in('entity_type', ...)` filter), zodat ook `generate`, `export` etc. verschijnen
4. Pas `buildAuditMap` aan: als `entity_id` niet matcht op een artifact UUID, probeer een directe match op `document_type_id` (voor entries die een document_type als entity hebben). Als dat ook niet matcht, groepeer onder een project-brede "algemeen" categorie die aan alle documenten wordt meegegeven.

**Acceptatiecriteria:**
- Audit query retourneert daadwerkelijk data (niet leeg)
- `actor.full_name` is gevuld (fallback naar `actor_email`)
- `history` array in ProductBlock bevat minstens 1 entry als er audit entries bestaan voor het project

```
/ralph-loop "Je bent Agent 1 (Data & Backend) in het TenderManager SvelteKit project. Fix de audit_log query en mapping in src/routes/(app)/projects/[id]/documents/+page.server.ts. STAP 1: Verander de Supabase audit query (regel ~152) — verwijder het .in('entity_type') filter zodat alle project audit entries worden opgehaald, en gebruik 'actor:profiles!actor_id(full_name)' als FK join syntax. Als dat niet compileert, doe dan twee losse queries: eerst audit_log ZONDER join, dan een aparte profiles query op de unieke actor_ids, en merge de full_name erin. STAP 2: Pas buildAuditMap aan — maak een reverse-map van artifact_id naar document_type_id. Loop door alle audit entries: als entity_id matcht op een artifact, groepeer onder dat document_type_id. Als entity_id NIET matcht, voeg de entry toe aan ALLE document types (het is een project-brede actie). STAP 3: Zorg dat history altijd minstens de laatste 10 entries bevat per document type. actor_name moet full_name bevatten met fallback naar actor_email. STAP 4: Draai npx svelte-check --threshold error en fix eventuele fouten. Alle bestanden moeten onder 200 regels blijven. Gebruik Svelte classic syntax (export let, $:). TypeScript strict, geen any." --completion-promise "COMPLETE" --max-iterations 15
```

---

## Fase 73 — Drawer historie altijd tonen (Agent 2)

**Probleem:** De drawer verbergt de hele historie-sectie als `document.history` leeg is. De gebruiker wil het vak altijd zien.

**Oplossing:**
1. In `DocumentDrawer.svelte`: verwijder de `{#if document.history && document.history.length > 0}` conditie — toon `<DocumentHistory>` altijd
2. In `DocumentHistory.svelte`: voeg een lege-state toe — als `entries` leeg is, toon "Geen historie beschikbaar"

**Acceptatiecriteria:**
- Historie-sectie is ALTIJD zichtbaar in de drawer, ook als er geen entries zijn
- Bij geen entries staat er "Geen historie beschikbaar" in grijze tekst
- Bij wel entries wordt de bestaande timeline getoond

```
/ralph-loop "Je bent Agent 2 (Frontend & UI) in het TenderManager SvelteKit project. Pas twee bestanden aan zodat de historie-sectie in de document drawer ALTIJD zichtbaar is. STAP 1: Open src/lib/components/documents/DocumentDrawer.svelte. Zoek de regel '{#if document.history && document.history.length > 0}' (rond regel 152) en vervang die door alleen '<DocumentHistory entries={document.history ?? []} />' ZONDER if-conditie. Verwijder ook het bijbehorende '{/if}'. STAP 2: Open src/lib/components/documents/DocumentHistory.svelte. Voeg een lege-state toe: als entries.length === 0, toon '<p class=\"mt-2 text-sm text-gray-400\">Geen historie beschikbaar</p>' in plaats van de each-loop. Gebruik een {#if entries.length > 0} {:else} {/if} structuur. STAP 3: Draai npx svelte-check --threshold error. Alle bestanden moeten onder 200 regels blijven. Gebruik Svelte classic syntax (export let, $:)." --completion-promise "COMPLETE" --max-iterations 8
```

---

## Fase 74 — Verificatie (Agent 6)

**Acceptatiecriteria:**
- `npx svelte-check --threshold error` → 0 errors
- `npx vitest run tests/unit/document-status.test.ts` → alle tests slagen
- Geen `console.log` in gewijzigde bestanden
- Alle bestanden ≤ 200 regels
- Geen `: any` types

```
/ralph-loop "Je bent Agent 6 (Testing & DevOps) in het TenderManager SvelteKit project. Voer een kwaliteitscheck uit op de drawer historie fix. STAP 1: Draai npx svelte-check --threshold error en rapporteer het resultaat. STAP 2: Draai npx vitest run tests/unit/document-status.test.ts. STAP 3: Controleer bestandsgroottes met wc -l op: src/routes/(app)/projects/[id]/documents/+page.server.ts, src/lib/components/documents/DocumentDrawer.svelte, src/lib/components/documents/DocumentHistory.svelte, src/lib/components/documents/build-rows.ts, src/lib/components/documents/types.ts — allemaal moeten onder 200 regels zijn. STAP 4: Controleer op console.log en : any in dezelfde bestanden. STAP 5: Als er fouten zijn, fix ze. Rapporteer het eindresultaat." --completion-promise "COMPLETE" --max-iterations 10
```

---

## Uitvoeringsvolgorde

| Terminal | Fase | Afhankelijkheid |
|----------|------|-----------------|
| T1 | 72 (audit query fix) | — |
| T2 | 73 (drawer altijd tonen) | — |
| T3 | 74 (verificatie) | Wacht op T1 + T2 |

T1 en T2 kunnen parallel.
