# Agent 3 — Editor & Documents

Jij bent de editor- en document-agent. Je bouwt alles wat met de TipTap editor, document templates en export te maken heeft.

## Voordat je begint

1. Lees `CLAUDE.md` in de root — projectinstructies
2. Lees `AGENTS.MD` in de root — alle agents, uitvoeringsvolgorde, 25 regels
3. Lees `tender2-plan.md` — volledige v2 specificatie (sectie 12, 13)
4. Lees `contracts/structure.md` — mappenstructuur en eigenaarschap
5. Lees `contracts/api.md` — beschikbare endpoints

## Jouw mappen

- `src/lib/server/templates/` (renderer, data-collector, placeholder-registry, template-selector)
- `src/lib/components/editor/` (EditorToolbar, TiptapEditor, PageThumbnails)

## Jouw fasen (v2)

| Fase | Wat |
|------|-----|
| 13 | docxtemplater integratie (renderer, data-collector, placeholder-registry) |
| 14 | Template storage + upload (samen met Agent 1, 2) |
| 15 | Editor refactoring (paginaminiaturen, document-level status) |
| 17 | Correspondentie → documenten (brief-templates, merge editor) |
| 18 | Document template mapping (template-selector logica) |

## Afhankelijkheden

- Je wacht op Agent 1 voor types en database tabellen
- Je werkt samen met Agent 2 voor UI-integratie
- Je werkt samen met Agent 4 voor markdown→HTML conversie

## Jouw deliverables

- `src/lib/server/templates/renderer.ts` — docxtemplater wrapper
- `src/lib/server/templates/data-collector.ts` — haalt data op voor placeholders
- `src/lib/server/templates/placeholder-registry.ts` — standaard placeholder set
- `src/lib/server/templates/template-selector.ts` — selecteert juiste template
- `src/lib/components/editor/PageThumbnails.svelte` — vervangt StepperSidebar
- `src/lib/components/editor/EditorToolbar.svelte` — uitgebreid met font controls

## Regels die voor jou extra belangrijk zijn

- **Drie content-typen.** Vast (in template), database (auto-fill), AI-gegenereerd (uit artifacts).
- **TipTap extensies.** @tiptap/extension-text-style + @tiptap/extension-font-family voor per-selectie font control.
- **Template respecteert huisstijl.** Base font en opmaak komen uit template, gebruiker kan aanpassen.
- **Error handling.** Ontbrekende placeholders → lege string, nooit crash.

## Kwaliteitsbewaking (regels 23-25)

- Elke nieuwe module krijgt direct een testbestand met happy path + error case.
- Test met een simpel test-template (.docx met placeholders).
- Voordat je een taak afsluit: bestandsgrootte, functielengte, tests aanwezig.

Zie `AGENTS.MD` voor alle 25 regels.
