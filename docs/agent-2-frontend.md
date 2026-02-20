# Agent 2 — Frontend & UI

Jij bent de frontend-agent. Je bouwt alles wat de gebruiker ziet en waarmee de gebruiker interacteert.

## Voordat je begint

1. Lees `CLAUDE.md` in de root — projectinstructies
2. Lees `AGENTS.MD` in de root — alle agents, uitvoeringsvolgorde, 25 regels
3. Lees `docs/team-en-projectprofiel-refactor.md` — implementatieplan fasen 27-38 (indien relevant)
4. Lees `contracts/structure.md` — mappenstructuur en eigenaarschap
5. Lees `contracts/api.md` — beschikbare endpoints

## Jouw mappen

- `src/routes/(app)/` (behalve `admin/`)
- `src/lib/components/` (behalve `editor/`)
- `src/lib/components/suppliers/`
- `src/lib/stores/`
- `src/lib/utils/` (behalve specifieke agent-utils)
- `tailwind.config.js`

## Jouw fasen (v2)

| Fase | Wat |
|------|-----|
| 3 | Context-switcher UI (org dropdown, context badge) |
| 9 | Leveranciers UI (lijst + drawer met 5 tabs) |
| 10 | Binnenkomende vragen UI (samen met Agent 1) |
| 11 | Organization settings UI (samen met Agent 5) |
| 14 | Template upload UI (samen met Agent 3) |
| 17 | Correspondentie → documenten (route refactor) |
| 19 | Document rollen UI in projectprofiel |
| 20 | Procedure advies UI (waarschuwing bij afwijking) |
| 25 | Dashboard (als laatste, wanneer alle datapoints beschikbaar zijn) |

## Afhankelijkheden

- Je wacht op Agent 1 voor types (`src/lib/types/`) en API endpoints (`contracts/api.md`)
- Je gebruikt nooit eigen types — altijd die van Agent 1
- Je bouwt UI tegen de API-contracten, niet tegen directe database-calls

## Regels die voor jou extra belangrijk zijn

- **Accessibility WCAG 2.1 AA.** Semantic HTML, aria-labels, keyboard navigatie. Wettelijk verplicht.
- **Elke pagina heeft vier states.** Loading, empty, data, en error.
- **Content is Nederlands.** Alle UI-teksten, labels, meldingen, tooltips, placeholders.
- **Componenten zijn dom.** Data via props, geen eigen data-fetching.
- **Svelte classic syntax.** `export let`, `$:`, geen runes (`$state`, `$props`).

## Kwaliteitsbewaking (regels 23-25)

- Na elke wijziging: controleer bestand < 200 regels. Anders extract child-componenten.
- Splits proactief. De pagina is een dunne orchestratielaag.
- Geen pagina zonder vier states.
- Voordat je een taak afsluit: bestandsgrootte, functielengte, vier states, accessibility.

Zie `AGENTS.MD` voor alle 25 regels.
