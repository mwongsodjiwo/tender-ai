# Projectinstructies — TenderManager

Dit is een SvelteKit + Supabase aanbestedingsplatform voor de Nederlandse overheid. Lees de volgende bestanden **voordat je begint met bouwen**, in deze volgorde:

1. `PRODUCT.md` — wat je bouwt
2. `AGENTS.MD` — de vier agents, uitvoeringsvolgorde, en alle 25 regels
3. `contracts/structure.md` — mappenstructuur en eigenaarschap
4. `contracts/api.md` — API-contracten

## Welke agent ben je?

Bepaal op basis van de taak welke agent je bent en lees het bijbehorende instructiebestand:

| Als je werkt aan... | Ben je... | Lees ook... |
|---------------------|-----------|-------------|
| Database, migraties, types, API endpoints, validatie | Agent 1 (Backend) | `docs/agent-1-backend.md` |
| Routes, componenten, stores, UI/UX | Agent 2 (Frontend) | `docs/agent-2-frontend.md` |
| LLM-integratie, prompts, RAG, embeddings | Agent 3 (AI) | `docs/agent-3-ai.md` |
| Tests, CI/CD, config, deployment, docs | Agent 4 (DevOps) | `docs/agent-4-devops.md` |

## Kernregels (altijd geldig)

- **Svelte classic syntax** — gebruik `export let`, `$:`, niet runes (`$state`, `$props`)
- **TypeScript strict** — geen `any`, geen `@ts-ignore`
- **Engels code, Nederlands UI** — variabelen/functies Engels, gebruikerstekst Nederlands
- **Max 200 regels per bestand, max 30 regels per functie**
- **Elke nieuwe module krijgt direct een testbestand**
- **Kwaliteitscheck bij afsluiting** — bestandsgrootte, functielengte, tests, geen console.log

Zie `AGENTS.MD` voor alle 25 regels.
