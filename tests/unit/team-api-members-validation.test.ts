// Unit tests for Fase 28 — Zod schema runtime validation

import { describe, it, expect } from 'vitest';

// =============================================================================
// memberSearchSchema RUNTIME VALIDATION
// =============================================================================

describe('memberSearchSchema runtime validation', async () => {
	const { memberSearchSchema } = await import(
		'$server/api/validation/members.js'
	);

	it('parses empty object with defaults', () => {
		const result = memberSearchSchema.parse({});
		expect(result.status).toBe('all');
		expect(result.limit).toBe(25);
		expect(result.offset).toBe(0);
	});

	it('accepts valid search params', () => {
		const result = memberSearchSchema.parse({
			search: 'Jan',
			status: 'active',
			limit: '10',
			offset: '5'
		});
		expect(result.search).toBe('Jan');
		expect(result.status).toBe('active');
		expect(result.limit).toBe(10);
		expect(result.offset).toBe(5);
	});

	it('accepts inactive status', () => {
		const result = memberSearchSchema.parse({ status: 'inactive' });
		expect(result.status).toBe('inactive');
	});

	it('rejects invalid status', () => {
		const result = memberSearchSchema.safeParse({ status: 'deleted' });
		expect(result.success).toBe(false);
	});

	it('rejects limit over 100', () => {
		const result = memberSearchSchema.safeParse({ limit: '200' });
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// updateMemberSchema RUNTIME VALIDATION
// =============================================================================

describe('updateMemberSchema runtime validation', async () => {
	const { updateMemberSchema } = await import(
		'$server/api/validation/members.js'
	);

	it('accepts status only', () => {
		const result = updateMemberSchema.parse({ status: 'inactive' });
		expect(result.status).toBe('inactive');
	});

	it('accepts manager_id as valid uuid', () => {
		const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
		const result = updateMemberSchema.parse({ manager_id: uuid });
		expect(result.manager_id).toBe(uuid);
	});

	it('accepts manager_id as null to unset manager', () => {
		const result = updateMemberSchema.parse({ manager_id: null });
		expect(result.manager_id).toBeNull();
	});

	it('rejects invalid manager_id', () => {
		const result = updateMemberSchema.safeParse({ manager_id: 'not-uuid' });
		expect(result.success).toBe(false);
	});

	it('accepts both status and manager_id together', () => {
		const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
		const result = updateMemberSchema.parse({
			status: 'active',
			manager_id: uuid
		});
		expect(result.status).toBe('active');
		expect(result.manager_id).toBe(uuid);
	});
});
