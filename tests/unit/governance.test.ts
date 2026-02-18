// Unit tests for data governance utilities — Fase 12
// Tests classification mapping, retention date calculation, and governance tables

import { describe, it, expect } from 'vitest';
import {
	getDataClassification,
	calculateRetentionDate,
	getGovernanceTables
} from '../../src/lib/utils/governance';
import type { OrganizationSettings } from '../../src/lib/types/db/multi-org';

// =============================================================================
// MOCK SETTINGS
// =============================================================================

const DEFAULT_SETTINGS: Pick<
	OrganizationSettings,
	| 'retention_archive_years_granted'
	| 'retention_personal_data_years'
	| 'retention_operational_years'
> = {
	retention_archive_years_granted: 7,
	retention_personal_data_years: 1,
	retention_operational_years: 1
};

const CUSTOM_SETTINGS: Pick<
	OrganizationSettings,
	| 'retention_archive_years_granted'
	| 'retention_personal_data_years'
	| 'retention_operational_years'
> = {
	retention_archive_years_granted: 10,
	retention_personal_data_years: 2,
	retention_operational_years: 3
};

// =============================================================================
// getDataClassification
// =============================================================================

describe('getDataClassification', () => {
	it('returns archive for correspondence', () => {
		expect(getDataClassification('correspondence')).toBe('archive');
	});

	it('returns archive for artifacts', () => {
		expect(getDataClassification('artifacts')).toBe('archive');
	});

	it('returns archive for evaluations', () => {
		expect(getDataClassification('evaluations')).toBe('archive');
	});

	it('returns archive for documents', () => {
		expect(getDataClassification('documents')).toBe('archive');
	});

	it('returns operational for conversations', () => {
		expect(getDataClassification('conversations')).toBe('operational');
	});

	it('returns operational for messages', () => {
		expect(getDataClassification('messages')).toBe('operational');
	});

	it('returns operational for time_entries', () => {
		expect(getDataClassification('time_entries')).toBe('operational');
	});

	it('returns operational for document_comments', () => {
		expect(getDataClassification('document_comments')).toBe('operational');
	});

	it('returns operational for section_reviewers', () => {
		expect(getDataClassification('section_reviewers')).toBe('operational');
	});

	it('returns personal for suppliers', () => {
		expect(getDataClassification('suppliers')).toBe('personal');
	});

	it('returns personal for supplier_contacts', () => {
		expect(getDataClassification('supplier_contacts')).toBe('personal');
	});

	it('returns archive for incoming_questions', () => {
		expect(getDataClassification('incoming_questions')).toBe('archive');
	});

	it('returns operational for unknown table', () => {
		expect(getDataClassification('unknown_table')).toBe('operational');
	});
});

// =============================================================================
// calculateRetentionDate
// =============================================================================

describe('calculateRetentionDate', () => {
	const CONTRACT_END = new Date('2026-06-15');

	it('adds 7 years for archive with default settings', () => {
		const result = calculateRetentionDate(
			DEFAULT_SETTINGS, 'archive', CONTRACT_END
		);
		expect(result.getFullYear()).toBe(2033);
		expect(result.getMonth()).toBe(5); // June = 5
		expect(result.getDate()).toBe(15);
	});

	it('adds 1 year for personal with default settings', () => {
		const result = calculateRetentionDate(
			DEFAULT_SETTINGS, 'personal', CONTRACT_END
		);
		expect(result.getFullYear()).toBe(2027);
		expect(result.getMonth()).toBe(5);
	});

	it('adds 1 year for operational with default settings', () => {
		const result = calculateRetentionDate(
			DEFAULT_SETTINGS, 'operational', CONTRACT_END
		);
		expect(result.getFullYear()).toBe(2027);
		expect(result.getMonth()).toBe(5);
	});

	it('respects custom org settings for archive', () => {
		const result = calculateRetentionDate(
			CUSTOM_SETTINGS, 'archive', CONTRACT_END
		);
		expect(result.getFullYear()).toBe(2036);
	});

	it('respects custom org settings for personal', () => {
		const result = calculateRetentionDate(
			CUSTOM_SETTINGS, 'personal', CONTRACT_END
		);
		expect(result.getFullYear()).toBe(2028);
	});

	it('respects custom org settings for operational', () => {
		const result = calculateRetentionDate(
			CUSTOM_SETTINGS, 'operational', CONTRACT_END
		);
		expect(result.getFullYear()).toBe(2029);
	});

	it('does not mutate the original contract end date', () => {
		const original = new Date('2026-01-01');
		calculateRetentionDate(DEFAULT_SETTINGS, 'archive', original);
		expect(original.getFullYear()).toBe(2026);
	});

	it('handles leap year boundary correctly', () => {
		const leapDate = new Date('2024-02-29');
		const result = calculateRetentionDate(
			DEFAULT_SETTINGS, 'archive', leapDate
		);
		// 2024 + 7 = 2031 (no Feb 29), JS rolls to Mar 1
		expect(result.getFullYear()).toBe(2031);
	});
});

// =============================================================================
// getGovernanceTables
// =============================================================================

describe('getGovernanceTables', () => {
	it('returns all governed table names', () => {
		const tables = getGovernanceTables();
		expect(tables).toContain('correspondence');
		expect(tables).toContain('artifacts');
		expect(tables).toContain('evaluations');
		expect(tables).toContain('documents');
		expect(tables).toContain('conversations');
		expect(tables).toContain('messages');
		expect(tables).toContain('time_entries');
		expect(tables).toContain('document_comments');
		expect(tables).toContain('section_reviewers');
	});

	it('includes supplier tables', () => {
		const tables = getGovernanceTables();
		expect(tables).toContain('suppliers');
		expect(tables).toContain('supplier_contacts');
		expect(tables).toContain('project_suppliers');
	});

	it('includes incoming_questions', () => {
		const tables = getGovernanceTables();
		expect(tables).toContain('incoming_questions');
	});

	it('returns an array with at least 9 tables', () => {
		const tables = getGovernanceTables();
		expect(tables.length).toBeGreaterThanOrEqual(9);
	});
});
