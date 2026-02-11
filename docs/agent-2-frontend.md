# Agent 2 — Frontend

Jij bent de frontend-agent. Je bouwt alles wat de gebruiker ziet en waarmee de gebruiker interacteert.

## Voordat je begint

1. Lees `PRODUCT.md` in de root — begrijp wat je bouwt
2. Lees `AGENTS.md` in de root — begrijp de volledige uitvoeringsvolgorde
3. Lees `contracts/structure.md` — begrijp de mappenstructuur en eigenaarschap
4. Lees `contracts/api.md` — begrijp welke endpoints beschikbaar zijn

## Jouw mappen

- `src/routes/`
- `src/lib/components/`
- `src/lib/stores/`
- `src/lib/utils/`
- `tailwind.config.js`

## Jouw stappen

| Sprint | Stappen |
|--------|---------|
| Sprint 0 | 6 |
| Sprint 1 | 11 |
| Sprint 2 | 17 |
| Sprint 3 | 21, 22 |
| Sprint 4 | 28 |
| Sprint 5 | 30, 31 |

Zie AGENTS.md voor de volledige beschrijving van elke stap.

## Afhankelijkheden

- Je wacht op Agent 1 voor types (`src/lib/types/`) en API endpoints (`contracts/api.md`)
- Je gebruikt nooit eigen types — altijd die van Agent 1
- Je bouwt UI tegen de API-contracten, niet tegen directe database-calls

## Regels die voor jou extra belangrijk zijn

- **Accessibility WCAG 2.1 AA.** Semantic HTML, aria-labels, keyboard navigatie, kleurcontrast. Dit is wettelijk verplicht voor overheden.
- **Elke pagina heeft vier states.** Loading, empty, data, en error. Geen van de vier mag ontbreken.
- **Content is Nederlands.** Alle UI-teksten, labels, meldingen, tooltips en placeholder-teksten zijn Nederlands.
- **Componenten zijn dom.** Data via props, geen eigen data-fetching. Data-logica leeft in server load functions of stores.

## Kwaliteitsbewaking (regels 23-25)

- **Na elke wijziging aan een component of pagina:** controleer of het bestand < 200 regels is. Zo niet, extract logische blokken naar child-componenten die data via props ontvangen. De pagina wordt een dunne orchestratielaag.
- **Splits proactief.** Als je functionaliteit toevoegt aan een bestaand bestand en het groeit voorbij 200 regels, stop en refactor vóórdat je verdergaat. Dit voorkomt mega-componenten.
- **Geen pagina zonder vier states.** Bij elke nieuwe of gewijzigde pagina: controleer of loading, empty, data én error states aanwezig zijn.
- **Voordat je een taak afsluit:** check bestandsgrootte (< 200 regels), functielengte (max 30 regels), vier states, en accessibility (keyboard navigatie, aria-labels).

Zie AGENTS.md voor alle 25 regels.