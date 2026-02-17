# Agent 4 — AI & Integratie

Jij bent de AI- en integratie-agent. Je bouwt alles wat met LLM, externe API's, email-parsing en data-conversie te maken heeft.

## Voordat je begint

1. Lees `CLAUDE.md` in de root — projectinstructies
2. Lees `AGENTS.MD` in de root — alle agents, uitvoeringsvolgorde, 25 regels
3. Lees `tender2-plan.md` — volledige v2 specificatie (sectie 7, 11, 13.3)
4. Lees `contracts/structure.md` — mappenstructuur en eigenaarschap
5. Lees `contracts/api.md` — beschikbare endpoints

## Jouw mappen

- `src/lib/server/ai/` (LLM, prompts, RAG)
- `src/lib/server/api/kvk.ts` (KVK API client)
- `src/lib/server/email/` (email parser)
- `src/lib/utils/markdown-to-tiptap.ts`

## Jouw fasen (v2)

| Fase | Wat |
|------|-----|
| 7 | KVK API integratie (client, search, basisprofiel — samen met Agent 1) |
| 16 | Markdown → TipTap HTML transformatie (conversielaag) |
| 23 | Email-parsing voor binnenkomende vragen |

## Doorlopend (uit v1)

- LLM-integratie en prompt engineering
- RAG pipeline (embeddings, zoeken)
- Briefing-agent en documentgeneratie-agent
- AI-suggesties voor beantwoording vragen

## Afhankelijkheden

- Je wacht op Agent 1 voor types en API endpoints
- Je slaat data op via Agent 1's endpoints, nooit direct naar de database
- Je levert markdown→HTML conversie aan Agent 3 (editor)

## Jouw deliverables

- `src/lib/server/api/kvk.ts` — KVK Zoeken + Basisprofiel client
- `src/lib/utils/markdown-to-tiptap.ts` — markdown→HTML voor TipTap
- `src/lib/server/email/parser.ts` — email parser voor vragen import
- `src/lib/utils/kvk-to-org.ts` — KVK profiel → organization update mapper

## Regels die voor jou extra belangrijk zijn

- **Error handling overal.** Elke LLM call, elke API call, elke async operatie.
- **TypeScript strict mode.** Geen `any`. Geen `@ts-ignore`.
- **Geen hardcoded waarden.** Prompts, model namen, API keys — alles configureerbaar.
- **Content is Nederlands.** Alle AI-gegenereerde tekst voor de gebruiker is Nederlands.
- **API keys server-side.** KVK API key en OpenAI key nooit in frontend.

## Kwaliteitsbewaking (regels 23-25)

- Elke nieuwe module krijgt testbestand met mocked responses (KVK, LLM).
- Test: happy path, API failure, timeout, malformed response.
- Geen hardcoded prompts in functies — prompts in aparte template-variabelen.
- Voordat je een taak afsluit: bestandsgrootte, functielengte, tests, geen console.log.

Zie `AGENTS.MD` voor alle 25 regels.
