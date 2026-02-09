// Unit tests for Sprint R2 — New enums: activity_status, correspondence_status, evaluation_status

import { describe, it, expect } from 'vitest';
import {
	ACTIVITY_STATUSES,
	ACTIVITY_STATUS_LABELS,
	CORRESPONDENCE_STATUSES,
	CORRESPONDENCE_STATUS_LABELS,
	EVALUATION_STATUSES,
	EVALUATION_STATUS_LABELS,
	type ActivityStatus,
	type CorrespondenceStatus,
	type EvaluationStatus
} from '../../src/lib/types/enums';

// =============================================================================
// ACTIVITY STATUSES
// =============================================================================

describe('Activity statuses enum', () => {
	it('has exactly 4 statuses', () => {
		expect(ACTIVITY_STATUSES).toHaveLength(4);
	});

	it('contains all expected statuses', () => {
		expect(ACTIVITY_STATUSES).toContain('not_started');
		expect(ACTIVITY_STATUSES).toContain('in_progress');
		expect(ACTIVITY_STATUSES).toContain('completed');
		expect(ACTIVITY_STATUSES).toContain('skipped');
	});

	it('is in correct order', () => {
		expect(ACTIVITY_STATUSES[0]).toBe('not_started');
		expect(ACTIVITY_STATUSES[1]).toBe('in_progress');
		expect(ACTIVITY_STATUSES[2]).toBe('completed');
		expect(ACTIVITY_STATUSES[3]).toBe('skipped');
	});

	it('is a const tuple', () => {
		expect(Array.isArray(ACTIVITY_STATUSES)).toBe(true);
	});
});

describe('Activity status labels (Dutch)', () => {
	it('has a label for every status', () => {
		for (const status of ACTIVITY_STATUSES) {
			expect(ACTIVITY_STATUS_LABELS[status]).toBeDefined();
			expect(typeof ACTIVITY_STATUS_LABELS[status]).toBe('string');
			expect(ACTIVITY_STATUS_LABELS[status].length).toBeGreaterThan(0);
		}
	});

	it('has correct Dutch labels', () => {
		expect(ACTIVITY_STATUS_LABELS.not_started).toBe('Niet gestart');
		expect(ACTIVITY_STATUS_LABELS.in_progress).toBe('Bezig');
		expect(ACTIVITY_STATUS_LABELS.completed).toBe('Afgerond');
		expect(ACTIVITY_STATUS_LABELS.skipped).toBe('Overgeslagen');
	});
});

describe('ActivityStatus type compatibility', () => {
	it('all statuses are valid ActivityStatus values', () => {
		const statuses: ActivityStatus[] = ['not_started', 'in_progress', 'completed', 'skipped'];
		expect(statuses).toEqual([...ACTIVITY_STATUSES]);
	});
});

// =============================================================================
// CORRESPONDENCE STATUSES
// =============================================================================

describe('Correspondence statuses enum', () => {
	it('has exactly 4 statuses', () => {
		expect(CORRESPONDENCE_STATUSES).toHaveLength(4);
	});

	it('contains all expected statuses', () => {
		expect(CORRESPONDENCE_STATUSES).toContain('draft');
		expect(CORRESPONDENCE_STATUSES).toContain('ready');
		expect(CORRESPONDENCE_STATUSES).toContain('sent');
		expect(CORRESPONDENCE_STATUSES).toContain('archived');
	});

	it('is in correct order', () => {
		expect(CORRESPONDENCE_STATUSES[0]).toBe('draft');
		expect(CORRESPONDENCE_STATUSES[1]).toBe('ready');
		expect(CORRESPONDENCE_STATUSES[2]).toBe('sent');
		expect(CORRESPONDENCE_STATUSES[3]).toBe('archived');
	});

	it('is a const tuple', () => {
		expect(Array.isArray(CORRESPONDENCE_STATUSES)).toBe(true);
	});
});

describe('Correspondence status labels (Dutch)', () => {
	it('has a label for every status', () => {
		for (const status of CORRESPONDENCE_STATUSES) {
			expect(CORRESPONDENCE_STATUS_LABELS[status]).toBeDefined();
			expect(typeof CORRESPONDENCE_STATUS_LABELS[status]).toBe('string');
			expect(CORRESPONDENCE_STATUS_LABELS[status].length).toBeGreaterThan(0);
		}
	});

	it('has correct Dutch labels', () => {
		expect(CORRESPONDENCE_STATUS_LABELS.draft).toBe('Concept');
		expect(CORRESPONDENCE_STATUS_LABELS.ready).toBe('Gereed');
		expect(CORRESPONDENCE_STATUS_LABELS.sent).toBe('Verzonden');
		expect(CORRESPONDENCE_STATUS_LABELS.archived).toBe('Gearchiveerd');
	});
});

describe('CorrespondenceStatus type compatibility', () => {
	it('all statuses are valid CorrespondenceStatus values', () => {
		const statuses: CorrespondenceStatus[] = ['draft', 'ready', 'sent', 'archived'];
		expect(statuses).toEqual([...CORRESPONDENCE_STATUSES]);
	});
});

// =============================================================================
// EVALUATION STATUSES
// =============================================================================

describe('Evaluation statuses enum', () => {
	it('has exactly 4 statuses', () => {
		expect(EVALUATION_STATUSES).toHaveLength(4);
	});

	it('contains all expected statuses', () => {
		expect(EVALUATION_STATUSES).toContain('draft');
		expect(EVALUATION_STATUSES).toContain('scoring');
		expect(EVALUATION_STATUSES).toContain('completed');
		expect(EVALUATION_STATUSES).toContain('published');
	});

	it('is in correct order', () => {
		expect(EVALUATION_STATUSES[0]).toBe('draft');
		expect(EVALUATION_STATUSES[1]).toBe('scoring');
		expect(EVALUATION_STATUSES[2]).toBe('completed');
		expect(EVALUATION_STATUSES[3]).toBe('published');
	});

	it('is a const tuple', () => {
		expect(Array.isArray(EVALUATION_STATUSES)).toBe(true);
	});
});

describe('Evaluation status labels (Dutch)', () => {
	it('has a label for every status', () => {
		for (const status of EVALUATION_STATUSES) {
			expect(EVALUATION_STATUS_LABELS[status]).toBeDefined();
			expect(typeof EVALUATION_STATUS_LABELS[status]).toBe('string');
			expect(EVALUATION_STATUS_LABELS[status].length).toBeGreaterThan(0);
		}
	});

	it('has correct Dutch labels', () => {
		expect(EVALUATION_STATUS_LABELS.draft).toBe('Concept');
		expect(EVALUATION_STATUS_LABELS.scoring).toBe('Beoordelen');
		expect(EVALUATION_STATUS_LABELS.completed).toBe('Afgerond');
		expect(EVALUATION_STATUS_LABELS.published).toBe('Gepubliceerd');
	});
});

describe('EvaluationStatus type compatibility', () => {
	it('all statuses are valid EvaluationStatus values', () => {
		const statuses: EvaluationStatus[] = ['draft', 'scoring', 'completed', 'published'];
		expect(statuses).toEqual([...EVALUATION_STATUSES]);
	});
});
