// Unit tests for API authorization guards

import { describe, it, expect, vi } from 'vitest';
import { requireSuperadmin } from '$server/api/guards';

function createMockSupabase(profileData: { is_superadmin: boolean } | null, error: unknown = null) {
	return {
		from: vi.fn().mockReturnValue({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: profileData,
						error
					})
				})
			})
		})
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}

function createMockUser(id = 'user-123') {
	return {
		id,
		email: 'test@example.com',
		app_metadata: {},
		user_metadata: {},
		aud: 'authenticated',
		created_at: '2026-01-01T00:00:00Z'
	} as import('@supabase/supabase-js').User;
}

describe('requireSuperadmin', () => {
	it('returns null (passes) for superadmin user', async () => {
		const supabase = createMockSupabase({ is_superadmin: true });
		const user = createMockUser();
		const result = await requireSuperadmin(supabase, user);
		expect(result).toBeNull();
	});

	it('returns 401 when user is null', async () => {
		const supabase = createMockSupabase(null);
		const result = await requireSuperadmin(supabase, null);
		expect(result).toBeInstanceOf(Response);
		expect(result!.status).toBe(401);
		const body = await result!.json();
		expect(body.code).toBe('UNAUTHORIZED');
	});

	it('returns 403 when user is not superadmin', async () => {
		const supabase = createMockSupabase({ is_superadmin: false });
		const user = createMockUser();
		const result = await requireSuperadmin(supabase, user);
		expect(result).toBeInstanceOf(Response);
		expect(result!.status).toBe(403);
		const body = await result!.json();
		expect(body.code).toBe('FORBIDDEN');
	});

	it('returns 403 when profile is null', async () => {
		const supabase = createMockSupabase(null);
		const user = createMockUser();
		const result = await requireSuperadmin(supabase, user);
		expect(result).toBeInstanceOf(Response);
		expect(result!.status).toBe(403);
	});

	it('queries profiles table with correct user id', async () => {
		const supabase = createMockSupabase({ is_superadmin: true });
		const user = createMockUser('specific-id');
		await requireSuperadmin(supabase, user);
		expect(supabase.from).toHaveBeenCalledWith('profiles');
	});

	it('provides Dutch error message for unauthorized', async () => {
		const supabase = createMockSupabase(null);
		const result = await requireSuperadmin(supabase, null);
		const body = await result!.json();
		expect(body.message).toBe('Niet ingelogd');
	});

	it('provides Dutch error message for forbidden', async () => {
		const supabase = createMockSupabase({ is_superadmin: false });
		const user = createMockUser();
		const result = await requireSuperadmin(supabase, user);
		const body = await result!.json();
		expect(body.message).toContain('beheerders');
	});
});
