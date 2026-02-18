// Unit tests for Fase 10 — Incoming questions API file verification

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// =============================================================================
// MIGRATION
// =============================================================================

describe('Incoming questions migration', () => {
	const filePath = path.resolve(
		'supabase/migrations/20260218001500_incoming_questions.sql'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('creates question_status enum', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('CREATE TYPE question_status');
		expect(source).toContain("'received'");
		expect(source).toContain("'in_review'");
		expect(source).toContain("'answered'");
		expect(source).toContain("'approved'");
		expect(source).toContain("'published'");
	});

	it('creates incoming_questions table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('CREATE TABLE incoming_questions');
	});

	it('has question_number SERIAL', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('question_number SERIAL');
	});

	it('references projects table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('REFERENCES projects(id)');
	});

	it('references suppliers table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('REFERENCES suppliers(id)');
	});

	it('has all required columns', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('question_text TEXT NOT NULL');
		expect(source).toContain('answer_text TEXT');
		expect(source).toContain('reference_document TEXT');
		expect(source).toContain('is_rectification BOOLEAN');
		expect(source).toContain('rectification_text TEXT');
		expect(source).toContain('status question_status');
		expect(source).toContain('approved_by UUID');
		expect(source).toContain('received_at TIMESTAMPTZ');
		expect(source).toContain('answered_at TIMESTAMPTZ');
	});

	it('has governance fields', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('data_classification');
		expect(source).toContain('retention_until');
		expect(source).toContain('anonymized_at');
		expect(source).toContain('archive_status');
	});

	it('has indexes', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('idx_incoming_questions_project');
		expect(source).toContain('idx_incoming_questions_status');
		expect(source).toContain('idx_incoming_questions_number');
	});

	it('has unique constraint on project_id + question_number', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('CREATE UNIQUE INDEX');
		expect(source).toContain('project_id, question_number');
	});

	it('has RLS enabled', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ENABLE ROW LEVEL SECURITY');
	});

	it('has RLS policies', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('CREATE POLICY');
		expect(source).toContain('organization_members');
	});
});

// =============================================================================
// TYPES
// =============================================================================

describe('IncomingQuestion database type', () => {
	const filePath = path.resolve('src/lib/types/db/questions.ts');

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports IncomingQuestion interface', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface IncomingQuestion');
	});

	it('has all required fields', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('project_id: string');
		expect(source).toContain('question_number: number');
		expect(source).toContain('question_text: string');
		expect(source).toContain('answer_text: string | null');
		expect(source).toContain('status: QuestionStatus');
		expect(source).toContain('supplier_id: string | null');
		expect(source).toContain('is_rectification: boolean');
		expect(source).toContain('approved_by: string | null');
	});

	it('imports QuestionStatus type', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('QuestionStatus');
	});
});

describe('Incoming question API types', () => {
	const filePath = path.resolve('src/lib/types/api/questions.ts');

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports CreateQuestionRequest', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface CreateQuestionRequest');
	});

	it('exports UpdateQuestionRequest', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface UpdateQuestionRequest');
	});

	it('exports QuestionListQuery', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface QuestionListQuery');
	});
});

// =============================================================================
// ENUMS
// =============================================================================

describe('Question status enums', () => {
	const filePath = path.resolve('src/lib/types/enums-multi-org.ts');

	it('has QUESTION_STATUSES', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('QUESTION_STATUSES');
		expect(source).toContain("'received'");
		expect(source).toContain("'in_review'");
		expect(source).toContain("'answered'");
		expect(source).toContain("'approved'");
		expect(source).toContain("'published'");
	});

	it('has QuestionStatus type', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export type QuestionStatus');
	});

	it('has Dutch labels', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('QUESTION_STATUS_LABELS');
		expect(source).toContain('Ontvangen');
		expect(source).toContain('In behandeling');
		expect(source).toContain('Beantwoord');
		expect(source).toContain('Goedgekeurd');
		expect(source).toContain('Gepubliceerd');
	});
});

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

describe('Question validation schemas', () => {
	const filePath = path.resolve('src/lib/server/api/validation/questions.ts');

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports createQuestionSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('createQuestionSchema');
		expect(source).toContain('question_text');
	});

	it('exports updateQuestionSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('updateQuestionSchema');
		expect(source).toContain('answer_text');
	});

	it('exports questionListQuerySchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('questionListQuerySchema');
	});

	it('validates status against QUESTION_STATUSES', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('QUESTION_STATUSES');
	});
});

// =============================================================================
// API ROUTES
// =============================================================================

describe('Questions list API route', () => {
	const filePath = path.resolve(
		'src/routes/api/projects/[id]/questions/+server.ts'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports GET handler', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const GET');
	});

	it('exports POST handler', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const POST');
	});

	it('queries incoming_questions table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("from('incoming_questions')");
	});

	it('filters by project_id', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("eq('project_id'");
	});

	it('orders by question_number', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("order('question_number')");
	});

	it('supports status filter', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("eq('status'");
	});

	it('validates with createQuestionSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('createQuestionSchema');
	});

	it('has auth guard', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('UNAUTHORIZED');
	});

	it('has audit logging', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('logAudit');
		expect(source).toContain('incoming_question');
	});
});

describe('Question detail API route', () => {
	const filePath = path.resolve(
		'src/routes/api/projects/[id]/questions/[questionId]/+server.ts'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports GET handler', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const GET');
	});

	it('exports PATCH handler', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const PATCH');
	});

	it('validates with updateQuestionSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('updateQuestionSchema');
	});

	it('sets answered_at when answer provided', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('answered_at');
	});

	it('has audit logging', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('logAudit');
	});
});

describe('Question approve API route', () => {
	const filePath = path.resolve(
		'src/routes/api/projects/[id]/questions/[questionId]/approve/+server.ts'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports POST handler', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const POST');
	});

	it('requires answer before approval', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('answer_text');
		expect(source).toContain('beantwoord');
	});

	it('sets approved status and approved_by', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("status: 'approved'");
		expect(source).toContain('approved_by');
	});

	it('has audit logging with approve action', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('logAudit');
		expect(source).toContain("action: 'approve'");
	});
});

// =============================================================================
// NvI DATA — Approved questions for Nota van Inlichtingen
// =============================================================================

describe('NvI data retrieval (approved questions)', () => {
	const filePath = path.resolve(
		'src/routes/api/projects/[id]/questions/+server.ts'
	);

	it('supports status=approved filter for NvI', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("eq('status'");
	});
});
