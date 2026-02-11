// GET /api/planning/workload — Team workload aggregation
// Sprint 7: combines activity assignments and time entries per team member

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { TeamWorkloadResponse } from '$types';
import type { PhaseActivity, TimeEntry, Profile } from '$types';
import {
	buildMemberWorkload,
	buildMemberInfoList,
	detectOverloads
} from '$lib/server/planning/workload-helpers';

export const GET: RequestHandler = async ({ url, locals }) => {
	const { supabase, session } = locals;

	if (!session) {
		throw error(401, 'Niet ingelogd');
	}

	const fromParam = url.searchParams.get('from');
	const toParam = url.searchParams.get('to');

	const now = new Date();
	const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1)
		.toISOString().split('T')[0];
	const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
		.toISOString().split('T')[0];

	const from = fromParam ?? defaultFrom;
	const to = toParam ?? defaultTo;

	// Fetch all org members with profiles
	const [membersRes, projectsRes] = await Promise.all([
		supabase
			.from('organization_members')
			.select('profile_id, profiles!inner(id, first_name, last_name, avatar_url)')
			.limit(200),
		supabase
			.from('projects')
			.select('id, name')
			.is('deleted_at', null)
			.not('status', 'eq', 'archived')
	]);

	if (membersRes.error) {
		throw error(500, `Fout bij ophalen teamleden: ${membersRes.error.message}`);
	}
	if (projectsRes.error) {
		throw error(500, `Fout bij ophalen projecten: ${projectsRes.error.message}`);
	}

	const orgMembers = membersRes.data ?? [];
	const projects = projectsRes.data ?? [];

	if (orgMembers.length === 0) {
		const empty: TeamWorkloadResponse = { members: [], warnings: [] };
		return json(empty);
	}

	const projectIds = projects.map((p) => p.id);
	const profileIds = orgMembers.map((m) => m.profile_id);
	const projectNames = new Map(projects.map((p) => [p.id, p.name]));

	// Fetch activities and time entries in date range
	const [activitiesRes, timeEntriesRes, rolesRes] = await Promise.all([
		supabase
			.from('phase_activities')
			.select('*')
			.in('project_id', projectIds)
			.is('deleted_at', null)
			.in('assigned_to', profileIds),
		supabase
			.from('time_entries')
			.select('*')
			.in('user_id', profileIds)
			.gte('date', from)
			.lte('date', to),
		supabase
			.from('project_member_roles')
			.select('project_members!inner(profile_id), role')
			.in('project_members.profile_id', profileIds)
	]);

	if (activitiesRes.error) {
		throw error(500, `Fout bij ophalen activiteiten: ${activitiesRes.error.message}`);
	}
	if (timeEntriesRes.error) {
		throw error(500, `Fout bij ophalen uren: ${timeEntriesRes.error.message}`);
	}

	const allActivities = (activitiesRes.data ?? []) as PhaseActivity[];
	const allTimeEntries = (timeEntriesRes.data ?? []) as TimeEntry[];

	// Build role mappings from joined query
	const roleMappings = (rolesRes.data ?? []).map((r) => {
		const pm = r.project_members as unknown as { profile_id: string };
		return { profile_id: pm.profile_id, role: r.role };
	});

	// Build profile list from org members with joined profile data
	const profiles = orgMembers.map((m) => {
		const p = m.profiles as unknown as Profile;
		return p;
	}).filter((p): p is Profile => p !== null);

	const memberInfoList = buildMemberInfoList(orgMembers, profiles, roleMappings);

	const memberWorkloads = memberInfoList.map((member) =>
		buildMemberWorkload(member, allActivities, allTimeEntries, projectNames)
	);

	// Sort: overloaded members first, then by total assigned hours desc
	memberWorkloads.sort((a, b) => {
		const aOverloaded = a.summary.overloaded_weeks.length > 0 ? 1 : 0;
		const bOverloaded = b.summary.overloaded_weeks.length > 0 ? 1 : 0;
		if (aOverloaded !== bOverloaded) return bOverloaded - aOverloaded;
		return b.summary.total_assigned_hours - a.summary.total_assigned_hours;
	});

	const warnings = detectOverloads(memberWorkloads);

	const response: TeamWorkloadResponse = {
		members: memberWorkloads,
		warnings
	};

	return json(response);
};
