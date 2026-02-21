import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'tm_sidebar_width';
export const DEFAULT_WIDTH = 240;
export const MIN_WIDTH = 200;
export const MAX_WIDTH = 400;

function clampWidth(value: number): number {
	if (isNaN(value)) return DEFAULT_WIDTH;
	return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
}

function createSidebarWidthStore() {
	const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;
	const initial = stored ? clampWidth(parseInt(stored, 10)) : DEFAULT_WIDTH;
	const { subscribe, set } = writable<number>(initial);

	return {
		subscribe,
		set(width: number) {
			const clamped = clampWidth(width);
			set(clamped);
			if (browser) {
				localStorage.setItem(STORAGE_KEY, String(clamped));
			}
		},
		reset() {
			this.set(DEFAULT_WIDTH);
		}
	};
}

export const sidebarWidth = createSidebarWidthStore();
