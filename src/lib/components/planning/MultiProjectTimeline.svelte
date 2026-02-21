<script lang="ts">
	import type { OrganizationProjectPlanning } from '$types';
	import { PROJECT_PHASE_LABELS, PROJECT_PHASES } from '$types';
	import { PHASE_COLORS } from './gantt-types';
	import {
		type ViewRange,
		RANGE_OPTIONS,
		PHASE_ABBREVIATIONS,
		getVisibleMonths,
		getTodayX,
		dateToX,
		getPhaseSegments,
		getProjectBar
	} from './multi-project-utils';

	export let projects: OrganizationProjectPlanning[] = [];
	export let year: number = new Date().getFullYear();
	export let onProjectClick: ((projectId: string) => void) | undefined = undefined;

	let viewRange: ViewRange = 'year';

	const ROW_HEIGHT = 60;
	const HEADER_HEIGHT = 40;
	const LEFT_PANEL = 200;
	const COL_WIDTH = 80;

	$: months = getVisibleMonths(viewRange);
	$: chartWidth = months.length * COL_WIDTH;
	$: totalHeight = HEADER_HEIGHT + projects.length * ROW_HEIGHT;
	$: todayX = getTodayX(months, year, COL_WIDTH);
</script>

<div class="rounded-lg border border-gray-200 bg-white">
	<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
		<h3 class="text-sm font-semibold text-gray-900">Organisatie Planning {year}</h3>
		<div class="flex gap-1">
			{#each RANGE_OPTIONS as option (option.value)}
				<button
					on:click={() => (viewRange = option.value)}
					class="rounded px-2.5 py-1 text-xs font-medium transition-colors
						{viewRange === option.value ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}"
				>{option.label}</button>
			{/each}
		</div>
	</div>

	{#if projects.length === 0}
		<div class="px-4 py-12 text-center text-sm text-gray-500">Geen actieve projecten met planning gevonden.</div>
	{:else}
		<div class="overflow-x-auto">
			<div class="flex" style="min-width: {LEFT_PANEL + chartWidth}px;">
				<!-- Left panel -->
				<div class="shrink-0 border-r border-gray-200" style="width: {LEFT_PANEL}px;">
					<div class="border-b border-gray-100 px-3 py-2" style="height: {HEADER_HEIGHT}px;">
						<span class="text-xs font-medium text-gray-500">Project</span>
					</div>
					{#each projects as project (project.id)}
						<button
							on:click={() => onProjectClick?.(project.id)}
							class="flex w-full items-center gap-2 border-b border-gray-50 px-3 text-left hover:bg-gray-50"
							style="height: {ROW_HEIGHT}px;"
							title="{project.name} — {PROJECT_PHASE_LABELS[project.current_phase]}"
						>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-gray-900">{project.name}</p>
								<div class="flex items-center gap-1.5">
									<span class="inline-block h-1.5 w-1.5 rounded-full" style="background-color: {PHASE_COLORS[project.current_phase]}"></span>
									<span class="text-xs text-gray-500">{PROJECT_PHASE_LABELS[project.current_phase]}</span>
									{#if !project.is_on_track}
										<span class="text-xs font-medium text-red-600" title="Loopt achter">!</span>
									{/if}
								</div>
							</div>
							<span class="shrink-0 text-xs font-medium text-gray-500">{project.progress}%</span>
						</button>
					{/each}
				</div>

				<!-- Chart area -->
				<div class="relative flex-1 overflow-hidden" style="width: {chartWidth}px;">
					<svg width={chartWidth} height={totalHeight} class="block">
						{#each months as month, i (month.index)}
							<g transform="translate({i * COL_WIDTH}, 0)">
								<line x1="0" y1="0" x2="0" y2={totalHeight} stroke="#e5e7eb" stroke-width="1" />
								<text x={COL_WIDTH / 2} y="24" text-anchor="middle" class="fill-gray-500" font-size="12" font-weight="500">{month.label}</text>
							</g>
						{/each}
						<line x1={chartWidth} y1="0" x2={chartWidth} y2={totalHeight} stroke="#e5e7eb" />
						<line x1="0" y1={HEADER_HEIGHT} x2={chartWidth} y2={HEADER_HEIGHT} stroke="#e5e7eb" />

						{#each projects as project, rowIdx (project.id)}
							{@const rowY = HEADER_HEIGHT + rowIdx * ROW_HEIGHT}
							{@const segments = getPhaseSegments(project, months, year, chartWidth, COL_WIDTH)}
							{@const bar = getProjectBar(project, months, year, chartWidth, COL_WIDTH)}

							<rect x="0" y={rowY} width={chartWidth} height={ROW_HEIGHT} fill={rowIdx % 2 === 0 ? '#fafafa' : '#ffffff'} />
							<line x1="0" y1={rowY + ROW_HEIGHT} x2={chartWidth} y2={rowY + ROW_HEIGHT} stroke="#f3f4f6" />

							{#each segments as seg (seg.phase)}
								<rect x={seg.x} y={rowY + 10} width={seg.width} height="24" rx="4" fill={PHASE_COLORS[seg.phase]} opacity="0.85" />
								{#if seg.width > 30}
									<text x={seg.x + seg.width / 2} y={rowY + 26} text-anchor="middle" fill="white" font-size="9" font-weight="600">{PHASE_ABBREVIATIONS[seg.phase]}</text>
								{/if}
							{/each}

							{#if bar && project.progress > 0 && project.progress < 100}
								<rect x={bar.x} y={rowY + 38} width={bar.width} height="3" rx="1.5" fill="#e5e7eb" />
								<rect x={bar.x} y={rowY + 38} width={bar.width * project.progress / 100} height="3" rx="1.5" fill="#10b981" />
							{/if}

							{#each project.upcoming_milestones as ms (ms.id)}
								{@const msX = dateToX(ms.target_date, months, year, chartWidth, COL_WIDTH)}
								{#if msX !== null}
									<g transform="translate({msX}, {rowY + 22})">
										<polygon points="0,-5 5,0 0,5 -5,0" fill={ms.is_critical ? '#ef4444' : '#6b7280'} />
									</g>
								{/if}
							{/each}
						{/each}

						{#if todayX !== null}
							<line x1={todayX} y1="0" x2={todayX} y2={totalHeight} stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,3" />
							<rect x={todayX - 14} y="2" width="28" height="14" rx="3" fill="#ef4444" />
							<text x={todayX} y="12" text-anchor="middle" fill="white" font-size="8" font-weight="600">Nu</text>
						{/if}
					</svg>
				</div>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-4 border-t border-gray-100 px-4 py-2">
			{#each PROJECT_PHASES as phase (phase)}
				<div class="flex items-center gap-1.5">
					<span class="inline-block h-3 w-3 rounded-sm" style="background-color: {PHASE_COLORS[phase]}"></span>
					<span class="text-xs text-gray-500">{PROJECT_PHASE_LABELS[phase]}</span>
				</div>
			{/each}
			<div class="flex items-center gap-1.5">
				<svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,0 10,5 5,10 0,5" fill="#6b7280" /></svg>
				<span class="text-xs text-gray-500">Milestone</span>
			</div>
		</div>
	{/if}
</div>
