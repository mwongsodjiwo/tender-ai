// Unit tests for Sprint R4 — Project overview & profile types and validation

import { describe, it, expect } from 'vitest';
import type {
	ProjectOverviewMetrics,
	ProjectOverviewDocumentBlock,
	ProjectOverviewActivity,
	ConfirmProjectProfileResponse
} from '../../src/lib/types/api';
import type { ProjectProfile, PhaseActivity, Project } from '../../src/lib/types/database';
import type { ProjectPhase, ActivityStatus } from '../../src/lib/types/enums';
import {
	PROJECT_PHASES,
	PROJECT_PHASE_LABELS,
	PROJECT_PHASE_DESCRIPTIONS,
	ACTIVITY_STATUSES,
	ACTIVITY_STATUS_LABELS
} from '../../src/lib/types/enums';
import {
	confirmProjectProfileSchema,
	createProjectProfileSchema,
	updateProjectProfileSchema,
	updatePhaseActivitySchema
} from '../../src/lib/server/api/validation';

// =============================================================================
// PROJECT OVERVIEW METRICS
// =============================================================================

describe('ProjectOverviewMetrics type shape', () => {
	const mockMetrics: ProjectOverviewMetrics = {
		total_sections: 20,
		approved_sections: 8,
		progress_percentage: 40
	};

	it('has all required fields', () => {
		expect(mockMetrics.total_sections).toBeDefined();
		expect(mockMetrics.approved_sections).toBeDefined();
		expect(mockMetrics.progress_percentage).toBeDefined();
	});

	it('all fields are numbers', () => {
		expect(typeof mockMetrics.total_sections).toBe('number');
		expect(typeof mockMetrics.approved_sections).toBe('number');
		expect(typeof mockMetrics.progress_percentage).toBe('number');
	});

	it('progress percentage is 0-100', () => {
		expect(mockMetrics.progress_percentage).toBeGreaterThanOrEqual(0);
		expect(mockMetrics.progress_percentage).toBeLessThanOrEqual(100);
	});

	it('approved <= total', () => {
		expect(mockMetrics.approved_sections).toBeLessThanOrEqual(mockMetrics.total_sections);
	});
});

// =============================================================================
// PROJECT OVERVIEW DOCUMENT BLOCK
// =============================================================================

describe('ProjectOverviewDocumentBlock type shape', () => {
	const mockBlock: ProjectOverviewDocumentBlock = {
		doc_type_id: '123e4567-e89b-12d3-a456-426614174000',
		doc_type_name: 'Aanbestedingsleidraad',
		doc_type_slug: 'aanbestedingsleidraad',
		total: 12,
		approved: 5,
		progress: 42
	};

	it('has all required fields', () => {
		expect(mockBlock.doc_type_id).toBeDefined();
		expect(mockBlock.doc_type_name).toBeDefined();
		expect(mockBlock.doc_type_slug).toBeDefined();
		expect(mockBlock.total).toBeDefined();
		expect(mockBlock.approved).toBeDefined();
		expect(mockBlock.progress).toBeDefined();
	});

	it('progress matches approved/total ratio', () => {
		const expectedProgress = Math.round((mockBlock.approved / mockBlock.total) * 100);
		expect(mockBlock.progress).toBe(expectedProgress);
	});
});

// =============================================================================
// PROJECT OVERVIEW ACTIVITY
// =============================================================================

describe('ProjectOverviewActivity type shape', () => {
	const mockActivity: ProjectOverviewActivity = {
		id: '123e4567-e89b-12d3-a456-426614174000',
		phase: 'preparing',
		title: 'Briefing starten',
		status: 'not_started',
		href: '/projects/abc/briefing'
	};

	it('has all required fields', () => {
		expect(mockActivity.id).toBeDefined();
		expect(mockActivity.phase).toBeDefined();
		expect(mockActivity.title).toBeDefined();
		expect(mockActivity.status).toBeDefined();
	});

	it('phase is a valid ProjectPhase', () => {
		expect(PROJECT_PHASES).toContain(mockActivity.phase);
	});

	it('status is a valid ActivityStatus', () => {
		expect(ACTIVITY_STATUSES).toContain(mockActivity.status);
	});

	it('href can be null', () => {
		const noHref: ProjectOverviewActivity = { ...mockActivity, href: null };
		expect(noHref.href).toBeNull();
	});
});

// =============================================================================
// CONFIRM PROJECT PROFILE RESPONSE
// =============================================================================

describe('ConfirmProjectProfileResponse type shape', () => {
	const mockResponse: ConfirmProjectProfileResponse = {
		profile_confirmed: true,
		profile_confirmed_at: '2026-02-09T12:00:00.000Z'
	};

	it('has required fields', () => {
		expect(mockResponse.profile_confirmed).toBe(true);
		expect(mockResponse.profile_confirmed_at).toBeDefined();
	});

	it('profile_confirmed_at is a valid ISO string', () => {
		const date = new Date(mockResponse.profile_confirmed_at);
		expect(date.toISOString()).toBe(mockResponse.profile_confirmed_at);
	});
});

// =============================================================================
// PROJECT PROFILE TYPE SHAPE
// =============================================================================

describe('ProjectProfile type shape', () => {
	const mockProfile: ProjectProfile = {
		id: '123e4567-e89b-12d3-a456-426614174000',
		project_id: '223e4567-e89b-12d3-a456-426614174000',
		contracting_authority: 'Gemeente Amsterdam',
		department: 'Inkoop & Aanbesteding',
		contact_name: 'Jan de Vries',
		contact_email: 'jan@amsterdam.nl',
		contact_phone: '+31612345678',
		project_goal: 'IT-systeem voor afvalverwerking',
		scope_description: 'Levering en implementatie van een digitaal afvalbeheersysteem.',
		estimated_value: 500000,
		currency: 'EUR',
		cpv_codes: ['72000000-5', '72200000-7'],
		nuts_codes: ['NL329'],
		timeline_start: '2026-03-01',
		timeline_end: '2026-12-31',
		planning_generated_at: null,
		planning_approved: false,
		planning_approved_at: null,
		planning_approved_by: null,
		planning_metadata: {},
		metadata: {},
		created_at: '2026-01-15T10:00:00.000Z',
		updated_at: '2026-02-09T12:00:00.000Z',
		deleted_at: null
	};

	it('has all required fields', () => {
		expect(mockProfile.id).toBeDefined();
		expect(mockProfile.project_id).toBeDefined();
		expect(mockProfile.contracting_authority).toBeDefined();
		expect(mockProfile.department).toBeDefined();
		expect(mockProfile.contact_name).toBeDefined();
		expect(mockProfile.contact_email).toBeDefined();
		expect(mockProfile.contact_phone).toBeDefined();
		expect(mockProfile.project_goal).toBeDefined();
		expect(mockProfile.scope_description).toBeDefined();
		expect(mockProfile.currency).toBeDefined();
		expect(mockProfile.cpv_codes).toBeDefined();
		expect(mockProfile.nuts_codes).toBeDefined();
	});

	it('cpv_codes is an array', () => {
		expect(Array.isArray(mockProfile.cpv_codes)).toBe(true);
	});

	it('nuts_codes is an array', () => {
		expect(Array.isArray(mockProfile.nuts_codes)).toBe(true);
	});

	it('estimated_value can be null', () => {
		const noValue: ProjectProfile = { ...mockProfile, estimated_value: null };
		expect(noValue.estimated_value).toBeNull();
	});

	it('timeline dates can be null', () => {
		const noTimeline: ProjectProfile = {
			...mockProfile,
			timeline_start: null,
			timeline_end: null
		};
		expect(noTimeline.timeline_start).toBeNull();
		expect(noTimeline.timeline_end).toBeNull();
	});

	it('deleted_at is null for active profiles', () => {
		expect(mockProfile.deleted_at).toBeNull();
	});
});

// =============================================================================
// PROJECT PROFILE CONFIRMATION FLOW
// =============================================================================

describe('Project profile confirmation flow', () => {
	const mockProject: Partial<Project> = {
		id: '123e4567-e89b-12d3-a456-426614174000',
		profile_confirmed: false,
		profile_confirmed_at: null
	};

	it('project starts with profile_confirmed = false', () => {
		expect(mockProject.profile_confirmed).toBe(false);
		expect(mockProject.profile_confirmed_at).toBeNull();
	});

	it('after confirmation, profile_confirmed becomes true', () => {
		const confirmed: Partial<Project> = {
			...mockProject,
			profile_confirmed: true,
			profile_confirmed_at: '2026-02-09T12:00:00.000Z'
		};
		expect(confirmed.profile_confirmed).toBe(true);
		expect(confirmed.profile_confirmed_at).toBeDefined();
	});

	it('confirmed_at is a valid ISO date string', () => {
		const timestamp = '2026-02-09T12:00:00.000Z';
		const date = new Date(timestamp);
		expect(date.toISOString()).toBe(timestamp);
	});
});

// =============================================================================
// CONFIRM PROJECT PROFILE SCHEMA VALIDATION
// =============================================================================

describe('confirmProjectProfileSchema', () => {
	it('accepts { confirmed: true }', () => {
		const result = confirmProjectProfileSchema.safeParse({ confirmed: true });
		expect(result.success).toBe(true);
	});

	it('rejects { confirmed: false }', () => {
		const result = confirmProjectProfileSchema.safeParse({ confirmed: false });
		expect(result.success).toBe(false);
	});

	it('rejects empty object', () => {
		const result = confirmProjectProfileSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('rejects missing confirmed field', () => {
		const result = confirmProjectProfileSchema.safeParse({ other: 'value' });
		expect(result.success).toBe(false);
	});

	it('rejects non-boolean confirmed', () => {
		const result = confirmProjectProfileSchema.safeParse({ confirmed: 'true' });
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// PHASE ACTIVITY STATUS UPDATES
// =============================================================================

describe('Phase activity status transitions', () => {
	const mockActivity: PhaseActivity = {
		id: '123e4567-e89b-12d3-a456-426614174000',
		project_id: '223e4567-e89b-12d3-a456-426614174000',
		phase: 'preparing',
		activity_type: 'briefing',
		title: 'Briefing starten',
		description: '',
		status: 'not_started',
		sort_order: 0,
		assigned_to: null,
		due_date: null,
		completed_at: null,
		planned_start: null,
		planned_end: null,
		actual_start: null,
		actual_end: null,
		estimated_hours: null,
		progress_percentage: 0,
		metadata: {},
		created_at: '2026-01-15T10:00:00.000Z',
		updated_at: '2026-02-09T12:00:00.000Z',
		deleted_at: null
	};

	it('starts with not_started status', () => {
		expect(mockActivity.status).toBe('not_started');
		expect(mockActivity.completed_at).toBeNull();
	});

	it('can transition to in_progress', () => {
		const inProgress: PhaseActivity = { ...mockActivity, status: 'in_progress' };
		expect(inProgress.status).toBe('in_progress');
	});

	it('can transition to completed with completed_at', () => {
		const completed: PhaseActivity = {
			...mockActivity,
			status: 'completed',
			completed_at: '2026-02-09T14:00:00.000Z'
		};
		expect(completed.status).toBe('completed');
		expect(completed.completed_at).toBeDefined();
	});

	it('can transition to skipped', () => {
		const skipped: PhaseActivity = { ...mockActivity, status: 'skipped' };
		expect(skipped.status).toBe('skipped');
	});

	it('all activity statuses have labels', () => {
		for (const status of ACTIVITY_STATUSES) {
			expect(ACTIVITY_STATUS_LABELS[status]).toBeDefined();
			expect(ACTIVITY_STATUS_LABELS[status].length).toBeGreaterThan(0);
		}
	});
});

// =============================================================================
// UPDATE PHASE ACTIVITY SCHEMA
// =============================================================================

describe('updatePhaseActivitySchema', () => {
	it('accepts valid status update', () => {
		const result = updatePhaseActivitySchema.safeParse({ status: 'completed' });
		expect(result.success).toBe(true);
	});

	it('accepts valid title update', () => {
		const result = updatePhaseActivitySchema.safeParse({ title: 'Nieuwe titel' });
		expect(result.success).toBe(true);
	});

	it('rejects invalid status', () => {
		const result = updatePhaseActivitySchema.safeParse({ status: 'invalid_status' });
		expect(result.success).toBe(false);
	});

	it('accepts empty object (no changes)', () => {
		const result = updatePhaseActivitySchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts nullable assigned_to', () => {
		const result = updatePhaseActivitySchema.safeParse({ assigned_to: null });
		expect(result.success).toBe(true);
	});

	it('accepts nullable due_date', () => {
		const result = updatePhaseActivitySchema.safeParse({ due_date: null });
		expect(result.success).toBe(true);
	});

	it('rejects title that is too long', () => {
		const result = updatePhaseActivitySchema.safeParse({ title: 'a'.repeat(301) });
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// CREATE / UPDATE PROJECT PROFILE SCHEMA
// =============================================================================

describe('createProjectProfileSchema', () => {
	it('accepts valid profile data', () => {
		const result = createProjectProfileSchema.safeParse({
			contracting_authority: 'Gemeente Amsterdam',
			department: 'Inkoop',
			contact_name: 'Jan',
			contact_email: 'jan@amsterdam.nl',
			project_goal: 'Afvalverwerking',
			cpv_codes: ['72000000-5']
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object (all defaults)', () => {
		const result = createProjectProfileSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('sets default currency to EUR', () => {
		const result = createProjectProfileSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.currency).toBe('EUR');
		}
	});

	it('sets default empty arrays for codes', () => {
		const result = createProjectProfileSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.cpv_codes).toEqual([]);
			expect(result.data.nuts_codes).toEqual([]);
		}
	});

	it('rejects invalid email', () => {
		const result = createProjectProfileSchema.safeParse({
			contact_email: 'not-an-email'
		});
		expect(result.success).toBe(false);
	});

	it('accepts empty email string', () => {
		const result = createProjectProfileSchema.safeParse({
			contact_email: ''
		});
		expect(result.success).toBe(true);
	});

	it('rejects negative estimated_value', () => {
		const result = createProjectProfileSchema.safeParse({
			estimated_value: -100
		});
		expect(result.success).toBe(false);
	});

	it('rejects contracting_authority over 500 chars', () => {
		const result = createProjectProfileSchema.safeParse({
			contracting_authority: 'a'.repeat(501)
		});
		expect(result.success).toBe(false);
	});
});

describe('updateProjectProfileSchema', () => {
	it('accepts partial update', () => {
		const result = updateProjectProfileSchema.safeParse({
			project_goal: 'Nieuwe doelstelling'
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object', () => {
		const result = updateProjectProfileSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects scope_description over 10000 chars', () => {
		const result = updateProjectProfileSchema.safeParse({
			scope_description: 'a'.repeat(10001)
		});
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// PHASE INDICATORS & DESCRIPTIONS
// =============================================================================

describe('Phase indicator data', () => {
	it('has 5 project phases', () => {
		expect(PROJECT_PHASES).toHaveLength(5);
	});

	it('all phases have labels', () => {
		for (const phase of PROJECT_PHASES) {
			expect(PROJECT_PHASE_LABELS[phase]).toBeDefined();
			expect(PROJECT_PHASE_LABELS[phase].length).toBeGreaterThan(0);
		}
	});

	it('all phases have descriptions', () => {
		for (const phase of PROJECT_PHASES) {
			expect(PROJECT_PHASE_DESCRIPTIONS[phase]).toBeDefined();
			expect(PROJECT_PHASE_DESCRIPTIONS[phase].length).toBeGreaterThan(0);
		}
	});

	it('phases are in correct order', () => {
		expect(PROJECT_PHASES[0]).toBe('preparing');
		expect(PROJECT_PHASES[1]).toBe('exploring');
		expect(PROJECT_PHASES[2]).toBe('specifying');
		expect(PROJECT_PHASES[3]).toBe('tendering');
		expect(PROJECT_PHASES[4]).toBe('contracting');
	});

	it('labels are in Dutch', () => {
		expect(PROJECT_PHASE_LABELS.preparing).toBe('Voorbereiden');
		expect(PROJECT_PHASE_LABELS.exploring).toBe('Verkennen');
		expect(PROJECT_PHASE_LABELS.specifying).toBe('Specificeren');
		expect(PROJECT_PHASE_LABELS.tendering).toBe('Aanbesteden');
		expect(PROJECT_PHASE_LABELS.contracting).toBe('Contracteren');
	});
});

// =============================================================================
// PHASE ACTIVITY GROUPING
// =============================================================================

describe('Phase activity grouping by phase', () => {
	const mockActivities: Partial<PhaseActivity>[] = [
		{ id: '1', phase: 'preparing', title: 'Briefing', status: 'completed', sort_order: 0 },
		{ id: '2', phase: 'preparing', title: 'Profiel', status: 'in_progress', sort_order: 1 },
		{ id: '3', phase: 'exploring', title: 'Deskresearch', status: 'not_started', sort_order: 0 },
		{ id: '4', phase: 'specifying', title: 'PvE', status: 'not_started', sort_order: 0 }
	];

	it('can group activities by phase', () => {
		const grouped: Record<string, typeof mockActivities> = {};
		for (const a of mockActivities) {
			const phase = a.phase as string;
			if (!grouped[phase]) grouped[phase] = [];
			grouped[phase].push(a);
		}
		expect(grouped['preparing']).toHaveLength(2);
		expect(grouped['exploring']).toHaveLength(1);
		expect(grouped['specifying']).toHaveLength(1);
	});

	it('can count completed per phase', () => {
		const preparingActivities = mockActivities.filter(a => a.phase === 'preparing');
		const completed = preparingActivities.filter(a => a.status === 'completed');
		expect(completed).toHaveLength(1);
		expect(preparingActivities).toHaveLength(2);
	});

	it('activities are sorted by sort_order', () => {
		const preparing = mockActivities
			.filter(a => a.phase === 'preparing')
			.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
		expect(preparing[0].title).toBe('Briefing');
		expect(preparing[1].title).toBe('Profiel');
	});
});

// =============================================================================
// OVERVIEW PROGRESS CALCULATION
// =============================================================================

describe('Overview progress calculation', () => {
	it('calculates 0% for zero sections', () => {
		const total = 0;
		const approved = 0;
		const progress = total > 0 ? Math.round((approved / total) * 100) : 0;
		expect(progress).toBe(0);
	});

	it('calculates correct percentage', () => {
		const total = 20;
		const approved = 8;
		const progress = Math.round((approved / total) * 100);
		expect(progress).toBe(40);
	});

	it('calculates 100% when all approved', () => {
		const total = 10;
		const approved = 10;
		const progress = Math.round((approved / total) * 100);
		expect(progress).toBe(100);
	});

	it('rounds to nearest integer', () => {
		const total = 3;
		const approved = 1;
		const progress = Math.round((approved / total) * 100);
		expect(progress).toBe(33);
	});
});

// =============================================================================
// DEADLINE CALCULATION
// =============================================================================

describe('Deadline days calculation', () => {
	it('calculates positive days for future deadline', () => {
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 5);
		const days = Math.ceil((futureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
		expect(days).toBe(5);
	});

	it('calculates negative days for past deadline', () => {
		const pastDate = new Date();
		pastDate.setDate(pastDate.getDate() - 3);
		const days = Math.ceil((pastDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
		expect(days).toBeLessThanOrEqual(-2);
	});

	it('handles null deadline', () => {
		const deadline: string | null = null;
		const days = deadline
			? Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
			: null;
		expect(days).toBeNull();
	});
});

// =============================================================================
// PROFILE BADGE LOGIC
// =============================================================================

describe('Profile badge logic', () => {
	it('shows "Concept" when not confirmed', () => {
		const confirmed = false;
		const badge = confirmed ? 'Bevestigd' : 'Concept';
		expect(badge).toBe('Concept');
	});

	it('shows "Bevestigd" when confirmed', () => {
		const confirmed = true;
		const badge = confirmed ? 'Bevestigd' : 'Concept';
		expect(badge).toBe('Bevestigd');
	});
});

// =============================================================================
// PHASE STATUS HELPER
// =============================================================================

describe('Phase status helper', () => {
	function phaseStatus(phaseIndex: number, currentIndex: number): 'completed' | 'current' | 'upcoming' {
		if (phaseIndex < currentIndex) return 'completed';
		if (phaseIndex === currentIndex) return 'current';
		return 'upcoming';
	}

	it('marks phases before current as completed', () => {
		expect(phaseStatus(0, 2)).toBe('completed');
		expect(phaseStatus(1, 2)).toBe('completed');
	});

	it('marks current phase correctly', () => {
		expect(phaseStatus(2, 2)).toBe('current');
	});

	it('marks phases after current as upcoming', () => {
		expect(phaseStatus(3, 2)).toBe('upcoming');
		expect(phaseStatus(4, 2)).toBe('upcoming');
	});

	it('first phase is current when project starts', () => {
		expect(phaseStatus(0, 0)).toBe('current');
		expect(phaseStatus(1, 0)).toBe('upcoming');
	});

	it('last phase is current when project finishing', () => {
		expect(phaseStatus(3, 4)).toBe('completed');
		expect(phaseStatus(4, 4)).toBe('current');
	});
});
