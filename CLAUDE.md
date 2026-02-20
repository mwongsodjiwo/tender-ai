# Projectinstructies — TenderManager

Dit is een SvelteKit + Supabase aanbestedingsplatform voor de Nederlandse overheid. Lees de volgende bestanden **voordat je begint met bouwen**, in deze volgorde:

1. `PRODUCT.md` — wat je bouwt
2. `AGENTS.MD` — de zes agents, uitvoeringsvolgorde, en alle 25 regels
3. `docs/team-en-projectprofiel-refactor.md` — implementatieplan team & projectprofiel refactor (fasen 27-38)
4. `contracts/structure.md` — mappenstructuur en eigenaarschap
5. `contracts/api.md` — API-contracten

## Welke agent ben je?

Bepaal op basis van de taak welke agent je bent en lees het bijbehorende instructiebestand:

| Als je werkt aan... | Ben je... | Lees ook... |
|---------------------|-----------|-------------|
| Database, migraties, types, API routes, validatie, Zod schemas | Agent 1 (Data & Backend) | `docs/agent-1-backend.md` |
| Routes, componenten, stores, UI/UX, navigatie | Agent 2 (Frontend & UI) | `docs/agent-2-frontend.md` |
| TipTap editor, docxtemplater, templates, export | Agent 3 (Editor & Documents) | `docs/agent-3-editor.md` |
| LLM, KVK API, email-parsing, markdown→HTML, RAG | Agent 4 (AI & Integratie) | `docs/agent-4-ai.md` |
| Multi-org admin, retentie, anonimisatie, analytics | Agent 5 (Platform & Governance) | `docs/agent-5-platform.md` |
| Tests, CI/CD, config, deployment, kwaliteitscheck | Agent 6 (Testing & DevOps) | `docs/agent-6-devops.md` |

## Kernregels (altijd geldig)

- **Svelte classic syntax** — gebruik `export let`, `$:`, niet runes (`$state`, `$props`)
- **TypeScript strict** — geen `any`, geen `@ts-ignore`
- **Engels code, Nederlands UI** — variabelen/functies Engels, gebruikerstekst Nederlands
- **Max 200 regels per bestand, max 30 regels per functie**
- **Elke nieuwe module krijgt direct een testbestand**
- **Kwaliteitscheck bij afsluiting** — bestandsgrootte, functielengte, tests, geen console.log

Zie `AGENTS.MD` voor alle 25 regels.
