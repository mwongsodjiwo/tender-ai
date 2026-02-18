// Unit tests for procedure advice utility — Fase 20
// Tests all threshold variants, centraal vs decentraal, org-specific values,
// deviation detection, and social services simplified procedure

import { describe, it, expect } from 'vitest';
import {
	getProcedureAdvice,
	checkDeviation,
	CATEGORY_TYPES,
	type CategoryType
} from '../../src/lib/utils/procedure-advice';
import type { OrganizationSettings } from '../../src/lib/types/db/multi-org';

// =============================================================================
// MOCK SETTINGS
// =============================================================================

type ThresholdSettings = Pick<
	OrganizationSettings,
	| 'threshold_works'
	| 'threshold_services_central'
	| 'threshold_services_decentral'
	| 'threshold_social_services'
>;

const DEFAULT_THRESHOLDS: ThresholdSettings = {
	threshold_works: 5538000,
	threshold_services_central: 143000,
	threshold_services_decentral: 221000,
	threshold_social_services: 750000
};

const CUSTOM_THRESHOLDS: ThresholdSettings = {
	threshold_works: 6000000,
	threshold_services_central: 150000,
	threshold_services_decentral: 250000,
	threshold_social_services: 800000
};

// =============================================================================
// getProcedureAdvice — diensten centraal
// =============================================================================

describe('getProcedureAdvice — diensten centraal', () => {
	it('advises European open above threshold (143k)', () => {
		const result = getProcedureAdvice(
			200000, 'diensten', 'centraal', DEFAULT_THRESHOLDS
		);
		expect(result.recommended).toBe('open');
		expect(result.label).toBe('Europees openbaar');
		expect(result.isAboveThreshold).toBe(true);
		expect(result.threshold).toBe(143000);
	});

	it('advises European open exactly at threshold', () => {
		const result = getProcedureAdvice(
			143000, 'diensten', 'centraal', DEFAULT_THRESHOLDS
		);
		expect(result.recommended).toBe('open');
		expect(result.isAboveThreshold).toBe(true);
	});

	it('advises national/onderhandse below threshold', () => {
		const result = getProcedureAdvice(
			100000, 'diensten', 'centraal', DEFAULT_THRESHOLDS
		);
		expect(result.recommended).toBe('national_open');
		expect(result.isAboveThreshold).toBe(false);
		expect(result.threshold).toBe(143000);
	});

	it('includes motivation text with amounts', () => {
		const result = getProcedureAdvice(
			200000, 'diensten', 'centraal', DEFAULT_THRESHOLDS
		);
		expect(result.motivation).toContain('200.000');
		expect(result.motivation).toContain('143.000');
	});
});

// =============================================================================
// getProcedureAdvice — diensten decentraal
// =============================================================================

describe('getProcedureAdvice — diensten decentraal', () => {
	it('advises European open above threshold (221k)', () => {
		const result = getProcedureAdvice(
			250000, 'diensten', 'decentraal', DEFAULT_THRESHOLDS
		);
		expect(result.recommended).toBe('open');
		expect(result.isAboveThreshold).toBe(true);
		expect(result.threshold).toBe(221000);
	});

	it('advises national/onderhandse below threshold', () => {
		const result = getProcedureAdvice(
			150000, 'diensten', 'decentraal', DEFAULT_THRESHOLDS
		);
		expect(result.recommended).toBe('national_open');
		expect(result.isAboveThreshold).toBe(false);
	});

	it('uses decentral threshold, not central', () => {
		// 200k is above central (143k) but below decentral (221k)
		const result = getProcedureAdvice(
			200000, 'diensten', 'decentraal', DEFAULT_THRESHOLDS
		);
		expect(result.recommended).toBe('national_open');
		expect(result.isAboveThreshold).toBe(false);
	});
});

// =============================================================================
// getProcedureAdvice — werken
// =============================================================================

describe('getProcedureAdvice — werken', () => {
	it('advises European open above threshold (5.538k)', () => {
		const result = getProcedureAdvice(
			6000000, 'werken', 'centraal', DEFAULT_THRESHOLDS
		);
		expect(result.recommended).toBe('open');
		expect(result.isAboveThreshold).toBe(true);
		expect(result.threshold).toBe(5538000);
	});

	it('advises national below threshold', () => {
		const result = getProcedureAdvice(
			3000000, 'werken', 'centraal', DEFAULT_THRESHOLDS
		);
		expect(result.recommended).toBe('national_open');
		expect(result.isAboveThreshold).toBe(false);
	});

	it('uses same threshold for centraal and decentraal', () => {
		const centraal = getProcedureAdvice(
			5538000, 'werken', 'centraal', DEFAULT_THRESHOLDS
		);
		const decentraal = getProcedureAdvice(
			5538000, 'werken', 'decentraal', DEFAULT_THRESHOLDS
		);
		expect(centraal.threshold).toBe(decentraal.threshold);
		expect(centraal.isAboveThreshold).toBe(decentraal.isAboveThreshold);
	});
});

// =============================================================================
// getProcedureAdvice — sociaal
// =============================================================================

describe('getProcedureAdvice — sociaal', () => {
	it('advises simplified procedure above threshold (750k)', () => {
		const result = getProcedureAdvice(
			800000, 'sociaal', 'centraal', DEFAULT_THRESHOLDS
		);
		expect(result.recommended).toBe('open');
		expect(result.label).toBe('Vereenvoudigd regime');
		expect(result.isAboveThreshold).toBe(true);
		expect(result.threshold).toBe(750000);
	});

	it('advises national below social threshold', () => {
		const result = getProcedureAdvice(
			500000, 'sociaal', 'decentraal', DEFAULT_THRESHOLDS
		);
		expect(result.recommended).toBe('national_open');
		expect(result.isAboveThreshold).toBe(false);
	});

	it('uses same social threshold for centraal and decentraal', () => {
		const centraal = getProcedureAdvice(
			750000, 'sociaal', 'centraal', DEFAULT_THRESHOLDS
		);
		const decentraal = getProcedureAdvice(
			750000, 'sociaal', 'decentraal', DEFAULT_THRESHOLDS
		);
		expect(centraal.threshold).toBe(decentraal.threshold);
	});
});

// =============================================================================
// getProcedureAdvice — org-specific thresholds
// =============================================================================

describe('getProcedureAdvice — org-specific thresholds', () => {
	it('uses custom threshold for works', () => {
		const result = getProcedureAdvice(
			5700000, 'werken', 'centraal', CUSTOM_THRESHOLDS
		);
		// 5.7M is below custom 6M threshold
		expect(result.isAboveThreshold).toBe(false);
		expect(result.threshold).toBe(6000000);
	});

	it('uses custom threshold for services central', () => {
		const result = getProcedureAdvice(
			145000, 'diensten', 'centraal', CUSTOM_THRESHOLDS
		);
		// 145k is below custom 150k threshold
		expect(result.isAboveThreshold).toBe(false);
		expect(result.threshold).toBe(150000);
	});

	it('uses custom threshold for services decentral', () => {
		const result = getProcedureAdvice(
			230000, 'diensten', 'decentraal', CUSTOM_THRESHOLDS
		);
		// 230k is below custom 250k threshold
		expect(result.isAboveThreshold).toBe(false);
		expect(result.threshold).toBe(250000);
	});

	it('uses custom threshold for social services', () => {
		const result = getProcedureAdvice(
			760000, 'sociaal', 'centraal', CUSTOM_THRESHOLDS
		);
		// 760k is below custom 800k threshold
		expect(result.isAboveThreshold).toBe(false);
		expect(result.threshold).toBe(800000);
	});
});

// =============================================================================
// getProcedureAdvice — null settings (uses defaults)
// =============================================================================

describe('getProcedureAdvice — null settings (defaults)', () => {
	it('falls back to default threshold for works', () => {
		const result = getProcedureAdvice(
			6000000, 'werken', 'centraal', null
		);
		expect(result.isAboveThreshold).toBe(true);
		expect(result.threshold).toBe(5538000);
	});

	it('falls back to default threshold for services central', () => {
		const result = getProcedureAdvice(
			200000, 'diensten', 'centraal', null
		);
		expect(result.isAboveThreshold).toBe(true);
		expect(result.threshold).toBe(143000);
	});

	it('falls back to default threshold for services decentral', () => {
		const result = getProcedureAdvice(
			250000, 'diensten', 'decentraal', null
		);
		expect(result.isAboveThreshold).toBe(true);
		expect(result.threshold).toBe(221000);
	});

	it('falls back to default threshold for social services', () => {
		const result = getProcedureAdvice(
			800000, 'sociaal', 'centraal', null
		);
		expect(result.isAboveThreshold).toBe(true);
		expect(result.threshold).toBe(750000);
	});
});

// =============================================================================
// checkDeviation
// =============================================================================

describe('checkDeviation', () => {
	it('detects no deviation when procedures match', () => {
		const result = checkDeviation('open', 'open');
		expect(result.isDeviation).toBe(false);
		expect(result.requiresJustification).toBe(false);
	});

	it('detects deviation when procedures differ', () => {
		const result = checkDeviation('open', 'restricted');
		expect(result.isDeviation).toBe(true);
		expect(result.requiresJustification).toBe(true);
	});

	it('detects deviation from national to European', () => {
		const result = checkDeviation('national_open', 'open');
		expect(result.isDeviation).toBe(true);
		expect(result.requiresJustification).toBe(true);
	});

	it('returns no deviation when chosen is null', () => {
		const result = checkDeviation('open', null);
		expect(result.isDeviation).toBe(false);
		expect(result.requiresJustification).toBe(false);
		expect(result.chosen).toBe('open');
	});

	it('returns recommended and chosen in result', () => {
		const result = checkDeviation('open', 'single_source');
		expect(result.recommended).toBe('open');
		expect(result.chosen).toBe('single_source');
	});
});

// =============================================================================
// CATEGORY_TYPES enum
// =============================================================================

describe('CATEGORY_TYPES', () => {
	it('contains diensten, werken, sociaal', () => {
		expect(CATEGORY_TYPES).toContain('diensten');
		expect(CATEGORY_TYPES).toContain('werken');
		expect(CATEGORY_TYPES).toContain('sociaal');
	});

	it('has exactly 3 entries', () => {
		expect(CATEGORY_TYPES).toHaveLength(3);
	});
});

// =============================================================================
// Edge cases
// =============================================================================

describe('getProcedureAdvice — edge cases', () => {
	it('handles zero amount', () => {
		const result = getProcedureAdvice(
			0, 'diensten', 'centraal', DEFAULT_THRESHOLDS
		);
		expect(result.recommended).toBe('national_open');
		expect(result.isAboveThreshold).toBe(false);
	});

	it('handles very large amounts', () => {
		const result = getProcedureAdvice(
			100_000_000, 'werken', 'centraal', DEFAULT_THRESHOLDS
		);
		expect(result.recommended).toBe('open');
		expect(result.isAboveThreshold).toBe(true);
	});

	it('handles amount just below threshold', () => {
		const result = getProcedureAdvice(
			142999, 'diensten', 'centraal', DEFAULT_THRESHOLDS
		);
		expect(result.isAboveThreshold).toBe(false);
	});

	it('handles amount of 1 euro', () => {
		const result = getProcedureAdvice(
			1, 'diensten', 'centraal', DEFAULT_THRESHOLDS
		);
		expect(result.recommended).toBe('national_open');
		expect(result.isAboveThreshold).toBe(false);
	});
});
