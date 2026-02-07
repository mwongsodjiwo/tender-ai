# API Contract — Tendermanager

All endpoints return JSON. Authentication is via Supabase session cookies (handled automatically by `@supabase/ssr`).

## Common Response Format

**Success:**
```json
{ "data": <T> }
```

**Error:**
```json
{ "message": "string", "code": "string", "status": number }
```

---

## Health Check

### `GET /api/health`
- **Auth:** None
- **Response:** `{ status: "healthy" | "unhealthy", timestamp: string, database: "connected" | "disconnected" }`

---

## Authentication

### `POST /api/auth/register`
- **Auth:** None
- **Body:** `{ email: string, password: string, full_name: string }`
- **Response:** `{ data: { user: User, session: Session } }`
- **Errors:** 400 (validation), 400 (auth error)

### `POST /api/auth/login`
- **Auth:** None
- **Body:** `{ email: string, password: string }`
- **Response:** `{ data: { user: User, session: Session } }`
- **Errors:** 400 (validation), 401 (invalid credentials)

### `POST /api/auth/logout`
- **Auth:** Required
- **Body:** None
- **Response:** `{ data: { message: "Uitgelogd" } }`

---

## Profile

### `GET /api/profile`
- **Auth:** Required
- **Response:** `{ data: Profile }`

### `PATCH /api/profile`
- **Auth:** Required
- **Body:** `{ full_name?: string, job_title?: string, phone?: string, avatar_url?: string }`
- **Response:** `{ data: Profile }`

---

## Organizations

### `GET /api/organizations`
- **Auth:** Required
- **Response:** `{ data: Organization[] }`

### `POST /api/organizations`
- **Auth:** Required
- **Body:** `{ name: string, slug: string, description?: string }`
- **Response (201):** `{ data: Organization }`
- **Errors:** 409 (slug already exists)

### `GET /api/organizations/:id`
- **Auth:** Required (must be member)
- **Response:** `{ data: Organization }`

### `PATCH /api/organizations/:id`
- **Auth:** Required (must be admin/owner)
- **Body:** `{ name?: string, description?: string, logo_url?: string }`
- **Response:** `{ data: Organization }`

---

## Organization Members

### `GET /api/organizations/:id/members`
- **Auth:** Required (must be member)
- **Response:** `{ data: OrganizationMemberWithProfile[] }`

### `POST /api/organizations/:id/members`
- **Auth:** Required (must be admin/owner)
- **Body:** `{ email: string, role: "owner" | "admin" | "member" }`
- **Response (201):** `{ data: OrganizationMember }`
- **Errors:** 404 (user not found), 409 (already a member)

---

## Chat (Sprint 0 — basic)

### `POST /api/chat`
- **Auth:** Required
- **Body:** `{ conversation_id: string, message: string }`
- **Response:** `{ data: { message_id: string, content: string, conversation_id: string } }`

---

## Projects (Sprint 1)

### `GET /api/projects`
- **Auth:** Required
- **Query:** `?organization_id=uuid` (optional filter)
- **Response:** `{ data: Project[] }`

### `POST /api/projects`
- **Auth:** Required
- **Body:** `{ organization_id: string, name: string, description?: string, procedure_type?: ProcedureType, estimated_value?: number, publication_date?: string, deadline_date?: string }`
- **Response (201):** `{ data: Project }`
- **Note:** Creator is automatically added as project member with `project_leader` role

### `GET /api/projects/:id`
- **Auth:** Required (must be project member or org member)
- **Response:** `{ data: Project }`

### `PATCH /api/projects/:id`
- **Auth:** Required (must be project member)
- **Body:** `{ name?: string, description?: string, status?: ProjectStatus, procedure_type?: ProcedureType, estimated_value?: number, publication_date?: string, deadline_date?: string, briefing_data?: object }`
- **Response:** `{ data: Project }`

### `DELETE /api/projects/:id`
- **Auth:** Required (must be project member)
- **Response:** `{ data: { message: "Project verwijderd" } }`
- **Note:** Soft delete (sets deleted_at)

---

## Project Members (Sprint 1)

### `GET /api/projects/:id/members`
- **Auth:** Required (must be project member)
- **Response:** `{ data: ProjectMemberWithRoles[] }`

### `POST /api/projects/:id/members`
- **Auth:** Required (must be project member or org admin)
- **Body:** `{ profile_id: string, roles: ProjectRole[] }`
- **Response (201):** `{ data: ProjectMemberWithRoles }`
- **Errors:** 409 (already a member)

---

## Artifacts (Sprint 1)

### `GET /api/projects/:id/artifacts`
- **Auth:** Required (must be project member)
- **Query:** `?document_type_id=uuid` (optional filter)
- **Response:** `{ data: Artifact[] }`

### `POST /api/projects/:id/artifacts`
- **Auth:** Required (must be project member)
- **Body:** `{ document_type_id: string, section_key: string, title: string, content?: string, sort_order?: number, metadata?: object }`
- **Response (201):** `{ data: Artifact }`

### `GET /api/projects/:id/artifacts/:artifactId`
- **Auth:** Required (must be project member)
- **Response:** `{ data: Artifact }`

### `PATCH /api/projects/:id/artifacts/:artifactId`
- **Auth:** Required (must be project member)
- **Body:** `{ title?: string, content?: string, status?: ArtifactStatus, sort_order?: number, metadata?: object }`
- **Response:** `{ data: Artifact }`

---

## Conversations (Sprint 1)

### `GET /api/projects/:id/conversations`
- **Auth:** Required (must be project member)
- **Response:** `{ data: Conversation[] }`

### `POST /api/projects/:id/conversations`
- **Auth:** Required (must be project member)
- **Body:** `{ artifact_id?: string, title?: string, context_type?: string }`
- **Response (201):** `{ data: Conversation }`

---

## Briefing (Sprint 1)

### `POST /api/briefing/start`
- **Auth:** Required
- **Body:** `{ project_id: string }`
- **Response:** `{ data: { conversation_id: string, content: string, briefing_complete: false } }`
- **Note:** Sets project status to 'briefing', creates conversation with context_type 'briefing'

### `POST /api/briefing/message`
- **Auth:** Required
- **Body:** `{ project_id: string, conversation_id: string, message: string }`
- **Response:** `{ data: { message_id: string, content: string, conversation_id: string, briefing_complete: boolean, artifacts_generated: number } }`
- **Note:** When briefing is complete, generates artifacts and sets project status to 'generating'

---

---

## Project Member Roles (Sprint 3)

### `GET /api/projects/:id/members/:memberId`
- **Auth:** Required (must be project member)
- **Response:** `{ data: ProjectMemberWithRoles }`

### `PATCH /api/projects/:id/members/:memberId`
- **Auth:** Required (must be project leader or org admin)
- **Body:** `{ roles: ProjectRole[] }`
- **Response:** `{ data: ProjectMemberWithRoles }`
- **Note:** Replaces all existing roles with the new set

### `DELETE /api/projects/:id/members/:memberId`
- **Auth:** Required (must be project leader or org admin)
- **Response:** `{ data: { message: "Lid verwijderd uit project" } }`

---

## Section Reviewers (Sprint 3)

### `GET /api/projects/:id/reviewers`
- **Auth:** Required (must be project member)
- **Response:** `{ data: SectionReviewer[] }`

### `POST /api/projects/:id/reviewers`
- **Auth:** Required (must be project member)
- **Body:** `{ artifact_id: string, email: string, name: string }`
- **Response (201):** `{ data: SectionReviewer }`
- **Note:** Generates magic link token automatically. Token expires in 14 days.

---

## Magic Link Review (Sprint 3)

### `GET /api/review/:token`
- **Auth:** None (magic link access)
- **Response:** `{ data: { reviewer: ReviewerResponse, artifact: Artifact, project: { id, name } } }`
- **Errors:** 404 (invalid token), 410 (expired)

### `PATCH /api/review/:token`
- **Auth:** None (magic link access)
- **Body:** `{ review_status: "approved" | "rejected", feedback?: string }`
- **Response:** `{ data: SectionReviewer }`

### `POST /api/review/:token/chat`
- **Auth:** None (magic link access)
- **Body:** `{ token: string, conversation_id?: string, message: string }`
- **Response:** `{ data: { message_id, content, conversation_id, has_update, updated_artifact } }`

---

## Audit Log (Sprint 3)

### `GET /api/projects/:id/audit`
- **Auth:** Required (must be project member or org member)
- **Query:** `?page=1&per_page=25&action=create&entity_type=artifact&actor_id=uuid`
- **Response:** `{ data: { entries: AuditLogEntry[], total: number, page: number, per_page: number } }`

### `GET /api/organizations/:id/audit`
- **Auth:** Required (must be org member)
- **Query:** Same as project audit
- **Response:** Same format as project audit

---

---

## Document Uploads (Sprint 4)

### `GET /api/projects/:id/uploads`
- **Auth:** Required (must be project member or org member)
- **Query:** `?category=reference` (optional filter)
- **Response:** `{ data: Document[] }`

### `POST /api/projects/:id/uploads`
- **Auth:** Required (must be org member)
- **Body:** `multipart/form-data` with fields:
  - `file` (required) — The file to upload (max 50 MB, PDF/Word/Excel/TXT/CSV)
  - `organization_id` (required) — UUID
  - `project_id` (optional) — UUID, defaults to `:id`
  - `category` (optional) — `"policy" | "specification" | "template" | "reference"`, default `"reference"`
  - `name` (optional) — Display name, defaults to filename
- **Response (201):** `{ data: Document }`
- **Errors:** 400 (validation), 400 (file too large), 400 (unsupported type)
- **Note:** Text content is extracted for plain text files. Other formats are processed by the RAG pipeline.

### `GET /api/projects/:id/uploads/:documentId`
- **Auth:** Required (must be project member or org member)
- **Response:** `{ data: Document }`
- **Errors:** 404 (not found)

### `DELETE /api/projects/:id/uploads/:documentId`
- **Auth:** Required (must be org member)
- **Response:** `{ data: { message: "Document verwijderd" } }`
- **Note:** Soft delete (sets deleted_at). Removes associated chunks.

---

## TenderNed Search (Sprint 4)

### `GET /api/tenderned`
- **Auth:** Required
- **Query:**
  - `query` (required) — Search term (min 2 chars)
  - `procedure_type` (optional) — Filter by procedure type
  - `cpv_code` (optional) — Filter by CPV code
  - `limit` (optional) — Results per page (1-50, default 10)
  - `offset` (optional) — Pagination offset (default 0)
- **Response:** `{ data: { items: TenderNedItem[], total: number } }`
- **Errors:** 400 (validation)

---

## Context Search (Sprint 4 — updated)

### `POST /api/context-search`
- **Auth:** Required
- **Body:** `{ query: string, project_id?: string, organization_id?: string, limit?: number }`
- **Response:** `{ data: ContextSearchResult[] }`
- **Note:** Updated in Sprint 4 to use RAG pipeline with embedding-based semantic search. Falls back to text search when embeddings are unavailable. Added `organization_id` filter.

---

## Type Definitions

See `src/lib/types/` for full TypeScript type definitions:
- `database.ts` — Row types for all tables (includes DocumentChunk, TenderNedChunk)
- `api.ts` — Request/response types (includes upload & TenderNed types)
- `enums.ts` — All enum values (includes 'upload' audit action)
