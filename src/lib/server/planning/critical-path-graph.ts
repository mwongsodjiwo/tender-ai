// Graph construction and cycle detection for Critical Path Method (CPM)

import type { PhaseActivity, Milestone, ActivityDependency, DependencyType } from '$types';

export interface CPMNode {
	id: string;
	type: 'activity' | 'milestone';
	title: string;
	duration: number;
	earliest_start: number;
	earliest_finish: number;
	latest_start: number;
	latest_finish: number;
	total_float: number;
	is_critical: boolean;
	predecessors: string[];
	successors: string[];
}

export interface CPMResult {
	nodes: Map<string, CPMNode>;
	critical_path: CPMNode[];
	project_duration: number;
}

/** Build a directed acyclic graph (DAG) from activities, milestones and dependencies */
export function buildDAG(
	activities: PhaseActivity[],
	milestones: Milestone[],
	dependencies: ActivityDependency[]
): Map<string, CPMNode> {
	const graph = new Map<string, CPMNode>();

	for (const activity of activities) {
		const duration = calculateActivityDuration(activity);
		graph.set(activity.id, {
			id: activity.id,
			type: 'activity',
			title: activity.title,
			duration,
			earliest_start: 0,
			earliest_finish: 0,
			latest_start: 0,
			latest_finish: 0,
			total_float: 0,
			is_critical: false,
			predecessors: [],
			successors: []
		});
	}

	for (const milestone of milestones) {
		graph.set(milestone.id, {
			id: milestone.id,
			type: 'milestone',
			title: milestone.title,
			duration: 0,
			earliest_start: 0,
			earliest_finish: 0,
			latest_start: 0,
			latest_finish: 0,
			total_float: 0,
			is_critical: false,
			predecessors: [],
			successors: []
		});
	}

	for (const dep of dependencies) {
		const sourceNode = graph.get(dep.source_id);
		const targetNode = graph.get(dep.target_id);
		if (!sourceNode || !targetNode) continue;

		sourceNode.successors.push(dep.target_id);
		targetNode.predecessors.push(dep.source_id);
	}

	return graph;
}

function calculateActivityDuration(activity: PhaseActivity): number {
	if (activity.planned_start && activity.planned_end) {
		const start = new Date(activity.planned_start).getTime();
		const end = new Date(activity.planned_end).getTime();
		const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
		return Math.max(days, 0);
	}
	return 0;
}

/** Detect circular dependencies in the graph. Returns arrays of node IDs forming cycles. */
export function detectCycles(graph: Map<string, CPMNode>): string[][] {
	const visited = new Set<string>();
	const recursionStack = new Set<string>();
	const cycles: string[][] = [];

	for (const [id] of graph) {
		if (!visited.has(id)) {
			dfs(id, [id], graph, visited, recursionStack, cycles);
		}
	}

	return cycles;
}

function dfs(
	nodeId: string,
	path: string[],
	graph: Map<string, CPMNode>,
	visited: Set<string>,
	recursionStack: Set<string>,
	cycles: string[][]
): void {
	visited.add(nodeId);
	recursionStack.add(nodeId);

	const node = graph.get(nodeId);
	if (!node) return;

	for (const successor of node.successors) {
		if (!visited.has(successor)) {
			dfs(successor, [...path, successor], graph, visited, recursionStack, cycles);
		} else if (recursionStack.has(successor)) {
			const cycleStart = path.indexOf(successor);
			if (cycleStart >= 0) {
				cycles.push([...path.slice(cycleStart), successor]);
			} else {
				cycles.push([...path, successor]);
			}
		}
	}

	recursionStack.delete(nodeId);
}

/** Return nodes in topological order. Throws if cycles exist. */
export function topologicalSort(graph: Map<string, CPMNode>): CPMNode[] {
	const inDegree = new Map<string, number>();
	for (const [id, node] of graph) {
		inDegree.set(id, node.predecessors.length);
	}

	const queue: string[] = [];
	for (const [id, degree] of inDegree) {
		if (degree === 0) queue.push(id);
	}

	const sorted: CPMNode[] = [];
	while (queue.length > 0) {
		const current = queue.shift()!;
		const node = graph.get(current)!;
		sorted.push(node);

		for (const successor of node.successors) {
			const newDegree = (inDegree.get(successor) ?? 1) - 1;
			inDegree.set(successor, newDegree);
			if (newDegree === 0) queue.push(successor);
		}
	}

	if (sorted.length !== graph.size) {
		throw new Error('Circulaire afhankelijkheden gevonden — topologische sortering niet mogelijk');
	}

	return sorted;
}

/** Get lag in days for a dependency between source and target */
export function getLagDays(
	dependencies: ActivityDependency[],
	sourceId: string,
	targetId: string
): number {
	const dep = dependencies.find(
		(d) => d.source_id === sourceId && d.target_id === targetId
	);
	return dep?.lag_days ?? 0;
}

/** Get dependency type between source and target */
export function getDependencyType(
	dependencies: ActivityDependency[],
	sourceId: string,
	targetId: string
): DependencyType {
	const dep = dependencies.find(
		(d) => d.source_id === sourceId && d.target_id === targetId
	);
	return dep?.dependency_type ?? 'finish_to_start';
}
