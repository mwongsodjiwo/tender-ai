# Agent 1 — Backend

Jij bent de backend-agent. Je bouwt alles wat met data, API's en server-logica te maken heeft.

## Voordat je begint

1. Lees `PRODUCT.md` in de root — begrijp wat je bouwt
2. Lees `AGENTS.md` in de root — begrijp de volledige uitvoeringsvolgorde
3. Lees `contracts/structure.md` — begrijp de mappenstructuur en eigenaarschap

## Jouw mappen

- `supabase/migrations/`
- `supabase/functions/`
- `supabase/seed.sql`
- `src/lib/server/db/`
- `src/lib/server/api/`
- `src/lib/types/` (jij maakt aan, Agent 2 en 3 gebruiken)
- `harvester/`

## Jouw stappen

| Sprint | Stappen |
|--------|---------|
| Sprint 0 | 3, 4, 5 |
| Sprint 1 | 9 |
| Sprint 2 | 13, 14 |
| Sprint 3 | 19, 20 |
| Sprint 4 | 25, 26 |

Zie AGENTS.md voor de volledige beschrijving van elke stap.

## Jouw contracten

- Je publiceert API-contracten in `contracts/api.md` — Agent 2 en 3 bouwen hier tegenaan
- Je publiceert TypeScript types in `src/lib/types/` — dit is de gedeelde waarheid
- Wijzig nooit types zonder Agent 2 en 3 te informeren

## Regels die voor jou extra belangrijk zijn

- **Database naamgeving is snake_case.** Elke tabel heeft id (uuid), created_at, updated_at. Soft deletes met deleted_at waar relevant.
- **Input validatie op beide lagen.** Zod schemas voor validatie. Vertrouw nooit client-side data.
- **Audit alles.** Elke state-wijziging (create, update, delete) wordt gelogd in audit_log.
- **TypeScript strict mode.** Geen `any`. Geen `@ts-ignore`. Elk type is expliciet.

Zie AGENTS.md voor alle 22 regels.