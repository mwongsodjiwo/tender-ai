// Unit tests for Sprint R2 — Type shapes and Project interface extension

import { describe, it, expect } from 'vitest';
import type {
	Project,
	ProjectProfile,
	PhaseActivity,
	Correspondence,
	Evaluation,
	KnowledgeBaseTender,
	KnowledgeBaseRequirement,
	RequirementChunk,
	HarvestLog
} from '../../src/lib/types/database';
import type {
	ActivityStatus,
	CorrespondenceStatus,
	EvaluationStatus
} from '../../src/lib/types/enums';

// =============================================================================
// PROJECT INTERFACE EXTENSION
// =============================================================================

describe('Project interface — Sprint R2 extensions', () => {
	it('includes profile_confirmed boolean', () => {
		const project = {
			profile_confirmed: false,
			profile_confirmed_at: null
		} as Partial<Project>;

		expect(typeof project.profile_confirmed).toBe('boolean');
		expect(project.profile_confirmed_at).toBeNull();
	});

	it('allows profile_confirmed_at as string or null', () => {
		const confirmed: Partial<Project> = {
			profile_confirmed: true,
			profile_confirmed_at: '2026-02-09T12:00:00Z'
		};
		expect(typeof confirmed.profile_confirmed_at).toBe('string');

		const unconfirmed: Partial<Project> = {
			profile_confirmed: false,
			profile_confirmed_at: null
		};
		expect(unconfirmed.profile_confirmed_at).toBeNull();
	});
});

// =============================================================================
// PROJECT PROFILE TYPE SHAPE
// =============================================================================

describe('ProjectProfile type shape', () => {
	const mockProfile: ProjectProfile = {
		id: '550e8400-e29b-41d4-a716-446655440000',
		project_id: '660e8400-e29b-41d4-a716-446655440000',
		contracting_authority: 'Gemeente Amsterdam',
		department: 'Inkoopafdeling',
		contact_name: 'Jan de Vries',
		contact_email: 'jan@amsterdam.nl',
		contact_phone: '+31 20 1234567',
		project_goal: 'ICT-diensten aanbesteden',
		scope_description: 'Levering van kantoorapparatuur',
		estimated_value: 500000,
		currency: 'EUR',
		cpv_codes: ['72000000'],
		nuts_codes: ['NL329'],
		timeline_start: '2026-04-01',
		timeline_end: '2027-03-31',
		planning_generated_at: null,
		planning_approved: false,
		planning_approved_at: null,
		planning_approved_by: null,
		planning_metadata: {},
		metadata: {},
		created_at: '2026-02-09T12:00:00Z',
		updated_at: '2026-02-09T12:00:00Z',
		deleted_at: null
	};

	it('has all required fields', () => {
		expect(mockProfile.id).toBeDefined();
		expect(mockProfile.project_id).toBeDefined();
		expect(mockProfile.contracting_authority).toBeDefined();
		expect(mockProfile.department).toBeDefined();
		expect(mockProfile.contact_name).toBeDefined();
		expect(mockProfile.contact_email).toBeDefined();
		expect(mockProfile.contact_phone).toBeDefined();
		expect(mockProfile.project_goal).toBeDefined();
		expect(mockProfile.scope_description).toBeDefined();
		expect(mockProfile.currency).toBeDefined();
		expect(mockProfile.cpv_codes).toBeDefined();
		expect(mockProfile.nuts_codes).toBeDefined();
		expect(mockProfile.metadata).toBeDefined();
		expect(mockProfile.created_at).toBeDefined();
		expect(mockProfile.updated_at).toBeDefined();
	});

	it('has correct types for nullable fields', () => {
		expect(mockProfile.estimated_value).toBe(500000);
		expect(typeof mockProfile.timeline_start).toBe('string');
		expect(mockProfile.deleted_at).toBeNull();
	});

	it('has arrays for cpv_codes and nuts_codes', () => {
		expect(Array.isArray(mockProfile.cpv_codes)).toBe(true);
		expect(Array.isArray(mockProfile.nuts_codes)).toBe(true);
	});
});

// =============================================================================
// PHASE ACTIVITY TYPE SHAPE
// =============================================================================

describe('PhaseActivity type shape', () => {
	const mockActivity: PhaseActivity = {
		id: '550e8400-e29b-41d4-a716-446655440001',
		project_id: '660e8400-e29b-41d4-a716-446655440000',
		phase: 'preparing',
		activity_type: 'briefing',
		title: 'Briefing afnemen',
		description: 'Afnemen van de eerste briefing met stakeholders',
		status: 'not_started',
		sort_order: 0,
		assigned_to: null,
		due_date: null,
		completed_at: null,
		metadata: {},
		created_at: '2026-02-09T12:00:00Z',
		updated_at: '2026-02-09T12:00:00Z',
		deleted_at: null
	};

	it('has all required fields', () => {
		expect(mockActivity.id).toBeDefined();
		expect(mockActivity.project_id).toBeDefined();
		expect(mockActivity.phase).toBeDefined();
		expect(mockActivity.activity_type).toBeDefined();
		expect(mockActivity.title).toBeDefined();
		expect(mockActivity.status).toBeDefined();
	});

	it('phase is a valid ProjectPhase', () => {
		const validPhases = ['preparing', 'exploring', 'specifying', 'tendering', 'contracting'];
		expect(validPhases).toContain(mockActivity.phase);
	});

	it('status is a valid ActivityStatus', () => {
		const validStatuses: ActivityStatus[] = ['not_started', 'in_progress', 'completed', 'skipped'];
		expect(validStatuses).toContain(mockActivity.status);
	});

	it('has nullable fields', () => {
		expect(mockActivity.assigned_to).toBeNull();
		expect(mockActivity.due_date).toBeNull();
		expect(mockActivity.completed_at).toBeNull();
		expect(mockActivity.deleted_at).toBeNull();
	});
});

// =============================================================================
// CORRESPONDENCE TYPE SHAPE
// =============================================================================

describe('Correspondence type shape', () => {
	const mockLetter: Correspondence = {
		id: '550e8400-e29b-41d4-a716-446655440002',
		project_id: '660e8400-e29b-41d4-a716-446655440000',
		phase: 'tendering',
		letter_type: 'afwijzingsbrief',
		recipient: 'Leverancier B.V.',
		subject: 'Afwijzing inschrijving',
		body: 'Geachte heer/mevrouw, ...',
		status: 'draft',
		sent_at: null,
		metadata: {},
		created_by: '770e8400-e29b-41d4-a716-446655440000',
		created_at: '2026-02-09T12:00:00Z',
		updated_at: '2026-02-09T12:00:00Z',
		deleted_at: null
	};

	it('has all required fields', () => {
		expect(mockLetter.id).toBeDefined();
		expect(mockLetter.project_id).toBeDefined();
		expect(mockLetter.phase).toBeDefined();
		expect(mockLetter.letter_type).toBeDefined();
		expect(mockLetter.recipient).toBeDefined();
		expect(mockLetter.subject).toBeDefined();
		expect(mockLetter.body).toBeDefined();
		expect(mockLetter.status).toBeDefined();
	});

	it('status is a valid CorrespondenceStatus', () => {
		const validStatuses: CorrespondenceStatus[] = ['draft', 'ready', 'sent', 'archived'];
		expect(validStatuses).toContain(mockLetter.status);
	});

	it('has nullable fields', () => {
		expect(mockLetter.sent_at).toBeNull();
		expect(mockLetter.deleted_at).toBeNull();
	});
});

// =============================================================================
// EVALUATION TYPE SHAPE
// =============================================================================

describe('Evaluation type shape', () => {
	const mockEvaluation: Evaluation = {
		id: '550e8400-e29b-41d4-a716-446655440003',
		project_id: '660e8400-e29b-41d4-a716-446655440000',
		tenderer_name: 'Acme Solutions B.V.',
		scores: { price: 80, quality: 90 },
		total_score: 85.5,
		ranking: 1,
		status: 'completed',
		notes: 'Beste prijs-kwaliteitverhouding',
		metadata: {},
		created_by: '770e8400-e29b-41d4-a716-446655440000',
		created_at: '2026-02-09T12:00:00Z',
		updated_at: '2026-02-09T12:00:00Z',
		deleted_at: null
	};

	it('has all required fields', () => {
		expect(mockEvaluation.id).toBeDefined();
		expect(mockEvaluation.project_id).toBeDefined();
		expect(mockEvaluation.tenderer_name).toBeDefined();
		expect(mockEvaluation.scores).toBeDefined();
		expect(mockEvaluation.total_score).toBeDefined();
		expect(mockEvaluation.status).toBeDefined();
	});

	it('status is a valid EvaluationStatus', () => {
		const validStatuses: EvaluationStatus[] = ['draft', 'scoring', 'completed', 'published'];
		expect(validStatuses).toContain(mockEvaluation.status);
	});

	it('scores is a record', () => {
		expect(typeof mockEvaluation.scores).toBe('object');
	});

	it('total_score is a number', () => {
		expect(typeof mockEvaluation.total_score).toBe('number');
	});

	it('ranking can be a number or null', () => {
		expect(typeof mockEvaluation.ranking).toBe('number');

		const unranked: Evaluation = { ...mockEvaluation, ranking: null };
		expect(unranked.ranking).toBeNull();
	});
});

// =============================================================================
// KNOWLEDGE BASE TYPE SHAPES
// =============================================================================

describe('KnowledgeBaseTender type shape', () => {
	const mockTender: KnowledgeBaseTender = {
		id: '550e8400-e29b-41d4-a716-446655440004',
		external_id: 'TN-2026-001',
		title: 'ICT-aanbesteding Gemeente Rotterdam',
		description: 'Levering van ICT-diensten',
		contracting_authority: 'Gemeente Rotterdam',
		procedure_type: 'open',
		estimated_value: 1000000,
		currency: 'EUR',
		publication_date: '2026-01-15',
		deadline_date: '2026-03-01',
		cpv_codes: ['72000000'],
		nuts_codes: ['NL33C'],
		source_url: 'https://www.tenderned.nl/aankondigingen/001',
		raw_data: {},
		created_at: '2026-02-09T12:00:00Z',
		updated_at: '2026-02-09T12:00:00Z'
	};

	it('has all required fields', () => {
		expect(mockTender.id).toBeDefined();
		expect(mockTender.external_id).toBeDefined();
		expect(mockTender.title).toBeDefined();
		expect(mockTender.cpv_codes).toBeDefined();
		expect(mockTender.nuts_codes).toBeDefined();
	});

	it('has arrays for codes', () => {
		expect(Array.isArray(mockTender.cpv_codes)).toBe(true);
		expect(Array.isArray(mockTender.nuts_codes)).toBe(true);
	});

	it('has nullable fields', () => {
		const minimal: KnowledgeBaseTender = {
			...mockTender,
			description: null,
			contracting_authority: null,
			procedure_type: null,
			estimated_value: null,
			currency: null,
			publication_date: null,
			deadline_date: null,
			source_url: null
		};
		expect(minimal.description).toBeNull();
		expect(minimal.contracting_authority).toBeNull();
	});
});

describe('KnowledgeBaseRequirement type shape', () => {
	const mockReq: KnowledgeBaseRequirement = {
		id: '550e8400-e29b-41d4-a716-446655440005',
		tender_id: '550e8400-e29b-41d4-a716-446655440004',
		requirement_text: 'De leverancier moet ISO 27001 gecertificeerd zijn.',
		category: 'security',
		source_section: 'Paragraaf 3.2',
		metadata: {},
		created_at: '2026-02-09T12:00:00Z'
	};

	it('has all required fields', () => {
		expect(mockReq.id).toBeDefined();
		expect(mockReq.tender_id).toBeDefined();
		expect(mockReq.requirement_text).toBeDefined();
	});

	it('has nullable category and source_section', () => {
		const minimal: KnowledgeBaseRequirement = {
			...mockReq,
			category: null,
			source_section: null
		};
		expect(minimal.category).toBeNull();
		expect(minimal.source_section).toBeNull();
	});
});

describe('RequirementChunk type shape', () => {
	const mockChunk: RequirementChunk = {
		id: '550e8400-e29b-41d4-a716-446655440006',
		requirement_id: '550e8400-e29b-41d4-a716-446655440005',
		chunk_index: 0,
		content: 'De leverancier moet ISO 27001 gecertificeerd zijn.',
		token_count: 12,
		metadata: {},
		created_at: '2026-02-09T12:00:00Z'
	};

	it('has all required fields', () => {
		expect(mockChunk.id).toBeDefined();
		expect(mockChunk.requirement_id).toBeDefined();
		expect(mockChunk.chunk_index).toBeDefined();
		expect(mockChunk.content).toBeDefined();
	});

	it('token_count can be number or null', () => {
		expect(typeof mockChunk.token_count).toBe('number');
		const noCount: RequirementChunk = { ...mockChunk, token_count: null };
		expect(noCount.token_count).toBeNull();
	});
});

describe('HarvestLog type shape', () => {
	const mockLog: HarvestLog = {
		id: '550e8400-e29b-41d4-a716-446655440007',
		source: 'tenderned',
		started_at: '2026-02-09T12:00:00Z',
		finished_at: '2026-02-09T12:05:00Z',
		records_fetched: 100,
		records_inserted: 95,
		records_updated: 5,
		errors: [],
		metadata: {},
		created_at: '2026-02-09T12:00:00Z'
	};

	it('has all required fields', () => {
		expect(mockLog.id).toBeDefined();
		expect(mockLog.source).toBeDefined();
		expect(mockLog.started_at).toBeDefined();
		expect(mockLog.records_fetched).toBeDefined();
		expect(mockLog.records_inserted).toBeDefined();
		expect(mockLog.records_updated).toBeDefined();
	});

	it('finished_at can be string or null', () => {
		expect(typeof mockLog.finished_at).toBe('string');
		const running: HarvestLog = { ...mockLog, finished_at: null };
		expect(running.finished_at).toBeNull();
	});

	it('errors is an array', () => {
		expect(Array.isArray(mockLog.errors)).toBe(true);
	});
});
