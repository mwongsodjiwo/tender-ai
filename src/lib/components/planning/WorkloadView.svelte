<script lang="ts">
	import type { MemberWorkload, OverloadWarning } from '$types';
	import WorkloadMemberRow from './WorkloadMemberRow.svelte';

	export let members: MemberWorkload[] = [];
	export let warnings: OverloadWarning[] = [];
	export let from: string = '';
	export let to: string = '';
	export let onMemberClick: (profileId: string) => void = () => {};

	$: weeks = buildWeekLabels(from, to);
	$: hasData = members.some((m) => m.summary.total_logged_hours > 0 || m.assignments.length > 0);

	function buildWeekLabels(fromDate: string, toDate: string): string[] {
		if (!fromDate || !toDate) return [];
		const result: string[] = [];
		const start = new Date(fromDate);
		const end = new Date(toDate);

		// Align to Monday
		const day = start.getUTCDay() || 7;
		start.setUTCDate(start.getUTCDate() - day + 1);

		while (start <= end && result.length < 12) {
			const weekStr = getISOWeek(start);
			result.push(weekStr);
			start.setUTCDate(start.getUTCDate() + 7);
		}
		return result;
	}

	function getISOWeek(date: Date): string {
		const d = new Date(date);
		const dayOfWeek = d.getUTCDay() || 7;
		d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
		const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
		const msPerDay = 1000 * 60 * 60 * 24;
		const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / msPerDay + 1) / 7);
		return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
	}

	function formatWeekLabel(week: string): string {
		const match = week.match(/W(\d+)$/);
		return match ? `Wk ${parseInt(match[1], 10)}` : week;
	}
</script>

<div class="space-y-4">
	<!-- Overload warnings -->
	{#if warnings.length > 0}
		<div class="rounded-lg border border-red-200 bg-red-50 p-4">
			<h3 class="text-sm font-semibold text-red-800">Overbezetting gedetecteerd</h3>
			<ul class="mt-2 space-y-1">
				{#each warnings as warning (warning.profile_id)}
					<li class="text-sm text-red-700">
						<span class="font-medium">{warning.member_name}</span>
						heeft {warning.weeks.length} {warning.weeks.length === 1 ? 'week' : 'weken'} met meer dan 40 uur.
						{#if warning.suggestion}
							<span class="text-red-600">Suggestie: {warning.suggestion}</span>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Workload table -->
	<div class="rounded-lg border border-gray-200 bg-white">
		<div class="border-b border-gray-200 px-4 py-3">
			<h3 class="text-sm font-semibold text-gray-900">Teamwerkbelasting</h3>
			<p class="mt-0.5 text-xs text-gray-500">
				Uren per teamlid per week — klik op een naam voor details
			</p>
		</div>

		{#if members.length === 0}
			<div class="px-4 py-12 text-center">
				<p class="text-sm text-gray-500">Geen teamleden gevonden.</p>
			</div>
		{:else if !hasData}
			<div class="px-4 py-12 text-center">
				<p class="text-sm text-gray-500">Nog geen uren geregistreerd in deze periode.</p>
				<p class="mt-1 text-xs text-gray-400">
					{members.length} {members.length === 1 ? 'teamlid' : 'teamleden'} beschikbaar
				</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full min-w-[600px]">
					<thead>
						<tr class="border-b border-gray-200 bg-gray-50">
							<th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Teamlid</th>
							{#each weeks as week (week)}
								<th class="px-3 py-2.5 text-center text-xs font-medium text-gray-500">
									{formatWeekLabel(week)}
								</th>
							{/each}
							<th class="px-3 py-2.5 text-center text-xs font-medium text-gray-500">Totaal</th>
							<th class="px-3 py-2.5 text-center text-xs font-medium text-gray-500">Bezetting</th>
						</tr>
					</thead>
					<tbody>
						{#each members as member (member.profile_id)}
							<WorkloadMemberRow
								{member}
								{weeks}
								{onMemberClick}
							/>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Legend -->
			<div class="flex flex-wrap items-center gap-4 border-t border-gray-100 px-4 py-2.5">
				<div class="flex items-center gap-1.5">
					<span class="inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
					<span class="text-xs text-gray-500">&lt; 36u</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
					<span class="text-xs text-gray-500">36–40u</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="inline-block h-2.5 w-2.5 rounded-full bg-red-500"></span>
					<span class="text-xs text-gray-500">&gt; 40u</span>
				</div>
			</div>
		{/if}
	</div>
</div>
