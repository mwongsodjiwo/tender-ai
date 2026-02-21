// Unit tests: Critical Path Method algorithm

import { describe, it, expect } from 'vitest';
import { calculateCriticalPath, wouldCreateCycle } from '../../src/lib/server/planning/critical-path';
import { detectCycles, buildDAG } from '../../src/lib/server/planning/critical-path-graph';
import type { PhaseActivity, Milestone, ActivityDependency } from '../../src/lib/types/database';

// Helper to create a minimal activity
function makeActivity(overrides: Partial<PhaseActivity> & { id: string }): PhaseActivity {
	return {
		project_id: 'proj-1',
		phase: 'preparing',
		activity_type: 'task',
		title: overrides.id,
		description: '',
		status: 'not_started',
		sort_order: 0,
		assigned_to: null,
		due_date: null,
		completed_at: null,
		planned_start: null,
		planned_end: null,
		actual_start: null,
		actual_end: null,
		estimated_hours: null,
		progress_percentage: 0,
		metadata: {},
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		deleted_at: null,
		...overrides
	};
}

function makeDep(source: string, target: string, overrides?: Partial<ActivityDependency>): ActivityDependency {
	return {
		id: `dep-${source}-${target}`,
		project_id: 'proj-1',
		source_type: 'activity',
		source_id: source,
		target_type: 'activity',
		target_id: target,
		dependency_type: 'finish_to_start',
		lag_days: 0,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		...overrides
	};
}

describe('calculateCriticalPath', () => {
	it('should return empty result for empty inputs', () => {
		const result = calculateCriticalPath([], [], []);
		expect(result.critical_path).toHaveLength(0);
		expect(result.project_duration).toBe(0);
	});

	it('should handle single activity with no dependencies', () => {
		const activities = [
			makeActivity({ id: 'a1', planned_start: '2026-03-01', planned_end: '2026-03-11' })
		];
		const result = calculateCriticalPath(activities, [], []);
		expect(result.nodes.size).toBe(1);
		expect(result.critical_path).toHaveLength(1);
		expect(result.project_duration).toBe(10);
	});

	it('should calculate critical path for linear chain A -> B -> C', () => {
		const activities = [
			makeActivity({ id: 'a1', planned_start: '2026-03-01', planned_end: '2026-03-06' }), // 5 days
			makeActivity({ id: 'a2', planned_start: '2026-03-06', planned_end: '2026-03-16' }), // 10 days
			makeActivity({ id: 'a3', planned_start: '2026-03-16', planned_end: '2026-03-19' })  // 3 days
		];
		const deps = [makeDep('a1', 'a2'), makeDep('a2', 'a3')];
		const result = calculateCriticalPath(activities, [], deps);

		expect(result.project_duration).toBe(18); // 5 + 10 + 3
		expect(result.critical_path).toHaveLength(3);
		// All are critical since it's a single chain
		for (const node of result.critical_path) {
			expect(node.total_float).toBe(0);
		}
	});

	it('should identify the longer path as critical in parallel paths', () => {
		// Path 1: A (5d) -> C (3d) = 8 days
		// Path 2: B (10d) -> C (3d) = 13 days (critical)
		const activities = [
			makeActivity({ id: 'a', planned_start: '2026-03-01', planned_end: '2026-03-06' }),   // 5 days
			makeActivity({ id: 'b', planned_start: '2026-03-01', planned_end: '2026-03-11' }),   // 10 days
			makeActivity({ id: 'c', planned_start: '2026-03-11', planned_end: '2026-03-14' })    // 3 days
		];
		const deps = [makeDep('a', 'c'), makeDep('b', 'c')];
		const result = calculateCriticalPath(activities, [], deps);

		expect(result.project_duration).toBe(13);

		const nodeB = result.nodes.get('b')!;
		const nodeC = result.nodes.get('c')!;
		expect(nodeB.is_critical).toBe(true);
		expect(nodeC.is_critical).toBe(true);

		const nodeA = result.nodes.get('a')!;
		expect(nodeA.is_critical).toBe(false);
		expect(nodeA.total_float).toBe(5); // 5 days slack
	});

	it('should handle lag days in dependencies', () => {
		const activities = [
			makeActivity({ id: 'a1', planned_start: '2026-03-01', planned_end: '2026-03-06' }), // 5 days
			makeActivity({ id: 'a2', planned_start: '2026-03-06', planned_end: '2026-03-11' })  // 5 days
		];
		const deps = [makeDep('a1', 'a2', { lag_days: 3 })];
		const result = calculateCriticalPath(activities, [], deps);

		// Duration: 5 (a1) + 3 (lag) + 5 (a2) = 13
		expect(result.project_duration).toBe(13);
	});

	it('should include milestones in the critical path', () => {
		const activities = [
			makeActivity({ id: 'a1', planned_start: '2026-03-01', planned_end: '2026-03-06' })
		];
		const milestones: Milestone[] = [{
			id: 'm1',
			project_id: 'proj-1',
			milestone_type: 'publication',
			title: 'Publicatie',
			description: '',
			target_date: '2026-03-06',
			actual_date: null,
			phase: 'preparing',
			is_critical: true,
			status: 'not_started',
			sort_order: 0,
			source: 'manual',
			metadata: {},
			created_by: null,
			created_at: '2026-01-01T00:00:00Z',
			updated_at: '2026-01-01T00:00:00Z',
			deleted_at: null
		}];
		const deps = [makeDep('a1', 'm1')];
		const result = calculateCriticalPath(activities, milestones, deps);

		expect(result.nodes.size).toBe(2);
		const msNode = result.nodes.get('m1')!;
		expect(msNode.duration).toBe(0); // milestones have 0 duration
		expect(msNode.earliest_start).toBe(5);
	});

	it('should throw on circular dependencies', () => {
		const activities = [
			makeActivity({ id: 'a1', planned_start: '2026-03-01', planned_end: '2026-03-06' }),
			makeActivity({ id: 'a2', planned_start: '2026-03-06', planned_end: '2026-03-11' })
		];
		const deps = [makeDep('a1', 'a2'), makeDep('a2', 'a1')];

		expect(() => calculateCriticalPath(activities, [], deps)).toThrow('Circulaire afhankelijkheden');
	});

	it('should handle start_to_start dependency type', () => {
		const activities = [
			makeActivity({ id: 'a1', planned_start: '2026-03-01', planned_end: '2026-03-06' }), // 5 days
			makeActivity({ id: 'a2', planned_start: '2026-03-01', planned_end: '2026-03-08' })  // 7 days
		];
		const deps = [makeDep('a1', 'a2', { dependency_type: 'start_to_start' })];
		const result = calculateCriticalPath(activities, [], deps);

		// SS: a2 starts when a1 starts, so a2.earliest_start = a1.earliest_start = 0
		const nodeA2 = result.nodes.get('a2')!;
		expect(nodeA2.earliest_start).toBe(0);
	});
});

describe('wouldCreateCycle', () => {
	it('should detect a simple cycle', () => {
		const existing = [makeDep('a', 'b'), makeDep('b', 'c')];
		expect(wouldCreateCycle(existing, 'c', 'a')).toBe(true);
	});

	it('should allow non-cyclic dependency', () => {
		const existing = [makeDep('a', 'b')];
		expect(wouldCreateCycle(existing, 'b', 'c')).toBe(false);
	});

	it('should detect direct cycle', () => {
		const existing = [makeDep('a', 'b')];
		expect(wouldCreateCycle(existing, 'b', 'a')).toBe(true);
	});

	it('should handle empty graph', () => {
		expect(wouldCreateCycle([], 'a', 'b')).toBe(false);
	});
});

describe('detectCycles', () => {
	it('should detect no cycles in DAG', () => {
		const activities = [
			makeActivity({ id: 'a1', planned_start: '2026-03-01', planned_end: '2026-03-06' }),
			makeActivity({ id: 'a2', planned_start: '2026-03-06', planned_end: '2026-03-11' })
		];
		const deps = [makeDep('a1', 'a2')];
		const graph = buildDAG(activities, [], deps);
		const cycles = detectCycles(graph);
		expect(cycles).toHaveLength(0);
	});
});
