// Deadline checker — scans milestones and activities for approaching/overdue deadlines

import type { SupabaseClient } from '@supabase/supabase-js';
import { createBulkNotifications } from './notification-service.js';

interface DeadlineCheckResult {
	approaching: number;
	overdue: number;
	notifications_created: number;
}

export async function checkDeadlines(
	supabase: SupabaseClient
): Promise<DeadlineCheckResult> {
	const today = new Date().toISOString().split('T')[0];
	const futureDate = addDays(today, 14);

	const [approaching, overdue] = await Promise.all([
		findApproachingMilestones(supabase, today, futureDate),
		findOverdueMilestones(supabase, today)
	]);

	const notifications = [
		...buildApproachingNotifications(approaching, today),
		...buildOverdueNotifications(overdue, today)
	];

	const created = await createBulkNotifications(supabase, notifications);

	return {
		approaching: approaching.length,
		overdue: overdue.length,
		notifications_created: created
	};
}

interface MilestoneWithProject {
	id: string;
	title: string;
	target_date: string;
	is_critical: boolean;
	project_id: string;
	projects: { name: string; organization_id: string };
	members: { profile_id: string }[];
}

async function findApproachingMilestones(
	supabase: SupabaseClient,
	today: string,
	futureDate: string
): Promise<MilestoneWithProject[]> {
	const { data } = await supabase
		.from('milestones')
		.select(`
			id, title, target_date, is_critical, project_id,
			projects!inner(name, organization_id),
			members:project_members!milestones_project_id_fkey(profile_id)
		`)
		.gte('target_date', today)
		.lte('target_date', futureDate)
		.neq('status', 'completed')
		.is('deleted_at', null);

	return (data as unknown as MilestoneWithProject[]) ?? [];
}

async function findOverdueMilestones(
	supabase: SupabaseClient,
	today: string
): Promise<MilestoneWithProject[]> {
	const { data } = await supabase
		.from('milestones')
		.select(`
			id, title, target_date, is_critical, project_id,
			projects!inner(name, organization_id),
			members:project_members!milestones_project_id_fkey(profile_id)
		`)
		.lt('target_date', today)
		.neq('status', 'completed')
		.is('deleted_at', null);

	return (data as unknown as MilestoneWithProject[]) ?? [];
}

function buildApproachingNotifications(
	milestones: MilestoneWithProject[],
	today: string
) {
	return milestones.flatMap((m) => {
		const daysLeft = daysBetween(today, m.target_date);
		const prefix = m.is_critical ? '[KRITIEK] ' : '';
		return getProjectMemberIds(m).map((userId) => ({
			userId,
			organizationId: m.projects.organization_id,
			projectId: m.project_id,
			notificationType: 'deadline_approaching' as const,
			title: `${prefix}${m.title} — ${m.projects.name}`,
			body: `Deadline over ${daysLeft} ${daysLeft === 1 ? 'dag' : 'dagen'}.`,
			metadata: { milestone_id: m.id, days_remaining: daysLeft }
		}));
	});
}

function buildOverdueNotifications(
	milestones: MilestoneWithProject[],
	today: string
) {
	return milestones.flatMap((m) => {
		const daysOver = daysBetween(m.target_date, today);
		return getProjectMemberIds(m).map((userId) => ({
			userId,
			organizationId: m.projects.organization_id,
			projectId: m.project_id,
			notificationType: 'deadline_overdue' as const,
			title: `VERLOPEN: ${m.title} — ${m.projects.name}`,
			body: `Deadline ${daysOver} ${daysOver === 1 ? 'dag' : 'dagen'} geleden verlopen.`,
			metadata: { milestone_id: m.id, days_overdue: daysOver }
		}));
	});
}

function getProjectMemberIds(m: MilestoneWithProject): string[] {
	return m.members?.map((member) => member.profile_id) ?? [];
}

function addDays(dateStr: string, days: number): string {
	const date = new Date(dateStr);
	date.setDate(date.getDate() + days);
	return date.toISOString().split('T')[0];
}

function daysBetween(dateA: string, dateB: string): number {
	const a = new Date(dateA);
	const b = new Date(dateB);
	const diff = b.getTime() - a.getTime();
	return Math.round(diff / (1000 * 60 * 60 * 24));
}
