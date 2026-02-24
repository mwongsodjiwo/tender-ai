// Fase 109 — Unit tests for anchorDate resolution logic
// Tests the anchor date derivation used in ProfileForm and ProfileTabs:
// 1. profile.planning_metadata.project_start_date (primary)
// 2. project.created_at (fallback)
// 3. today (last resort)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/** Replicates the anchorDate resolution from ProfileForm line 240 / ProfileTabs line 251 */
function resolveAnchorDate(
	profile: { planning_metadata?: Record<string, unknown> } | null,
	project: { created_at?: string }
): string {
	return (
		(profile?.planning_metadata?.project_start_date as string) ??
		project.created_at?.split('T')[0] ??
		new Date().toISOString().split('T')[0]
	);
}

describe('resolveAnchorDate — primary: planning_metadata.project_start_date', () => {
	it('uses project_start_date when available', () => {
		const profile = { planning_metadata: { project_start_date: '2026-06-01' } };
		const project = { created_at: '2026-01-15T10:30:00Z' };
		expect(resolveAnchorDate(profile, project)).toBe('2026-06-01');
	});

	it('uses project_start_date even when created_at is present', () => {
		const profile = { planning_metadata: { project_start_date: '2026-09-15' } };
		const project = { created_at: '2026-03-01T08:00:00Z' };
		expect(resolveAnchorDate(profile, project)).toBe('2026-09-15');
	});

	it('uses project_start_date even when it is a past date', () => {
		const profile = { planning_metadata: { project_start_date: '2025-01-01' } };
		const project = { created_at: '2026-03-01T08:00:00Z' };
		expect(resolveAnchorDate(profile, project)).toBe('2025-01-01');
	});
});

describe('resolveAnchorDate — fallback: project.created_at', () => {
	it('falls back to created_at when project_start_date is absent', () => {
		const profile = { planning_metadata: {} };
		const project = { created_at: '2026-04-10T14:25:00Z' };
		expect(resolveAnchorDate(profile, project)).toBe('2026-04-10');
	});

	it('falls back to created_at when planning_metadata is empty', () => {
		const profile = { planning_metadata: {} };
		const project = { created_at: '2026-07-22T00:00:00Z' };
		expect(resolveAnchorDate(profile, project)).toBe('2026-07-22');
	});

	it('falls back to created_at when profile is null', () => {
		const project = { created_at: '2026-02-28T12:00:00Z' };
		expect(resolveAnchorDate(null, project)).toBe('2026-02-28');
	});

	it('falls back to created_at when planning_metadata is undefined', () => {
		const profile = {};
		const project = { created_at: '2026-11-30T09:00:00Z' };
		expect(resolveAnchorDate(profile, project)).toBe('2026-11-30');
	});

	it('strips time portion from created_at ISO string', () => {
		const profile = { planning_metadata: {} };
		const project = { created_at: '2026-05-15T23:59:59.999Z' };
		expect(resolveAnchorDate(profile, project)).toBe('2026-05-15');
	});
});

describe('resolveAnchorDate — last resort: today', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-02-24T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('falls back to today when both are missing', () => {
		const profile = { planning_metadata: {} };
		const project = {};
		expect(resolveAnchorDate(profile, project)).toBe('2026-02-24');
	});

	it('falls back to today when profile is null and created_at is absent', () => {
		expect(resolveAnchorDate(null, {})).toBe('2026-02-24');
	});

	it('falls back to today when project_start_date is undefined', () => {
		const profile = { planning_metadata: { other_field: 'value' } };
		const project = {};
		expect(resolveAnchorDate(profile, project)).toBe('2026-02-24');
	});
});

describe('resolveAnchorDate — edge cases', () => {
	it('returns project_start_date as-is (no transformation)', () => {
		const profile = { planning_metadata: { project_start_date: '2026-12-31' } };
		expect(resolveAnchorDate(profile, {})).toBe('2026-12-31');
	});

	it('handles created_at with date-only format (no T)', () => {
		const profile = { planning_metadata: {} };
		const project = { created_at: '2026-08-15' };
		// split('T')[0] still returns '2026-08-15' if no T is present
		expect(resolveAnchorDate(profile, project)).toBe('2026-08-15');
	});
});
