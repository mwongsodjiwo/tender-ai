// Tests for workload-helpers — Planning Sprint 7
// Tests: happy path + error cases per rule 24

import { describe, it, expect } from 'vitest';
import {
	buildMemberAssignments,
	buildTimeLogged,
	buildWorkloadSummary,
	buildMemberWorkload,
	detectOverloads,
	buildMemberInfoList
} from '$lib/server/planning/workload-helpers';
import type { PhaseActivity, TimeEntry, Profile } from '$lib/types/database';

function makeActivity(overrides: Partial<PhaseActivity> = {}): PhaseActivity {
	return {
		id: 'act-1',
		project_id: 'proj-1',
		phase: 'preparing',
		activity_type: 'task',
		title: 'Test activiteit',
		description: '',
		status: 'in_progress',
		sort_order: 0,
		assigned_to: 'user-1',
		due_date: null,
		completed_at: null,
		planned_start: '2026-02-01',
		planned_end: '2026-02-14',
		actual_start: null,
		actual_end: null,
		estimated_hours: 20,
		progress_percentage: 50,
		metadata: {},
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		deleted_at: null,
		...overrides
	};
}

function makeTimeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
	return {
		id: 'te-1',
		user_id: 'user-1',
		organization_id: 'org-1',
		project_id: 'proj-1',
		date: '2026-02-03',
		hours: 8,
		activity_type: 'preparing',
		notes: '',
		created_at: '2026-02-03T00:00:00Z',
		updated_at: '2026-02-03T00:00:00Z',
		...overrides
	};
}

const projectNames = new Map([['proj-1', 'Project Alpha'], ['proj-2', 'Project Beta']]);

describe('buildMemberAssignments', () => {
	it('returns assignments for the given profile', () => {
		const activities = [
			makeActivity({ id: 'a1', assigned_to: 'user-1' }),
			makeActivity({ id: 'a2', assigned_to: 'user-2' }),
			makeActivity({ id: 'a3', assigned_to: 'user-1', status: 'completed' })
		];

		const result = buildMemberAssignments(activities, 'user-1', projectNames);
		expect(result).toHaveLength(1);
		expect(result[0].activity_id).toBe('a1');
		expect(result[0].project_name).toBe('Project Alpha');
	});

	it('returns empty array when no activities assigned', () => {
		const result = buildMemberAssignments([], 'user-1', projectNames);
		expect(result).toHaveLength(0);
	});
});

describe('buildTimeLogged', () => {
	it('groups entries by ISO week', () => {
		const entries = [
			makeTimeEntry({ date: '2026-02-02', hours: 8 }),
			makeTimeEntry({ date: '2026-02-03', hours: 6 }),
			makeTimeEntry({ date: '2026-02-09', hours: 4 })
		];

		const result = buildTimeLogged(entries, 'user-1', projectNames);
		expect(result.length).toBeGreaterThanOrEqual(1);
		expect(result[0].hours).toBe(14);
	});

	it('returns empty array for unknown user', () => {
		const entries = [makeTimeEntry({ user_id: 'user-1' })];
		const result = buildTimeLogged(entries, 'user-99', projectNames);
		expect(result).toHaveLength(0);
	});
});

describe('buildWorkloadSummary', () => {
	it('calculates totals and utilization', () => {
		const assignments = [
			{ project_id: 'p1', project_name: 'P', activity_id: 'a1', activity_title: 'T', phase: 'preparing' as const, planned_start: null, planned_end: null, estimated_hours: 30, status: 'in_progress' as const },
			{ project_id: 'p1', project_name: 'P', activity_id: 'a2', activity_title: 'T', phase: 'preparing' as const, planned_start: null, planned_end: null, estimated_hours: 10, status: 'not_started' as const }
		];
		const timeLogged = [
			{ week: '2026-W06', hours: 38, by_project: { P: 38 } },
			{ week: '2026-W07', hours: 42, by_project: { P: 42 } }
		];

		const result = buildWorkloadSummary(assignments, timeLogged);
		expect(result.total_assigned_hours).toBe(40);
		expect(result.total_logged_hours).toBe(80);
		expect(result.overloaded_weeks).toEqual(['2026-W07']);
		expect(result.utilization_percentage).toBe(100);
	});

	it('returns zero utilization when no time logged', () => {
		const result = buildWorkloadSummary([], []);
		expect(result.utilization_percentage).toBe(0);
		expect(result.total_assigned_hours).toBe(0);
		expect(result.overloaded_weeks).toHaveLength(0);
	});
});

describe('detectOverloads', () => {
	it('detects overloaded members and suggests alternatives', () => {
		const members = [
			{
				profile_id: 'u1', name: 'Jan', avatar_url: null, roles: [],
				assignments: [], time_logged: [{ week: 'W06', hours: 50, by_project: {} }],
				summary: { total_assigned_hours: 50, total_logged_hours: 50, utilization_percentage: 125, overloaded_weeks: ['W06'] }
			},
			{
				profile_id: 'u2', name: 'Lisa', avatar_url: null, roles: [],
				assignments: [], time_logged: [],
				summary: { total_assigned_hours: 20, total_logged_hours: 20, utilization_percentage: 50, overloaded_weeks: [] }
			}
		];

		const warnings = detectOverloads(members);
		expect(warnings).toHaveLength(1);
		expect(warnings[0].member_name).toBe('Jan');
		expect(warnings[0].suggestion).toContain('Lisa');
	});

	it('returns empty array when nobody is overloaded', () => {
		const members = [
			{
				profile_id: 'u1', name: 'Jan', avatar_url: null, roles: [],
				assignments: [], time_logged: [],
				summary: { total_assigned_hours: 20, total_logged_hours: 20, utilization_percentage: 50, overloaded_weeks: [] }
			}
		];

		expect(detectOverloads(members)).toHaveLength(0);
	});
});

describe('buildMemberInfoList', () => {
	it('builds member info from org members and profiles', () => {
		const orgMembers = [{ profile_id: 'u1' }, { profile_id: 'u2' }];
		const profiles: Profile[] = [
			{ id: 'u1', email: 'j@x.nl', first_name: 'Jan', last_name: 'Vries', avatar_url: null, job_title: null, phone: null, is_superadmin: false, created_at: '', updated_at: '' },
			{ id: 'u2', email: 'l@x.nl', first_name: 'Lisa', last_name: 'Bakker', avatar_url: null, job_title: null, phone: null, is_superadmin: false, created_at: '', updated_at: '' }
		];
		const roles = [
			{ profile_id: 'u1', role: 'project_leader' },
			{ profile_id: 'u1', role: 'procurement_advisor' },
			{ profile_id: 'u2', role: 'legal_advisor' }
		];

		const result = buildMemberInfoList(orgMembers, profiles, roles);
		expect(result).toHaveLength(2);
		expect(result[0].roles).toContain('project_leader');
		expect(result[0].roles).toContain('procurement_advisor');
		expect(result[1].roles).toEqual(['legal_advisor']);
	});

	it('handles missing profile gracefully', () => {
		const orgMembers = [{ profile_id: 'unknown' }];
		const profiles: Profile[] = [];
		const result = buildMemberInfoList(orgMembers, profiles, []);
		expect(result).toHaveLength(0);
	});
});
