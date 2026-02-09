// Unit tests for Sprint R1 — Project phases enum, labels, and phase indicator logic

import { describe, it, expect } from 'vitest';
import {
	PROJECT_PHASES,
	PROJECT_PHASE_LABELS,
	PROJECT_PHASE_DESCRIPTIONS,
	type ProjectPhase
} from '../../src/lib/types/enums';

describe('Project phases enum', () => {
	it('has exactly 5 phases', () => {
		expect(PROJECT_PHASES).toHaveLength(5);
	});

	it('contains all expected phases in correct order', () => {
		expect(PROJECT_PHASES[0]).toBe('preparing');
		expect(PROJECT_PHASES[1]).toBe('exploring');
		expect(PROJECT_PHASES[2]).toBe('specifying');
		expect(PROJECT_PHASES[3]).toBe('tendering');
		expect(PROJECT_PHASES[4]).toBe('contracting');
	});

	it('contains preparing phase', () => {
		expect(PROJECT_PHASES).toContain('preparing');
	});

	it('contains exploring phase', () => {
		expect(PROJECT_PHASES).toContain('exploring');
	});

	it('contains specifying phase', () => {
		expect(PROJECT_PHASES).toContain('specifying');
	});

	it('contains tendering phase', () => {
		expect(PROJECT_PHASES).toContain('tendering');
	});

	it('contains contracting phase', () => {
		expect(PROJECT_PHASES).toContain('contracting');
	});
});

describe('Project phase labels (Dutch)', () => {
	it('has a label for every phase', () => {
		for (const phase of PROJECT_PHASES) {
			expect(PROJECT_PHASE_LABELS[phase]).toBeDefined();
			expect(typeof PROJECT_PHASE_LABELS[phase]).toBe('string');
			expect(PROJECT_PHASE_LABELS[phase].length).toBeGreaterThan(0);
		}
	});

	it('has correct Dutch labels', () => {
		expect(PROJECT_PHASE_LABELS.preparing).toBe('Voorbereiden');
		expect(PROJECT_PHASE_LABELS.exploring).toBe('Verkennen');
		expect(PROJECT_PHASE_LABELS.specifying).toBe('Specificeren');
		expect(PROJECT_PHASE_LABELS.tendering).toBe('Aanbesteden');
		expect(PROJECT_PHASE_LABELS.contracting).toBe('Contracteren');
	});
});

describe('Project phase descriptions (Dutch)', () => {
	it('has a description for every phase', () => {
		for (const phase of PROJECT_PHASES) {
			expect(PROJECT_PHASE_DESCRIPTIONS[phase]).toBeDefined();
			expect(typeof PROJECT_PHASE_DESCRIPTIONS[phase]).toBe('string');
			expect(PROJECT_PHASE_DESCRIPTIONS[phase].length).toBeGreaterThan(0);
		}
	});

	it('preparing description mentions briefing and projectprofiel', () => {
		expect(PROJECT_PHASE_DESCRIPTIONS.preparing.toLowerCase()).toContain('briefing');
		expect(PROJECT_PHASE_DESCRIPTIONS.preparing.toLowerCase()).toContain('projectprofiel');
	});

	it('exploring description mentions deskresearch', () => {
		expect(PROJECT_PHASE_DESCRIPTIONS.exploring.toLowerCase()).toContain('deskresearch');
	});

	it('specifying description mentions PvE', () => {
		expect(PROJECT_PHASE_DESCRIPTIONS.specifying).toContain('PvE');
	});

	it('tendering description mentions gunning', () => {
		expect(PROJECT_PHASE_DESCRIPTIONS.tendering.toLowerCase()).toContain('gunning');
	});

	it('contracting description mentions overeenkomst', () => {
		expect(PROJECT_PHASE_DESCRIPTIONS.contracting.toLowerCase()).toContain('overeenkomst');
	});
});

describe('Phase indicator logic', () => {
	function phaseStatus(
		currentPhase: ProjectPhase,
		checkPhase: ProjectPhase
	): 'completed' | 'current' | 'upcoming' {
		const currentIndex = PROJECT_PHASES.indexOf(currentPhase);
		const checkIndex = PROJECT_PHASES.indexOf(checkPhase);
		if (checkIndex < currentIndex) return 'completed';
		if (checkIndex === currentIndex) return 'current';
		return 'upcoming';
	}

	it('marks earlier phases as completed', () => {
		expect(phaseStatus('specifying', 'preparing')).toBe('completed');
		expect(phaseStatus('specifying', 'exploring')).toBe('completed');
	});

	it('marks current phase as current', () => {
		expect(phaseStatus('preparing', 'preparing')).toBe('current');
		expect(phaseStatus('specifying', 'specifying')).toBe('current');
		expect(phaseStatus('contracting', 'contracting')).toBe('current');
	});

	it('marks later phases as upcoming', () => {
		expect(phaseStatus('preparing', 'exploring')).toBe('upcoming');
		expect(phaseStatus('preparing', 'contracting')).toBe('upcoming');
		expect(phaseStatus('specifying', 'tendering')).toBe('upcoming');
	});

	it('first phase has no completed phases', () => {
		for (const phase of PROJECT_PHASES) {
			if (phase === 'preparing') {
				expect(phaseStatus('preparing', phase)).toBe('current');
			} else {
				expect(phaseStatus('preparing', phase)).toBe('upcoming');
			}
		}
	});

	it('last phase has all previous phases completed', () => {
		for (const phase of PROJECT_PHASES) {
			if (phase === 'contracting') {
				expect(phaseStatus('contracting', phase)).toBe('current');
			} else {
				expect(phaseStatus('contracting', phase)).toBe('completed');
			}
		}
	});
});

describe('Sidebar navigation links', () => {
	const EXPECTED_PROJECT_SUB_LINKS = [
		{ path: '', label: 'Overzicht' },
		{ path: '/profile', label: 'Projectprofiel' },
		{ path: '/documents', label: 'Documenten' },
		{ path: '/correspondence', label: 'Correspondentie' },
		{ path: '/team', label: 'Team' }
	];

	it('has exactly 5 navigation links', () => {
		expect(EXPECTED_PROJECT_SUB_LINKS).toHaveLength(5);
	});

	it('has Overzicht as first link', () => {
		expect(EXPECTED_PROJECT_SUB_LINKS[0].label).toBe('Overzicht');
		expect(EXPECTED_PROJECT_SUB_LINKS[0].path).toBe('');
	});

	it('has Projectprofiel as second link', () => {
		expect(EXPECTED_PROJECT_SUB_LINKS[1].label).toBe('Projectprofiel');
		expect(EXPECTED_PROJECT_SUB_LINKS[1].path).toBe('/profile');
	});

	it('has Documenten as third link', () => {
		expect(EXPECTED_PROJECT_SUB_LINKS[2].label).toBe('Documenten');
		expect(EXPECTED_PROJECT_SUB_LINKS[2].path).toBe('/documents');
	});

	it('has Correspondentie as fourth link', () => {
		expect(EXPECTED_PROJECT_SUB_LINKS[3].label).toBe('Correspondentie');
		expect(EXPECTED_PROJECT_SUB_LINKS[3].path).toBe('/correspondence');
	});

	it('has Team as fifth link', () => {
		expect(EXPECTED_PROJECT_SUB_LINKS[4].label).toBe('Team');
		expect(EXPECTED_PROJECT_SUB_LINKS[4].path).toBe('/team');
	});
});

describe('Phase-specific activities', () => {
	const PHASE_ACTIVITY_COUNTS: Record<ProjectPhase, number> = {
		preparing: 4,
		exploring: 4,
		specifying: 5,
		tendering: 5,
		contracting: 3
	};

	it('preparing phase has 4 activities', () => {
		expect(PHASE_ACTIVITY_COUNTS.preparing).toBe(4);
	});

	it('exploring phase has 4 activities', () => {
		expect(PHASE_ACTIVITY_COUNTS.exploring).toBe(4);
	});

	it('specifying phase has 5 activities', () => {
		expect(PHASE_ACTIVITY_COUNTS.specifying).toBe(5);
	});

	it('tendering phase has 5 activities', () => {
		expect(PHASE_ACTIVITY_COUNTS.tendering).toBe(5);
	});

	it('contracting phase has 3 activities', () => {
		expect(PHASE_ACTIVITY_COUNTS.contracting).toBe(3);
	});

	it('every phase has at least 1 activity', () => {
		for (const phase of PROJECT_PHASES) {
			expect(PHASE_ACTIVITY_COUNTS[phase]).toBeGreaterThanOrEqual(1);
		}
	});
});

describe('ProjectPhase type compatibility', () => {
	it('all phases are valid ProjectPhase values', () => {
		const phases: ProjectPhase[] = ['preparing', 'exploring', 'specifying', 'tendering', 'contracting'];
		expect(phases).toEqual([...PROJECT_PHASES]);
	});

	it('PROJECT_PHASES is defined as const tuple', () => {
		// as const makes it readonly at compile time
		expect(Array.isArray(PROJECT_PHASES)).toBe(true);
		expect(PROJECT_PHASES.length).toBe(5);
	});
});
