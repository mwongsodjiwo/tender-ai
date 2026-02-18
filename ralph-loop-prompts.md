# Ralph Loop Prompts — TenderManager v2

> Kopieer de prompt per fase en plak in je terminal.
> Fasen zonder dependencies (1, 4, 5, 13, 16) kunnen parallel draaien.

---

## Fase 1 — Multi-org basisstructuur

```
/ralph-loop:ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD, docs/agent-1-backend.md en tender2-plan.md (sectie 6 en 8). Bouw Fase 1: Multi-org basisstructuur. Voeg is_superadmin toe aan profiles (migratie 028). Maak alle migraties (028-037), TypeScript types, Zod schemas en tests zoals beschreven in tender2-plan.md sectie 18 Fase 1. Draai alle migraties en tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 30 --completion-promise "COMPLETE"
```

## Fase 2 — RLS policies & rechtenmodel

```
/ralph-loop:ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD, docs/agent-1-backend.md en tender2-plan.md (sectie 8.3, 8.5). Bouw Fase 2: RLS policies voor multi-org rechtenmodel. Maak is_superadmin() helper functie die als bypass in ALLE RLS policies zit. Superadmin ziet en schrijft alles in alle organisaties. Pas RLS aan op organizations, relationships, settings, members, projects, suppliers. Schrijf tests inclusief superadmin bypass test. Output COMPLETE wanneer alle tests slagen." --max-iterations 25 --completion-promise "COMPLETE"
```

## Fase 3 — Context-switcher UI

```
/ralph-loop:ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md, AGENTS.MD, docs/agent-2-frontend.md en tender2-plan.md (sectie 8.4). Bouw Fase 3: Context-switcher UI. Maak store organization-context.ts, componenten OrganizationSwitcher.svelte en ContextBadge.svelte. Integreer in layout, pas data-loading aan op actieve org. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 25 --completion-promise "COMPLETE"
```

## Fase 4 — CPV referentietabel + import

```
/ralph-loop:ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD, docs/agent-1-backend.md en tender2-plan.md (sectie 3.3, 6.3). Bouw Fase 4: CPV referentietabel. Maak migratie cpv_codes tabel, import script vanuit bestaand Excel-bestand, API route GET /api/cpv met filter op category_type/division/search. Schrijf tests voor import en API. Output COMPLETE wanneer alle tests slagen." --max-iterations 20 --completion-promise "COMPLETE"
```

## Fase 5 — NUTS referentietabel + postcode mapping

```
/ralph-loop:ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD, docs/agent-1-backend.md en tender2-plan.md (sectie 3.2, 6.3). Bouw Fase 5: NUTS referentietabel en postcode-NUTS mapping. Alleen NL codes. Maak migraties, seed scripts, API route GET /api/nuts, util getNutsFromPostcode. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 20 --completion-promise "COMPLETE"
```

## Fase 6 — Organization tabel uitbreiding (KVK velden)

```
/ralph-loop:ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD, docs/agent-1-backend.md en tender2-plan.md (sectie 3.1, 6.2). Bouw Fase 6: Breid organizations tabel uit met KVK velden (kvk_nummer, handelsnaam, rechtsvorm, straat, postcode, plaats, sbi_codes, nuts_codes). Update TypeScript types, Zod schemas, API routes. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 15 --completion-promise "COMPLETE"
```

## Fase 7 — KVK API integratie

```
/ralph-loop:ralph-loop "Je bent Agent 4 (AI & Integratie). Lees CLAUDE.md, AGENTS.MD, docs/agent-4-ai.md en tender2-plan.md (sectie 7). Bouw Fase 7: KVK API integratie. Maak KVK client in src/lib/server/api/kvk.ts (searchKvk, getKvkProfile), API routes /api/kvk/search en /api/kvk/[kvkNummer], auto-link util kvk-to-org.ts. Mock KVK responses in tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 25 --completion-promise "COMPLETE"
```

## Fase 8 — Leveranciers CRM (database + API)

```
/ralph-loop:ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD, docs/agent-1-backend.md en tender2-plan.md (sectie 6.3, 9). Bouw Fase 8: Leveranciers CRM database en API. Maak migraties suppliers, supplier_contacts, project_suppliers. Maak CRUD API routes voor suppliers en project-suppliers koppeling. RLS: leveranciers gescheiden per organisatie. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 30 --completion-promise "COMPLETE"
```

## Fase 9 — Leveranciers UI (lijst + drawer)

```
/ralph-loop:ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md, AGENTS.MD, docs/agent-2-frontend.md en tender2-plan.md (sectie 9). Bouw Fase 9: Leveranciers UI. Maak /suppliers route met tabel en zoekfunctie, SupplierDrawer.svelte (40% breed, 5 tabs: Overzicht, Aanbestedingen, Correspondentie, Kwalificatie, Notities), KvkSearchDialog.svelte, SupplierInProject.svelte. Voeg Leveranciers toe aan sidebar. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 30 --completion-promise "COMPLETE"
```

## Fase 10 — Binnenkomende vragen module

```
/ralph-loop:ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD, docs/agent-1-backend.md en tender2-plan.md (sectie 6.3, 11). Bouw Fase 10: Binnenkomende vragen module. Maak migratie incoming_questions tabel, API routes (CRUD + approve), UI route /projects/[id]/questions met lijst en inline beantwoorden. Automatische nummering per project. Status flow: received → approved. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 25 --completion-promise "COMPLETE"
```

## Fase 11 — Organization settings UI

```
/ralph-loop:ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md, AGENTS.MD, docs/agent-2-frontend.md en tender2-plan.md (sectie 8). Bouw Fase 11: Organization settings UI. Maak /settings route met tabs Algemeen, Retentie, Drempelwaarden, Relaties. API routes voor settings update en relationships CRUD. Alleen zichtbaar voor owner/admin. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 20 --completion-promise "COMPLETE"
```

## Fase 12 — Data governance velden

```
/ralph-loop:ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD, docs/agent-1-backend.md en tender2-plan.md (sectie 6.2, 14). Bouw Fase 12: Data governance velden. Maak migratie die data_classification, retention_until, anonymized_at, archive_status toevoegt aan correspondence, artifacts, evaluations, documents, time_entries, conversations, messages, document_comments, section_reviewers. Maak util governance.ts. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 20 --completion-promise "COMPLETE"
```

## Fase 13 — docxtemplater integratie

```
/ralph-loop:ralph-loop "Je bent Agent 3 (Editor & Documents). Lees CLAUDE.md, AGENTS.MD, docs/agent-3-editor.md en tender2-plan.md (sectie 12). Bouw Fase 13: docxtemplater integratie. Installeer docxtemplater en pizzip. Maak renderer.ts, data-collector.ts, placeholder-registry.ts in src/lib/server/templates/. Maak export API route. Test met simpel test-template. Output COMPLETE wanneer alle tests slagen." --max-iterations 25 --completion-promise "COMPLETE"
```

## Fase 14 — Template storage + upload UI

```
/ralph-loop:ralph-loop "Je bent Agent 3 (Editor & Documents). Lees CLAUDE.md, AGENTS.MD, docs/agent-3-editor.md en tender2-plan.md (sectie 3.4, 6.3). Bouw Fase 14: Template storage en upload. Maak migratie document_templates tabel, Supabase Storage bucket, API routes (upload/list/download/delete), settings/templates UI pagina. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 25 --completion-promise "COMPLETE"
```

## Fase 15 — Editor refactoring

```
/ralph-loop:ralph-loop "Je bent Agent 3 (Editor & Documents). Lees CLAUDE.md, AGENTS.MD, docs/agent-3-editor.md en tender2-plan.md (sectie 13). Bouw Fase 15: Editor refactoring. Vervang StepperSidebar door PageThumbnails.svelte. Refactor document editor naar doorlopend document. Voeg document-level status toe. Voeg font-family en font-size controls toe aan EditorToolbar via TipTap extensies. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 30 --completion-promise "COMPLETE"
```

## Fase 16 — Markdown → HTML transformatie

```
/ralph-loop:ralph-loop "Je bent Agent 4 (AI & Integratie). Lees CLAUDE.md, AGENTS.MD, docs/agent-4-ai.md en tender2-plan.md (sectie 13.3). Bouw Fase 16: Markdown naar TipTap HTML transformatie. Installeer unified, remark-parse, remark-rehype, rehype-stringify. Maak src/lib/utils/markdown-to-tiptap.ts. Integreer in artifact opslag. Test bullets, headers, bold/italic, geneste lijsten, lege input. Output COMPLETE wanneer alle tests slagen." --max-iterations 15 --completion-promise "COMPLETE"
```

## Fase 17 — Correspondentie → documenten

```
/ralph-loop:ralph-loop "Je bent Agent 3 (Editor & Documents). Lees CLAUDE.md, AGENTS.MD, docs/agent-3-editor.md en tender2-plan.md (sectie 10, 13). Bouw Fase 17: Merge correspondentie in documentensysteem. Maak document_types voor alle 11 brieftypes. Migreer bestaande correspondence data naar artifacts. Maak brief-specifieke placeholder sets. Redirect oude correspondence routes. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 30 --completion-promise "COMPLETE"
```

## Fase 18 — Document template mapping

```
/ralph-loop:ralph-loop "Je bent Agent 3 (Editor & Documents). Lees CLAUDE.md, AGENTS.MD, docs/agent-3-editor.md en tender2-plan.md (sectie 3.4, 12). Bouw Fase 18: Document template mapping. Maak template-selector.ts met selectTemplate logica (org + type + categorie, fallbacks). Integreer in export flow. Maak UI voor template-keuze bij document aanmaken. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 15 --completion-promise "COMPLETE"
```

## Fase 19 — Document rollen

```
/ralph-loop:ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD, docs/agent-1-backend.md en tender2-plan.md (sectie 6.3). Bouw Fase 19: Document rollen. Maak migratie project_document_roles tabel. Maak API routes GET/POST/PATCH. Maak UI sectie in projectprofiel met formulier per rol (contactpersoon, inkoper, projectleider, budgethouder, juridisch_adviseur). Integreer in template data collector. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 15 --completion-promise "COMPLETE"
```

## Fase 20 — Procedure advies logica

```
/ralph-loop:ralph-loop "Je bent Agent 1 (Data & Backend). Lees CLAUDE.md, AGENTS.MD, docs/agent-1-backend.md en tender2-plan.md (sectie 17). Bouw Fase 20: Procedure advies. Maak util procedure-advice.ts met getProcedureAdvice (drempelbedragen diensten centraal/decentraal, werken, sociaal). Maak ProcedureAdvisor.svelte component met waarschuwing bij afwijking en verplicht onderbouwingsveld. Integreer in projectprofiel. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 15 --completion-promise "COMPLETE"
```

## Fase 21 — Selectielijst profielen

```
/ralph-loop:ralph-loop "Je bent Agent 5 (Platform & Governance). Lees CLAUDE.md, AGENTS.MD, docs/agent-5-platform.md en tender2-plan.md (sectie 14.4). Bouw Fase 21: Selectielijst profielen. Maak API route GET /api/retention-profiles. Maak RetentionProfileSelector.svelte met dropdown (VNG 2020, PROVISA), auto-fill termijnen, mogelijkheid om te overschrijven. Integreer in settings tab Retentie. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 10 --completion-promise "COMPLETE"
```

## Fase 22 — Retentie signalering (cron job)

```
/ralph-loop:ralph-loop "Je bent Agent 5 (Platform & Governance). Lees CLAUDE.md, AGENTS.MD, docs/agent-5-platform.md en tender2-plan.md (sectie 14). Bouw Fase 22: Retentie signalering. Maak cron/retention-check.ts, database functies archive_project() en anonymize_records() (replace en remove strategie). Maak admin UI met lijst verlopen records en acties (anonimiseren/verlengen/vernietigen). Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 25 --completion-promise "COMPLETE"
```

## Fase 23 — Email-parsing binnenkomende vragen

```
/ralph-loop:ralph-loop "Je bent Agent 4 (AI & Integratie). Lees CLAUDE.md, AGENTS.MD, docs/agent-4-ai.md en tender2-plan.md (sectie 11). Bouw Fase 23: Email-parsing voor binnenkomende vragen. Maak src/lib/server/email/parser.ts (parseQuestionEmail). Maak API route POST /api/projects/[projectId]/questions/import. Maak import dialoog UI. Herken afzender als leverancier, extraheer document referentie. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 20 --completion-promise "COMPLETE"
```

## Fase 24 — Superadmin analytics

```
/ralph-loop:ralph-loop "Je bent Agent 5 (Platform & Governance). Lees CLAUDE.md, AGENTS.MD, docs/agent-5-platform.md en tender2-plan.md. Bouw Fase 24: Superadmin analytics. Voeg is_superadmin toe aan profiles. Maak /admin route met overzicht (organisaties, projecten, gebruikers, documenten), trends, feature usage. Alleen aggregaties, geen PII. Bescherm met is_superadmin check. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 20 --completion-promise "COMPLETE"
```

## Fase 25 — Dashboard

```
/ralph-loop:ralph-loop "Je bent Agent 2 (Frontend & UI). Lees CLAUDE.md, AGENTS.MD, docs/agent-2-frontend.md en tender2-plan.md. Bouw Fase 25: Dashboard. Inventariseer alle datapoints uit eerdere fasen. Verwijder oude dashboard content (behalve phasebar). Maak KPI cards, projecten overzicht, recente activiteit, deadlines, open actiepunten. Aggregatie queries per org context. Schrijf tests. Output COMPLETE wanneer alle tests slagen." --max-iterations 25 --completion-promise "COMPLETE"
```

## Fase 26 — End-to-end testing & validatie

```
/ralph-loop:ralph-loop "Je bent Agent 6 (Testing & DevOps). Lees CLAUDE.md, AGENTS.MD, docs/agent-6-devops.md en tender2-plan.md (sectie 16). Bouw Fase 26: Volledige E2E tests en kwaliteitsvalidatie. Schrijf E2E tests voor alle kritieke flows (org aanmaken, context switch, project met CPV/NUTS, leverancier via KVK, document genereren, NvI). Draai alle unit/integratie/RLS/E2E tests. Kwaliteitscheck: geen bestand >200 regels, geen functie >30 regels, geen console.log, geen any/@ts-ignore, RLS op alle tabellen, Zod op alle routes. Fix alle failures. Output COMPLETE wanneer alles slaagt." --max-iterations 40 --completion-promise "COMPLETE"
```

---

## Aanbevolen volgorde

```
Ronde 1 (parallel, geen dependencies):
  Terminal 1: Fase 1  — Multi-org basis
  Terminal 2: Fase 4  — CPV referentietabel
  Terminal 3: Fase 5  — NUTS referentietabel
  Terminal 4: Fase 13 — docxtemplater
  Terminal 5: Fase 16 — Markdown → HTML

Ronde 2 (na Fase 1):
  Terminal 1: Fase 2  — RLS policies
  Terminal 2: Fase 6  — Organization KVK velden
  Terminal 3: Fase 12 — Data governance velden

Ronde 3 (na Fase 2 + 6):
  Terminal 1: Fase 3  — Context-switcher UI
  Terminal 2: Fase 7  — KVK API integratie
  Terminal 3: Fase 8  — Leveranciers CRM database
  Terminal 4: Fase 11 — Organization settings UI

Ronde 4 (na Fase 8 + 13):
  Terminal 1: Fase 9  — Leveranciers UI
  Terminal 2: Fase 10 — Binnenkomende vragen
  Terminal 3: Fase 14 — Template storage + upload
  Terminal 4: Fase 15 — Editor refactoring

Ronde 5 (na Fase 14 + 15):
  Terminal 1: Fase 17 — Correspondentie → documenten
  Terminal 2: Fase 19 — Document rollen
  Terminal 3: Fase 20 — Procedure advies
  Terminal 4: Fase 21 — Selectielijst profielen

Ronde 6 (na Fase 17):
  Terminal 1: Fase 18 — Document template mapping
  Terminal 2: Fase 22 — Retentie signalering
  Terminal 3: Fase 23 — Email-parsing

Ronde 7 (na alles):
  Terminal 1: Fase 24 — Superadmin analytics
  Terminal 2: Fase 25 — Dashboard

Ronde 8 (finale):
  Terminal 1: Fase 26 — End-to-end testing
```
