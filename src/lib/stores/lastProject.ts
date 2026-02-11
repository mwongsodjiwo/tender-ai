import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'tm_last_project_id';

function createLastProjectStore() {
	const initial = browser ? localStorage.getItem(STORAGE_KEY) : null;
	const { subscribe, set } = writable<string | null>(initial);

	return {
		subscribe,
		set(id: string | null) {
			set(id);
			if (browser) {
				if (id) {
					localStorage.setItem(STORAGE_KEY, id);
				} else {
					localStorage.removeItem(STORAGE_KEY);
				}
			}
		}
	};
}

export const lastProjectId = createLastProjectStore();
