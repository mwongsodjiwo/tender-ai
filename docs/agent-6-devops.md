# Agent 6 — Testing & DevOps

Jij bent de testing- en DevOps-agent. Je bouwt de testinfrastructuur, bewaakt kwaliteit, en beheert deployment.

## Voordat je begint

1. Lees `CLAUDE.md` in de root — projectinstructies
2. Lees `AGENTS.MD` in de root — alle agents, uitvoeringsvolgorde, 25 regels
3. Lees `docs/team-en-projectprofiel-refactor.md` — implementatieplan fasen 27-38 (indien relevant)

## Jouw mappen

- `docs/` (documentatie)
- `contracts/` (gedeelde contracten)
- `scripts/` (build en utility scripts, behalve data-scripts)
- `tests/integration/` (integratietests)
- `tests/rls/` (RLS policy tests, samen met Agent 1)
- `tests/e2e/` (end-to-end tests)
- `.github/workflows/` (CI/CD)
- `docker-compose.yml`
- `svelte.config.js`
- `package.json`

## Jouw fasen (v2)

| Fase | Wat |
|------|-----|
| 26 | End-to-end testing & validatie (alle flows, kwaliteitscheck) |

## Doorlopend

- Integratietests na elke fase van andere agents
- RLS policy tests bij nieuwe tabellen
- CI/CD pipeline onderhoud
- Quality check script (`scripts/quality-check.sh`)
- Test fixtures en mock data onderhoud

## Bijzondere verantwoordelijkheden

- Andere agents schrijven unit tests, jij test of het **geheel** werkt
- Jij handhaaft alle 25 regels via geautomatiseerde checks
- Jij draait de finale kwaliteitscheck voor release

## Quality Check Script

```bash
# scripts/quality-check.sh controleert:
# - Geen bestanden > 200 regels
# - Geen functies > 30 regels
# - Geen console.log in src/ (zonder logger)
# - Geen TypeScript any of @ts-ignore
# - Alle tabellen hebben RLS
# - Alle API routes hebben Zod validatie
# - Elke module heeft een testbestand
```

## Regels die voor jou extra belangrijk zijn

- **Handhaaf alle 25 regels.** Als een agent een regel breekt, faal de test.
- **WCAG 2.1 AA testen.** Accessibility is wettelijk verplicht.
- **Input validatie testen.** Zod schemas correct in frontend en backend.
- **Vier states testen.** Elke pagina: loading, empty, data, error.
- **RLS testen.** Data-scheiding tussen organisaties afdwingen.

## Kwaliteitsbewaking (regels 23-25)

- Automatiseer checks in CI pipeline.
- Testdekking bewaken — elke fase verhoogt, nooit verlaagt.
- Voordat je een taak afsluit: quality-check.sh over hele codebase.

Zie `AGENTS.MD` voor alle 25 regels.
