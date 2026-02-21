<script lang="ts">
	import type { PageData } from './$types';
	import type { DeadlineItem, Milestone, PhaseActivity, ActivityDependency } from '$types';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import {
		loadCriticalPath,
		createDependency,
		updateActivity,
		updateDeadlineDate,
		deleteActivity,
		handleExport
	} from '$lib/utils/planning-helpers';
	import PlanningHeader from '$lib/components/planning/PlanningHeader.svelte';
	import PlanningFilters from '$lib/components/planning/PlanningFilters.svelte';
	import PlanningContent from '$lib/components/planning/PlanningContent.svelte';
	import PlanningActions from '$lib/components/planning/PlanningActions.svelte';

	export let data: PageData;

	$: project = data.project;
	$: milestones = (data.milestones ?? []) as Milestone[];
	$: deadlineItems = (data.deadlineItems ?? []) as DeadlineItem[];
	$: activities = (data.activities ?? []) as PhaseActivity[];
	$: dependencies = (data.dependencies ?? []) as ActivityDependency[];
	$: projectProfile = data.projectProfile;
	$: members = data.members ?? [];

	// Critical path state
	let criticalPathIds: Set<string> = new Set();
	let nodeFloats: Map<string, number> = new Map();
	let criticalPathError = '';
	let showCriticalPath = true;

	async function refreshCriticalPath(): Promise<void> {
		const result = await loadCriticalPath(project.id);
		criticalPathIds = result.criticalPathIds;
		nodeFloats = result.nodeFloats;
		criticalPathError = result.error;
	}

	onMount(() => { refreshCriticalPath(); });
	$: if (dependencies) { refreshCriticalPath(); }

	// Tab state
	type PlanningTab = 'deadlines' | 'timeline' | 'ai';
	$: tabParam = $page.url.searchParams.get('tab') as PlanningTab | null;
	let activeTab: PlanningTab = 'deadlines';
	$: if (tabParam && ['deadlines', 'timeline', 'ai'].includes(tabParam)) {
		activeTab = tabParam;
	}

	let deadlineView: 'list' | 'calendar' = 'list';

	// Error state
	let ganttUpdateError = '';
	let dateUpdateError = '';
	let deleteError = '';

	// Modal/panel state
	let showMilestoneModal = false;
	let showMilestonePanel = false;
	let showExportMenu = false;
	let milestoneFormError = '';
	let milestoneFormSubmitting = false;
	let isMilestone = false;

	// Context menu
	let contextMenu: { x: number; y: number; activityId: string; title: string } | null = null;

	async function onDependencyCreate(s: string, t: string): Promise<void> {
		ganttUpdateError = await createDependency(project.id, s, t);
	}

	async function onActivityUpdate(id: string, changes: Partial<PhaseActivity>): Promise<void> {
		ganttUpdateError = await updateActivity(project.id, id, changes);
	}

	async function onDateChange(item: DeadlineItem, newDate: string): Promise<void> {
		dateUpdateError = await updateDeadlineDate(project.id, item, newDate);
	}

	function onDeadlineClick(item: DeadlineItem): void {
		if (item.type === 'milestone') showMilestonePanel = true;
	}

	function onMilestoneClick(): void {
		showMilestonePanel = true;
	}

	function onContextMenu(e: MouseEvent, item: DeadlineItem): void {
		e.preventDefault();
		if (item.type !== 'activity') return;
		contextMenu = { x: e.clientX, y: e.clientY, activityId: item.id, title: item.title };
	}

	async function onDeleteActivity(): Promise<void> {
		if (!contextMenu) return;
		const { activityId } = contextMenu;
		contextMenu = null;
		deleteError = await deleteActivity(project.id, activityId);
	}

	function onExport(format: 'ical' | 'csv'): void {
		showExportMenu = false;
		handleExport(project.id, format);
	}

	function closeMilestoneModal(): void {
		showMilestoneModal = false;
		milestoneFormError = '';
		isMilestone = false;
	}

	function closeExportMenu(event: MouseEvent): void {
		const target = event.target as HTMLElement;
		if (!target.closest('.export-menu-wrapper')) showExportMenu = false;
	}
</script>

<svelte:window on:click={(e) => { contextMenu = null; closeExportMenu(e); }} />

<svelte:head>
	<title>Planning — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<PlanningHeader
		{showExportMenu}
		{onExport}
		onToggleExportMenu={() => { showExportMenu = !showExportMenu; }}
		onAdd={() => { showMilestoneModal = true; }}
	/>

	<PlanningFilters
		{activeTab}
		{deadlineView}
		onTabChange={(tab) => { activeTab = tab; }}
		onViewChange={(view) => { deadlineView = view; }}
	/>

	<PlanningContent
		{activeTab}
		{deadlineView}
		{deadlineItems}
		{activities}
		{milestones}
		{dependencies}
		projectId={project.id}
		timelineStart={projectProfile?.timeline_start ?? null}
		timelineEnd={projectProfile?.timeline_end ?? null}
		{criticalPathIds}
		{nodeFloats}
		{showCriticalPath}
		{criticalPathError}
		{ganttUpdateError}
		{dateUpdateError}
		{onDeadlineClick}
		{onDateChange}
		{onContextMenu}
		onActivityUpdate={onActivityUpdate}
		{onMilestoneClick}
		onDependencyCreate={onDependencyCreate}
		onCriticalPathToggle={(v) => { showCriticalPath = v; }}
		onDismissGanttError={() => { ganttUpdateError = ''; }}
		onDismissDateError={() => { dateUpdateError = ''; }}
		onAddFirst={() => { showMilestoneModal = true; }}
	/>

	<PlanningActions
		{milestones}
		{members}
		{showMilestonePanel}
		{showMilestoneModal}
		{contextMenu}
		{deleteError}
		{milestoneFormError}
		{milestoneFormSubmitting}
		{isMilestone}
		onCloseMilestonePanel={() => { showMilestonePanel = false; }}
		onCloseMilestoneModal={closeMilestoneModal}
		onOpenMilestoneModal={() => { showMilestoneModal = true; }}
		onDeleteActivity={onDeleteActivity}
		onDismissDeleteError={() => { deleteError = ''; }}
	/>
</div>
