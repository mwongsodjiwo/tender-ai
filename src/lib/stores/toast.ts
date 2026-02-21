import { writable } from 'svelte/store';

export interface Toast {
	id: number;
	message: string;
	type: 'success' | 'error';
}

let nextId = 0;

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function add(message: string, type: 'success' | 'error' = 'success') {
		const id = nextId++;
		update((all) => [...all, { id, message, type }]);
		setTimeout(() => remove(id), 4000);
	}

	function remove(id: number) {
		update((all) => all.filter((t) => t.id !== id));
	}

	return { subscribe, add, remove };
}

export const toasts = createToastStore();
