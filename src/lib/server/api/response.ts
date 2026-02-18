// Standardized API response helpers — consistent error and success format

import { json } from '@sveltejs/kit';

export type ErrorCode =
	| 'VALIDATION_ERROR'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'DUPLICATE'
	| 'DB_ERROR'
	| 'INTERNAL_ERROR'
	| 'AUTH_ERROR'
	| 'EXTERNAL_API_ERROR';

export function apiError(status: number, code: ErrorCode, message: string): Response {
	return json({ message, code, status }, { status });
}

export function apiSuccess<T>(data: T, status = 200): Response {
	return json({ data }, { status });
}
