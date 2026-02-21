import { invalidateAll } from '$app/navigation';
import type { Milestone } from '$types';
import type { TimelineMilestone } from '$lib/utils/procurement-timeline.js';

interface ProfilePayload {
	project_goal: string;
	scope_description: string;
	estimated_value?: number;
	currency: string;
	cpv_codes: string[];
}

interface ActionResult {
	error: string;
	success: string;
}

export async function saveProfile(
	projectId: string,
	payload: ProfilePayload,
	hasProfile: boolean,
	planningMilestones: TimelineMilestone[],
	existingMilestones: Milestone[]
): Promise<ActionResult> {
	const method = hasProfile ? 'PATCH' : 'POST';
	const res = await fetch(`/api/projects/${projectId}/profile`, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});

	const json = await res.json();

	if (!res.ok) {
		return {
			error: json.message ?? 'Er is iets misgegaan bij het opslaan.',
			success: ''
		};
	}

	if (planningMilestones.length > 0) {
		const milestoneError = await savePlanningMilestones(
			projectId,
			planningMilestones,
			existingMilestones
		);
		if (milestoneError) {
			return { error: milestoneError, success: '' };
		}
	}

	await invalidateAll();
	return { error: '', success: 'Projectprofiel opgeslagen.' };
}

export async function savePlanningMilestones(
	projectId: string,
	planningMilestones: TimelineMilestone[],
	existingMilestones: Milestone[]
): Promise<string> {
	for (const existing of existingMilestones) {
		await fetch(`/api/projects/${projectId}/milestones/${existing.id}`, {
			method: 'DELETE'
		});
	}
	for (const m of planningMilestones) {
		const res = await fetch(`/api/projects/${projectId}/milestones`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				milestone_type: m.milestone_type,
				title: m.label,
				target_date: m.target_date,
				is_critical: true,
				status: 'not_started'
			})
		});
		if (!res.ok) {
			const json = await res.json();
			return json.message ?? 'Milestone kon niet worden opgeslagen.';
		}
	}
	return '';
}

export async function confirmProfile(projectId: string): Promise<ActionResult> {
	const res = await fetch(`/api/projects/${projectId}/profile/confirm`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ confirmed: true })
	});

	const json = await res.json();

	if (!res.ok) {
		return {
			error: json.message ?? 'Er is iets misgegaan bij het bevestigen.',
			success: ''
		};
	}

	await invalidateAll();
	return { error: '', success: 'Projectprofiel bevestigd.' };
}
