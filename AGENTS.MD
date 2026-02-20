# Agents — Ontwikkelinstructies TenderManager

Dit document beschrijft de zes ontwikkelagents, hun verantwoordelijkheden, en de uitvoeringsvolgorde.

Agents werken continu. Een fase is een logische eenheid: een verzameling samenhangende deliverables. Een fase is pas afgerond wanneer alle stappen geaccepteerd zijn en tests slagen.

## De zes agents

| Agent | Naam | Verantwoordelijkheid |
|-------|------|---------------------|
| Agent 1 | Data & Backend | Supabase schema's, migraties, RLS policies, API routes, validatie, TypeScript types |
| Agent 2 | Frontend & UI | SvelteKit pages, componenten, stores, navigatie, Tailwind styling |
| Agent 3 | Editor & Documents | TipTap editor, docxtemplater, template-loader, export engine |
| Agent 4 | AI & Integratie | LLM, KVK API client, email-parsing, markdown→HTML conversie, RAG |
| Agent 5 | Platform & Governance | Multi-org admin, retentie cron jobs, anonimisatie, selectielijsten, analytics |
| Agent 6 | Testing & DevOps | Test suites, CI/CD, quality checks, deployment, config, documentatie |

## Territoriumkaart — Wie bezit welke mappen

```
tendermanager/
├── docs/                          → Agent 6
├── contracts/                     → Agent 6
├── supabase/
│   ├── migrations/                → Agent 1
│   ├── functions/                 → Agent 1
│   └── seed.sql                   → Agent 1
├── scripts/                       → Agent 6
│   ├── import-cpv-codes.ts        → Agent 1 (data)
│   ├── seed-nuts-codes.ts         → Agent 1 (data)
│   └── quality-check.sh           → Agent 6
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/                → Agent 1
│   │   │   ├── api/               → Agent 1
│   │   │   ├── ai/                → Agent 4
│   │   │   ├── templates/         → Agent 3
│   │   │   ├── email/             → Agent 4
│   │   │   └── cron/              → Agent 5
│   │   ├── components/
│   │   │   ├── editor/            → Agent 3
│   │   │   ├── suppliers/         → Agent 2
│   │   │   ├── team/              → Agent 2
│   │   │   └── (overige)          → Agent 2
│   │   ├── stores/                → Agent 2
│   │   ├── utils/
│   │   │   ├── markdown-to-tiptap.ts → Agent 4
│   │   │   ├── governance.ts      → Agent 5
│   │   │   ├── procedure-advice.ts → Agent 1
│   │   │   ├── procurement-timeline.ts → Agent 1
│   │   │   └── (overige)          → Agent 2
│   │   ├── types/                 → Agent 1 (maakt aan), alle agents (gebruiken)
│   │   └── schemas/               → Agent 1 (Zod)
│   └── routes/
│       ├── (app)/
│       │   ├── admin/             → Agent 5
│       │   ├── settings/          → Agent 2 + Agent 5
│       │   └── (overige)          → Agent 2
│       └── api/                   → Agent 1
├── harvester/                     → Agent 1
├── tests/
│   ├── integration/               → Agent 6
│   ├── rls/                       → Agent 1 + Agent 6
│   ├── e2e/                       → Agent 6
│   └── unit/                      → Alle agents (eigen code)
├── .github/workflows/             → Agent 6
├── docker-compose.yml             → Agent 6
├── svelte.config.js               → Agent 6
├── tailwind.config.js             → Agent 2
└── package.json                   → Agent 6
```

## Uitvoeringsvolgorde

### Afgeronde sprints (v1)

> De volgende sprints zijn afgerond en vormen de basis waarop v2 verder bouwt.

**Sprint 0 — Fundament** ✅
Werkende repo, database schema, auth, basis layout, chat.

**Sprint 1 — Briefing** ✅
Projectaanmaak via AI-begeleide briefing, artifacts per sectie.

**Sprint 2 — Documentgeneratie** ✅
Documentgeneratie, versioning, export (Word/PDF), project workspace.

**Sprint 3 — Samenwerking & review** ✅
Projectrollen, kennishouder review (magic links), audit log.

**Sprint 4 — Data & context** ✅
Document upload, TenderNed harvester, RAG pipeline, kennisbank.

**Sprint 5 — Polish & deploy** ✅
Instellingen, responsive design, prompt optimalisatie, deployment.

---

### Nieuwe fasen (v2)

> Fasen 1-26 zijn de originele v2 fasen. Fasen 27-38 staan in `docs/team-en-projectprofiel-refactor.md`.

| Fase | Wat | Agent(s) | Afhankelijk van |
|------|-----|----------|----------------|
| 1 | Multi-org basisstructuur | 1 | — |
| 2 | RLS policies & rechtenmodel | 1 | Fase 1 |
| 3 | Context-switcher UI | 2 | Fase 1, 2 |
| 4 | CPV referentietabel + import | 1 | — |
| 5 | NUTS referentietabel + postcode mapping | 1 | — |
| 6 | Organization tabel uitbreiding (KVK velden) | 1 | Fase 1 |
| 7 | KVK API integratie | 1, 4 | Fase 6 |
| 8 | Leveranciers CRM (database + API) | 1 | Fase 1, 6 |
| 9 | Leveranciers UI (lijst + drawer) | 2 | Fase 8 |
| 10 | Binnenkomende vragen module | 1, 2 | Fase 8 |
| 11 | Organization settings UI | 2, 5 | Fase 1 |
| 12 | Data governance velden | 1 | Fase 1 |
| 13 | docxtemplater integratie | 3 | — |
| 14 | Template storage + upload UI | 1, 2, 3 | Fase 13 |
| 15 | Editor refactoring | 3 | Fase 13 |
| 16 | Markdown → HTML transformatie | 4 | — |
| 17 | Correspondentie → documenten | 1, 2, 3 | Fase 13, 15 |
| 18 | Document template mapping | 1, 3 | Fase 4, 14 |
| 19 | Document rollen | 1, 2 | Fase 6 |
| 20 | Procedure advies logica | 1, 2 | Fase 11 |
| 21 | Selectielijst profielen | 5 | Fase 12 |
| 22 | Retentie signalering (cron job) | 5 | Fase 12, 21 |
| 23 | Email-parsing binnenkomende vragen | 4 | Fase 10 |
| 24 | Superadmin analytics | 5 | Fase 1-22 |
| 25 | Dashboard | 2 | Alles |
| 26 | Testing & validatie (end-to-end) | 6 | Alles |
| 27 | Team: database uitbreiding (status, manager_id) | 1 | — |
| 28 | Team: API uitbreidingen (search, filter, status) | 1 | Fase 27 |
| 29 | Team: UI redesign (tabel, zoekbalk, tabs, drawer) | 2 | Fase 27, 28 |
| 30 | Documentrollen koppeling aan teamleden | 1 | Fase 27 |
| 31 | Documentrollen UI in drawer | 2 | Fase 29, 30 |
| 32 | Projectprofiel: tab Organisatie (read-only) | 2 | — |
| 33 | Projectprofiel: opslaan vs. bevestigen | 1, 2 | — |
| 34 | Planning: termijnberekening logica | 1 | Fase 20 |
| 35 | Planning: UI sleutelmomenten met cascade | 2 | Fase 34 |
| 36 | Projectprofiel: sidebar samenvatting | 2 | Fase 34, 35 |
| 37 | Opschonen: oude velden en tabs verwijderen | 1, 2 | Fase 29, 31, 32, 35 |
| 38 | Tests & validatie | 6 | Alles |

---

## Regels

1. **Lees altijd eerst `CLAUDE.md`, `PRODUCT.md` en het relevante implementatieplan** voordat je begint met bouwen.
2. **Werk alleen in je eigen mappen.** Zie de territoriumkaart. Als je iets nodig hebt uit andermans territorium, maak een contract aan in `contracts/`.
3. **Types zijn het contract.** Agent 1 maakt types in `src/lib/types/`. Alle agents gebruiken exact deze types. Nooit eigen types bedenken.
4. **API-contracten zijn bindend.** Agent 1 documenteert endpoints in `contracts/api.md` met request/response shapes. Andere agents bouwen hier tegenaan.
5. **Wacht op dependencies.** Start niet met bouwen als je afhankelijk bent van een fase die nog niet af is. Dependencies staan bij elke fase beschreven.
6. **Elke agent schrijft unit tests voor eigen code.** Agent 6 schrijft integratie- en e2e-tests.
7. **Geen hardcoded waarden.** Alle configuratie via environment variables. Alle teksten via templates of database.
8. **Audit alles.** Elke state-wijziging (create, update, delete) — menselijk én AI — wordt gelogd in audit_log.
9. **Een fase is pas klaar wanneer alle tests slagen.** Niet eerder, niet later.
10. **Naamgeving is Engels, content is Nederlands.** Alle variabelen, functies, componenten, bestanden in het Engels. Alle UI-teksten Nederlands. Comments Engels.
11. **Kleine functies.** Maximaal 30 regels per functie. Doet een functie meer dan één ding, splits het op.
12. **Geen magic values.** Alle constanten krijgen een naam. Geen losse strings of getallen.
13. **TypeScript strict mode.** Geen `any`. Geen `@ts-ignore`. Elk type is expliciet.
14. **Error handling overal.** Elke API call, database query, async operatie heeft error handling.
15. **Componenten zijn dom.** UI-componenten ontvangen data via props, geen eigen data-fetching.
16. **Eén bestand, één verantwoordelijkheid.** Max 200 regels. Heroverweeg structuur als dat overschreden wordt. **Testbestanden (`.test.ts`) zijn uitgezonderd en mogen langer zijn.**
17. **Geen console.log in productie.** Gebruik een logger utility.
18. **Commits zijn atomair.** Eén commit doet één ding.
19. **Accessibility WCAG 2.1 AA.** Semantic HTML, aria-labels, keyboard navigatie. Wettelijk verplicht.
20. **Input validatie op beide lagen.** Zod schemas in frontend én backend.
21. **Database naamgeving is snake_case.** Elke tabel heeft id (uuid), created_at, updated_at.
22. **Elke pagina heeft vier states.** Loading, empty, data, en error.
23. **Bestandsgrootte bewaken na elke wijziging.** Max 200 regels, anders splitsen. Testbestanden uitgezonderd.
24. **Elke nieuwe module krijgt direct een testbestand.** Happy path + één error case minimum.
25. **Kwaliteitscheck bij afsluiting.** (a) functies ≤ 30 regels, (b) bestanden ≤ 200 regels (testbestanden uitgezonderd), (c) geen console.log, (d) tests aanwezig.

## Technische stack

| Component | Technologie |
|-----------|-------------|
| Frontend | SvelteKit (classic syntax) + TailwindCSS |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Editor | TipTap met extensies |
| Templates | docxtemplater (JS) |
| Hosting | Railway |
| AI | OpenAI GPT-4o |
| Embeddings | pgvector in Supabase |
| Export | docxtemplater (Word), server-side (PDF) |
| Extern | KVK Zoeken API + Basisprofiel API |
| TenderNed | Eigen harvester → Supabase (knowledge_base schema) |
| Repo | Monorepo (geen workspaces) |

## Projectfases (gebruiker)

| Fase | Naam | Beschrijving |
|------|------|-------------|
| 1 | Voorbereiden | Briefing, projectprofiel opstellen en bevestigen |
| 2 | Marktverkennen | Deskresearch, RFI, consultatie, rapport |
| 3 | Specificeren | PvE, Aanbestedingsleidraad, EMVI, UEA, Conceptovereenkomst |
| 4 | Aanbesteden | Publicatie, NvI, beoordeling, gunning, afwijzingsbrieven |
| 5 | Contracteren | Definitieve overeenkomst, ondertekening |

Het bevestigde projectprofiel (fase 1) is de single source of truth voor alle AI-acties.
