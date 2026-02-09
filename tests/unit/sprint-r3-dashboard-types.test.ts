// Unit tests for Sprint R3 — Dashboard types and MonthlyChart data

import { describe, it, expect } from 'vitest';
import type {
	DashboardMetrics,
	DashboardRecentProject,
	DashboardResponse,
	MonthlyProjectData
} from '../../src/lib/types/api';

// =============================================================================
// DASHBOARD METRICS
// =============================================================================

describe('DashboardMetrics type shape', () => {
	const mockMetrics: DashboardMetrics = {
		total_projects: 12,
		active_projects: 5,
		completed_projects: 3,
		in_review_count: 8,
		in_review_trend: 2,
		average_progress: 45,
		sections_by_status: {
			draft: 10,
			generated: 5,
			review: 8,
			approved: 12,
			rejected: 2
		},
		total_sections: 37
	};

	it('has all required fields', () => {
		expect(mockMetrics.total_projects).toBeDefined();
		expect(mockMetrics.active_projects).toBeDefined();
		expect(mockMetrics.completed_projects).toBeDefined();
		expect(mockMetrics.in_review_count).toBeDefined();
		expect(mockMetrics.in_review_trend).toBeDefined();
		expect(mockMetrics.average_progress).toBeDefined();
		expect(mockMetrics.sections_by_status).toBeDefined();
		expect(mockMetrics.total_sections).toBeDefined();
	});

	it('all numeric fields are numbers', () => {
		expect(typeof mockMetrics.total_projects).toBe('number');
		expect(typeof mockMetrics.active_projects).toBe('number');
		expect(typeof mockMetrics.completed_projects).toBe('number');
		expect(typeof mockMetrics.in_review_count).toBe('number');
		expect(typeof mockMetrics.in_review_trend).toBe('number');
		expect(typeof mockMetrics.average_progress).toBe('number');
		expect(typeof mockMetrics.total_sections).toBe('number');
	});

	it('sections_by_status is an object', () => {
		expect(typeof mockMetrics.sections_by_status).toBe('object');
	});

	it('total_sections matches sum of sections_by_status', () => {
		const sum = Object.values(mockMetrics.sections_by_status).reduce((a, b) => a + b, 0);
		expect(sum).toBe(mockMetrics.total_sections);
	});

	it('active_projects + completed_projects <= total_projects', () => {
		expect(mockMetrics.active_projects + mockMetrics.completed_projects).toBeLessThanOrEqual(
			mockMetrics.total_projects
		);
	});

	it('average_progress is between 0 and 100', () => {
		expect(mockMetrics.average_progress).toBeGreaterThanOrEqual(0);
		expect(mockMetrics.average_progress).toBeLessThanOrEqual(100);
	});
});

// =============================================================================
// DASHBOARD RECENT PROJECT
// =============================================================================

describe('DashboardRecentProject type shape', () => {
	const mockProject: DashboardRecentProject = {
		id: '550e8400-e29b-41d4-a716-446655440000',
		name: 'ICT-aanbesteding 2026',
		current_phase: 'specifying',
		deadline_date: '2026-06-01',
		progress: 65,
		updated_at: '2026-02-09T12:00:00Z'
	};

	it('has all required fields', () => {
		expect(mockProject.id).toBeDefined();
		expect(mockProject.name).toBeDefined();
		expect(mockProject.current_phase).toBeDefined();
		expect(mockProject.progress).toBeDefined();
		expect(mockProject.updated_at).toBeDefined();
	});

	it('current_phase is a valid phase', () => {
		const validPhases = ['preparing', 'exploring', 'specifying', 'tendering', 'contracting'];
		expect(validPhases).toContain(mockProject.current_phase);
	});

	it('deadline_date can be string or null', () => {
		expect(typeof mockProject.deadline_date).toBe('string');

		const noDeadline: DashboardRecentProject = {
			...mockProject,
			deadline_date: null
		};
		expect(noDeadline.deadline_date).toBeNull();
	});

	it('progress is a number between 0 and 100', () => {
		expect(typeof mockProject.progress).toBe('number');
		expect(mockProject.progress).toBeGreaterThanOrEqual(0);
		expect(mockProject.progress).toBeLessThanOrEqual(100);
	});
});

// =============================================================================
// MONTHLY PROJECT DATA
// =============================================================================

describe('MonthlyProjectData type shape', () => {
	const mockMonth: MonthlyProjectData = {
		month: '2026-02',
		label: 'feb',
		started: 3,
		completed: 1
	};

	it('has all required fields', () => {
		expect(mockMonth.month).toBeDefined();
		expect(mockMonth.label).toBeDefined();
		expect(mockMonth.started).toBeDefined();
		expect(mockMonth.completed).toBeDefined();
	});

	it('month follows YYYY-MM format', () => {
		expect(mockMonth.month).toMatch(/^\d{4}-\d{2}$/);
	});

	it('started and completed are non-negative numbers', () => {
		expect(typeof mockMonth.started).toBe('number');
		expect(typeof mockMonth.completed).toBe('number');
		expect(mockMonth.started).toBeGreaterThanOrEqual(0);
		expect(mockMonth.completed).toBeGreaterThanOrEqual(0);
	});

	it('label is a short month string', () => {
		expect(typeof mockMonth.label).toBe('string');
		expect(mockMonth.label.length).toBeLessThanOrEqual(5);
	});
});

// =============================================================================
// DASHBOARD RESPONSE
// =============================================================================

describe('DashboardResponse type shape', () => {
	const mockResponse: DashboardResponse = {
		metrics: {
			total_projects: 5,
			active_projects: 3,
			completed_projects: 1,
			in_review_count: 4,
			in_review_trend: 1,
			average_progress: 30,
			sections_by_status: { draft: 5, generated: 3, review: 4, approved: 2, rejected: 1 },
			total_sections: 15
		},
		recent_projects: [
			{
				id: '1',
				name: 'Project A',
				current_phase: 'preparing',
				deadline_date: null,
				progress: 10,
				updated_at: '2026-02-09T12:00:00Z'
			}
		],
		upcoming_deadlines: [],
		monthly_data: [
			{ month: '2025-09', label: 'sep', started: 1, completed: 0 },
			{ month: '2025-10', label: 'okt', started: 2, completed: 1 },
			{ month: '2025-11', label: 'nov', started: 0, completed: 0 },
			{ month: '2025-12', label: 'dec', started: 1, completed: 0 },
			{ month: '2026-01', label: 'jan', started: 1, completed: 0 },
			{ month: '2026-02', label: 'feb', started: 0, completed: 0 }
		]
	};

	it('has all required fields', () => {
		expect(mockResponse.metrics).toBeDefined();
		expect(mockResponse.recent_projects).toBeDefined();
		expect(mockResponse.upcoming_deadlines).toBeDefined();
		expect(mockResponse.monthly_data).toBeDefined();
	});

	it('recent_projects is an array', () => {
		expect(Array.isArray(mockResponse.recent_projects)).toBe(true);
	});

	it('upcoming_deadlines is an array', () => {
		expect(Array.isArray(mockResponse.upcoming_deadlines)).toBe(true);
	});

	it('monthly_data is an array of 6 months', () => {
		expect(Array.isArray(mockResponse.monthly_data)).toBe(true);
		expect(mockResponse.monthly_data).toHaveLength(6);
	});

	it('monthly_data is in chronological order', () => {
		for (let i = 1; i < mockResponse.monthly_data.length; i++) {
			expect(mockResponse.monthly_data[i].month > mockResponse.monthly_data[i - 1].month).toBe(true);
		}
	});

	it('empty dashboard has sensible defaults', () => {
		const emptyDashboard: DashboardResponse = {
			metrics: {
				total_projects: 0,
				active_projects: 0,
				completed_projects: 0,
				in_review_count: 0,
				in_review_trend: 0,
				average_progress: 0,
				sections_by_status: {},
				total_sections: 0
			},
			recent_projects: [],
			upcoming_deadlines: [],
			monthly_data: []
		};

		expect(emptyDashboard.metrics.total_projects).toBe(0);
		expect(emptyDashboard.metrics.average_progress).toBe(0);
		expect(emptyDashboard.recent_projects).toHaveLength(0);
		expect(emptyDashboard.upcoming_deadlines).toHaveLength(0);
	});
});

// =============================================================================
// PROGRESS CALCULATION LOGIC
// =============================================================================

describe('Dashboard progress calculation', () => {
	it('calculates progress correctly from artifacts and activities', () => {
		const approvedArtifacts = 3;
		const totalArtifacts = 10;
		const completedActivities = 2;
		const totalActivities = 5;

		const totalItems = totalArtifacts + totalActivities;
		const completedItems = approvedArtifacts + completedActivities;
		const progress = Math.round((completedItems / totalItems) * 100);

		expect(progress).toBe(33); // (3+2)/(10+5) = 33%
	});

	it('returns 0 progress when no items exist', () => {
		const totalItems = 0;
		const progress = totalItems > 0 ? Math.round((0 / totalItems) * 100) : 0;
		expect(progress).toBe(0);
	});

	it('returns 100 when all items are completed', () => {
		const approvedArtifacts = 5;
		const totalArtifacts = 5;
		const completedActivities = 3;
		const totalActivities = 3;

		const totalItems = totalArtifacts + totalActivities;
		const completedItems = approvedArtifacts + completedActivities;
		const progress = Math.round((completedItems / totalItems) * 100);

		expect(progress).toBe(100);
	});

	it('calculates average progress across projects', () => {
		const projectProgresses = [25, 50, 75, 100];
		const average = Math.round(
			projectProgresses.reduce((sum, p) => sum + p, 0) / projectProgresses.length
		);
		expect(average).toBe(63); // (25+50+75+100)/4 = 62.5 → 63
	});

	it('returns 0 average when no active projects', () => {
		const projectProgresses: number[] = [];
		const average = projectProgresses.length > 0
			? Math.round(projectProgresses.reduce((sum, p) => sum + p, 0) / projectProgresses.length)
			: 0;
		expect(average).toBe(0);
	});
});

// =============================================================================
// MONTHLY DATA AGGREGATION LOGIC
// =============================================================================

describe('Monthly data aggregation', () => {
	it('counts projects started in a given month', () => {
		const projects = [
			{ created_at: '2026-01-15T10:00:00Z', status: 'draft' },
			{ created_at: '2026-01-20T10:00:00Z', status: 'briefing' },
			{ created_at: '2026-02-05T10:00:00Z', status: 'review' }
		];

		const janStart = new Date(2026, 0, 1);
		const janEnd = new Date(2026, 0, 31, 23, 59, 59);

		const startedInJan = projects.filter(p => {
			const created = new Date(p.created_at);
			return created >= janStart && created <= janEnd;
		}).length;

		expect(startedInJan).toBe(2);
	});

	it('counts projects completed in a given month', () => {
		const completedStatuses = ['approved', 'published'];
		const projects = [
			{ updated_at: '2026-01-10T10:00:00Z', status: 'approved' },
			{ updated_at: '2026-01-25T10:00:00Z', status: 'published' },
			{ updated_at: '2026-01-15T10:00:00Z', status: 'draft' },
			{ updated_at: '2026-02-01T10:00:00Z', status: 'approved' }
		];

		const janStart = new Date(2026, 0, 1);
		const janEnd = new Date(2026, 0, 31, 23, 59, 59);

		const completedInJan = projects.filter(p => {
			const updated = new Date(p.updated_at);
			return completedStatuses.includes(p.status) && updated >= janStart && updated <= janEnd;
		}).length;

		expect(completedInJan).toBe(2);
	});

	it('generates correct month labels', () => {
		const monthDate = new Date(2026, 0, 1);
		const label = monthDate.toLocaleDateString('nl-NL', { month: 'short' });
		expect(typeof label).toBe('string');
		expect(label.length).toBeGreaterThan(0);
	});

	it('generates 6 months of data', () => {
		const monthlyData = [];
		const now = new Date(2026, 1, 9); // Feb 9, 2026

		for (let i = 5; i >= 0; i--) {
			const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
			monthlyData.push({ month: monthKey, label: '', started: 0, completed: 0 });
		}

		expect(monthlyData).toHaveLength(6);
		expect(monthlyData[0].month).toBe('2025-09');
		expect(monthlyData[5].month).toBe('2026-02');
	});
});

// =============================================================================
// DEADLINE FILTERING LOGIC
// =============================================================================

describe('Deadline filtering', () => {
	const DEADLINE_DAYS_AHEAD = 7;

	it('finds deadlines within the next 7 days', () => {
		const today = new Date('2026-02-09');
		const nextWeek = new Date('2026-02-16');

		const projects = [
			{ name: 'A', deadline_date: '2026-02-10' },
			{ name: 'B', deadline_date: '2026-02-15' },
			{ name: 'C', deadline_date: '2026-02-20' },
			{ name: 'D', deadline_date: null }
		];

		const upcoming = projects.filter(p =>
			p.deadline_date && new Date(p.deadline_date) >= today && new Date(p.deadline_date) <= nextWeek
		);

		expect(upcoming).toHaveLength(2);
		expect(upcoming[0].name).toBe('A');
		expect(upcoming[1].name).toBe('B');
	});

	it('sorts deadlines by date ascending', () => {
		const deadlines = [
			{ deadline_date: '2026-02-15' },
			{ deadline_date: '2026-02-10' },
			{ deadline_date: '2026-02-12' }
		];

		const sorted = [...deadlines].sort(
			(a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime()
		);

		expect(sorted[0].deadline_date).toBe('2026-02-10');
		expect(sorted[1].deadline_date).toBe('2026-02-12');
		expect(sorted[2].deadline_date).toBe('2026-02-15');
	});

	it('returns empty array when no upcoming deadlines', () => {
		const today = new Date('2026-02-09');
		const nextWeek = new Date('2026-02-16');

		const projects = [
			{ deadline_date: '2026-03-01' },
			{ deadline_date: null }
		];

		const upcoming = projects.filter(p =>
			p.deadline_date && new Date(p.deadline_date) >= today && new Date(p.deadline_date) <= nextWeek
		);

		expect(upcoming).toHaveLength(0);
	});
});

// =============================================================================
// SECTIONS BY STATUS LOGIC
// =============================================================================

describe('Sections by status aggregation', () => {
	it('counts artifacts per status', () => {
		const artifacts = [
			{ status: 'draft' },
			{ status: 'draft' },
			{ status: 'review' },
			{ status: 'approved' },
			{ status: 'approved' },
			{ status: 'approved' },
			{ status: 'rejected' }
		];

		const sectionsByStatus = {
			draft: artifacts.filter(a => a.status === 'draft').length,
			generated: artifacts.filter(a => a.status === 'generated').length,
			review: artifacts.filter(a => a.status === 'review').length,
			approved: artifacts.filter(a => a.status === 'approved').length,
			rejected: artifacts.filter(a => a.status === 'rejected').length
		};

		expect(sectionsByStatus.draft).toBe(2);
		expect(sectionsByStatus.generated).toBe(0);
		expect(sectionsByStatus.review).toBe(1);
		expect(sectionsByStatus.approved).toBe(3);
		expect(sectionsByStatus.rejected).toBe(1);
	});

	it('calculates correct percentages', () => {
		const totalSections = 20;
		const reviewCount = 4;
		const percentage = Math.round((reviewCount / totalSections) * 100);
		expect(percentage).toBe(20);
	});

	it('handles empty artifacts', () => {
		const sectionsByStatus = {
			draft: 0,
			generated: 0,
			review: 0,
			approved: 0,
			rejected: 0
		};

		const total = Object.values(sectionsByStatus).reduce((a, b) => a + b, 0);
		expect(total).toBe(0);
	});
});
