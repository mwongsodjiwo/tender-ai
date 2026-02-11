// Sprint 8 — Notifications & integrations tests
// Tests validation schemas, export helpers, and enum coverage

import { describe, it, expect } from 'vitest';
import {
	notificationListQuerySchema,
	markNotificationsReadSchema,
	updateNotificationPreferenceSchema,
	planningExportQuerySchema
} from '$server/api/validation';
import {
	NOTIFICATION_TYPES,
	NOTIFICATION_TYPE_LABELS,
	NOTIFICATION_TYPE_DESCRIPTIONS
} from '$types';
import { generateICalFeed } from '$server/planning/export-ical';
import { generateCsvExport } from '$server/planning/export-csv';
import type { Milestone, PhaseActivity } from '$types';

// =============================================================================
// NOTIFICATION ENUMS
// =============================================================================

describe('NotificationType enum', () => {
	it('should have 7 notification types', () => {
		expect(NOTIFICATION_TYPES).toHaveLength(7);
	});

	it('should have labels for all types', () => {
		for (const type of NOTIFICATION_TYPES) {
			expect(NOTIFICATION_TYPE_LABELS[type]).toBeDefined();
			expect(NOTIFICATION_TYPE_LABELS[type].length).toBeGreaterThan(0);
		}
	});

	it('should have descriptions for all types', () => {
		for (const type of NOTIFICATION_TYPES) {
			expect(NOTIFICATION_TYPE_DESCRIPTIONS[type]).toBeDefined();
			expect(NOTIFICATION_TYPE_DESCRIPTIONS[type].length).toBeGreaterThan(0);
		}
	});

	it('should have Dutch labels', () => {
		expect(NOTIFICATION_TYPE_LABELS.deadline_approaching).toBe('Naderende deadline');
		expect(NOTIFICATION_TYPE_LABELS.deadline_overdue).toBe('Verlopen deadline');
		expect(NOTIFICATION_TYPE_LABELS.weekly_summary).toBe('Wekelijks overzicht');
	});
});

// =============================================================================
// NOTIFICATION VALIDATION SCHEMAS
// =============================================================================

describe('notificationListQuerySchema', () => {
	it('should accept empty query (defaults)', () => {
		const result = notificationListQuerySchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(20);
			expect(result.data.offset).toBe(0);
			expect(result.data.unread_only).toBe(false);
		}
	});

	it('should accept valid filter params', () => {
		const result = notificationListQuerySchema.safeParse({
			unread_only: 'true',
			notification_type: 'deadline_approaching',
			limit: '10',
			offset: '5'
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid notification_type', () => {
		const result = notificationListQuerySchema.safeParse({
			notification_type: 'invalid_type'
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid project_id', () => {
		const result = notificationListQuerySchema.safeParse({
			project_id: 'not-a-uuid'
		});
		expect(result.success).toBe(false);
	});
});

describe('markNotificationsReadSchema', () => {
	it('should accept valid notification ids', () => {
		const result = markNotificationsReadSchema.safeParse({
			notification_ids: ['550e8400-e29b-41d4-a716-446655440001']
		});
		expect(result.success).toBe(true);
	});

	it('should reject empty array', () => {
		const result = markNotificationsReadSchema.safeParse({
			notification_ids: []
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid UUIDs', () => {
		const result = markNotificationsReadSchema.safeParse({
			notification_ids: ['not-a-uuid']
		});
		expect(result.success).toBe(false);
	});
});

describe('updateNotificationPreferenceSchema', () => {
	it('should accept valid preference update', () => {
		const result = updateNotificationPreferenceSchema.safeParse({
			notification_type: 'deadline_approaching',
			in_app: true,
			email: false,
			days_before_deadline: 7
		});
		expect(result.success).toBe(true);
	});

	it('should accept partial update', () => {
		const result = updateNotificationPreferenceSchema.safeParse({
			notification_type: 'milestone_completed',
			email: false
		});
		expect(result.success).toBe(true);
	});

	it('should reject days_before_deadline out of range', () => {
		const result = updateNotificationPreferenceSchema.safeParse({
			notification_type: 'deadline_approaching',
			days_before_deadline: 0
		});
		expect(result.success).toBe(false);
	});

	it('should reject days_before_deadline above 30', () => {
		const result = updateNotificationPreferenceSchema.safeParse({
			notification_type: 'deadline_approaching',
			days_before_deadline: 31
		});
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// PLANNING EXPORT VALIDATION
// =============================================================================

describe('planningExportQuerySchema', () => {
	it('should accept empty query (defaults)', () => {
		const result = planningExportQuerySchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.include_activities).toBe(true);
			expect(result.data.include_milestones).toBe(true);
		}
	});

	it('should accept valid phase filter', () => {
		const result = planningExportQuerySchema.safeParse({
			phase: 'tendering'
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid phase', () => {
		const result = planningExportQuerySchema.safeParse({
			phase: 'invalid_phase'
		});
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// ICAL EXPORT
// =============================================================================

describe('generateICalFeed', () => {
	const mockMilestones: Partial<Milestone>[] = [
		{
			id: '550e8400-e29b-41d4-a716-446655440001',
			title: 'Publicatie op TenderNed',
			description: 'Officiële publicatie',
			target_date: '2026-03-15',
			milestone_type: 'publication'
		}
	];

	const mockActivities: Partial<PhaseActivity>[] = [
		{
			id: '550e8400-e29b-41d4-a716-446655440002',
			title: 'PvE afronden',
			description: 'Programma van Eisen',
			due_date: '2026-03-10',
			phase: 'specifying'
		}
	];

	it('should generate valid iCal output', () => {
		const result = generateICalFeed(
			'Test Project',
			mockMilestones as Milestone[],
			mockActivities as PhaseActivity[]
		);

		expect(result).toContain('BEGIN:VCALENDAR');
		expect(result).toContain('END:VCALENDAR');
		expect(result).toContain('VERSION:2.0');
		expect(result).toContain('PRODID:-//TenderManager//Planning//NL');
	});

	it('should include milestone events', () => {
		const result = generateICalFeed(
			'Test Project',
			mockMilestones as Milestone[],
			[]
		);

		expect(result).toContain('BEGIN:VEVENT');
		expect(result).toContain('Publicatie op TenderNed');
		expect(result).toContain('DTSTART;VALUE=DATE:20260315');
	});

	it('should include activity events with due_date', () => {
		const result = generateICalFeed(
			'Test Project',
			[],
			mockActivities as PhaseActivity[]
		);

		expect(result).toContain('PvE afronden');
		expect(result).toContain('DTSTART;VALUE=DATE:20260310');
	});

	it('should handle empty arrays', () => {
		const result = generateICalFeed('Empty', [], []);
		expect(result).toContain('BEGIN:VCALENDAR');
		expect(result).toContain('END:VCALENDAR');
		expect(result).not.toContain('BEGIN:VEVENT');
	});
});

// =============================================================================
// CSV EXPORT
// =============================================================================

describe('generateCsvExport', () => {
	const mockMilestones: Partial<Milestone>[] = [
		{
			title: 'Inschrijfdeadline',
			milestone_type: 'submission_deadline',
			phase: 'tendering',
			status: 'not_started',
			target_date: '2026-04-01',
			is_critical: true
		}
	];

	const mockActivities: Partial<PhaseActivity>[] = [
		{
			title: 'Marktonderzoek',
			phase: 'exploring',
			status: 'in_progress',
			due_date: '2026-03-01',
			planned_start: '2026-02-10',
			planned_end: '2026-03-01',
			progress_percentage: 50,
			assigned_to: null
		}
	];

	it('should generate CSV with BOM and headers', () => {
		const result = generateCsvExport(
			mockMilestones as Milestone[],
			mockActivities as PhaseActivity[]
		);

		expect(result).toContain('\uFEFF');
		expect(result).toContain('Type;Titel;Fase;Status;Deadline');
	});

	it('should include milestone rows', () => {
		const result = generateCsvExport(mockMilestones as Milestone[], []);
		expect(result).toContain('Milestone');
		expect(result).toContain('Inschrijfdeadline');
		expect(result).toContain('Ja');
	});

	it('should include activity rows', () => {
		const result = generateCsvExport([], mockActivities as PhaseActivity[]);
		expect(result).toContain('Activiteit');
		expect(result).toContain('Marktonderzoek');
		expect(result).toContain('50%');
	});

	it('should handle empty data', () => {
		const result = generateCsvExport([], []);
		expect(result).toContain('Type;Titel');
		const lines = result.trim().split('\r\n');
		expect(lines).toHaveLength(1);
	});
});
