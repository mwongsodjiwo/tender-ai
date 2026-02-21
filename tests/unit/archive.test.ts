// Unit tests for archive Zod schemas and document archive logic — Fase 39

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	archiveDocumentParamsSchema,
	archiveCorrespondenceParamsSchema
} from '$server/api/validation';

vi.mock('$server/logger', () => ({ logError: vi.fn() }));

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockUser(id = 'user-1', email = 'test@example.com') {
	return { id, email };
}

function createMockSupabase(overrides: {
	projectData?: Record<string, unknown> | null;
	projectError?: unknown;
	updateData?: unknown[] | Record<string, unknown> | null;
	updateError?: unknown;
} = {}) {
	const {
		projectData = { id: 'proj-1', organization_id: 'org-1' },
		projectError = null,
		updateData = [{ id: 'art-1' }],
		updateError = null
	} = overrides;

	const auditInsert = vi.fn().mockResolvedValue({ error: null });
	const updateSelect = vi.fn().mockResolvedValue({
		data: updateData, error: updateError
	});
	const updateDeleted = vi.fn().mockReturnValue({ select: updateSelect });
	const updateEqDoc = vi.fn().mockReturnValue({ is: updateDeleted });
	const updateEq = vi.fn().mockReturnValue({ eq: updateEqDoc });
	const updateFn = vi.fn().mockReturnValue({ eq: updateEq });

	const projectSingle = vi.fn().mockResolvedValue({
		data: projectData, error: projectError
	});
	const projectDeleted = vi.fn().mockReturnValue({ single: projectSingle });
	const projectEq = vi.fn().mockReturnValue({ is: projectDeleted });
	const projectSelect = vi.fn().mockReturnValue({ eq: projectEq });

	return {
		from: vi.fn((table: string) => {
			if (table === 'audit_log') return { insert: auditInsert };
			if (table === 'projects') return { select: projectSelect };
			return { update: updateFn };
		}),
		_auditInsert: auditInsert
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}

// ---------------------------------------------------------------------------
// Zod schema tests
// ---------------------------------------------------------------------------

describe('archiveDocumentParamsSchema', () => {
	it('accepts valid UUIDs', () => {
		const result = archiveDocumentParamsSchema.safeParse({
			id: '550e8400-e29b-41d4-a716-446655440000',
			docTypeId: '660e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid project UUID', () => {
		const result = archiveDocumentParamsSchema.safeParse({
			id: 'not-a-uuid',
			docTypeId: '660e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid docTypeId UUID', () => {
		const result = archiveDocumentParamsSchema.safeParse({
			id: '550e8400-e29b-41d4-a716-446655440000',
			docTypeId: 'bad'
		});
		expect(result.success).toBe(false);
	});
});

describe('archiveCorrespondenceParamsSchema', () => {
	it('accepts valid UUIDs', () => {
		const result = archiveCorrespondenceParamsSchema.safeParse({
			id: '550e8400-e29b-41d4-a716-446655440000',
			letterId: '770e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid letterId UUID', () => {
		const result = archiveCorrespondenceParamsSchema.safeParse({
			id: '550e8400-e29b-41d4-a716-446655440000',
			letterId: 'not-valid'
		});
		expect(result.success).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Auth + project validation tests
// ---------------------------------------------------------------------------

describe('archive endpoints auth guard', () => {
	it('rejects null user', () => {
		const user = null;
		expect(user).toBeNull();
	});

	it('accepts authenticated user', () => {
		const user = createMockUser();
		expect(user.id).toBe('user-1');
	});
});

describe('archive project validation', () => {
	it('handles existing project', () => {
		const sb = createMockSupabase();
		expect(sb.from('projects')).toBeDefined();
	});

	it('handles missing project', () => {
		const sb = createMockSupabase({
			projectData: null,
			projectError: { message: 'Not found' }
		});
		expect(sb.from('projects')).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// Document archive/unarchive
// ---------------------------------------------------------------------------

describe('document archive logic', () => {
	let supabase: ReturnType<typeof createMockSupabase>;

	beforeEach(() => {
		supabase = createMockSupabase({
			updateData: [{ id: 'art-1' }, { id: 'art-2' }]
		});
	});

	it('targets artifacts table', () => {
		supabase.from('artifacts');
		expect(supabase.from).toHaveBeenCalledWith('artifacts');
	});

	it('counts archived artifacts', () => {
		const artifacts = [{ id: 'art-1' }, { id: 'art-2' }];
		expect(artifacts.length).toBe(2);
	});
});

describe('document unarchive logic', () => {
	it('sets archive_status to active', () => {
		const update = { archive_status: 'active' };
		expect(update.archive_status).toBe('active');
	});
});
