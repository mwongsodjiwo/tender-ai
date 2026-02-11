# Planningstool — Sprintplan

> **Doel:** Een complete planningslaag toevoegen aan TenderManager waarmee gebruikers projecttijdlijnen visueel beheren, deadlines bewaken, en AI-gestuurde planningssuggesties ontvangen — zowel op project- als organisatieniveau.

---

## Overzicht features & prioriteit

| # | Feature | Prioriteit | Sprint |
|---|---------|-----------|--------|
| 1 | Datamodel & infrastructuur | Fundament | Sprint 1 |
| 2 | Deadline-tracker | Hoog | Sprint 2 |
| 3 | Gantt / projecttijdlijn | Hoog | Sprint 3 |
| 4 | AI-planningssuggesties | Hoog | Sprint 4 |
| 5 | Cross-project planning dashboard | Medium | Sprint 5 |
| 6 | Afhankelijkheden & kritiek pad | Medium | Sprint 6 |
| 7 | Teamworkload-view | Medium | Sprint 7 |
| 8 | Notificaties & integraties | Laag | Sprint 8 |

---

## Sprint 1 — Fundament: Datamodel & Infrastructuur

### Doel
De database uitbreiden met alles wat de planningsfeatures nodig hebben: milestones, afhankelijkheden, planning-metadata, en de basis-API's.

### Agent-verdeling
- **Agent 1 (Backend):** Database migraties, RLS policies, API endpoints
- **Agent 2 (Frontend):** Geen werk deze sprint
- **Agent 3 (AI):** Schema-analyse voor AI-planningscontext
- **Agent 4 (DevOps):** Migratie-tests, seed data

---

### Stap 1.1 — Database migratie: `milestones` tabel

Milestones zijn de ankerpunten in een aanbestedingsplanning — publicatiedatum, inschrijfdeadline, gunningsbesluit, etc.

```sql
-- Migratie: 20260212_planning_milestones.sql

CREATE TYPE milestone_type AS ENUM (
    'phase_start',       -- Start van een fase
    'phase_end',         -- Einde van een fase
    'publication',       -- Publicatie op TenderNed
    'submission_deadline', -- Inschrijfdeadline
    'nota_van_inlichtingen', -- NvI deadline
    'award_decision',    -- Gunningsbesluit
    'standstill_end',    -- Einde standstill-termijn
    'contract_signed',   -- Contract ondertekend
    'custom'             -- Vrij definieerbaar
);

CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_type milestone_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    target_date DATE NOT NULL,
    actual_date DATE,                     -- Werkelijke datum (achteraf invullen)
    phase project_phase,                  -- Optionele koppeling aan fase
    is_critical BOOLEAN DEFAULT false,    -- Blokkeert dit andere milestones?
    status activity_status NOT NULL DEFAULT 'not_started',
    sort_order INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_milestones_date ON milestones(target_date);
CREATE INDEX idx_milestones_type ON milestones(milestone_type);
CREATE INDEX idx_milestones_project_phase ON milestones(project_id, phase);
```

**RLS Policies:**
```sql
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Lezen: alle projectleden
CREATE POLICY milestones_select ON milestones FOR SELECT
    USING (project_id IN (
        SELECT pm.project_id FROM project_members pm
        WHERE pm.profile_id = auth.uid()
    ));

-- Schrijven: project_leader en procurement_advisor
CREATE POLICY milestones_insert ON milestones FOR INSERT
    WITH CHECK (project_id IN (
        SELECT pm.project_id FROM project_members pm
        JOIN project_member_roles pmr ON pmr.project_member_id = pm.id
        WHERE pm.profile_id = auth.uid()
        AND pmr.role IN ('project_leader', 'procurement_advisor')
    ));

-- Idem voor UPDATE en DELETE
```

---

### Stap 1.2 — Database migratie: `activity_dependencies` tabel

Legt vast welke activiteiten/milestones afhankelijk zijn van elkaar.

```sql
-- Migratie: 20260212_activity_dependencies.sql

CREATE TYPE dependency_type AS ENUM (
    'finish_to_start',   -- B start pas als A klaar is (meest voorkomend)
    'start_to_start',    -- B start tegelijk met A
    'finish_to_finish',  -- B eindigt tegelijk met A
    'start_to_finish'    -- B eindigt als A start (zeldzaam)
);

CREATE TABLE activity_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Bron (predecessor): kan een phase_activity OF milestone zijn
    source_type TEXT NOT NULL CHECK (source_type IN ('activity', 'milestone')),
    source_id UUID NOT NULL,

    -- Doel (successor): idem
    target_type TEXT NOT NULL CHECK (target_type IN ('activity', 'milestone')),
    target_id UUID NOT NULL,

    dependency_type dependency_type NOT NULL DEFAULT 'finish_to_start',
    lag_days INT DEFAULT 0,          -- Wachttijd in dagen (kan negatief)

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Voorkom dubbele afhankelijkheden
    UNIQUE(source_type, source_id, target_type, target_id)
);

CREATE INDEX idx_deps_project ON activity_dependencies(project_id);
CREATE INDEX idx_deps_source ON activity_dependencies(source_type, source_id);
CREATE INDEX idx_deps_target ON activity_dependencies(target_type, target_id);
```

---

### Stap 1.3 — Uitbreiden `phase_activities` tabel

Voeg planning-specifieke kolommen toe aan de bestaande tabel.

```sql
-- Migratie: 20260212_extend_phase_activities.sql

ALTER TABLE phase_activities
    ADD COLUMN planned_start DATE,
    ADD COLUMN planned_end DATE,
    ADD COLUMN actual_start DATE,
    ADD COLUMN actual_end DATE,
    ADD COLUMN estimated_hours NUMERIC(6,1),     -- Geschatte uren
    ADD COLUMN progress_percentage INT DEFAULT 0  -- 0-100
        CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- Index voor tijdlijn-queries
CREATE INDEX idx_phase_activities_dates
    ON phase_activities(project_id, planned_start, planned_end);
```

---

### Stap 1.4 — Uitbreiden `project_profiles` tabel

Extra planning-metadata op projectniveau.

```sql
-- Migratie: 20260212_extend_project_profiles.sql

ALTER TABLE project_profiles
    ADD COLUMN planning_generated_at TIMESTAMPTZ,     -- Wanneer AI planning aanmaakte
    ADD COLUMN planning_approved BOOLEAN DEFAULT false,
    ADD COLUMN planning_approved_at TIMESTAMPTZ,
    ADD COLUMN planning_approved_by UUID REFERENCES profiles(id),
    ADD COLUMN planning_metadata JSONB DEFAULT '{}';  -- AI-context, parameters
```

---

### Stap 1.5 — TypeScript types uitbreiden

**Bestand:** `src/lib/types/database.ts`

```typescript
// Nieuw
export type MilestoneType =
    | 'phase_start' | 'phase_end' | 'publication'
    | 'submission_deadline' | 'nota_van_inlichtingen'
    | 'award_decision' | 'standstill_end'
    | 'contract_signed' | 'custom';

export type DependencyType =
    | 'finish_to_start' | 'start_to_start'
    | 'finish_to_finish' | 'start_to_finish';

export interface Milestone {
    id: string;
    project_id: string;
    milestone_type: MilestoneType;
    title: string;
    description: string;
    target_date: string;
    actual_date: string | null;
    phase: ProjectPhase | null;
    is_critical: boolean;
    status: ActivityStatus;
    sort_order: number;
    metadata: Record<string, unknown>;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface ActivityDependency {
    id: string;
    project_id: string;
    source_type: 'activity' | 'milestone';
    source_id: string;
    target_type: 'activity' | 'milestone';
    target_id: string;
    dependency_type: DependencyType;
    lag_days: number;
    created_at: string;
    updated_at: string;
}

// Uitbreiding bestaand PhaseActivity interface
export interface PhaseActivityPlanning extends PhaseActivity {
    planned_start: string | null;
    planned_end: string | null;
    actual_start: string | null;
    actual_end: string | null;
    estimated_hours: number | null;
    progress_percentage: number;
}
```

**Bestand:** `src/lib/types/enums.ts`

```typescript
export const MILESTONE_TYPES = [
    'phase_start', 'phase_end', 'publication',
    'submission_deadline', 'nota_van_inlichtingen',
    'award_decision', 'standstill_end',
    'contract_signed', 'custom'
] as const;

export const MILESTONE_TYPE_LABELS: Record<MilestoneType, string> = {
    phase_start: 'Fase start',
    phase_end: 'Fase einde',
    publication: 'Publicatie',
    submission_deadline: 'Inschrijfdeadline',
    nota_van_inlichtingen: 'Nota van Inlichtingen',
    award_decision: 'Gunningsbesluit',
    standstill_end: 'Einde standstill',
    contract_signed: 'Contract getekend',
    custom: 'Aangepast'
};

export const DEPENDENCY_TYPES = [
    'finish_to_start', 'start_to_start',
    'finish_to_finish', 'start_to_finish'
] as const;

export const DEPENDENCY_TYPE_LABELS: Record<DependencyType, string> = {
    finish_to_start: 'Einde → Start',
    start_to_start: 'Start → Start',
    finish_to_finish: 'Einde → Einde',
    start_to_finish: 'Start → Einde'
};
```

---

### Stap 1.6 — Zod validatieschema's

**Bestand:** `src/lib/server/api/validation.ts`

```typescript
export const createMilestoneSchema = z.object({
    milestone_type: z.enum(MILESTONE_TYPES),
    title: z.string().min(1).max(300),
    description: z.string().max(2000).optional().default(''),
    target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    actual_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    phase: z.enum(PROJECT_PHASES).nullable().optional(),
    is_critical: z.boolean().optional().default(false),
    status: z.enum(ACTIVITY_STATUSES).optional().default('not_started'),
    sort_order: z.number().int().min(0).optional().default(0),
    metadata: z.record(z.unknown()).optional().default({})
});

export const updateMilestoneSchema = createMilestoneSchema.partial();

export const createDependencySchema = z.object({
    source_type: z.enum(['activity', 'milestone']),
    source_id: z.string().uuid(),
    target_type: z.enum(['activity', 'milestone']),
    target_id: z.string().uuid(),
    dependency_type: z.enum(DEPENDENCY_TYPES).optional().default('finish_to_start'),
    lag_days: z.number().int().min(-365).max(365).optional().default(0)
});
```

---

### Stap 1.7 — API endpoints

**Milestones CRUD:**

| Methode | Route | Beschrijving |
|---------|-------|-------------|
| GET | `/api/projects/[id]/milestones` | Alle milestones van project |
| POST | `/api/projects/[id]/milestones` | Nieuwe milestone |
| GET | `/api/projects/[id]/milestones/[milestoneId]` | Enkele milestone |
| PATCH | `/api/projects/[id]/milestones/[milestoneId]` | Update milestone |
| DELETE | `/api/projects/[id]/milestones/[milestoneId]` | Soft delete |

**Dependencies CRUD:**

| Methode | Route | Beschrijving |
|---------|-------|-------------|
| GET | `/api/projects/[id]/dependencies` | Alle afhankelijkheden |
| POST | `/api/projects/[id]/dependencies` | Nieuwe afhankelijkheid |
| DELETE | `/api/projects/[id]/dependencies/[depId]` | Verwijder afhankelijkheid |

**Planning overview (read-only aggregatie):**

| Methode | Route | Beschrijving |
|---------|-------|-------------|
| GET | `/api/projects/[id]/planning` | Gecombineerde tijdlijn-data |
| GET | `/api/planning/overview` | Cross-project overzicht |

---

### Stap 1.8 — Seed data: standaard milestones per procedure-type

Maak een utility die bij projectcreatie standaard milestones aanmaakt op basis van het gekozen procedure-type:

```typescript
// src/lib/server/planning/default-milestones.ts

export const DEFAULT_MILESTONES: Record<ProcedureType, Partial<Milestone>[]> = {
    open: [
        { milestone_type: 'phase_start', title: 'Start voorbereiding', phase: 'preparing' },
        { milestone_type: 'publication', title: 'Publicatie op TenderNed', phase: 'tendering', is_critical: true },
        { milestone_type: 'nota_van_inlichtingen', title: 'Deadline NvI-vragen', phase: 'tendering' },
        { milestone_type: 'submission_deadline', title: 'Inschrijfdeadline', phase: 'tendering', is_critical: true },
        { milestone_type: 'award_decision', title: 'Gunningsbesluit', phase: 'tendering', is_critical: true },
        { milestone_type: 'standstill_end', title: 'Einde Alcatel-termijn', phase: 'tendering' },
        { milestone_type: 'contract_signed', title: 'Contractondertekening', phase: 'contracting', is_critical: true }
    ],
    restricted: [
        // Idem + selectiefase milestones
        { milestone_type: 'custom', title: 'Selectieleidraad publicatie', phase: 'tendering', is_critical: true },
        { milestone_type: 'custom', title: 'Selectiebesluit', phase: 'tendering', is_critical: true },
        // ...
    ],
    national_open: [
        // Vergelijkbaar met 'open' maar met kortere termijnen (nationaal)
        // ...
    ],
    national_restricted: [
        // Vergelijkbaar met 'restricted' maar nationaal
        // ...
    ],
    // ... overige: negotiated_with_publication, negotiated_without_publication,
    //     competitive_dialogue, innovation_partnership, single_source
};
```

---

### Acceptatiecriteria Sprint 1

- [ ] Alle migraties draaien foutloos op Supabase
- [ ] RLS policies correct geconfigureerd en getest
- [ ] TypeScript types matchen 1:1 met database schema
- [ ] Zod validatie dekt alle edge cases
- [ ] CRUD endpoints werken voor milestones en dependencies
- [ ] Seed data beschikbaar voor alle procedure-types
- [ ] Audit logging actief voor alle mutaties

---

## Sprint 2 — Deadline-tracker

### Doel
Een overzichtelijke deadline-view die zowel op project- als organisatieniveau werkt. Snelle winst met hoge waarde — iedereen wil weten: "wat moet er deze week gebeuren?"

### Agent-verdeling
- **Agent 1 (Backend):** Deadline-aggregatie API, filtering, sortering
- **Agent 2 (Frontend):** DeadlineTracker component, kalenderview, lijst-view
- **Agent 3 (AI):** Geen werk deze sprint
- **Agent 4 (DevOps):** Component tests

---

### Stap 2.1 — Backend: deadline-aggregatie endpoint

```typescript
// GET /api/planning/deadlines?range=week|month|quarter&from=2026-02-10&project_id=xxx

interface DeadlineItem {
    id: string;
    type: 'milestone' | 'activity';
    title: string;
    date: string;                    // target_date of due_date
    project_id: string;
    project_name: string;
    phase: ProjectPhase;
    status: ActivityStatus;
    is_critical: boolean;
    assigned_to: string | null;      // Profile ID
    assigned_to_name: string | null; // full_name uit profiles tabel
    days_remaining: number;          // Berekend veld
    is_overdue: boolean;
}

interface DeadlineResponse {
    items: DeadlineItem[];
    summary: {
        total: number;
        overdue: number;
        this_week: number;
        critical: number;
    };
}
```

De API combineert data uit `milestones` en `phase_activities` (waar `due_date IS NOT NULL`), sorteert op datum, en voegt project-informatie toe via een JOIN.

---

### Stap 2.2 — Component: `DeadlineList.svelte`

Een lijstweergave met kleurcodes en filters:

```
Bestandslocatie: src/lib/components/planning/DeadlineList.svelte

Props:
- items: DeadlineItem[]
- view: 'compact' | 'detailed'
- onItemClick: (item) => void

Visueel:
┌──────────────────────────────────────────────────┐
│ 📋 Deadlines                    [Week ▾] [Filter]│
├──────────────────────────────────────────────────┤
│ 🔴 VERLOPEN                                      │
│   ├─ PvE afronden          Project X    -3 dagen │
│   └─ NvI beantwoorden      Project Y    -1 dag   │
│                                                   │
│ 🟠 DEZE WEEK                                     │
│   ├─ Marktverkenning klaar  Project X    2 dagen  │
│   └─ Publicatie TenderNed   Project Z    5 dagen  │
│                                                   │
│ 🟢 KOMENDE                                       │
│   ├─ Inschrijfdeadline      Project Z   14 dagen  │
│   └─ Gunningsbesluit        Project Y   21 dagen  │
└──────────────────────────────────────────────────┘
```

Kleurlogica:
- **Rood:** `days_remaining < 0` (verlopen)
- **Oranje:** `days_remaining <= 7` (deze week)
- **Geel:** `days_remaining <= 14` (komende twee weken)
- **Groen:** `days_remaining > 14`
- **Ster-icoon** bij `is_critical: true`

---

### Stap 2.3 — Component: `DeadlineCalendar.svelte`

Maandkalender met deadline-markers:

```
Bestandslocatie: src/lib/components/planning/DeadlineCalendar.svelte

Props:
- items: DeadlineItem[]
- month: Date
- onDateClick: (date) => void
- onItemClick: (item) => void

Visueel:
┌─────────────────────────────────────────────────┐
│  ◀  Februari 2026  ▶                             │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┤
│  Ma  │  Di  │  Wo  │  Do  │  Vr  │  Za  │  Zo  │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│      │      │      │      │      │      │   1  │
│   2  │   3  │   4  │   5  │   6  │   7  │   8  │
│   9  │  10  │  11  │ [12] │  13  │  14  │  15  │
│      │      │ 📍   │ 🔴●● │      │      │      │
│  16  │  17  │  18  │  19  │  20  │  21  │  22  │
│      │      │      │ 🟠●  │      │      │      │
│  23  │  24  │  25  │  26  │  27  │  28  │      │
│      │      │ 🟢●  │      │ ⭐●  │      │      │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘

Klik op een dag → popover met deadline-details
```

---

### Stap 2.4 — Pagina: `/projects/[id]/planning`

Nieuwe route binnen het project:

```
Bestandslocatie: src/routes/(app)/projects/[id]/planning/+page.svelte

Layout:
┌──────────────────────────────────────────────────┐
│ Project X > Planning                              │
├──────────────────────────────────────────────────┤
│ [Deadlines] [Tijdlijn] [AI Suggesties]           │ ← Tabs (Tijdlijn/AI volgen later)
├──────────────────────────────────────────────────┤
│                                                   │
│  Deadline-view (lijst of kalender, toggle)        │
│                                                   │
│  + Milestone toevoegen                            │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Page server load:**
```typescript
// +page.server.ts
export const load: PageServerLoad = async ({ params, locals }) => {
    const [milestones, activities, dependencies] = await Promise.all([
        supabase.from('milestones').select('*')
            .eq('project_id', params.id)
            .is('deleted_at', null)
            .order('target_date'),
        supabase.from('phase_activities').select('*')
            .eq('project_id', params.id)
            .is('deleted_at', null)
            .not('due_date', 'is', null)
            .order('due_date'),
        supabase.from('activity_dependencies').select('*')
            .eq('project_id', params.id)
    ]);

    return { milestones, activities, dependencies };
};
```

---

### Stap 2.5 — Organisatie-brede deadline-widget op dashboard

Uitbreiding van het bestaande dashboard (`/dashboard`):

```typescript
// Toevoegen aan dashboard/+page.server.ts
const upcomingDeadlines = await supabase.rpc('get_upcoming_deadlines', {
    org_id: organization.id,
    days_ahead: 30
});
```

Stored procedure die milestones en activiteiten over alle projecten combineert:

```sql
CREATE OR REPLACE FUNCTION get_upcoming_deadlines(
    org_id UUID,
    days_ahead INT DEFAULT 30
) RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    date DATE,
    project_id UUID,
    project_name TEXT,
    phase project_phase,
    status activity_status,
    is_critical BOOLEAN,
    days_remaining INT
) AS $$
BEGIN
    RETURN QUERY
    -- Milestones
    SELECT m.id, 'milestone'::TEXT, m.title, m.target_date,
           p.id, p.name, m.phase, m.status, m.is_critical,
           (m.target_date - CURRENT_DATE)::INT
    FROM milestones m
    JOIN projects p ON p.id = m.project_id
    WHERE p.organization_id = org_id
      AND m.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND m.target_date <= CURRENT_DATE + days_ahead
      AND m.status != 'completed'

    UNION ALL

    -- Activities met due_date
    SELECT a.id, 'activity'::TEXT, a.title, a.due_date,
           p.id, p.name, a.phase, a.status, false,
           (a.due_date - CURRENT_DATE)::INT
    FROM phase_activities a
    JOIN projects p ON p.id = a.project_id
    WHERE p.organization_id = org_id
      AND a.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND a.due_date IS NOT NULL
      AND a.due_date <= CURRENT_DATE + days_ahead
      AND a.status NOT IN ('completed', 'skipped')

    ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Acceptatiecriteria Sprint 2

- [ ] Deadline-lijst toont milestones + activiteiten gecombineerd
- [ ] Kleurcodes correct (rood/oranje/geel/groen)
- [ ] Kalenderweergave toont markers op juiste dagen
- [ ] Filtering op project, fase, status werkt
- [ ] Dashboard-widget toont organisatie-brede deadlines
- [ ] Milestone CRUD werkt vanuit de planning-pagina
- [ ] Verlopen deadlines worden prominent getoond

---

## Sprint 3 — Gantt / Projecttijdlijn

### Doel
Een interactieve Gantt-chart per project die fasen, activiteiten en milestones op een horizontale tijdlijn toont. Drag-and-drop voor herschikken.

### Agent-verdeling
- **Agent 1 (Backend):** Planning-aggregatie endpoint, datum-herberekening
- **Agent 2 (Frontend):** GanttChart component, interactie, responsive design
- **Agent 3 (AI):** Geen werk deze sprint
- **Agent 4 (DevOps):** Visual regression tests

---

### Stap 3.1 — Technologiekeuze Gantt-chart

**Aanbeveling: custom SVG-component met d3-scale**

Waarom geen bestaande library:
- `gantt-task-react` / `frappe-gantt` → lastig te integreren met Svelte 5
- Custom geeft volledige controle over styling (Remote.com design system)
- d3-scale doet het zware rekenwerk (tijdas → pixels)

```bash
npm install d3-scale d3-time d3-time-format
```

---

### Stap 3.2 — Backend: planning-aggregatie endpoint

```typescript
// GET /api/projects/[id]/planning

interface PlanningTimelineData {
    project: {
        id: string;
        name: string;
        timeline_start: string;
        timeline_end: string;
        current_phase: ProjectPhase;
    };
    phases: {
        phase: ProjectPhase;
        label: string;
        start_date: string | null;   // Vroegste activiteit/milestone
        end_date: string | null;     // Laatste activiteit/milestone
        progress: number;            // 0-100
        activities: PhaseActivityPlanning[];
        milestones: Milestone[];
    }[];
    dependencies: ActivityDependency[];
    summary: {
        total_activities: number;
        completed_activities: number;
        total_milestones: number;
        completed_milestones: number;
        overall_progress: number;
        days_remaining: number;
        is_on_track: boolean;
    };
}
```

---

### Stap 3.3 — Component: `GanttChart.svelte`

```
Bestandslocatie: src/lib/components/planning/GanttChart.svelte

Props:
- data: PlanningTimelineData
- viewMode: 'day' | 'week' | 'month'
- onActivityUpdate: (id, changes) => void
- onMilestoneClick: (milestone) => void
- readonly: boolean

Visueel:
┌───────────────────────────────────────────────────────────────────┐
│ Tijdlijn Project X          [Dag|Week|Maand]  [Vandaag]  [⤢]    │
├─────────────────┬─────────────────────────────────────────────────┤
│                 │ Feb          Mrt          Apr          Mei      │
│                 │ 10  17  24  3   10  17  24 31  7   14  21      │
├─────────────────┼─────────────────────────────────────────────────┤
│ ▼ VOORBEREIDEN  │ ██████████████████░░░░░                        │
│   Behoeftestell │     ████████                                    │
│   Inkoopstrateg │          ██████████                             │
│   ◆ Start publi │              ◆                                  │
│                 │                                                  │
│ ▼ VERKENNEN     │                  ████████████████               │
│   Deskresearch  │                  ████████                       │
│   Marktconsult  │                       █████████                 │
│   ◆ NvI deadlin │                              ◆                  │
│                 │              │                                   │
│ ▶ SPECIFICEREN  │                               ░░░░░░░░░░░░░░░  │
│ ▶ AANBESTEDEN   │                                          ░░░░░ │
│ ▶ CONTRACTEREN  │                                              ░░│
├─────────────────┼─────────────────────────────────────────────────┤
│                 │              ▼ vandaag                           │
└─────────────────┴─────────────────────────────────────────────────┘

Legenda:
██ = Gepland (gevuld = voortgang, leeg = resterend)
░░ = Toekomstig (niet gestart)
◆  = Milestone
│  = Vandaag-lijn
```

---

### Stap 3.4 — Gantt subcomponenten

```
src/lib/components/planning/
├── GanttChart.svelte           ← Hoofdcontainer
├── GanttHeader.svelte          ← Tijdas (dagen/weken/maanden)
├── GanttPhaseRow.svelte        ← Inklapbare fase-rij
├── GanttActivityBar.svelte     ← Activiteit-balk (draggable)
├── GanttMilestoneMarker.svelte ← Diamant-marker voor milestones
├── GanttDependencyLine.svelte  ← SVG pijl tussen items
├── GanttTodayLine.svelte       ← Rode verticale "vandaag" lijn
└── gantt-utils.ts              ← Scale berekeningen, datum helpers
```

**gantt-utils.ts kernfuncties:**
```typescript
import { scaleTime } from 'd3-scale';

export function createTimeScale(
    startDate: Date,
    endDate: Date,
    width: number
) {
    return scaleTime()
        .domain([startDate, endDate])
        .range([0, width]);
}

export function dateToX(scale: ScaleTime, date: Date): number {
    return scale(date);
}

export function calculateBarWidth(
    scale: ScaleTime,
    start: Date,
    end: Date
): number {
    return scale(end) - scale(start);
}

export function snapToGrid(
    x: number,
    viewMode: 'day' | 'week' | 'month',
    scale: ScaleTime
): Date {
    // Snap naar dichtstbijzijnde dag/week/maand
}
```

---

### Stap 3.5 — Drag-and-drop interactie

Activiteitbalken zijn horizontaal versleepbaar (wijzigt `planned_start` en `planned_end`). Gebruik Svelte 5 `$effect` en pointer events:

```typescript
// In GanttActivityBar.svelte
// NB: Codebase gebruikt Svelte "classic" syntax (export let, $:) — geen runes

export let activity: PhaseActivityPlanning;
export let readonly: boolean = false;
export let dayWidth: number;
export let onActivityUpdate: (id: string, changes: Partial<PhaseActivityPlanning>) => void;

let isDragging = false;
let dragStartX = 0;
let originalStart: Date;
let originalEnd: Date;

function onPointerDown(e: PointerEvent) {
    if (readonly) return;
    isDragging = true;
    dragStartX = e.clientX;
    originalStart = new Date(activity.planned_start);
    originalEnd = new Date(activity.planned_end);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
}

function onPointerMove(e: PointerEvent) {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    const deltaDays = Math.round(deltaX / dayWidth);
    // Preview nieuwe positie (reactief via $: bindings)
}

function onPointerUp(e: PointerEvent) {
    if (!isDragging) return;
    isDragging = false;
    // PATCH /api/projects/:id/activities/:activityId
    onActivityUpdate(activity.id, {
        planned_start: newStart.toISOString().split('T')[0],
        planned_end: newEnd.toISOString().split('T')[0]
    });
}
```

---

### Stap 3.6 — "Vandaag" indicator en voortgangsberekening

De rode "vandaag"-lijn en progressie per fase:

```typescript
// Voortgang per fase berekenen
function calculatePhaseProgress(activities: PhaseActivityPlanning[]): number {
    if (activities.length === 0) return 0;

    const totalWeight = activities.reduce((sum, a) => {
        // Activiteiten met meer geschatte uren wegen zwaarder
        return sum + (a.estimated_hours || 1);
    }, 0);

    const completedWeight = activities.reduce((sum, a) => {
        const weight = a.estimated_hours || 1;
        return sum + (weight * a.progress_percentage / 100);
    }, 0);

    return Math.round(completedWeight / totalWeight * 100);
}

// Is het project "on track"?
function isOnTrack(data: PlanningTimelineData): boolean {
    const today = new Date();
    // Check of elke activiteit die nu gepland staat
    // ook daadwerkelijk de verwachte voortgang heeft
    return data.phases.every(phase => {
        return phase.activities
            .filter(a => new Date(a.planned_start) <= today)
            .every(a => {
                const expectedProgress = calculateExpectedProgress(a, today);
                return a.progress_percentage >= expectedProgress * 0.8; // 20% marge
            });
    });
}
```

---

### Stap 3.7 — Tab-integratie op planning-pagina

Update de planning-pagina uit Sprint 2 met de Gantt-tab:

```svelte
<!-- src/routes/(app)/projects/[id]/planning/+page.svelte -->
<script lang="ts">
    // NB: Codebase gebruikt classic Svelte syntax
    let activeTab: 'deadlines' | 'timeline' | 'ai' = 'timeline';
</script>

<div class="tabs">
    <button class:active={activeTab === 'deadlines'} onclick={() => activeTab = 'deadlines'}>
        Deadlines
    </button>
    <button class:active={activeTab === 'timeline'} onclick={() => activeTab = 'timeline'}>
        Tijdlijn
    </button>
    <button class:active={activeTab === 'ai'} onclick={() => activeTab = 'ai'} disabled>
        AI Suggesties
    </button>
</div>

{#if activeTab === 'deadlines'}
    <DeadlineList items={deadlineItems} />
{:else if activeTab === 'timeline'}
    <GanttChart data={timelineData} viewMode="week" />
{/if}
```

---

### Acceptatiecriteria Sprint 3

- [ ] Gantt-chart rendert fasen als groepen met activiteiten als balken
- [ ] Milestones tonen als diamant-markers op correcte datum
- [ ] Tijdas schaalt correct bij dag/week/maand view
- [ ] Drag-and-drop wijzigt activiteitdatums en slaat op via API
- [ ] "Vandaag"-lijn is altijd zichtbaar en scrollt mee
- [ ] Voortgangspercentage is visueel zichtbaar per balk
- [ ] Afhankelijkheidspijlen tekenen correct (als dependencies bestaan)
- [ ] Responsive: horizontaal scrollbaar op kleinere schermen

---

## Sprint 4 — AI-planningssuggesties

### Doel
Na de briefing stelt de AI automatisch een realistisch faseschema voor, inclusief geschatte duur per fase, milestones, en activiteiten — gebaseerd op procedure-type, scope, en vergelijkbare tenders uit de kennisbank.

### Agent-verdeling
- **Agent 1 (Backend):** AI-planning endpoint, template-systeem
- **Agent 2 (Frontend):** PlanningWizard component, review-flow
- **Agent 3 (AI):** Prompt engineering, RAG context, planning-logica
- **Agent 4 (DevOps):** Integration tests, prompt evaluatie

---

### Stap 4.1 — AI planning-context ophalen

Voordat de AI een planning kan voorstellen, moet er context verzameld worden:

```typescript
// src/lib/server/planning/ai-planning-context.ts

interface PlanningContext {
    // Project-specifiek
    project_profile: ProjectProfile;
    procedure_type: ProcedureType;
    estimated_value: number;
    scope_description: string;

    // Wettelijke termijnen (hard-coded per procedure-type)
    legal_minimums: {
        publication_period_days: number;        // Min. publicatietermijn
        nvi_response_days: number;              // Min. NvI beantwoordtermijn
        standstill_days: number;                // Alcatel-termijn (20 dagen)
        selection_period_days?: number;          // Bij niet-openbaar
    };

    // Kennisbank: vergelijkbare tenders
    similar_tenders: {
        title: string;
        procedure_type: string;
        estimated_value: number;
        publication_date: string;
        deadline_date: string;
        duration_days: number;
    }[];

    // Team-beschikbaarheid
    team_size: number;
    team_roles: string[];
}

export async function gatherPlanningContext(
    supabase: SupabaseClient,
    projectId: string
): Promise<PlanningContext> {
    const [profile, project, members, similarTenders] = await Promise.all([
        getProjectProfile(supabase, projectId),
        getProject(supabase, projectId),
        getProjectMembers(supabase, projectId),
        findSimilarTenders(supabase, projectId) // Via embeddings/CPV codes
    ]);

    return {
        project_profile: profile,
        procedure_type: project.procedure_type,
        estimated_value: project.estimated_value,
        scope_description: profile.scope_description,
        legal_minimums: getLegalMinimums(project.procedure_type),
        similar_tenders: similarTenders,
        team_size: members.length,
        team_roles: members.flatMap(m => m.roles)
    };
}
```

---

### Stap 4.2 — Wettelijke minimumtermijnen

Harde constraints die de AI moet respecteren:

```typescript
// src/lib/server/planning/legal-constraints.ts

export function getLegalMinimums(procedureType: ProcedureType) {
    // ProcedureType enum waarden: 'open', 'restricted',
    // 'negotiated_with_publication', 'negotiated_without_publication',
    // 'competitive_dialogue', 'innovation_partnership',
    // 'national_open', 'national_restricted', 'single_source'

    const MINIMUMS: Record<ProcedureType, LegalMinimums> = {
        open: {
            publication_period_days: 45, // EU-drempel: 45 dagen (35 met TenderNed)
            nvi_response_days: 6,
            standstill_days: 20
        },
        restricted: {
            publication_period_days: 30, // Selectiefase
            selection_period_days: 30,
            nvi_response_days: 6,
            standstill_days: 20
        },
        negotiated_with_publication: {
            publication_period_days: 30,
            nvi_response_days: 6,
            standstill_days: 20
        },
        negotiated_without_publication: {
            publication_period_days: 0,
            nvi_response_days: 0,
            standstill_days: 0
        },
        competitive_dialogue: {
            publication_period_days: 30,
            nvi_response_days: 6,
            standstill_days: 20,
            dialogue_rounds: 3  // Extra parameter
        },
        innovation_partnership: {
            publication_period_days: 30,
            nvi_response_days: 6,
            standstill_days: 20
        },
        national_open: {
            publication_period_days: 20, // Nationale drempel: kortere termijn
            nvi_response_days: 6,
            standstill_days: 20
        },
        national_restricted: {
            publication_period_days: 15,
            selection_period_days: 15,
            nvi_response_days: 6,
            standstill_days: 20
        },
        single_source: {
            publication_period_days: 0,
            nvi_response_days: 0,
            standstill_days: 0
        }
    };

    return MINIMUMS[procedureType];
}
```

---

### Stap 4.3 — AI prompt voor planningsgeneratie

```typescript
// src/lib/server/planning/ai-planning-prompt.ts

export function buildPlanningPrompt(context: PlanningContext): string {
    return `
Je bent een ervaren inkoopadviseur die een realistische planning maakt voor een
aanbestedingstraject. Gebruik de volgende context:

## Projectinformatie
- Procedure: ${context.procedure_type}
- Geschatte waarde: €${context.estimated_value?.toLocaleString('nl-NL')}
- Scope: ${context.scope_description}
- Teamgrootte: ${context.team_size} personen (${context.team_roles.join(', ')})

## Wettelijke minimumtermijnen
${JSON.stringify(context.legal_minimums, null, 2)}

## Vergelijkbare tenders (referentie)
${context.similar_tenders.map(t =>
    `- "${t.title}": ${t.duration_days} dagen totaal`
).join('\n')}

## Opdracht
Maak een planning met:
1. Start- en einddatum per fase (voorbereiden, verkennen, specificeren, aanbesteden, contracteren)
2. Concrete activiteiten per fase met geschatte duur in werkdagen
3. Milestones met data
4. Afhankelijkheden tussen activiteiten

Houd rekening met:
- Wettelijke minimumtermijnen zijn HARD — deze mogen niet korter
- Voeg buffer toe voor reviews en goedkeuringen (min. 5 werkdagen per review)
- Parallelle activiteiten waar mogelijk (bijv. PvE en EMVI tegelijk)
- Vakantieperiodes (zomer: juli-aug, kerst: dec)
- De wenselijke startdatum is: ${context.project_profile.timeline_start || 'zo snel mogelijk'}
- De gewenste einddatum is: ${context.project_profile.timeline_end || 'niet gespecificeerd'}

Geef je antwoord als JSON in het volgende formaat:
${PLANNING_JSON_SCHEMA}
`;
}
```

---

### Stap 4.4 — API endpoint: AI planning genereren

```typescript
// POST /api/projects/[id]/planning/generate

interface GeneratePlanningRequest {
    target_start_date?: string;     // Gewenste startdatum
    target_end_date?: string;       // Gewenste einddatum
    preferences?: {
        buffer_days: number;         // Extra buffer per fase
        parallel_activities: boolean; // Activiteiten parallel plannen
        include_reviews: boolean;    // Review-momenten opnemen
    };
}

interface GeneratePlanningResponse {
    planning: {
        phases: {
            phase: ProjectPhase;
            start_date: string;
            end_date: string;
            activities: {
                title: string;
                description: string;
                activity_type: string;
                planned_start: string;
                planned_end: string;
                estimated_hours: number;
                assigned_role: string; // Welke rol dit moet doen
            }[];
            milestones: {
                milestone_type: MilestoneType;
                title: string;
                target_date: string;
                is_critical: boolean;
            }[];
        }[];
        dependencies: {
            from_title: string;
            to_title: string;
            type: DependencyType;
            lag_days: number;
        }[];
        total_duration_days: number;
        total_estimated_hours: number;
    };
    rationale: string; // AI-uitleg van keuzes
    warnings: string[]; // Bijv. "Planning is krap voor deze scope"
}
```

---

### Stap 4.5 — Component: `PlanningWizard.svelte`

Een stapsgewijze wizard die de AI-planning presenteert en de gebruiker laat reviewen/aanpassen:

```
Bestandslocatie: src/lib/components/planning/PlanningWizard.svelte

Stap 1: Parameters instellen
┌──────────────────────────────────────────────────┐
│ Planning genereren                                │
├──────────────────────────────────────────────────┤
│                                                   │
│  Gewenste startdatum:    [10-02-2026      📅]    │
│  Gewenste einddatum:     [30-06-2026      📅]    │
│                                                   │
│  ☑ Parallelle activiteiten waar mogelijk          │
│  ☑ Review-momenten opnemen                        │
│  Buffer per fase:        [5 werkdagen     ▾]     │
│                                                   │
│                    [Planning genereren →]          │
└──────────────────────────────────────────────────┘

Stap 2: AI-planning reviewen
┌──────────────────────────────────────────────────┐
│ Voorgestelde planning                   (AI 🤖)  │
├──────────────────────────────────────────────────┤
│                                                   │
│  [Gantt-preview van gegenereerde planning]        │
│                                                   │
│  💡 AI-toelichting:                               │
│  "Op basis van vergelijkbare tenders en de        │
│   scope van dit project stel ik een doorlooptijd  │
│   van 142 werkdagen voor..."                      │
│                                                   │
│  ⚠️ Waarschuwingen:                               │
│  - Publicatietermijn is exact op het minimum      │
│                                                   │
│  [Opnieuw genereren]  [Aanpassen]  [Toepassen ✓] │
└──────────────────────────────────────────────────┘

Stap 3: Bevestiging
┌──────────────────────────────────────────────────┐
│ Planning is toegepast ✅                          │
│                                                   │
│ 23 activiteiten aangemaakt                        │
│  7 milestones ingesteld                           │
│ 12 afhankelijkheden vastgelegd                    │
│                                                   │
│ [Bekijk in tijdlijn →]                            │
└──────────────────────────────────────────────────┘
```

---

### Stap 4.6 — Planning toepassen (bulk insert)

Na goedkeuring van de AI-planning, alles in één transactie opslaan:

```typescript
// POST /api/projects/[id]/planning/apply

export async function applyPlanning(
    supabase: SupabaseClient,
    projectId: string,
    planning: GeneratePlanningResponse['planning'],
    userId: string
) {
    // 1. Bestaande niet-gestarte activiteiten/milestones optioneel verwijderen
    // 2. Fase-activiteiten bulk insert
    // 3. Milestones bulk insert
    // 4. Dependencies bulk insert (na ID-mapping)
    // 5. Project profile update (planning_generated_at, planning_metadata)
    // 6. Audit log

    const activityIdMap = new Map<string, string>(); // title → uuid

    for (const phase of planning.phases) {
        for (const activity of phase.activities) {
            const { data } = await supabase.from('phase_activities').insert({
                project_id: projectId,
                phase: phase.phase,
                activity_type: activity.activity_type,
                title: activity.title,
                description: activity.description,
                planned_start: activity.planned_start,
                planned_end: activity.planned_end,
                estimated_hours: activity.estimated_hours,
                status: 'not_started'
            }).select().single();

            activityIdMap.set(activity.title, data.id);
        }

        for (const milestone of phase.milestones) {
            const { data } = await supabase.from('milestones').insert({
                project_id: projectId,
                milestone_type: milestone.milestone_type,
                title: milestone.title,
                target_date: milestone.target_date,
                phase: phase.phase,
                is_critical: milestone.is_critical,
                created_by: userId
            }).select().single();

            activityIdMap.set(milestone.title, data.id);
        }
    }

    // Dependencies met ID-mapping
    for (const dep of planning.dependencies) {
        await supabase.from('activity_dependencies').insert({
            project_id: projectId,
            source_type: 'activity',
            source_id: activityIdMap.get(dep.from_title),
            target_type: 'activity',
            target_id: activityIdMap.get(dep.to_title),
            dependency_type: dep.type,
            lag_days: dep.lag_days
        });
    }
}
```

---

### Stap 4.7 — Integratie met briefing-flow

Na afronding van de briefing (wanneer `profile_confirmed = true`), een suggestie tonen:

```svelte
<!-- In de project overview of na briefing-afronding -->
{#if project.profile_confirmed && !project_profile.planning_generated_at}
    <div class="planning-suggestion-banner">
        <p>
            Projectprofiel is compleet. Wil je een AI-planning laten genereren
            op basis van het gekozen procedure-type en de scope?
        </p>
        <a href="/projects/{project.id}/planning?tab=ai">
            Planning genereren →
        </a>
    </div>
{/if}
```

---

### Acceptatiecriteria Sprint 4

- [ ] AI genereert realistische planning op basis van projectcontext
- [ ] Wettelijke minimumtermijnen worden nooit onderschreden
- [ ] Vergelijkbare tenders uit kennisbank worden meegewogen
- [ ] Wizard toont preview voordat planning wordt toegepast
- [ ] Bulk insert werkt correct met juiste ID-mapping voor dependencies
- [ ] AI-toelichting en waarschuwingen worden getoond
- [ ] Planning kan opnieuw gegenereerd worden met andere parameters
- [ ] Na briefing verschijnt suggestie-banner

---

## Sprint 5 — Cross-project planning dashboard

### Doel
Een organisatie-breed overzicht dat alle lopende projecten op één tijdlijn toont, zodat capaciteitsproblemen en bottlenecks zichtbaar worden.

### Agent-verdeling
- **Agent 1 (Backend):** Multi-project aggregatie endpoint
- **Agent 2 (Frontend):** MultiProjectTimeline, capaciteitswidgets
- **Agent 3 (AI):** Geen werk deze sprint
- **Agent 4 (DevOps):** Performance tests (veel projecten)

---

### Stap 5.1 — Backend: organisatie-breed planning endpoint

```typescript
// GET /api/planning/overview?from=2026-01-01&to=2026-12-31

interface OrganizationPlanningOverview {
    projects: {
        id: string;
        name: string;
        current_phase: ProjectPhase;
        timeline_start: string;
        timeline_end: string;
        progress: number;
        status: ProjectStatus;
        is_on_track: boolean;
        phases: {
            phase: ProjectPhase;
            start_date: string | null;
            end_date: string | null;
        }[];
        upcoming_milestones: Milestone[];  // Komende 30 dagen
    }[];
    capacity: {
        month: string;
        active_projects: number;
        projects_in_specification: number;   // Zwaarste fase
        total_estimated_hours: number;
        available_hours: number;             // Team × werkdagen × 8
    }[];
    warnings: string[];   // "Maart: 4 projecten in specificatiefase"
}
```

---

### Stap 5.2 — Component: `MultiProjectTimeline.svelte`

```
Bestandslocatie: src/lib/components/planning/MultiProjectTimeline.svelte

Visueel:
┌────────────────────────────────────────────────────────────────┐
│ Organisatie Planning 2026          [Q1|Q2|Q3|Q4]  [Jaar]      │
├──────────────────┬─────────────────────────────────────────────┤
│                  │ Jan    Feb    Mrt    Apr    Mei    Jun      │
├──────────────────┼─────────────────────────────────────────────┤
│ ICT Werkplekken  │ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░                  │
│                  │ VB  VK   SPEC   AANB  CONTR                │
│                  │                                              │
│ Schoonmaak       │        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░        │
│                  │        VB  VK    SPEC    AANB  CONTR        │
│                  │                                              │
│ Beveiliging      │                   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                  │                   VB  VK   SPEC   AANB      │
├──────────────────┼─────────────────────────────────────────────┤
│ CAPACITEIT       │ ██ ██ ████ ████ ██████ ████ ████ ██ ██     │
│                  │ OK OK Hoog Hoog KRAP!  Hoog OK   OK OK     │
└──────────────────┴─────────────────────────────────────────────┘

Kleurcodering per fase:
VB = blauw, VK = groen, SPEC = oranje, AANB = rood, CONTR = paars
```

---

### Stap 5.3 — Component: `CapacityHeatmap.svelte`

Een heatmap die per week/maand toont hoeveel projecten actief zijn:

```
Bestandslocatie: src/lib/components/planning/CapacityHeatmap.svelte

Props:
- capacity: CapacityData[]
- teamSize: number

Visueel: Kleurintensiteit per maand
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│Jan │Feb │Mrt │Apr │Mei │Jun │Jul │Aug │Sep │Okt │Nov │Dec │
│ 🟢 │ 🟢 │ 🟡 │ 🟠 │ 🔴 │ 🟠 │ 🟢 │ 🟢 │ 🟡 │ 🟡 │ 🟢 │ 🟢 │
│ 2  │ 2  │ 3  │ 4  │ 5  │ 4  │ 1  │ 1  │ 3  │ 3  │ 2  │ 1  │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
```

---

### Stap 5.4 — Route: `/planning`

Nieuwe top-level route voor het organisatie-brede dashboard:

```
Bestandslocatie: src/routes/(app)/planning/+page.svelte

Navigatie: Hoofdmenu → "Planning" (naast Dashboard, Projecten, Kennisbank)

Layout:
┌──────────────────────────────────────────────────────────────┐
│ Planning                                                      │
├──────────────────────────────────────────────────────────────┤
│ [Overzicht] [Capaciteit] [Deadlines]                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─ Samenvatting ────────────────────────────────────────────┐│
│ │ 6 actieve projecten  │  3 op schema  │  2 kritieke DL's  ││
│ └───────────────────────────────────────────────────────────┘│
│                                                               │
│ [MultiProjectTimeline component]                              │
│                                                               │
│ [CapacityHeatmap component]                                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

### Acceptatiecriteria Sprint 5

- [ ] Multi-project tijdlijn toont alle actieve projecten
- [ ] Fasekleuren zijn consistent met rest van app
- [ ] Capaciteits-heatmap berekent correcte bezetting
- [ ] Waarschuwingen bij overbezetting worden getoond
- [ ] Performance acceptabel bij 20+ projecten
- [ ] Navigatie vanuit hoofdmenu werkt

---

## Sprint 6 — Afhankelijkheden & Kritiek pad

### Doel
Afhankelijkheden visueel maken in de Gantt-chart en het kritieke pad berekenen zodat gebruikers weten welke activiteiten absoluut niet mogen uitlopen.

### Agent-verdeling
- **Agent 1 (Backend):** Kritiek-pad algoritme, validatie circulaire deps
- **Agent 2 (Frontend):** Dependency-arrows, kritiek-pad highlighting
- **Agent 3 (AI):** Geen werk deze sprint
- **Agent 4 (DevOps):** Algoritme-tests

---

### Stap 6.1 — Kritiek-pad berekening (CPM)

```typescript
// src/lib/server/planning/critical-path.ts

interface CPMNode {
    id: string;
    type: 'activity' | 'milestone';
    duration: number;            // In werkdagen
    earliest_start: number;
    earliest_finish: number;
    latest_start: number;
    latest_finish: number;
    total_float: number;         // Speling
    is_critical: boolean;        // float === 0
    predecessors: string[];
    successors: string[];
}

export function calculateCriticalPath(
    activities: PhaseActivityPlanning[],
    milestones: Milestone[],
    dependencies: ActivityDependency[]
): CPMResult {
    // 1. Bouw directed acyclic graph (DAG)
    const graph = buildDAG(activities, milestones, dependencies);

    // 2. Detecteer circulaire afhankelijkheden
    const cycles = detectCycles(graph);
    if (cycles.length > 0) {
        throw new Error(`Circulaire afhankelijkheden gevonden: ${cycles}`);
    }

    // 3. Forward pass: bereken earliest start/finish
    topologicalSort(graph).forEach(node => {
        node.earliest_start = Math.max(
            ...node.predecessors.map(p =>
                graph.get(p).earliest_finish + getLag(dependencies, p, node.id)
            ),
            0
        );
        node.earliest_finish = node.earliest_start + node.duration;
    });

    // 4. Backward pass: bereken latest start/finish
    const projectEnd = Math.max(...[...graph.values()].map(n => n.earliest_finish));

    reverseTopologicalSort(graph).forEach(node => {
        node.latest_finish = node.successors.length === 0
            ? projectEnd
            : Math.min(...node.successors.map(s =>
                graph.get(s).latest_start - getLag(dependencies, node.id, s)
            ));
        node.latest_start = node.latest_finish - node.duration;
    });

    // 5. Bereken float en markeer kritiek pad
    graph.forEach(node => {
        node.total_float = node.latest_start - node.earliest_start;
        node.is_critical = node.total_float === 0;
    });

    return {
        nodes: [...graph.values()],
        critical_path: [...graph.values()].filter(n => n.is_critical),
        project_duration: projectEnd,
        total_float_distribution: calculateFloatDistribution(graph)
    };
}
```

---

### Stap 6.2 — Circulaire-afhankelijkheid detectie

Voorkom dat gebruikers loops aanmaken:

```typescript
function detectCycles(graph: Map<string, CPMNode>): string[][] {
    // Kahn's algorithm of DFS-based cycle detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    function dfs(nodeId: string, path: string[]) {
        visited.add(nodeId);
        recursionStack.add(nodeId);

        for (const successor of graph.get(nodeId)!.successors) {
            if (!visited.has(successor)) {
                dfs(successor, [...path, successor]);
            } else if (recursionStack.has(successor)) {
                cycles.push([...path, successor]);
            }
        }

        recursionStack.delete(nodeId);
    }

    graph.forEach((_, id) => {
        if (!visited.has(id)) dfs(id, [id]);
    });

    return cycles;
}
```

---

### Stap 6.3 — Frontend: dependency-arrows in Gantt

```svelte
<!-- GanttDependencyLine.svelte -->
<script lang="ts">
    // SVG pijl van source-balk naar target-balk
    // Routing: horizontaal uit source → verticaal → horizontaal in target

    export let sourceX: number;      // Rechterrand source-balk
    export let sourceY: number;      // Midden source-balk
    export let targetX: number;      // Linkerrand target-balk
    export let targetY: number;      // Midden target-balk
    export let isCritical: boolean = false;
    export let dependencyType: DependencyType;

    // Bereken SVG path met rechte hoeken (geen curves)
    const midX = sourceX + (targetX - sourceX) / 2;
    const path = `M ${sourceX} ${sourceY}
                  H ${midX}
                  V ${targetY}
                  H ${targetX}`;
</script>

<g class="dependency-line" class:critical={isCritical}>
    <path d={path} fill="none"
          stroke={isCritical ? '#ef4444' : '#94a3b8'}
          stroke-width={isCritical ? 2 : 1}
          marker-end="url(#arrowhead)" />
</g>
```

---

### Stap 6.4 — Kritiek-pad highlighting

Activiteiten op het kritieke pad krijgen een rode rand en label:

```svelte
<!-- In GanttActivityBar.svelte -->
<rect
    x={barX} y={barY}
    width={barWidth} height={barHeight}
    rx="4"
    class:critical-path={activity.is_critical}
    fill={phaseColor}
    stroke={activity.is_critical ? '#ef4444' : 'none'}
    stroke-width={activity.is_critical ? 2 : 0}
/>

{#if activity.is_critical}
    <text class="critical-badge" x={barX + barWidth + 4} y={barY + 10}>
        Kritiek pad
    </text>
{/if}
```

---

### Acceptatiecriteria Sprint 6

- [ ] Afhankelijkheidspijlen renderen correct in Gantt
- [ ] Kritiek pad wordt visueel gehighlight (rode rand)
- [ ] CPM-berekening klopt (forward + backward pass)
- [ ] Circulaire afhankelijkheden worden geblokkeerd met foutmelding
- [ ] Float/speling is zichtbaar per activiteit (tooltip)
- [ ] Dependency drag-and-drop: sleep van balk naar balk om link te maken

---

## Sprint 7 — Teamworkload view

### Doel
Combineer urenregistratie en activiteittoewijzingen tot een overzicht per teamlid, zodat werkdruk eerlijk verdeeld kan worden.

### Agent-verdeling
- **Agent 1 (Backend):** Workload-aggregatie endpoint
- **Agent 2 (Frontend):** WorkloadView, PersonTimeline componenten
- **Agent 3 (AI):** Geen werk deze sprint
- **Agent 4 (DevOps):** Tests

---

### Stap 7.1 — Backend: workload-aggregatie

```typescript
// GET /api/planning/workload?from=2026-02-01&to=2026-03-01

interface TeamWorkload {
    members: {
        profile_id: string;
        name: string;
        avatar_url: string | null;
        roles: string[];

        assignments: {
            project_id: string;
            project_name: string;
            activity_id: string;
            activity_title: string;
            phase: ProjectPhase;
            planned_start: string;
            planned_end: string;
            estimated_hours: number;
            status: ActivityStatus;
        }[];

        time_logged: {
            week: string;
            hours: number;
            by_project: Record<string, number>;
        }[];

        summary: {
            total_assigned_hours: number;
            total_logged_hours: number;
            utilization_percentage: number; // logged / available
            overloaded_weeks: string[];     // Weken > 40 uur
        };
    }[];
}
```

---

### Stap 7.2 — Component: `WorkloadView.svelte`

```
Bestandslocatie: src/lib/components/planning/WorkloadView.svelte

Visueel:
┌──────────────────────────────────────────────────────────────┐
│ Teamworkload                        [Feb 2026 ▾]            │
├──────────────────┬───────┬───────┬───────┬───────┬──────────┤
│ Teamlid          │ Wk 6  │ Wk 7  │ Wk 8  │ Wk 9  │ Totaal  │
├──────────────────┼───────┼───────┼───────┼───────┼──────────┤
│ 👤 Jan de Vries  │ 36u   │ 40u   │ 44u   │ 32u   │ 152u    │
│    Inkoopadviseur│ 🟢    │ 🟡    │ 🔴    │ 🟢    │         │
│    ├─ ICT Werkpl │ 24u   │ 24u   │ 24u   │ 16u   │         │
│    └─ Schoonmaak │ 12u   │ 16u   │ 20u   │ 16u   │         │
│                  │       │       │       │       │          │
│ 👤 Lisa Bakker   │ 40u   │ 38u   │ 40u   │ 40u   │ 158u    │
│    Projectleider │ 🟡    │ 🟢    │ 🟡    │ 🟡    │         │
│    ├─ Beveiliging│ 24u   │ 22u   │ 24u   │ 24u   │         │
│    └─ ICT Werkpl │ 16u   │ 16u   │ 16u   │ 16u   │         │
└──────────────────┴───────┴───────┴───────┴───────┴──────────┘

🟢 < 36u  │  🟡 36-40u  │  🔴 > 40u
```

---

### Stap 7.3 — Integratie met activiteittoewijzing

Vanuit de workload-view direct activiteiten hertoewijzen:

```typescript
// Bij overbezetting: suggestie tonen
function detectOverload(workload: TeamWorkload): OverloadWarning[] {
    return workload.members
        .filter(m => m.summary.overloaded_weeks.length > 0)
        .map(m => ({
            member: m.name,
            weeks: m.summary.overloaded_weeks,
            suggestion: findAlternativeAssignee(workload, m)
        }));
}
```

---

### Acceptatiecriteria Sprint 7

- [ ] Workload per teamlid per week correct berekend
- [ ] Kleurcodering voor bezettingsgraad
- [ ] Drill-down naar projecten per persoon
- [ ] Overbezetting-waarschuwingen
- [ ] Koppeling met urenregistratie (werkelijk vs. gepland)
- [ ] Hertoewijzing van activiteiten mogelijk vanuit view

---

## Sprint 8 — Notificaties & Integraties

### Doel
Proactieve waarschuwingen bij naderende deadlines, veranderende planning, en overbezetting. Plus exportmogelijkheden.

### Agent-verdeling
- **Agent 1 (Backend):** Notificatie-engine, cron jobs, e-mail templates
- **Agent 2 (Frontend):** Notificatie-bell, instellingen UI
- **Agent 3 (AI):** AI-samenvattingen voor weekrapportages
- **Agent 4 (DevOps):** E-mail tests, cron monitoring

---

### Stap 8.1 — Notificatie-systeem

```sql
-- Migratie: 20260212_notifications.sql

CREATE TYPE notification_type AS ENUM (
    'deadline_approaching',     -- X dagen voor deadline
    'deadline_overdue',         -- Deadline verlopen
    'activity_assigned',        -- Nieuwe toewijzing
    'planning_changed',         -- Planning is gewijzigd
    'milestone_completed',      -- Milestone bereikt
    'overload_warning',         -- Overbezetting
    'weekly_summary'            -- Wekelijks overzicht
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    project_id UUID REFERENCES projects(id),
    notification_type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    notification_type notification_type NOT NULL,
    in_app BOOLEAN DEFAULT true,
    email BOOLEAN DEFAULT true,
    days_before_deadline INT DEFAULT 7,  -- Wanneer waarschuwen
    UNIQUE(user_id, notification_type)
);
```

---

### Stap 8.2 — Deadline-checker (cron job / edge function)

```typescript
// supabase/functions/check-deadlines/index.ts
// Draait dagelijks via Supabase cron

export async function checkDeadlines() {
    // 1. Zoek milestones met target_date binnen notificatie-venster
    const approaching = await supabase
        .from('milestones')
        .select('*, projects!inner(name, organization_id)')
        .gte('target_date', today)
        .lte('target_date', addDays(today, 14))
        .neq('status', 'completed');

    // 2. Zoek verlopen milestones
    const overdue = await supabase
        .from('milestones')
        .select('*, projects!inner(name, organization_id)')
        .lt('target_date', today)
        .neq('status', 'completed');

    // 3. Maak notificaties aan voor relevante gebruikers
    for (const milestone of [...approaching, ...overdue]) {
        const members = await getProjectMembers(milestone.project_id);
        const type = milestone.target_date < today
            ? 'deadline_overdue'
            : 'deadline_approaching';

        for (const member of members) {
            await createNotification(member.profile_id, {
                type,
                title: `${milestone.title} — ${milestone.projects.name}`,
                body: formatDeadlineMessage(milestone, type),
                project_id: milestone.project_id
            });
        }
    }
}
```

---

### Stap 8.3 — Export-functionaliteit

```typescript
// Exportopties vanuit de planning-pagina

// 1. iCal export (voor Outlook/Google Calendar)
// GET /api/projects/[id]/planning/export/ical
function generateICalFeed(milestones: Milestone[]): string {
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TenderManager//Planning//NL',
        ...milestones.map(m => [
            'BEGIN:VEVENT',
            `DTSTART;VALUE=DATE:${m.target_date.replace(/-/g, '')}`,
            `SUMMARY:${m.title}`,
            `DESCRIPTION:${m.description}`,
            'END:VEVENT'
        ].join('\r\n')),
        'END:VCALENDAR'
    ].join('\r\n');
}

// 2. PDF export (gantt als afbeelding)
// POST /api/projects/[id]/planning/export/pdf

// 3. CSV export (activiteiten + milestones)
// GET /api/projects/[id]/planning/export/csv
```

---

### Stap 8.4 — AI wekelijkse samenvatting

```typescript
// Elke maandagochtend: AI-samenvatting van planning-status

export async function generateWeeklySummary(organizationId: string) {
    const context = await gatherOrganizationPlanningStatus(organizationId);

    const summary = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
            role: 'system',
            content: `Je bent een planning-assistent voor een inkoopafdeling.
                      Maak een beknopte weekrapportage in het Nederlands.`
        }, {
            role: 'user',
            content: `Maak een samenvatting van de planning-status:
                      ${JSON.stringify(context)}

                      Focus op: risico's, verlopen deadlines, komende week,
                      en aanbevelingen.`
        }]
    });

    // Verstuur als notificatie naar project_leaders
}
```

---

### Acceptatiecriteria Sprint 8

- [ ] In-app notificaties verschijnen bij naderende deadlines
- [ ] E-mailnotificaties worden verstuurd (opt-in)
- [ ] Gebruikers kunnen notificatievoorkeuren instellen
- [ ] iCal export importeerbaar in Outlook/Google Calendar
- [ ] PDF export bevat leesbare Gantt-weergave
- [ ] AI weekrapportage is beknopt en actionable

---

## Technische architectuur — Samenvatting

### Nieuwe bestanden

```
src/
├── lib/
│   ├── components/planning/
│   │   ├── DeadlineList.svelte
│   │   ├── DeadlineCalendar.svelte
│   │   ├── GanttChart.svelte
│   │   ├── GanttHeader.svelte
│   │   ├── GanttPhaseRow.svelte
│   │   ├── GanttActivityBar.svelte
│   │   ├── GanttMilestoneMarker.svelte
│   │   ├── GanttDependencyLine.svelte
│   │   ├── GanttTodayLine.svelte
│   │   ├── gantt-utils.ts
│   │   ├── PlanningWizard.svelte
│   │   ├── MultiProjectTimeline.svelte
│   │   ├── CapacityHeatmap.svelte
│   │   └── WorkloadView.svelte
│   ├── server/planning/
│   │   ├── ai-planning-context.ts
│   │   ├── ai-planning-prompt.ts
│   │   ├── critical-path.ts
│   │   ├── default-milestones.ts
│   │   └── legal-constraints.ts
│   └── types/ (uitbreidingen)
│
├── routes/
│   ├── (app)/planning/
│   │   └── +page.svelte / +page.server.ts
│   ├── (app)/projects/[id]/planning/
│   │   └── +page.svelte / +page.server.ts
│   └── api/
│       ├── projects/[id]/milestones/
│       ├── projects/[id]/dependencies/
│       ├── projects/[id]/planning/
│       │   ├── +server.ts (GET overview)
│       │   ├── generate/+server.ts (POST)
│       │   ├── apply/+server.ts (POST)
│       │   └── export/
│       └── planning/
│           ├── overview/+server.ts
│           ├── deadlines/+server.ts
│           └── workload/+server.ts
│
supabase/
├── migrations/
│   ├── 20260212_planning_milestones.sql
│   ├── 20260212_activity_dependencies.sql
│   ├── 20260212_extend_phase_activities.sql
│   ├── 20260212_extend_project_profiles.sql
│   └── 20260212_notifications.sql
└── functions/
    └── check-deadlines/index.ts
```

### Nieuwe dependencies

```json
{
    "d3-scale": "^4.0.0",
    "d3-time": "^3.0.0",
    "d3-time-format": "^4.0.0"
}
```

### Database impact

- 3 nieuwe tabellen: `milestones`, `activity_dependencies`, `notifications` + `notification_preferences`
- 4 kolommen toegevoegd aan `phase_activities`
- 4 kolommen toegevoegd aan `project_profiles`
- 2 nieuwe enums: `milestone_type`, `dependency_type`, `notification_type`
- 1 stored procedure: `get_upcoming_deadlines()`
- 1 edge function: `check-deadlines` (cron)
