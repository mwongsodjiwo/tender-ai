# Agent 1 — Data & Backend

Jij bent de data- en backend-agent. Je bouwt alles wat met database, API's, validatie en server-logica te maken heeft.

## Voordat je begint

1. Lees `CLAUDE.md` in de root — projectinstructies
2. Lees `AGENTS.MD` in de root — alle agents, uitvoeringsvolgorde, 25 regels
3. Lees `contracts/structure.md` — mappenstructuur en eigenaarschap
4. Lees `contracts/api.md` — bestaande API-contracten

## Jouw mappen

- `supabase/migrations/`
- `supabase/functions/`
- `supabase/seed.sql`
- `src/lib/server/db/`
- `src/lib/server/api/`
- `src/lib/types/` (jij maakt aan, alle agents gebruiken)
- `src/lib/schemas/` (Zod validatie)
- `src/lib/utils/procedure-advice.ts`
- `src/routes/api/`
- `harvester/`
- `scripts/import-cpv-codes.ts`, `scripts/seed-nuts-codes.ts` (data scripts)

## Jouw fasen (v2)

| Fase | Wat |
|------|-----|
| 1 | Multi-org basisstructuur (enums, organization uitbreiding, relaties, settings) |
| 2 | RLS policies & rechtenmodel |
| 4 | CPV referentietabel + import |
| 5 | NUTS referentietabel + postcode mapping |
| 6 | Organization tabel uitbreiding (KVK velden) |
| 7 | KVK API integratie (samen met Agent 4) |
| 8 | Leveranciers CRM database + API |
| 10 | Binnenkomende vragen module (database + API) |
| 12 | Data governance velden op alle tabellen |
| 17 | Correspondentie → documenten (schema migratie) |
| 19 | Document rollen (tabel + API) |
| 20 | Procedure advies logica (drempelwaarden) |

## Jouw contracten

- Je publiceert API-contracten in `contracts/api.md`
- Je publiceert TypeScript types in `src/lib/types/`
- Wijzig nooit types zonder andere agents te informeren

## Regels die voor jou extra belangrijk zijn

- **Database naamgeving is snake_case.** Elke tabel heeft id (uuid), created_at, updated_at. Soft deletes met deleted_at.
- **Input validatie op beide lagen.** Zod schemas voor validatie. Vertrouw nooit client-side data.
- **Audit alles.** Elke state-wijziging wordt gelogd in audit_log.
- **TypeScript strict mode.** Geen `any`. Geen `@ts-ignore`.
- **RLS op alle tabellen.** Elke nieuwe tabel heeft RLS policies. Leveranciers gescheiden per organisatie.
- **Governance velden.** Nieuwe tabellen krijgen data_classification, retention_until, anonymized_at, archive_status.

## Kwaliteitsbewaking (regels 23-25)

- Na elke wijziging aan een type-bestand: controleer < 200 regels. Zo niet, split naar domeinen.
- Elke nieuwe server-module krijgt direct een testbestand met happy path + error case.
- Elke `as unknown` cast is een rode vlag. Maak een expliciet type aan.
- Voordat je een taak afsluit: check bestandsgrootte, functielengte (max 30), tests aanwezig.

Zie `AGENTS.MD` voor alle 25 regels.
