# Agents — Ontwikkelinstructies Tendermanager

Dit document beschrijft de vier ontwikkelagents, hun verantwoordelijkheden, en de exacte volgorde van uitvoering.

Agents werken continu. Een sprint is geen tijdsperiode maar een logische fase: een verzameling samenhangende deliverables. Een sprint is pas afgerond wanneer alle stappen geaccepteerd zijn. De volgende sprint start zodra de vorige compleet is.

## De vier agents

| Agent | Naam | Verantwoordelijkheid |
|-------|------|---------------------|
| Agent 1 | Backend | Supabase schema's, RLS policies, Edge Functions, API endpoints |
| Agent 2 | Frontend | SvelteKit pages, componenten, routing, UI/UX |
| Agent 3 | AI | LLM-integratie, prompt engineering, RAG pipeline, embeddings |
| Agent 4 | DevOps & QA | Mappenstructuur, CI/CD, testen, kwaliteitsbewaking, deployment |

## Territoriumkaart — Wie bezit welke mappen
```
tendermanager/
├── docs/                        → Agent 4
├── supabase/
│   ├── migrations/              → Agent 1
│   ├── functions/               → Agent 1
│   └── seed.sql                 → Agent 1
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/              → Agent 1
│   │   │   ├── api/             → Agent 1
│   │   │   └── ai/             → Agent 3
│   │   ├── components/          → Agent 2
│   │   ├── stores/              → Agent 2
│   │   ├── utils/               → Agent 2
│   │   └── types/               → Agent 1 (maakt aan), Agent 2+3 (gebruiken)
│   └── routes/                  → Agent 2
├── harvester/                   → Agent 1
├── scripts/                     → Agent 4
├── tests/                       → Agent 4 (integratietests), alle agents (unit tests eigen code)
├── .github/workflows/           → Agent 4
├── docker-compose.yml           → Agent 4
├── svelte.config.js             → Agent 4
├── tailwind.config.js           → Agent 2
└── package.json                 → Agent 4
```

## Uitvoeringsvolgorde

---

### Sprint 0 — Fundament

Doel: een werkende repo met database, types, auth, en eerste pagina. Na deze sprint kan elke agent zelfstandig verder bouwen.

**Stap 1 · Agent 4** — Maak de complete mappenstructuur aan, inclusief alle config-bestanden (package.json, svelte.config.js, docker-compose.yml, tsconfig.json, .env.example). Initialiseer git repo.

**Stap 2 · Agent 4** — Maak `contracts/structure.md` aan: dit document beschrijft welke agent welke mappen bezit en welke interfaces ze delen.

**Stap 3 · Agent 1** — Maak het volledige Supabase database schema aan: alle tabellen (organizations, profiles, organization_members, projects, project_members, project_member_roles, artifacts, conversations, messages, documents, tenderned_items, document_types, section_reviewers, audit_log), RLS policies, en seed data.

**Stap 4 · Agent 1** — Maak TypeScript types aan in `src/lib/types/` die exact overeenkomen met het database schema. Deze types worden door alle agents gebruikt.

**Stap 5 · Agent 1** — Maak de eerste API endpoints: auth, organizations CRUD, profiles CRUD. Publiceer endpoint-contracten in `contracts/api.md`.

> ⛔ **AGENT 2 EN 3 WACHTEN OP STAP 4 EN 5** — Types en eerste endpoints moeten beschikbaar zijn.

**Stap 6 · Agent 2** — Maak de SvelteKit layout aan: root layout met navigatie, auth-pagina's (login/register), en de basis dashboard-pagina.

**Stap 7 · Agent 3** — Configureer LLM-verbinding, maak de basis chat-functie (vraag → antwoord), en sla gesprekken op via de conversations/messages endpoints.

**Stap 8 · Agent 4** — Schrijf eerste integratietests: database connectie, auth flow, basis API health check. Configureer CI pipeline.

✅ **Sprint 0 is klaar wanneer:** repo draait lokaal, database is gevuld, auth werkt, dashboard laadt, en de basis chat een antwoord geeft.

---

### Sprint 1 — Briefing

Doel: een gebruiker kan een nieuw project aanmaken via een AI-begeleide briefing.

**Stap 9 · Agent 1** — Projects CRUD endpoints, project_members endpoints, artifacts endpoints.

**Stap 10 · Agent 3** — Briefing-agent: de AI die vragen stelt om een project te initiëren. Leest document_types voor template-structuur. Genereert artifacts per sectie.

**Stap 11 · Agent 2** — Briefing UI: chatinterface waar gebruiker vragen beantwoordt. Projectaanmaak-flow. Dashboard met projectoverzicht.

**Stap 12 · Agent 4** — Tests voor briefing flow. Valideer dat artifacts correct worden opgeslagen.

✅ **Sprint 1 is klaar wanneer:** een gebruiker via chat een project kan aanmaken en de AI concept-artifacts genereert die in de database staan.

---

### Sprint 2 — Documentgeneratie

Doel: de AI genereert volledige documenten op basis van de briefing, en gebruikers kunnen deze inzien en bewerken.

**Stap 13 · Agent 1** — Document-endpoints: assemblage van artifacts tot compleet document. Versioning endpoints voor artifacts.

**Stap 14 · Agent 1** — Document export: artifacts samenvoegen tot Word (docx) en PDF. Template-engine met vaste structuur.

**Stap 15 · Agent 3** — Documentgeneratie-agent: genereert inhoud per sectie op basis van briefing-resultaten. Gebruikt templates uit document_types als structuur.

**Stap 16 · Agent 3** — Context-agent: doorzoekt geüploade documenten en TenderNed-data via embeddings om relevante informatie te vinden voor secties.

**Stap 17 · Agent 2** — Project workspace UI: 3-niveau structuur (overzicht → document → sectie). Sectie-editor met AI-chat sidebar. Versiegeschiedenis viewer.

**Stap 18 · Agent 4** — Tests voor documentgeneratie. Valideer template-output, export-kwaliteit.

✅ **Sprint 2 is klaar wanneer:** een compleet aanbestedingsdocument gegenereerd, per sectie bewerkt, en als Word/PDF geëxporteerd kan worden.

---

### Sprint 3 — Samenwerking & review

Doel: meerdere teamleden werken samen aan documenten, kennishouders reviewen secties.

**Stap 19 · Agent 1** — Project member roles endpoints (meerdere rollen per persoon). Section reviewers endpoints. Magic link auth voor kennishouders.

**Stap 20 · Agent 1** — Audit log: middleware die elke actie vastlegt. Query-endpoints voor audit trail.

**Stap 21 · Agent 2** — Rolbeheer UI: teamleden toevoegen, rollen toewijzen, RoleSwitcher component. Kennishouder-uitnodiging interface.

**Stap 22 · Agent 2** — Kennishouder review-pagina: minimale interface, sectie lezen, chat met AI, goedkeuren/afwijzen met feedback.

**Stap 23 · Agent 3** — Review-agent: beantwoordt vragen van kennishouders over specifieke secties. Verwerkt feedback in artifact-updates.

**Stap 24 · Agent 4** — Tests voor samenwerking. Valideer RLS policies per rol. Test magic link flow.

✅ **Sprint 3 is klaar wanneer:** een projectleider teamleden met rollen kan toevoegen, een kennishouder via magic link een sectie kan reviewen met AI-chat, en alle acties in de audit log staan.

---

### Sprint 4 — Data & context

Doel: documenten uploaden als context, TenderNed-data doorzoekbaar, kennisbank gevuld.

**Stap 25 · Agent 1** — Upload endpoints: documenten uploaden naar Supabase Storage, metadata opslaan in documents tabel.

**Stap 26 · Agent 1** — TenderNed harvester: data ophalen, parsen, opslaan in tenderned_items. Embedding-pipeline voor zoekbaar maken.

**Stap 27 · Agent 3** — RAG pipeline: embeddings genereren voor uploads en TenderNed data. Zoekfunctie die relevante fragmenten vindt.

**Stap 28 · Agent 2** — Upload UI in project workspace. TenderNed zoekinterface. Kennisbank pagina.

**Stap 29 · Agent 4** — Tests voor uploads en TenderNed integratie. Performance tests voor embedding queries.

✅ **Sprint 4 is klaar wanneer:** een gebruiker een document kan uploaden, de AI het als context gebruikt bij generatie, en TenderNed-data doorzoekbaar is vanuit de kennisbank.

---

### Sprint 5 — Polish & deploy

Doel: productie-klaar. Alles werkt, alles is getest, alles draait op Railway.

**Stap 30 · Agent 2** — Instellingen pagina: organisatiebeheer, profielbeheer, notificatie-voorkeuren.

**Stap 31 · Agent 2** — Responsive design check, error states, loading states, lege states.

**Stap 32 · Agent 3** — Prompt optimalisatie: fine-tune alle agent-prompts op basis van testresultaten.

**Stap 33 · Agent 4** — Volledige end-to-end tests. Security audit (RLS, auth, input validatie).

**Stap 34 · Agent 4** — Railway deployment configuratie. Environment variables instellen. Productie-build.

✅ **Sprint 5 is klaar wanneer:** de applicatie draait op Railway, alle tests slagen, en een gebruiker het volledige pad kan doorlopen: briefing → generatie → review → export.

---

## Regels

1. **Lees altijd eerst `contracts/structure.md` en `PRODUCT.md`** voordat je begint met bouwen.
2. **Werk alleen in je eigen mappen.** Zie de territoriumkaart. Als je iets nodig hebt uit andermans territorium, maak een contract aan in `contracts/`.
3. **Types zijn het contract.** Agent 1 maakt types in `src/lib/types/`. Alle agents gebruiken exact deze types. Nooit eigen types bedenken.
4. **API-contracten zijn bindend.** Agent 1 documenteert endpoints in `contracts/api.md` met request/response shapes. Agent 2 en 3 bouwen hier tegenaan.
5. **Wacht op dependencies.** Start niet met bouwen als je afhankelijk bent van een stap die nog niet af is. Dependencies staan bij elke sprint beschreven.
6. **Elke agent schrijft unit tests voor eigen code.** Agent 4 schrijft integratietests die de samenwerking tussen componenten testen.
7. **Geen hardcoded waarden.** Alle configuratie via environment variables. Alle teksten via templates of database.
8. **Audit alles.** Elke state-wijziging (create, update, delete) — menselijk én AI — wordt gelogd in audit_log.
9. **Een sprint is pas klaar wanneer de acceptatiecriteria zijn behaald.** Niet eerder, niet later. Geen tijdsdruk, wel kwaliteitsdruk.
10. **Naamgeving is Engels, content is Nederlands.** Alle variabelen, functies, componenten, bestanden en mappen in het Engels. Alle UI-teksten, labels, meldingen, tooltips, placeholder-teksten en documentinhoud zijn Nederlands. Comments in code zijn Engels.
11. **Kleine functies.** Maximaal 30 regels per functie. Doet een functie meer dan één ding, splits het op.
12. **Geen magic values.** Alle constanten krijgen een naam. Geen losse strings of getallen in de code.
13. **TypeScript strict mode.** Geen `any`. Geen `@ts-ignore`. Elk type is expliciet.
14. **Error handling overal.** Elke API call, elke database query, elke async operatie heeft error handling. Geen stille failures.
15. **Componenten zijn dom.** UI-componenten ontvangen data via props, doen geen eigen data-fetching. Data-logica leeft in server load functions of stores.
16. **Eén bestand, één verantwoordelijkheid.** Geen god-files. Als een bestand meer dan 200 regels heeft, heroverweeg de structuur.
17. **Geen console.log in productie.** Gebruik een logger utility. Console.log alleen tijdens development achter een debug flag.
18. **Commits zijn atomair.** Eén commit doet één ding. Geen "fix stuff" of "various changes".
19. **Accessibility WCAG 2.1 AA.** Semantic HTML, aria-labels, keyboard navigatie, kleurcontrast. Overheidsplatform — dit is wettelijk verplicht.
20. **Input validatie op beide lagen.** Zod schemas voor validatie in zowel frontend als backend. Vertrouw nooit client-side data.
21. **Database naamgeving is snake_case.** Tabellen en kolommen in snake_case. Elke tabel heeft id (uuid), created_at, updated_at. Soft deletes met deleted_at waar relevant.
22. **Elke pagina heeft vier states.** Loading, empty, data, en error. Geen van de vier mag ontbreken.

## Technische stack

| Component | Technologie |
|-----------|-------------|
| Frontend | SvelteKit + TailwindCSS |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Hosting | Railway |
| AI | Anthropic Claude API (of vergelijkbaar) |
| Embeddings | pgvector in Supabase |
| Export | docx-js (Word), pdf-lib of server-side (PDF) |
| TenderNed data | Eigen harvester → Supabase |
| Repo | Monorepo (geen workspaces) |