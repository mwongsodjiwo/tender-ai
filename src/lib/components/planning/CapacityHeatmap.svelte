<script lang="ts">
	import type { CapacityMonth } from '$types';

	export let capacity: CapacityMonth[] = [];
	export let teamSize: number = 1;

	type CapacityLevel = 'low' | 'normal' | 'high' | 'critical';

	interface CapacityCell {
		month: string;
		label: string;
		activeProjects: number;
		specProjects: number;
		utilization: number;
		level: CapacityLevel;
	}

	$: cells = capacity.map(buildCell);

	function buildCell(m: CapacityMonth): CapacityCell {
		const utilization = m.available_hours > 0
			? Math.round((m.total_estimated_hours / m.available_hours) * 100)
			: 0;
		return {
			month: m.month,
			label: m.label,
			activeProjects: m.active_projects,
			specProjects: m.projects_in_specification,
			utilization,
			level: getLevel(utilization, m.active_projects)
		};
	}

	function getLevel(utilization: number, activeProjects: number): CapacityLevel {
		if (utilization > 90 || activeProjects >= 5) return 'critical';
		if (utilization > 70 || activeProjects >= 4) return 'high';
		if (utilization > 50 || activeProjects >= 3) return 'normal';
		return 'low';
	}

	const LEVEL_STYLES: Record<CapacityLevel, { bg: string; text: string; label: string }> = {
		low: { bg: 'bg-green-100', text: 'text-green-700', label: 'OK' },
		normal: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Normaal' },
		high: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Hoog' },
		critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Krap' }
	};
</script>

<div class="rounded-lg border border-gray-200 bg-white">
	<div class="border-b border-gray-200 px-4 py-3">
		<h3 class="text-sm font-semibold text-gray-900">Capaciteitsoverzicht</h3>
		<p class="mt-0.5 text-xs text-gray-500">
			Bezetting per maand — team van {teamSize} {teamSize === 1 ? 'persoon' : 'personen'}
		</p>
	</div>

	{#if cells.length === 0}
		<div class="px-4 py-8 text-center text-sm text-gray-500">
			Geen capaciteitsdata beschikbaar.
		</div>
	{:else}
		<div class="overflow-x-auto p-4">
			<div class="grid gap-2" style="grid-template-columns: repeat({cells.length}, minmax(64px, 1fr));">
				{#each cells as cell (cell.month)}
					{@const style = LEVEL_STYLES[cell.level]}
					<div
						class="flex flex-col items-center rounded-lg p-2 transition-colors {style.bg}"
						title="{capitalizeLabel(cell.label)}: {cell.activeProjects} actieve projecten, {cell.utilization}% bezetting"
					>
						<span class="text-xs font-medium text-gray-600">{capitalizeLabel(cell.label)}</span>
						<span class="mt-1 text-lg font-semibold {style.text}">{cell.activeProjects}</span>
						<span class="text-[10px] text-gray-500">projecten</span>
						<div class="mt-1.5 w-full rounded-full bg-white/60" style="height: 4px;">
							<div
								class="h-full rounded-full transition-all"
								style="width: {Math.min(cell.utilization, 100)}%; background-color: {getLevelColor(cell.level)};"
							></div>
						</div>
						<span class="mt-1 text-[10px] font-medium {style.text}">{style.label}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Summary row -->
		<div class="flex flex-wrap items-center gap-4 border-t border-gray-100 px-4 py-2.5">
			<div class="flex items-center gap-1.5">
				<span class="inline-block h-3 w-3 rounded-sm bg-green-100"></span>
				<span class="text-xs text-gray-500">&lt; 50% OK</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="inline-block h-3 w-3 rounded-sm bg-yellow-100"></span>
				<span class="text-xs text-gray-500">50–70% Normaal</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="inline-block h-3 w-3 rounded-sm bg-orange-100"></span>
				<span class="text-xs text-gray-500">70–90% Hoog</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="inline-block h-3 w-3 rounded-sm bg-red-100"></span>
				<span class="text-xs text-gray-500">&gt; 90% Krap</span>
			</div>
		</div>
	{/if}
</div>

<script context="module" lang="ts">
	function capitalizeLabel(label: string): string {
		return label.charAt(0).toUpperCase() + label.slice(1);
	}

	function getLevelColor(level: 'low' | 'normal' | 'high' | 'critical'): string {
		const colors = { low: '#22c55e', normal: '#eab308', high: '#f97316', critical: '#ef4444' };
		return colors[level];
	}
</script>
