// AI weekly summary — generates a planning status report per organization

import type { SupabaseClient } from '@supabase/supabase-js';
import { chat } from '$server/ai/client';
import { createBulkNotifications } from './notification-service.js';

interface OrganizationPlanningStatus {
	projects: ProjectStatusSummary[];
	overdue_milestones: number;
	upcoming_deadlines: number;
	team_utilization: number;
}

interface ProjectStatusSummary {
	name: string;
	phase: string;
	progress: number;
	overdue_count: number;
	upcoming_count: number;
	is_on_track: boolean;
}

const WEEKLY_SUMMARY_PROMPT = `Je bent een planning-assistent voor een inkoopafdeling.
Maak een beknopte weekrapportage in het Nederlands.

Focus op:
1. Risico's en aandachtspunten
2. Verlopen deadlines die actie vereisen
3. Belangrijke deadlines komende week
4. Concrete aanbevelingen

Houd het kort (max 500 woorden). Gebruik opsommingstekens.
Begin met een korte samenvatting in één zin.`;

export async function generateWeeklySummary(
	supabase: SupabaseClient,
	organizationId: string
): Promise<{ summary: string; warnings: string[] }> {
	const status = await gatherOrganizationStatus(supabase, organizationId);

	const { content } = await chat({
		messages: [
			{
				role: 'user' as const,
				content: `Maak een weekrapportage op basis van deze data:\n${JSON.stringify(status, null, 2)}`
			}
		],
		systemPrompt: WEEKLY_SUMMARY_PROMPT,
		temperature: 0.5,
		maxTokens: 1500
	});

	const warnings = extractWarnings(status);

	return { summary: content, warnings };
}

export async function sendWeeklySummaryNotifications(
	supabase: SupabaseClient,
	organizationId: string
): Promise<number> {
	const { summary, warnings } = await generateWeeklySummary(supabase, organizationId);

	const { data: leaders } = await supabase
		.from('organization_members')
		.select('profile_id')
		.eq('organization_id', organizationId)
		.in('role', ['owner', 'admin']);

	if (!leaders || leaders.length === 0) return 0;

	const notifications = leaders.map((l) => ({
		userId: l.profile_id,
		organizationId,
		notificationType: 'weekly_summary' as const,
		title: 'Wekelijks planningsoverzicht',
		body: summary,
		metadata: { warnings, generated_at: new Date().toISOString() }
	}));

	return createBulkNotifications(supabase, notifications);
}

async function gatherOrganizationStatus(
	supabase: SupabaseClient,
	organizationId: string
): Promise<OrganizationPlanningStatus> {
	const today = new Date().toISOString().split('T')[0];
	const nextWeek = addDays(today, 7);

	const { data: projects } = await supabase
		.from('projects')
		.select('id, name, current_phase, status')
		.eq('organization_id', organizationId)
		.is('deleted_at', null)
		.neq('status', 'archived');

	const projectIds = projects?.map((p) => p.id) ?? [];
	if (projectIds.length === 0) {
		return { projects: [], overdue_milestones: 0, upcoming_deadlines: 0, team_utilization: 0 };
	}

	const [overdueResult, upcomingResult] = await Promise.all([
		supabase
			.from('milestones')
			.select('id, project_id')
			.in('project_id', projectIds)
			.lt('target_date', today)
			.neq('status', 'completed')
			.is('deleted_at', null),
		supabase
			.from('milestones')
			.select('id, project_id')
			.in('project_id', projectIds)
			.gte('target_date', today)
			.lte('target_date', nextWeek)
			.neq('status', 'completed')
			.is('deleted_at', null)
	]);

	const overdue = overdueResult.data ?? [];
	const upcoming = upcomingResult.data ?? [];

	const summaries: ProjectStatusSummary[] = (projects ?? []).map((p) => ({
		name: p.name,
		phase: p.current_phase,
		progress: 0,
		overdue_count: overdue.filter((m) => m.project_id === p.id).length,
		upcoming_count: upcoming.filter((m) => m.project_id === p.id).length,
		is_on_track: overdue.filter((m) => m.project_id === p.id).length === 0
	}));

	return {
		projects: summaries,
		overdue_milestones: overdue.length,
		upcoming_deadlines: upcoming.length,
		team_utilization: 0
	};
}

function extractWarnings(status: OrganizationPlanningStatus): string[] {
	const warnings: string[] = [];

	if (status.overdue_milestones > 0) {
		warnings.push(`${status.overdue_milestones} verlopen milestone(s) vereisen actie`);
	}

	const riskProjects = status.projects.filter((p) => !p.is_on_track);
	for (const p of riskProjects) {
		warnings.push(`${p.name}: ${p.overdue_count} verlopen deadline(s)`);
	}

	return warnings;
}

function addDays(dateStr: string, days: number): string {
	const date = new Date(dateStr);
	date.setDate(date.getDate() + days);
	return date.toISOString().split('T')[0];
}
