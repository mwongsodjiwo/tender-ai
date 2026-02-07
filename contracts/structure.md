# Structure Contract — Tendermanager

This document defines ownership of directories and files, and the interfaces shared between agents.

## Directory Ownership

| Path | Owner | Description |
|------|-------|-------------|
| `docs/` | Agent 4 | Documentation |
| `contracts/` | Agent 4 | Shared contracts between agents |
| `supabase/migrations/` | Agent 1 | Database migration files |
| `supabase/functions/` | Agent 1 | Supabase Edge Functions |
| `supabase/seed.sql` | Agent 1 | Seed data for development |
| `src/lib/server/db/` | Agent 1 | Database client and query helpers |
| `src/lib/server/api/` | Agent 1 | Server-side API logic |
| `src/lib/server/ai/` | Agent 3 | LLM integration, prompts, RAG |
| `src/lib/components/` | Agent 2 | Svelte UI components |
| `src/lib/stores/` | Agent 2 | Svelte stores for client state |
| `src/lib/utils/` | Agent 2 | Client-side utility functions |
| `src/lib/types/` | Agent 1 (creates) | Shared TypeScript types — used by all agents |
| `src/routes/` | Agent 2 | SvelteKit pages and API routes |
| `harvester/` | Agent 1 | TenderNed data harvester |
| `scripts/` | Agent 4 | Build and utility scripts |
| `tests/integration/` | Agent 4 | Integration tests |
| `tests/unit/` | All agents | Unit tests (each agent tests own code) |
| `.github/workflows/` | Agent 4 | CI/CD pipeline |
| `docker-compose.yml` | Agent 4 | Local development environment |
| `svelte.config.js` | Agent 4 | SvelteKit configuration |
| `tailwind.config.js` | Agent 2 | Tailwind CSS configuration |
| `package.json` | Agent 4 | Dependencies and scripts |

## Shared Interfaces

### Types (src/lib/types/)

Agent 1 creates and maintains all TypeScript types. These types are the single source of truth and must exactly match the database schema. All agents import from here — never create local type definitions.

Files:
- `database.ts` — Table row types matching Supabase schema
- `api.ts` — Request/response types for API endpoints
- `enums.ts` — Shared enumerations (roles, statuses, procedures)
- `index.ts` — Re-exports all types

### API Contracts (contracts/api.md)

Agent 1 documents all API endpoints with:
- HTTP method and path
- Request body shape (TypeScript type)
- Response body shape (TypeScript type)
- Authentication requirements
- Error responses

Agent 2 and Agent 3 build against these contracts.

### Environment Variables (.env.example)

All configuration via environment variables. No hardcoded values. The `.env.example` file documents all required variables.

## Rules

1. Never modify files outside your owned directories without coordination.
2. Types in `src/lib/types/` are the shared contract — changes require all agents to update.
3. API contracts in `contracts/api.md` are binding — frontend and AI build against them.
4. All database naming uses snake_case. All code naming uses camelCase/PascalCase (TypeScript conventions).
5. Every table has: `id` (uuid), `created_at` (timestamptz), `updated_at` (timestamptz).
6. Soft deletes use `deleted_at` (timestamptz, nullable) where relevant.
