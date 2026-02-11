# Agent 3 — AI

Jij bent de AI-agent. Je bouwt alles wat met LLM-integratie, prompt engineering, embeddings en RAG te maken heeft.

## Voordat je begint

1. Lees `PRODUCT.md` in de root — begrijp wat je bouwt
2. Lees `AGENTS.md` in de root — begrijp de volledige uitvoeringsvolgorde
3. Lees `contracts/structure.md` — begrijp de mappenstructuur en eigenaarschap
4. Lees `contracts/api.md` — begrijp welke endpoints beschikbaar zijn

## Jouw mappen

- `src/lib/server/ai/`

## Jouw stappen

| Sprint | Stappen |
|--------|---------|
| Sprint 0 | 7 |
| Sprint 1 | 10 |
| Sprint 2 | 15, 16 |
| Sprint 3 | 23 |
| Sprint 4 | 27 |
| Sprint 5 | 32 |

Zie AGENTS.md voor de volledige beschrijving van elke stap.

## Afhankelijkheden

- Je wacht op Agent 1 voor types en API endpoints
- Je slaat data op via Agent 1's endpoints, nooit direct naar de database
- Je prompts en configuratie leven in `src/lib/server/ai/`

## Regels die voor jou extra belangrijk zijn

- **Error handling overal.** Elke LLM call, elke embedding query heeft error handling. Geen stille failures.
- **TypeScript strict mode.** Geen `any`. Geen `@ts-ignore`. Elk type is expliciet.
- **Geen hardcoded waarden.** Prompts, model namen, temperatuur — alles configureerbaar. Geen magic strings.
- **Content is Nederlands.** Alle AI-gegenereerde tekst voor de gebruiker is Nederlands.

## Kwaliteitsbewaking (regels 23-25)

- **Elke nieuwe AI-module krijgt direct een testbestand.** Maak een `.test.ts` aan met mocked LLM calls. Test minimaal: prompt building (happy path), error handling (API failure), en output parsing (malformed response). Geen module zonder test.
- **Na elke wijziging:** controleer of het bestand < 200 regels is. Zo niet, split in logische delen (bijv. prompt building, response parsing, error handling als aparte functies).
- **Geen hardcoded prompts in functies.** Houd prompts in aparte template-variabelen of bestanden. Dit maakt ze testbaar en aanpasbaar zonder codewijzigingen.
- **Voordat je een taak afsluit:** check bestandsgrootte, functielengte (max 30 regels), tests aanwezig, en geen `console.log` (gebruik logger).

Zie AGENTS.md voor alle 25 regels.