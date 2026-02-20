// Unit tests for retention check cron job — Fase 22
// Tests findExpiredRecords, markExpiredRecords, notifyOrgAdmins

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	findExpiredRecords,
	markExpiredRecords,
	notifyOrgAdmins,
	runRetentionCheck
} from '../../src/lib/server/cron/retention-check';
import type { ExpiredRecord } from '../../src/lib/server/cron/retention-check';

// =============================================================================
// MOCK SUPABASE CLIENT
// =============================================================================

function createMockSupabase(overrides: Record<string, unknown> = {}) {
	const mockFrom = vi.fn();
	const mockRpc = vi.fn();

	const chainMethods = {
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		in: vi.fn().mockReturnThis(),
		lt: vi.fn().mockReturnThis(),
		is: vi.fn().mockReturnThis(),
		not: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		update: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		data: null as unknown,
		error: null as unknown,
		count: 0 as number | null,
		then: undefined as unknown
	};

	// Default: return empty results
	chainMethods.select.mockImplementation(() => {
		return {
			...chainMethods,
			eq: vi.fn().mockReturnValue({
				...chainMethods,
				in: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 })
			}),
			in: vi.fn().mockReturnValue({
				...chainMethods,
				eq: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 })
			}),
			lt: vi.fn().mockReturnValue({
				...chainMethods,
				is: vi.fn().mockResolvedValue({ data: [], error: null })
			}),
			...overrides
		};
	});

	mockFrom.mockReturnValue(chainMethods);

	return {
		from: mockFrom,
		rpc: mockRpc,
		_chain: chainMethods,
		_mockFrom: mockFrom
	} as unknown;
}

// =============================================================================
// SAMPLE DATA
// =============================================================================

const EXPIRED_DATE = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const FUTURE_DATE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

const SAMPLE_EXPIRED_RECORDS: ExpiredRecord[] = [
	{
		id: 'rec-1',
		tableName: 'correspondence',
		projectId: 'proj-1',
		organizationId: 'org-1',
		retentionUntil: EXPIRED_DATE,
		classification: 'archive'
	},
	{
		id: 'rec-2',
		tableName: 'evaluations',
		projectId: 'proj-1',
		organizationId: 'org-1',
		retentionUntil: EXPIRED_DATE,
		classification: 'archive'
	},
	{
		id: 'rec-3',
		tableName: 'conversations',
		projectId: 'proj-2',
		organizationId: 'org-2',
		retentionUntil: EXPIRED_DATE,
		classification: 'operational'
	}
];

// =============================================================================
// findExpiredRecords
// =============================================================================

describe('findExpiredRecords', () => {
	it('returns empty array when no records have expired', async () => {
		const supabase = createMockSupabaseWithData([]);
		const result = await findExpiredRecords(supabase as never);
		expect(result).toEqual([]);
	});

	it('returns records with expired retention', async () => {
		const expiredRow = {
			id: 'rec-1',
			retention_until: EXPIRED_DATE,
			archive_status: 'archived'
		};
		const supabase = createMockSupabaseWithData([expiredRow]);
		const result = await findExpiredRecords(supabase as never);
		expect(result.length).toBeGreaterThan(0);
		expect(result[0].id).toBe('rec-1');
		expect(result[0].retentionUntil).toBe(EXPIRED_DATE);
	});

	it('skips tables with query errors', async () => {
		const supabase = createMockSupabaseWithError('Query failed');
		const result = await findExpiredRecords(supabase as never);
		expect(result).toEqual([]);
	});
});

// =============================================================================
// markExpiredRecords
// =============================================================================

describe('markExpiredRecords', () => {
	it('returns 0 when no records to mark', async () => {
		const supabase = createMockSupabaseForUpdate(0);
		const result = await markExpiredRecords(supabase as never, []);
		expect(result).toBe(0);
	});

	it('groups records by table and updates them', async () => {
		const supabase = createMockSupabaseForUpdate(2);
		const result = await markExpiredRecords(
			supabase as never,
			SAMPLE_EXPIRED_RECORDS.slice(0, 2) // 2 records from correspondence and evaluations
		);
		expect(result).toBe(4); // 2 updates × 2 count each
	});
});

// =============================================================================
// notifyOrgAdmins
// =============================================================================

describe('notifyOrgAdmins', () => {
	it('returns 0 when expiredCount is 0', async () => {
		const supabase = createMockSupabaseForNotify([]);
		const result = await notifyOrgAdmins(supabase as never, 0, []);
		expect(result).toBe(0);
	});

	it('returns 0 when no organization IDs provided', async () => {
		const supabase = createMockSupabaseForNotify([]);
		const result = await notifyOrgAdmins(supabase as never, 5, []);
		expect(result).toBe(0);
	});

	it('creates notifications for org admins', async () => {
		const supabase = createMockSupabaseForNotify([
			{ profile_id: 'admin-1' },
			{ profile_id: 'admin-2' }
		]);
		const result = await notifyOrgAdmins(
			supabase as never, 3, ['org-1']
		);
		expect(result).toBe(2);
	});

	it('deduplicates organization IDs', async () => {
		const supabase = createMockSupabaseForNotify([
			{ profile_id: 'admin-1' }
		]);
		const result = await notifyOrgAdmins(
			supabase as never, 3, ['org-1', 'org-1', 'org-1']
		);
		// Should only query once for org-1
		expect(result).toBe(1);
	});
});

// =============================================================================
// runRetentionCheck
// =============================================================================

describe('runRetentionCheck', () => {
	it('returns zero counts when nothing expired', async () => {
		const supabase = createMockSupabaseWithData([]);
		const result = await runRetentionCheck(supabase as never);
		expect(result.expiredCount).toBe(0);
		expect(result.notificationsCreated).toBe(0);
		expect(result.checkedAt).toBeDefined();
		expect(result.errors).toEqual([]);
	});
});

// =============================================================================
// HELPER: Create mock Supabase variants
// =============================================================================

function createMockSupabaseWithData(rows: unknown[]) {
	const mock = {
		from: vi.fn().mockReturnValue({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					lt: vi.fn().mockReturnValue({
						is: vi.fn().mockResolvedValue({
							data: rows,
							error: null
						})
					})
				})
			})
		})
	};
	return mock;
}

function createMockSupabaseWithError(message: string) {
	return {
		from: vi.fn().mockReturnValue({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					lt: vi.fn().mockReturnValue({
						is: vi.fn().mockResolvedValue({
							data: null,
							error: { message }
						})
					})
				})
			})
		})
	};
}

function createMockSupabaseForUpdate(countPerTable: number) {
	return {
		from: vi.fn().mockReturnValue({
			update: vi.fn().mockReturnValue({
				in: vi.fn().mockReturnValue({
					eq: vi.fn().mockResolvedValue({
						count: countPerTable,
						error: null
					})
				})
			})
		})
	};
}

function createMockSupabaseForNotify(members: Array<{ profile_id: string }>) {
	return {
		from: vi.fn().mockImplementation((table: string) => {
			if (table === 'organization_members') {
				return {
					select: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							in: vi.fn().mockResolvedValue({
								data: members,
								error: null
							})
						})
					})
				};
			}
			// notifications table
			return {
				insert: vi.fn().mockReturnValue({
					select: vi.fn().mockResolvedValue({
						data: members.map((m, i) => ({ id: `notif-${i}` })),
						error: null
					})
				})
			};
		})
	};
}
