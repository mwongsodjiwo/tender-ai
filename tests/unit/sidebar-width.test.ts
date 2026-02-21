// Unit tests for sidebarWidth store

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// =============================================================================
// MOCK $app/environment — must be before store import
// =============================================================================

const mockStorage = new Map<string, string>();

vi.mock('$app/environment', () => ({ browser: true }));

const localStorageMock = {
	getItem: (key: string) => mockStorage.get(key) ?? null,
	setItem: (key: string, val: string) => mockStorage.set(key, val),
	removeItem: (key: string) => mockStorage.delete(key)
};
vi.stubGlobal('localStorage', localStorageMock);

// =============================================================================
// IMPORT STORE (after mocks)
// =============================================================================

const { sidebarWidth, DEFAULT_WIDTH, MIN_WIDTH, MAX_WIDTH } = await import(
	'../../src/lib/stores/sidebarWidth'
);

describe('sidebarWidth store', () => {
	beforeEach(() => {
		mockStorage.clear();
		sidebarWidth.set(DEFAULT_WIDTH);
	});

	it('has correct default width', () => {
		expect(get(sidebarWidth)).toBe(240);
	});

	it('exports correct constants', () => {
		expect(DEFAULT_WIDTH).toBe(240);
		expect(MIN_WIDTH).toBe(200);
		expect(MAX_WIDTH).toBe(400);
	});

	it('persists width to localStorage', () => {
		sidebarWidth.set(300);
		expect(get(sidebarWidth)).toBe(300);
		expect(mockStorage.get('tm_sidebar_width')).toBe('300');
	});

	it('clamps below minimum', () => {
		sidebarWidth.set(100);
		expect(get(sidebarWidth)).toBe(MIN_WIDTH);
	});

	it('clamps above maximum', () => {
		sidebarWidth.set(500);
		expect(get(sidebarWidth)).toBe(MAX_WIDTH);
	});

	it('handles NaN gracefully', () => {
		sidebarWidth.set(NaN);
		expect(get(sidebarWidth)).toBe(DEFAULT_WIDTH);
	});

	it('resets to default width', () => {
		sidebarWidth.set(350);
		expect(get(sidebarWidth)).toBe(350);
		sidebarWidth.reset();
		expect(get(sidebarWidth)).toBe(DEFAULT_WIDTH);
		expect(mockStorage.get('tm_sidebar_width')).toBe(String(DEFAULT_WIDTH));
	});
});
