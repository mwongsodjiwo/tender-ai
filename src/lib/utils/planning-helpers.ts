import { invalidateAll } from '$app/navigation';
import type { DeadlineItem, PhaseActivity } from '$types';

export function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('nl-NL', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

export function getMilestoneStatusColor(status: string): string {
	if (status === 'completed') return 'bg-green-100 text-green-700';
	if (status === 'in_progress') return 'bg-blue-100 text-blue-700';
	if (status === 'skipped') return 'bg-gray-100 text-gray-500';
	return 'bg-gray-100 text-gray-700';
}

interface CriticalPathResult {
	criticalPathIds: Set<string>;
	nodeFloats: Map<string, number>;
	error: string;
}

export async function loadCriticalPath(projectId: string): Promise<CriticalPathResult> {
	try {
		const response = await fetch(`/api/projects/${projectId}/planning/critical-path`);
		if (!response.ok) {
			const errorData = await response.json();
			return {
				criticalPathIds: new Set(),
				nodeFloats: new Map(),
				error: errorData.message ?? 'Fout bij berekenen kritiek pad.'
			};
		}
		const result = await response.json();
		const floats = new Map<string, number>();
		for (const node of result.data.nodes) {
			floats.set(node.id, node.total_float);
		}
		return {
			criticalPathIds: new Set(result.data.critical_path_ids),
			nodeFloats: floats,
			error: ''
		};
	} catch {
		return {
			criticalPathIds: new Set(),
			nodeFloats: new Map(),
			error: 'Netwerkfout bij ophalen kritiek pad.'
		};
	}
}

export async function createDependency(
	projectId: string,
	sourceId: string,
	targetId: string
): Promise<string> {
	try {
		const response = await fetch(`/api/projects/${projectId}/dependencies`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				source_type: 'activity',
				source_id: sourceId,
				target_type: 'activity',
				target_id: targetId,
				dependency_type: 'finish_to_start',
				lag_days: 0
			})
		});
		if (!response.ok) {
			const errorData = await response.json();
			return errorData.message ?? 'Fout bij aanmaken afhankelijkheid.';
		}
		await invalidateAll();
		return '';
	} catch {
		return 'Netwerkfout bij aanmaken afhankelijkheid.';
	}
}

export async function updateActivity(
	projectId: string,
	activityId: string,
	changes: Partial<PhaseActivity>
): Promise<string> {
	try {
		const response = await fetch(`/api/projects/${projectId}/activities/${activityId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(changes)
		});
		if (!response.ok) {
			const errorData = await response.json();
			return errorData.message ?? 'Fout bij opslaan van wijziging.';
		}
		await invalidateAll();
		return '';
	} catch {
		return 'Netwerkfout bij opslaan van wijziging.';
	}
}

export async function updateDeadlineDate(
	projectId: string,
	item: DeadlineItem,
	newDate: string
): Promise<string> {
	const url = item.type === 'milestone'
		? `/api/projects/${projectId}/milestones/${item.id}`
		: `/api/projects/${projectId}/activities/${item.id}`;
	const body = item.type === 'milestone'
		? { target_date: newDate }
		: { due_date: newDate };
	try {
		const response = await fetch(url, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!response.ok) {
			const err = await response.json();
			return err.message ?? 'Fout bij opslaan datum.';
		}
		await invalidateAll();
		return '';
	} catch {
		return 'Netwerkfout bij opslaan datum.';
	}
}

export async function deleteActivity(
	projectId: string,
	activityId: string
): Promise<string> {
	try {
		const response = await fetch(`/api/projects/${projectId}/activities/${activityId}`, {
			method: 'DELETE'
		});
		if (!response.ok) {
			const err = await response.json();
			return err.message ?? 'Fout bij verwijderen.';
		}
		await invalidateAll();
		return '';
	} catch {
		return 'Netwerkfout bij verwijderen.';
	}
}

export function handleExport(projectId: string, format: 'ical' | 'csv'): void {
	window.location.href = `/api/projects/${projectId}/planning/export/${format}`;
}
