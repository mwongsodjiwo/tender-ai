import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Organization } from '$types';

const STORAGE_KEY = 'tm_active_organization_id';

// --- Available organizations (set by layout on load) ---

const organizationsStore = writable<Organization[]>([]);

export const availableOrganizations = { subscribe: organizationsStore.subscribe };

export function setAvailableOrganizations(orgs: Organization[]): void {
	organizationsStore.set(orgs);
}

// --- Active organization id (persisted in localStorage) ---

function createActiveOrgIdStore() {
	const initial = browser ? localStorage.getItem(STORAGE_KEY) : null;
	const { subscribe, set, update } = writable<string | null>(initial);

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
		},
		update
	};
}

export const activeOrganizationId = createActiveOrgIdStore();

// --- Active organization (derived from id + available list) ---

export const activeOrganization = derived(
	[activeOrganizationId, organizationsStore],
	([$id, $orgs]) => $orgs.find((o) => o.id === $id) ?? null
);

// --- Switch organization (sets id, auto-selects first if none) ---

export function switchOrganization(orgId: string): void {
	activeOrganizationId.set(orgId);
}

/**
 * Initialises the context on layout load.
 * If the stored org id is not in the available list, selects the first org.
 */
export function initOrganizationContext(orgs: Organization[]): void {
	setAvailableOrganizations(orgs);

	if (orgs.length === 0) {
		activeOrganizationId.set(null);
		return;
	}

	const storedId = browser ? localStorage.getItem(STORAGE_KEY) : null;
	const valid = orgs.some((o) => o.id === storedId);

	if (valid && storedId) {
		activeOrganizationId.set(storedId);
	} else {
		activeOrganizationId.set(orgs[0].id);
	}
}

// --- Color helper: deterministic color from org name ---

export function orgColor(name: string): string {
	const PALETTE = [
		'#4F46E5', '#7C3AED', '#DB2777', '#DC2626',
		'#EA580C', '#D97706', '#16A34A', '#0891B2',
		'#2563EB', '#9333EA', '#C026D3', '#059669'
	];
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	return PALETTE[Math.abs(hash) % PALETTE.length];
}
