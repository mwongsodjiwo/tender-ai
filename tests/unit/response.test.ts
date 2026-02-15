// Unit tests for API response helpers

import { describe, it, expect } from 'vitest';
import { apiError, apiSuccess } from '$server/api/response';

describe('apiError', () => {
	it('returns Response with correct status', () => {
		const response = apiError(400, 'VALIDATION_ERROR', 'Invalid input');
		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(400);
	});

	it('returns JSON body with message, code, and status', async () => {
		const response = apiError(404, 'NOT_FOUND', 'Item niet gevonden');
		const body = await response.json();
		expect(body.message).toBe('Item niet gevonden');
		expect(body.code).toBe('NOT_FOUND');
		expect(body.status).toBe(404);
	});

	it('handles 401 unauthorized', async () => {
		const response = apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.code).toBe('UNAUTHORIZED');
	});

	it('handles 403 forbidden', async () => {
		const response = apiError(403, 'FORBIDDEN', 'Geen toegang');
		expect(response.status).toBe(403);
		const body = await response.json();
		expect(body.code).toBe('FORBIDDEN');
	});

	it('handles 500 internal error', async () => {
		const response = apiError(500, 'INTERNAL_ERROR', 'Server fout');
		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body.code).toBe('INTERNAL_ERROR');
	});

	it('handles DB_ERROR code', async () => {
		const response = apiError(500, 'DB_ERROR', 'Database fout');
		const body = await response.json();
		expect(body.code).toBe('DB_ERROR');
	});

	it('handles DUPLICATE code', async () => {
		const response = apiError(409, 'DUPLICATE', 'Al bestaand');
		expect(response.status).toBe(409);
		const body = await response.json();
		expect(body.code).toBe('DUPLICATE');
	});
});

describe('apiSuccess', () => {
	it('returns Response with 200 status by default', () => {
		const response = apiSuccess({ id: '123' });
		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(200);
	});

	it('wraps data in { data } envelope', async () => {
		const response = apiSuccess({ name: 'test', count: 42 });
		const body = await response.json();
		expect(body.data).toEqual({ name: 'test', count: 42 });
	});

	it('supports custom status code', () => {
		const response = apiSuccess({ id: '123' }, 201);
		expect(response.status).toBe(201);
	});

	it('handles array data', async () => {
		const response = apiSuccess([1, 2, 3]);
		const body = await response.json();
		expect(body.data).toEqual([1, 2, 3]);
	});

	it('handles null data', async () => {
		const response = apiSuccess(null);
		const body = await response.json();
		expect(body.data).toBeNull();
	});

	it('handles string data', async () => {
		const response = apiSuccess('ok');
		const body = await response.json();
		expect(body.data).toBe('ok');
	});
});
