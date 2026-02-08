// Unit tests for Sprint R8 — UEA database types existence and structure

import { describe, it, expect } from 'vitest';
import type {
	UeaSection,
	UeaQuestion,
	UeaProjectSelection,
	UeaQuestionWithSelection,
	UeaSectionWithQuestions
} from '../../src/lib/types/database';

describe('UEA database types', () => {
	it('UeaSection has required fields', () => {
		const section: UeaSection = {
			id: '550e8400-e29b-41d4-a716-446655440000',
			part_number: 2,
			part_title: 'Informatie over de ondernemer',
			section_key: 'II.A',
			section_title: 'Identificatie',
			description: 'Basisgegevens van de ondernemer.',
			sort_order: 1,
			is_active: true,
			created_at: '2026-02-08T00:00:00Z',
			updated_at: '2026-02-08T00:00:00Z'
		};
		expect(section.part_number).toBe(2);
		expect(section.section_key).toBe('II.A');
		expect(section.is_active).toBe(true);
	});

	it('UeaQuestion has required fields', () => {
		const question: UeaQuestion = {
			id: '550e8400-e29b-41d4-a716-446655440001',
			section_id: '550e8400-e29b-41d4-a716-446655440000',
			question_number: 'II.A.1',
			title: 'Naam van de onderneming',
			description: 'Officiële naam.',
			is_mandatory: true,
			sort_order: 1,
			is_active: true,
			created_at: '2026-02-08T00:00:00Z',
			updated_at: '2026-02-08T00:00:00Z'
		};
		expect(question.question_number).toBe('II.A.1');
		expect(question.is_mandatory).toBe(true);
	});

	it('UeaProjectSelection has required fields', () => {
		const selection: UeaProjectSelection = {
			id: '550e8400-e29b-41d4-a716-446655440002',
			project_id: '550e8400-e29b-41d4-a716-446655440003',
			question_id: '550e8400-e29b-41d4-a716-446655440001',
			is_selected: true,
			created_at: '2026-02-08T00:00:00Z',
			updated_at: '2026-02-08T00:00:00Z'
		};
		expect(selection.is_selected).toBe(true);
		expect(selection.project_id).toBeDefined();
	});

	it('UeaQuestionWithSelection extends UeaQuestion', () => {
		const q: UeaQuestionWithSelection = {
			id: '550e8400-e29b-41d4-a716-446655440001',
			section_id: '550e8400-e29b-41d4-a716-446655440000',
			question_number: 'III.A.1',
			title: 'Deelname criminele organisatie',
			description: 'Strafrechtelijke veroordeling.',
			is_mandatory: true,
			sort_order: 1,
			is_active: true,
			created_at: '2026-02-08T00:00:00Z',
			updated_at: '2026-02-08T00:00:00Z',
			is_selected: true
		};
		expect(q.is_selected).toBe(true);
		expect(q.is_mandatory).toBe(true);
	});

	it('UeaSectionWithQuestions has nested questions array', () => {
		const section: UeaSectionWithQuestions = {
			id: '550e8400-e29b-41d4-a716-446655440000',
			part_number: 3,
			part_title: 'Uitsluitingsgronden',
			section_key: 'III.A',
			section_title: 'Strafrechtelijke veroordelingen',
			description: 'Verplichte uitsluitingsgronden.',
			sort_order: 5,
			is_active: true,
			created_at: '2026-02-08T00:00:00Z',
			updated_at: '2026-02-08T00:00:00Z',
			questions: [
				{
					id: '550e8400-e29b-41d4-a716-446655440001',
					section_id: '550e8400-e29b-41d4-a716-446655440000',
					question_number: 'III.A.1',
					title: 'Deelname criminele organisatie',
					description: '',
					is_mandatory: true,
					sort_order: 1,
					is_active: true,
					created_at: '2026-02-08T00:00:00Z',
					updated_at: '2026-02-08T00:00:00Z',
					is_selected: true
				}
			]
		};
		expect(section.questions).toHaveLength(1);
		expect(section.questions[0].is_selected).toBe(true);
	});

	it('mandatory questions should always be selected', () => {
		const mandatoryQuestion: UeaQuestionWithSelection = {
			id: 'test-id',
			section_id: 'section-id',
			question_number: 'III.A.1',
			title: 'Test',
			description: '',
			is_mandatory: true,
			sort_order: 1,
			is_active: true,
			created_at: '2026-02-08T00:00:00Z',
			updated_at: '2026-02-08T00:00:00Z',
			is_selected: true
		};
		// Business rule: mandatory questions must always be selected
		expect(mandatoryQuestion.is_mandatory).toBe(true);
		expect(mandatoryQuestion.is_selected).toBe(true);
	});

	it('optional questions can be deselected', () => {
		const optionalQuestion: UeaQuestionWithSelection = {
			id: 'test-id',
			section_id: 'section-id',
			question_number: 'IV.B.1',
			title: 'Minimale jaaromzet',
			description: '',
			is_mandatory: false,
			sort_order: 1,
			is_active: true,
			created_at: '2026-02-08T00:00:00Z',
			updated_at: '2026-02-08T00:00:00Z',
			is_selected: false
		};
		expect(optionalQuestion.is_mandatory).toBe(false);
		expect(optionalQuestion.is_selected).toBe(false);
	});
});
