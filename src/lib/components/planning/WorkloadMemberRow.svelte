<script lang="ts">
	import type { MemberWorkload } from '$types';
	import { PROJECT_ROLE_LABELS } from '$types';
	import type { ProjectRole } from '$types';

	export let member: MemberWorkload;
	export let weeks: string[] = [];
	export let onMemberClick: (profileId: string) => void = () => {};

	let expanded = false;

	$: weekHoursMap = buildWeekHoursMap(member);
	$: projectBreakdown = buildProjectBreakdown(member);

	function buildWeekHoursMap(m: MemberWorkload): Map<string, number> {
		const map = new Map<string, number>();
		for (const w of m.time_logged) { map.set(w.week, w.hours); }
		return map;
	}

	function buildProjectBreakdown(m: MemberWorkload): { name: string; hours: number }[] {
		const map = new Map<string, number>();
		for (const a of m.assignments) {
			const prev = map.get(a.project_name) ?? 0;
			map.set(a.project_name, prev + (a.estimated_hours ?? 0));
		}
		return Array.from(map.entries())
			.map(([name, hours]) => ({ name, hours }))
			.sort((a, b) => b.hours - a.hours);
	}

	function getHoursColor(hours: number): string {
		if (hours > 40) return 'text-red-600 font-semibold';
		if (hours >= 36) return 'text-yellow-600 font-medium';
		return 'text-gray-700';
	}

	function getIndicator(hours: number): string {
		if (hours > 40) return 'bg-red-500';
		if (hours >= 36) return 'bg-yellow-500';
		if (hours > 0) return 'bg-green-500';
		return 'bg-gray-200';
	}

	function getRoleLabel(role: string): string {
		return PROJECT_ROLE_LABELS[role as ProjectRole] ?? role;
	}
</script>

<!-- Main member row -->
<tr class="border-b border-gray-100 hover:bg-gray-50">
	<td class="px-4 py-3">
		<button
			type="button"
			class="flex items-center gap-3 text-left"
			on:click={() => (expanded = !expanded)}
			aria-expanded={expanded}
		>
			<span class="text-xs text-gray-400">{expanded ? '▼' : '▶'}</span>
			{#if member.avatar_url}
				<img src={member.avatar_url} alt="" class="h-8 w-8 rounded-full" />
			{:else}
				<span class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
					{member.name.charAt(0).toUpperCase()}
				</span>
			{/if}
			<div>
				<p class="text-sm font-medium text-gray-900">{member.name}</p>
				{#if member.roles.length > 0}
					<p class="text-xs text-gray-500">
						{member.roles.map(getRoleLabel).join(', ')}
					</p>
				{/if}
			</div>
		</button>
	</td>
	{#each weeks as week (week)}
		{@const hours = weekHoursMap.get(week) ?? 0}
		<td class="px-3 py-3 text-center">
			<div class="flex flex-col items-center gap-1">
				<span class="text-sm {getHoursColor(hours)}">{hours > 0 ? `${hours}u` : '-'}</span>
				<span class="inline-block h-1.5 w-1.5 rounded-full {getIndicator(hours)}"></span>
			</div>
		</td>
	{/each}
	<td class="px-3 py-3 text-center">
		<span class="text-sm font-semibold text-gray-900">
			{Math.round(member.summary.total_logged_hours)}u
		</span>
	</td>
	<td class="px-3 py-3 text-center">
		<span class="text-sm {member.summary.utilization_percentage > 90 ? 'text-red-600 font-semibold' : 'text-gray-600'}">
			{member.summary.utilization_percentage}%
		</span>
	</td>
</tr>

<!-- Expanded project breakdown -->
{#if expanded}
	{#each projectBreakdown as proj (proj.name)}
		<tr class="bg-gray-50/50 border-b border-gray-50">
			<td class="px-4 py-2 pl-16">
				<span class="text-xs text-gray-500">{proj.name}</span>
			</td>
			{#each weeks as _ (_)}
				<td class="px-3 py-2"></td>
			{/each}
			<td class="px-3 py-2 text-center">
				<span class="text-xs text-gray-500">{Math.round(proj.hours)}u</span>
			</td>
			<td class="px-3 py-2"></td>
		</tr>
	{/each}
{/if}
