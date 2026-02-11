// GET /api/planning/overview — Cross-project planning overview
// Sprint 5: aggregates timelines, capacity, and warnings across all projects

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { OrganizationPlanningOverview } from '$types';
import type { Milestone, PhaseActivity } from '$types';
import {
	buildProjectPlanning,
	buildCapacity,
	buildWarnings
} from '$lib/server/planning/org-planning-helpers';

const DAYS_MS = 1000 * 60 * 60 * 24;

export const GET: RequestHandler = async ({ url, locals }) => {
	const { supabase, session } = locals;

	if (!session) {
		throw error(401, 'Niet ingelogd');
	}

	const now = new Date();
	const fromParam = url.searchParams.get('from');
	const toParam = url.searchParams.get('to');
	const yearStart = fromParam ?? `${now.getFullYear()}-01-01`;
	const yearEnd = toParam ?? `${now.getFullYear()}-12-31`;
	const year = new Date(yearStart).getFullYear();

	const { data: projects, error: projErr } = await supabase
		.from('projects')
		.select('id, name, status, current_phase, deadline_date, created_at')
		.is('deleted_at', null)
		.not('status', 'eq', 'archived')
		.order('name');

	if (projErr) {
		throw error(500, `Fout bij ophalen projecten: ${projErr.message}`);
	}

	const activeProjects = projects ?? [];

	if (activeProjects.length === 0) {
		const empty: OrganizationPlanningOverview = {
			projects: [], capacity: [], warnings: [],
			summary: { total_active: 0, on_track: 0, critical_deadlines: 0 }
		};
		return json(empty);
	}

	const projectIds = activeProjects.map((p) => p.id);

	const [profilesRes, milestonesRes, activitiesRes, membersRes] = await Promise.all([
		supabase.from('project_profiles').select('project_id, timeline_start, timeline_end')
			.in('project_id', projectIds).is('deleted_at', null),
		supabase.from('milestones').select('*')
			.in('project_id', projectIds).is('deleted_at', null).order('target_date'),
		supabase.from('phase_activities').select('*')
			.in('project_id', projectIds).is('deleted_at', null).order('phase'),
		supabase.from('organization_members').select('id').limit(200)
	]);

	if (milestonesRes.error || activitiesRes.error) {
		const msg = milestonesRes.error?.message ?? activitiesRes.error?.message ?? '';
		throw error(500, `Fout bij ophalen planningsdata: ${msg}`);
	}

	const profiles = profilesRes.data ?? [];
	const allMilestones = (milestonesRes.data ?? []) as Milestone[];
	const allActivities = (activitiesRes.data ?? []) as PhaseActivity[];
	const teamSize = membersRes.data?.length ?? 1;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const projectPlannings = activeProjects.map((proj) => {
		const profile = profiles.find((p) => p.project_id === proj.id);
		const ms = allMilestones.filter((m) => m.project_id === proj.id);
		const acts = allActivities.filter((a) => a.project_id === proj.id);
		return buildProjectPlanning(proj, profile ?? undefined, ms, acts, today);
	});

	const capacity = buildCapacity(projectPlannings, allActivities, year, teamSize);
	const warnings = buildWarnings(capacity, projectPlannings);

	const onTrack = projectPlannings.filter((p) => p.is_on_track).length;
	const todayMs = today.getTime();
	const criticalDl = allMilestones.filter((m) => {
		const days = Math.ceil((new Date(m.target_date).getTime() - todayMs) / DAYS_MS);
		return m.is_critical && m.status !== 'completed' && days >= 0 && days <= 14;
	}).length;

	const response: OrganizationPlanningOverview = {
		projects: projectPlannings,
		capacity,
		warnings,
		summary: { total_active: projectPlannings.length, on_track: onTrack, critical_deadlines: criticalDl }
	};

	return json(response);
};
