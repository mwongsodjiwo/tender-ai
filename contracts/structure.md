# Structure Contract — TenderManager

This document defines ownership of directories and files, and the interfaces shared between agents.

## Directory Ownership

| Path | Owner | Description |
|------|-------|-------------|
| `docs/` | Agent 6 | Documentation |
| `contracts/` | Agent 6 | Shared contracts between agents |
| `supabase/migrations/` | Agent 1 | Database migration files |
| `supabase/functions/` | Agent 1 | Supabase Edge Functions |
| `supabase/seed.sql` | Agent 1 | Seed data for development |
| `src/lib/server/db/` | Agent 1 | Database client and query helpers |
| `src/lib/server/api/` | Agent 1 | Server-side API logic |
| `src/lib/server/ai/` | Agent 4 | LLM integration, prompts, RAG |
| `src/lib/server/templates/` | Agent 3 | docxtemplater, template renderer, data collector |
| `src/lib/server/email/` | Agent 4 | Email parsing for incoming questions |
| `src/lib/server/cron/` | Agent 5 | Scheduled jobs (retention, archiving) |
| `src/lib/components/editor/` | Agent 3 | TipTap editor, toolbar, page thumbnails |
| `src/lib/components/suppliers/` | Agent 2 | Supplier list, drawer, search dialog |
| `src/lib/components/` (other) | Agent 2 | General Svelte UI components |
| `src/lib/stores/` | Agent 2 | Svelte stores for client state |
| `src/lib/utils/` (general) | Agent 2 | Client-side utility functions |
| `src/lib/utils/markdown-to-tiptap.ts` | Agent 4 | Markdown → TipTap HTML conversion |
| `src/lib/utils/governance.ts` | Agent 5 | Retention calculation, data classification |
| `src/lib/utils/procedure-advice.ts` | Agent 1 | Threshold-based procedure advice |
| `src/lib/types/` | Agent 1 (creates) | Shared TypeScript types — used by all agents |
| `src/lib/schemas/` | Agent 1 | Zod validation schemas |
| `src/routes/(app)/admin/` | Agent 5 | Superadmin analytics pages |
| `src/routes/(app)/settings/` | Agent 2 + 5 | Organization settings (shared) |
| `src/routes/(app)/` (other) | Agent 2 | SvelteKit app pages |
| `src/routes/api/` | Agent 1 | API routes |
| `harvester/` | Agent 1 | TenderNed data harvester |
| `scripts/import-cpv-codes.ts` | Agent 1 | CPV import (data script) |
| `scripts/seed-nuts-codes.ts` | Agent 1 | NUTS seed (data script) |
| `scripts/quality-check.sh` | Agent 6 | Automated quality check |
| `scripts/` (other) | Agent 6 | Build and utility scripts |
| `tests/integration/` | Agent 6 | Integration tests |
| `tests/rls/` | Agent 1 + 6 | RLS policy tests |
| `tests/e2e/` | Agent 6 | End-to-end tests |
| `tests/unit/` | All agents | Unit tests (each agent tests own code) |
| `.github/workflows/` | Agent 6 | CI/CD pipeline |
| `docker-compose.yml` | Agent 6 | Local development environment |
| `svelte.config.js` | Agent 6 | SvelteKit configuration |
| `tailwind.config.js` | Agent 2 | Tailwind CSS configuration |
| `package.json` | Agent 6 | Dependencies and scripts |

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

All other agents build against these contracts.

### Environment Variables (.env.example)

All configuration via environment variables. No hardcoded values. The `.env.example` file documents all required variables.

## Rules

1. Never modify files outside your owned directories without coordination.
2. Types in `src/lib/types/` are the shared contract — changes require all agents to update.
3. API contracts in `contracts/api.md` are binding — all agents build against them.
4. All database naming uses snake_case. All code naming uses camelCase/PascalCase (TypeScript conventions).
5. Every table has: `id` (uuid), `created_at` (timestamptz), `updated_at` (timestamptz).
6. Soft deletes use `deleted_at` (timestamptz, nullable) where relevant.
7. New tables include governance fields: `data_classification`, `retention_until`, `anonymized_at`, `archive_status`.
