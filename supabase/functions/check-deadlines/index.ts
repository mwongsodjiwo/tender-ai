// Supabase Edge Function: check-deadlines
// Draait dagelijks via cron — controleert naderende en verlopen deadlines

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface MilestoneRow {
	id: string;
	title: string;
	target_date: string;
	is_critical: boolean;
	project_id: string;
	status: string;
	projects: { name: string; organization_id: string };
}

Deno.serve(async (req) => {
	const authHeader = req.headers.get('Authorization');
	if (!authHeader) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
	const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
	const supabase = createClient(supabaseUrl, serviceRoleKey);

	const today = new Date().toISOString().split('T')[0];
	const futureDate = addDays(today, 14);

	const [approachingResult, overdueResult] = await Promise.all([
		supabase
			.from('milestones')
			.select('id, title, target_date, is_critical, project_id, status, projects!inner(name, organization_id)')
			.gte('target_date', today)
			.lte('target_date', futureDate)
			.neq('status', 'completed')
			.is('deleted_at', null),
		supabase
			.from('milestones')
			.select('id, title, target_date, is_critical, project_id, status, projects!inner(name, organization_id)')
			.lt('target_date', today)
			.neq('status', 'completed')
			.is('deleted_at', null)
	]);

	const approaching = (approachingResult.data as MilestoneRow[]) ?? [];
	const overdue = (overdueResult.data as MilestoneRow[]) ?? [];
	let notificationsCreated = 0;

	for (const milestone of [...approaching, ...overdue]) {
		const { data: members } = await supabase
			.from('project_members')
			.select('profile_id')
			.eq('project_id', milestone.project_id);

		if (!members || members.length === 0) continue;

		const isOverdue = milestone.target_date < today;
		const daysLeft = daysBetween(today, milestone.target_date);
		const daysOver = daysBetween(milestone.target_date, today);

		const notifications = members.map((m: { profile_id: string }) => ({
			user_id: m.profile_id,
			organization_id: milestone.projects.organization_id,
			project_id: milestone.project_id,
			notification_type: isOverdue ? 'deadline_overdue' : 'deadline_approaching',
			title: isOverdue
				? `VERLOPEN: ${milestone.title} — ${milestone.projects.name}`
				: `${milestone.is_critical ? '[KRITIEK] ' : ''}${milestone.title} — ${milestone.projects.name}`,
			body: isOverdue
				? `Deadline ${daysOver} dagen geleden verlopen.`
				: `Deadline over ${daysLeft} ${daysLeft === 1 ? 'dag' : 'dagen'}.`,
			metadata: { milestone_id: milestone.id }
		}));

		const { data: inserted } = await supabase
			.from('notifications')
			.insert(notifications)
			.select('id');

		notificationsCreated += inserted?.length ?? 0;
	}

	return new Response(
		JSON.stringify({
			approaching: approaching.length,
			overdue: overdue.length,
			notifications_created: notificationsCreated,
			checked_at: new Date().toISOString()
		}),
		{ headers: { 'Content-Type': 'application/json' } }
	);
});

function addDays(dateStr: string, days: number): string {
	const date = new Date(dateStr);
	date.setDate(date.getDate() + days);
	return date.toISOString().split('T')[0];
}

function daysBetween(dateA: string, dateB: string): number {
	const a = new Date(dateA);
	const b = new Date(dateB);
	return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
