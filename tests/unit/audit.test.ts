// Unit tests for audit logging helper

import { describe, it, expect, vi } from 'vitest';
import { logAudit } from '$server/db/audit';

vi.mock('$server/logger', () => ({
	logError: vi.fn()
}));

function createMockSupabase(error: unknown = null) {
	return {
		from: vi.fn().mockReturnValue({
			insert: vi.fn().mockResolvedValue({ error })
		})
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}

describe('logAudit', () => {
	it('inserts audit log with all fields', async () => {
		const supabase = createMockSupabase();
		await logAudit(supabase, {
			organizationId: 'org-1',
			projectId: 'proj-1',
			actorId: 'user-1',
			actorEmail: 'test@example.com',
			action: 'create',
			entityType: 'project',
			entityId: 'entity-1',
			changes: { name: 'Test' },
			ipAddress: '127.0.0.1',
			userAgent: 'TestAgent'
		});

		expect(supabase.from).toHaveBeenCalledWith('audit_log');
		const insertCall = supabase.from('audit_log').insert;
		expect(insertCall).toHaveBeenCalledWith({
			organization_id: 'org-1',
			project_id: 'proj-1',
			actor_id: 'user-1',
			actor_email: 'test@example.com',
			action: 'create',
			entity_type: 'project',
			entity_id: 'entity-1',
			changes: { name: 'Test' },
			ip_address: '127.0.0.1',
			user_agent: 'TestAgent'
		});
	});

	it('defaults optional fields to null', async () => {
		const supabase = createMockSupabase();
		await logAudit(supabase, {
			action: 'delete',
			entityType: 'document'
		});

		const insertCall = supabase.from('audit_log').insert;
		expect(insertCall).toHaveBeenCalledWith(
			expect.objectContaining({
				organization_id: null,
				project_id: null,
				actor_id: null,
				actor_email: null,
				entity_id: null,
				ip_address: null,
				user_agent: null,
				changes: {}
			})
		);
	});

	it('logs error when insert fails', async () => {
		const { logError } = await import('$server/logger');
		const dbError = { message: 'Connection failed' };
		const supabase = createMockSupabase(dbError);

		await logAudit(supabase, {
			action: 'update',
			entityType: 'artifact'
		});

		expect(logError).toHaveBeenCalledWith('Failed to write audit log', dbError);
	});

	it('does not throw on insert error', async () => {
		const supabase = createMockSupabase({ message: 'DB error' });
		await expect(
			logAudit(supabase, { action: 'create', entityType: 'project' })
		).resolves.toBeUndefined();
	});

	it('does not log error on success', async () => {
		const { logError } = await import('$server/logger');
		vi.mocked(logError).mockClear();
		const supabase = createMockSupabase(null);

		await logAudit(supabase, {
			action: 'create',
			entityType: 'project'
		});

		expect(logError).not.toHaveBeenCalled();
	});
});
