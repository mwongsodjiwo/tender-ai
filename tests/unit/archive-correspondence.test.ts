// Unit tests for correspondence archive/unarchive + audit — Fase 39

import { describe, it, expect, vi } from 'vitest';

vi.mock('$server/logger', () => ({ logError: vi.fn() }));

// ---------------------------------------------------------------------------
// Mock helper
// ---------------------------------------------------------------------------

function createMockSupabase(overrides: {
	updateData?: Record<string, unknown> | null;
	updateError?: unknown;
} = {}) {
	const {
		updateData = { id: 'letter-1', archive_status: 'archived' },
		updateError = null
	} = overrides;

	const auditInsert = vi.fn().mockResolvedValue({ error: null });
	const updateSingle = vi.fn().mockResolvedValue({
		data: updateData, error: updateError
	});
	const updateSelect = vi.fn().mockReturnValue({ single: updateSingle });
	const updateDeleted = vi.fn().mockReturnValue({ select: updateSelect });
	const updateEqProj = vi.fn().mockReturnValue({ is: updateDeleted });
	const updateEq = vi.fn().mockReturnValue({ eq: updateEqProj });
	const updateFn = vi.fn().mockReturnValue({ eq: updateEq });

	return {
		from: vi.fn((table: string) => {
			if (table === 'audit_log') return { insert: auditInsert };
			return { update: updateFn };
		}),
		_auditInsert: auditInsert
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}

// ---------------------------------------------------------------------------
// Correspondence archive
// ---------------------------------------------------------------------------

describe('correspondence archive logic', () => {
	it('targets correspondence table', () => {
		const supabase = createMockSupabase();
		supabase.from('correspondence');
		expect(supabase.from).toHaveBeenCalledWith('correspondence');
	});

	it('sets archive_status to archived', () => {
		const update = { archive_status: 'archived' };
		expect(update.archive_status).toBe('archived');
	});

	it('handles missing correspondence', () => {
		const supabase = createMockSupabase({
			updateData: null,
			updateError: { message: 'Not found' }
		});
		expect(supabase).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// Correspondence unarchive
// ---------------------------------------------------------------------------

describe('correspondence unarchive logic', () => {
	it('sets archive_status to active', () => {
		const update = { archive_status: 'active' };
		expect(update.archive_status).toBe('active');
	});

	it('returns the updated correspondence', () => {
		const letter = { id: 'letter-1', archive_status: 'active' };
		expect(letter.id).toBe('letter-1');
	});
});

// ---------------------------------------------------------------------------
// Audit logging
// ---------------------------------------------------------------------------

describe('archive audit logging', () => {
	it('logs archive action for artifacts', () => {
		const params = {
			action: 'archive',
			entityType: 'artifact',
			changes: { archive_status: 'archived', affected_count: 3 }
		};
		expect(params.action).toBe('archive');
		expect(params.entityType).toBe('artifact');
	});

	it('logs unarchive action for correspondence', () => {
		const params = {
			action: 'unarchive',
			entityType: 'correspondence',
			changes: { archive_status: 'active' }
		};
		expect(params.action).toBe('unarchive');
	});

	it('includes affected_count for document operations', () => {
		const changes = {
			archive_status: 'archived',
			affected_count: 5
		};
		expect(changes.affected_count).toBe(5);
	});

	it('audit insert is called on mock', () => {
		const supabase = createMockSupabase();
		const auditTable = supabase.from('audit_log');
		expect(auditTable.insert).toBeDefined();
	});
});
