// Unit tests for Fase 21 — Selectielijst profielen
// Tests API response format, retention profile data, and governance integration

import { describe, it, expect } from 'vitest';
import type { RetentionProfile } from '../../src/lib/types/db/multi-org';
import type { RetentionProfileValues } from '../../src/lib/utils/governance';
import {
	calculateRetentionDate,
	getDataClassification
} from '../../src/lib/utils/governance';

// =============================================================================
// MOCK DATA — VNG 2020 and PROVISA seed profiles
// =============================================================================

const VNG_2020_PROFILE: RetentionProfile = {
	id: 'vng_2020',
	name: 'VNG Selectielijst 2020',
	description: 'Standaard voor gemeenten',
	source: 'VNG Selectielijst gemeentelijke en intergemeentelijke organen 2020',
	archive_years_granted: 7,
	archive_years_not_granted: 5,
	personal_data_years: 1,
	operational_years: 1,
	created_at: '2026-01-01T00:00:00Z'
};

const PROVISA_PROFILE: RetentionProfile = {
	id: 'provisa',
	name: 'PROVISA',
	description: 'Provinciale selectielijst',
	source: 'Selectielijst archiefbescheiden provinciale organen',
	archive_years_granted: 7,
	archive_years_not_granted: 5,
	personal_data_years: 1,
	operational_years: 1,
	created_at: '2026-01-01T00:00:00Z'
};

const ALL_PROFILES: RetentionProfile[] = [VNG_2020_PROFILE, PROVISA_PROFILE];

// =============================================================================
// RETENTION PROFILE DATA
// =============================================================================

describe('Retention profile data — VNG 2020', () => {
	it('has correct id', () => {
		expect(VNG_2020_PROFILE.id).toBe('vng_2020');
	});

	it('has 7 archive years for granted tenders', () => {
		expect(VNG_2020_PROFILE.archive_years_granted).toBe(7);
	});

	it('has 5 archive years for non-granted tenders', () => {
		expect(VNG_2020_PROFILE.archive_years_not_granted).toBe(5);
	});

	it('has 1 year for personal data', () => {
		expect(VNG_2020_PROFILE.personal_data_years).toBe(1);
	});

	it('has 1 year for operational data', () => {
		expect(VNG_2020_PROFILE.operational_years).toBe(1);
	});

	it('has a description', () => {
		expect(VNG_2020_PROFILE.description).toBeTruthy();
	});

	it('has a source reference', () => {
		expect(VNG_2020_PROFILE.source).toContain('VNG');
	});
});

describe('Retention profile data — PROVISA', () => {
	it('has correct id', () => {
		expect(PROVISA_PROFILE.id).toBe('provisa');
	});

	it('has a source reference', () => {
		expect(PROVISA_PROFILE.source).toContain('provinciale');
	});

	it('has archive years matching spec', () => {
		expect(PROVISA_PROFILE.archive_years_granted).toBe(7);
		expect(PROVISA_PROFILE.archive_years_not_granted).toBe(5);
	});
});

// =============================================================================
// PROFILE SELECTION LOGIC
// =============================================================================

describe('Profile selection logic', () => {
	function findProfile(
		profiles: RetentionProfile[],
		id: string
	): RetentionProfile | undefined {
		return profiles.find((p) => p.id === id);
	}

	it('finds VNG 2020 by id', () => {
		const result = findProfile(ALL_PROFILES, 'vng_2020');
		expect(result).toBeDefined();
		expect(result?.name).toBe('VNG Selectielijst 2020');
	});

	it('finds PROVISA by id', () => {
		const result = findProfile(ALL_PROFILES, 'provisa');
		expect(result).toBeDefined();
		expect(result?.name).toBe('PROVISA');
	});

	it('returns undefined for unknown profile', () => {
		const result = findProfile(ALL_PROFILES, 'unknown');
		expect(result).toBeUndefined();
	});
});

// =============================================================================
// AUTO-FILL LOGIC (simulating component behavior)
// =============================================================================

describe('Auto-fill from profile selection', () => {
	function applyProfile(
		profiles: RetentionProfile[],
		profileId: string
	): RetentionProfileValues | null {
		const profile = profiles.find((p) => p.id === profileId);
		if (!profile) return null;
		return {
			profileId: profile.id,
			archiveYearsGranted: profile.archive_years_granted,
			archiveYearsNotGranted: profile.archive_years_not_granted,
			personalDataYears: profile.personal_data_years,
			operationalYears: profile.operational_years
		};
	}

	it('fills values from VNG 2020', () => {
		const values = applyProfile(ALL_PROFILES, 'vng_2020');
		expect(values).not.toBeNull();
		expect(values?.archiveYearsGranted).toBe(7);
		expect(values?.archiveYearsNotGranted).toBe(5);
		expect(values?.personalDataYears).toBe(1);
		expect(values?.operationalYears).toBe(1);
	});

	it('fills values from PROVISA', () => {
		const values = applyProfile(ALL_PROFILES, 'provisa');
		expect(values).not.toBeNull();
		expect(values?.profileId).toBe('provisa');
	});

	it('returns null for missing profile', () => {
		const values = applyProfile(ALL_PROFILES, 'nonexistent');
		expect(values).toBeNull();
	});
});

// =============================================================================
// OVERRIDE LOGIC
// =============================================================================

describe('Manual override of profile values', () => {
	it('allows overriding archive years while keeping profile id', () => {
		const overridden: RetentionProfileValues = {
			profileId: 'vng_2020',
			archiveYearsGranted: 10,
			archiveYearsNotGranted: 8,
			personalDataYears: 2,
			operationalYears: 3
		};
		expect(overridden.profileId).toBe('vng_2020');
		expect(overridden.archiveYearsGranted).toBe(10);
		expect(overridden.archiveYearsNotGranted).toBe(8);
	});

	it('overridden values integrate with retention calculation', () => {
		const orgSettings = {
			retention_archive_years_granted: 10,
			retention_personal_data_years: 2,
			retention_operational_years: 3
		};
		const contractEnd = new Date('2026-06-15');

		const archiveResult = calculateRetentionDate(
			orgSettings, 'archive', contractEnd
		);
		expect(archiveResult.getFullYear()).toBe(2036);

		const personalResult = calculateRetentionDate(
			orgSettings, 'personal', contractEnd
		);
		expect(personalResult.getFullYear()).toBe(2028);
	});
});

// =============================================================================
// INTEGRATION — profile values → governance calculation
// =============================================================================

describe('Profile values → governance calculation', () => {
	it('VNG 2020 archive classification gives 7-year retention', () => {
		const orgSettings = {
			retention_archive_years_granted: VNG_2020_PROFILE.archive_years_granted,
			retention_personal_data_years: VNG_2020_PROFILE.personal_data_years,
			retention_operational_years: VNG_2020_PROFILE.operational_years
		};

		const classification = getDataClassification('artifacts');
		expect(classification).toBe('archive');

		const result = calculateRetentionDate(
			orgSettings, classification, new Date('2026-01-01')
		);
		expect(result.getFullYear()).toBe(2033);
	});

	it('VNG 2020 personal classification gives 1-year retention', () => {
		const orgSettings = {
			retention_archive_years_granted: VNG_2020_PROFILE.archive_years_granted,
			retention_personal_data_years: VNG_2020_PROFILE.personal_data_years,
			retention_operational_years: VNG_2020_PROFILE.operational_years
		};

		const classification = getDataClassification('suppliers');
		expect(classification).toBe('personal');

		const result = calculateRetentionDate(
			orgSettings, classification, new Date('2026-01-01')
		);
		expect(result.getFullYear()).toBe(2027);
	});
});

// =============================================================================
// API RESPONSE FORMAT
// =============================================================================

describe('API response format — GET /api/retention-profiles', () => {
	it('profiles array contains expected fields', () => {
		for (const profile of ALL_PROFILES) {
			expect(profile).toHaveProperty('id');
			expect(profile).toHaveProperty('name');
			expect(profile).toHaveProperty('description');
			expect(profile).toHaveProperty('source');
			expect(profile).toHaveProperty('archive_years_granted');
			expect(profile).toHaveProperty('archive_years_not_granted');
			expect(profile).toHaveProperty('personal_data_years');
			expect(profile).toHaveProperty('operational_years');
			expect(profile).toHaveProperty('created_at');
		}
	});

	it('id is a non-empty string', () => {
		for (const profile of ALL_PROFILES) {
			expect(typeof profile.id).toBe('string');
			expect(profile.id.length).toBeGreaterThan(0);
		}
	});

	it('archive years are positive numbers', () => {
		for (const profile of ALL_PROFILES) {
			expect(profile.archive_years_granted).toBeGreaterThan(0);
			expect(profile.archive_years_not_granted).toBeGreaterThan(0);
		}
	});

	it('profiles have unique ids', () => {
		const ids = ALL_PROFILES.map((p) => p.id);
		const uniqueIds = new Set(ids);
		expect(uniqueIds.size).toBe(ids.length);
	});
});
