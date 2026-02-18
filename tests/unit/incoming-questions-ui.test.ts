// Unit tests for Fase 10 — Incoming questions UI file verification

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const COMPONENT_DIR = 'src/lib/components/questions';

// =============================================================================
// QUESTIONS PAGE SERVER LOAD
// =============================================================================

describe('Questions page server load', () => {
	const filePath = path.resolve(
		'src/routes/(app)/projects/[id]/questions/+page.server.ts'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports load function', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const load');
	});

	it('queries incoming_questions table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("from('incoming_questions')");
	});

	it('filters by project_id', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('project_id');
	});

	it('orders by question_number', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('question_number');
	});

	it('returns loadError', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('loadError');
	});
});

// =============================================================================
// QUESTIONS PAGE TEMPLATE
// =============================================================================

describe('Questions page template', () => {
	const filePath = path.resolve(
		'src/routes/(app)/projects/[id]/questions/+page.svelte'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('imports QuestionList component', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('QuestionList');
	});

	it('imports NewQuestionForm component', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('NewQuestionForm');
	});

	it('imports FilterBar component', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('FilterBar');
	});

	it('imports EmptyState component', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('EmptyState');
	});

	it('has page title', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('<title>Binnenkomende vragen');
	});

	it('has status filter', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('statusFilter');
		expect(source).toContain('QUESTION_STATUSES');
	});

	it('has new question button', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Nieuwe vraag');
	});

	it('handles empty state', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Nog geen vragen');
	});

	it('handles no filter results', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Geen resultaten');
	});

	it('handles load error state', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('loadError');
	});

	it('handles error message state', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('errorMessage');
	});

	it('calls answer API', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('handleAnswer');
		expect(source).toContain('answer_text');
	});

	it('calls approve API', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('handleApprove');
		expect(source).toContain('/approve');
	});

	it('calls status change API', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('handleStatusChange');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// QUESTION LIST COMPONENT
// =============================================================================

describe('QuestionList component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/QuestionList.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('shows question number', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('question_number');
	});

	it('shows status badge', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('StatusBadge');
	});

	it('shows rectification badge', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Rectificatie');
		expect(source).toContain('is_rectification');
	});

	it('has inline answering textarea', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('textarea');
		expect(source).toContain('answerDraft');
	});

	it('has approve button', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Goedkeuren');
		expect(source).toContain('onApprove');
	});

	it('has in_review status button', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('In behandeling');
		expect(source).toContain('onStatusChange');
	});

	it('has save answer button', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Antwoord opslaan');
	});

	it('has expand/collapse per question', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('expandedId');
		expect(source).toContain('toggleExpand');
	});

	it('shows reference document', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('reference_document');
	});

	it('has accessibility attributes', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('aria-expanded');
		expect(source).toContain('aria-label');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// NEW QUESTION FORM COMPONENT
// =============================================================================

describe('NewQuestionForm component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/NewQuestionForm.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('has question text field', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('questionText');
		expect(source).toContain('Vraagtekst');
	});

	it('has reference document field', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('referenceDocument');
		expect(source).toContain('Documentreferentie');
	});

	it('has rectification checkbox', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('isRectification');
		expect(source).toContain('rectificatie');
	});

	it('shows rectification text when checked', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('rectificationText');
		expect(source).toContain('Rectificatietekst');
	});

	it('has submit button', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Vraag registreren');
	});

	it('has cancel button', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Annuleren');
	});

	it('has form labels', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('label');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// STATUSBADGE UPDATE
// =============================================================================

describe('StatusBadge supports question statuses', () => {
	const source = readFileSync(
		path.resolve('src/lib/components/StatusBadge.svelte'), 'utf-8'
	);

	it('has received status', () => {
		expect(source).toContain('received');
		expect(source).toContain('Ontvangen');
	});

	it('has in_review status', () => {
		expect(source).toContain('in_review');
		expect(source).toContain('In behandeling');
	});

	it('has answered status', () => {
		expect(source).toContain('answered');
		expect(source).toContain('Beantwoord');
	});
});
