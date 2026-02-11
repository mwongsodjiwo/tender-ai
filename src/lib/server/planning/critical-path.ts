// Critical Path Method (CPM) — Forward pass, backward pass, float calculation

import type { PhaseActivity, Milestone, ActivityDependency } from '$types';
import {
	type CPMNode,
	type CPMResult,
	buildDAG,
	detectCycles,
	topologicalSort,
	getLagDays,
	getDependencyType
} from './critical-path-graph';

// Re-export for external consumers
export type { CPMNode, CPMResult };
export { detectCycles };

// =============================================================================
// MAIN CPM CALCULATION
// =============================================================================

/** Calculate the critical path for a set of activities, milestones, and dependencies */
export function calculateCriticalPath(
	activities: PhaseActivity[],
	milestones: Milestone[],
	dependencies: ActivityDependency[]
): CPMResult {
	const graph = buildDAG(activities, milestones, dependencies);

	if (graph.size === 0) {
		return { nodes: graph, critical_path: [], project_duration: 0 };
	}

	const cycles = detectCycles(graph);
	if (cycles.length > 0) {
		const cycleNames = cycles[0]
			.map((id) => graph.get(id)?.title ?? id)
			.join(' -> ');
		throw new Error(`Circulaire afhankelijkheden gevonden: ${cycleNames}`);
	}

	const sorted = topologicalSort(graph);

	forwardPass(sorted, graph, dependencies);

	const projectDuration = Math.max(
		...Array.from(graph.values()).map((n) => n.earliest_finish),
		0
	);

	backwardPass(sorted, graph, dependencies, projectDuration);

	calculateFloat(graph);

	const criticalPath = sorted.filter((n) => n.is_critical);

	return { nodes: graph, critical_path: criticalPath, project_duration: projectDuration };
}

function forwardPass(
	sorted: CPMNode[],
	graph: Map<string, CPMNode>,
	dependencies: ActivityDependency[]
): void {
	for (const node of sorted) {
		if (node.predecessors.length === 0) {
			node.earliest_start = 0;
		} else {
			node.earliest_start = Math.max(
				...node.predecessors.map((predId) => {
					const pred = graph.get(predId)!;
					const lag = getLagDays(dependencies, predId, node.id);
					const depType = getDependencyType(dependencies, predId, node.id);
					return getForwardConstraint(pred, depType) + lag;
				})
			);
		}
		node.earliest_finish = node.earliest_start + node.duration;
	}
}

function getForwardConstraint(predecessor: CPMNode, depType: string): number {
	switch (depType) {
		case 'finish_to_start':
			return predecessor.earliest_finish;
		case 'start_to_start':
			return predecessor.earliest_start;
		case 'finish_to_finish':
			return predecessor.earliest_finish;
		case 'start_to_finish':
			return predecessor.earliest_start;
		default:
			return predecessor.earliest_finish;
	}
}

function backwardPass(
	sorted: CPMNode[],
	graph: Map<string, CPMNode>,
	dependencies: ActivityDependency[],
	projectDuration: number
): void {
	const reversed = [...sorted].reverse();

	for (const node of reversed) {
		if (node.successors.length === 0) {
			node.latest_finish = projectDuration;
		} else {
			node.latest_finish = Math.min(
				...node.successors.map((succId) => {
					const succ = graph.get(succId)!;
					const lag = getLagDays(dependencies, node.id, succId);
					const depType = getDependencyType(dependencies, node.id, succId);
					return getBackwardConstraint(succ, depType) - lag;
				})
			);
		}
		node.latest_start = node.latest_finish - node.duration;
	}
}

function getBackwardConstraint(successor: CPMNode, depType: string): number {
	switch (depType) {
		case 'finish_to_start':
			return successor.latest_start;
		case 'start_to_start':
			return successor.latest_start;
		case 'finish_to_finish':
			return successor.latest_finish;
		case 'start_to_finish':
			return successor.latest_finish;
		default:
			return successor.latest_start;
	}
}

function calculateFloat(graph: Map<string, CPMNode>): void {
	for (const node of graph.values()) {
		node.total_float = node.latest_start - node.earliest_start;
		node.is_critical = node.total_float === 0;
	}
}

/** Check if adding a dependency from sourceId to targetId would create a cycle */
export function wouldCreateCycle(
	existingDependencies: ActivityDependency[],
	sourceId: string,
	targetId: string
): boolean {
	// Build adjacency list from existing deps
	const adjacency = new Map<string, string[]>();

	for (const dep of existingDependencies) {
		if (!adjacency.has(dep.source_id)) {
			adjacency.set(dep.source_id, []);
		}
		adjacency.get(dep.source_id)!.push(dep.target_id);
	}

	// Add the proposed dependency
	if (!adjacency.has(sourceId)) {
		adjacency.set(sourceId, []);
	}
	adjacency.get(sourceId)!.push(targetId);

	// BFS/DFS from targetId to check if we can reach sourceId
	return canReach(adjacency, targetId, sourceId);
}

function canReach(
	adjacency: Map<string, string[]>,
	from: string,
	target: string
): boolean {
	const visited = new Set<string>();
	const queue = [from];

	while (queue.length > 0) {
		const current = queue.shift()!;
		if (current === target) return true;
		if (visited.has(current)) continue;
		visited.add(current);

		const neighbors = adjacency.get(current) ?? [];
		for (const neighbor of neighbors) {
			if (!visited.has(neighbor)) {
				queue.push(neighbor);
			}
		}
	}

	return false;
}
