// Unit tests: Template selector logic (Fase 18)
// Tests selectTemplate fallback chain and listAvailableTemplates

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	selectTemplate,
	listAvailableTemplates,
	type TemplateSelectionParams,
	type TemplateSelectionResult
} from '../../src/lib/server/templates/template-selector';

// =============================================================================
// MOCK SUPABASE CLIENT
// =============================================================================

interface MockQuery {
	selectFn: ReturnType<typeof vi.fn>;
	fromFn: ReturnType<typeof vi.fn>;
	eqCalls: Array<[string, unknown]>;
	isCalls: Array<[string, unknown]>;
	orderCalls: Array<[string, { ascending: boolean }]>;
	limitFn: ReturnType<typeof vi.fn>;
	singleFn: ReturnType<typeof vi.fn>;
	resolvedData: unknown;
	resolvedError: unknown;
}

function createMockTemplate(overrides: Record<string, unknown> = {}) {
	return {
		id: 'tpl-001',
		organization_id: 'org-001',
		document_type_id: 'dt-001',
		category_type: null,
		name: 'Standard Template',
		description: null,
		file_path: 'org-001/dt-001/template.docx',
		file_size: 1024,
		is_default: false,
		placeholders: ['org_name', 'project_name'],
		created_by: 'user-001',
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		deleted_at: null,
		...overrides
	};
}

function createMockSupabase(queryResults: Array<{ data: unknown; error: unknown }>) {
	let callIndex = 0;

	const buildChain = () => {
		const result = queryResults[callIndex] ?? { data: null, error: null };
		callIndex++;

		const chain: Record<string, unknown> = {};
		chain.select = vi.fn().mockReturnValue(chain);
		chain.eq = vi.fn().mockReturnValue(chain);
		chain.is = vi.fn().mockReturnValue(chain);
		chain.order = vi.fn().mockReturnValue(chain);
		chain.limit = vi.fn().mockReturnValue(chain);
		chain.single = vi.fn().mockResolvedValue(result);

		// For listAvailableTemplates (no .single(), returns array)
		if (result.data && Array.isArray(result.data)) {
			chain.order = vi.fn().mockReturnValue({
				...chain,
				order: vi.fn().mockResolvedValue(result)
			});
		}

		return chain;
	};

	return {
		from: vi.fn().mockImplementation(() => buildChain())
	};
}

// Simple mock that returns specific data per call index
function createSequentialMock(results: Array<{ data: unknown; error: unknown }>) {
	let callIdx = 0;

	return {
		from: vi.fn().mockImplementation(() => {
			const idx = callIdx;
			callIdx++;
			const result = results[idx] ?? { data: null, error: null };

			const chain: Record<string, unknown> = {};
			chain.select = vi.fn().mockReturnValue(chain);
			chain.eq = vi.fn().mockReturnValue(chain);
			chain.is = vi.fn().mockReturnValue(chain);
			chain.order = vi.fn().mockReturnValue(chain);
			chain.limit = vi.fn().mockReturnValue(chain);
			chain.single = vi.fn().mockResolvedValue(result);
			return chain;
		})
	};
}

// =============================================================================
// TEST: selectTemplate
// =============================================================================

describe('selectTemplate', () => {
	const ORG_ID = 'org-001';
	const DOC_TYPE_ID = 'dt-001';
	const CATEGORY = 'diensten' as const;

	it('should return exact match when org + type + category matches', async () => {
		const template = createMockTemplate({ category_type: CATEGORY });
		const supabase = createSequentialMock([
			{ data: template, error: null }
		]);

		const result = await selectTemplate(supabase as never, {
			organizationId: ORG_ID,
			documentTypeId: DOC_TYPE_ID,
			categoryType: CATEGORY
		});

		expect(result.template).not.toBeNull();
		expect(result.matchType).toBe('exact');
		expect(result.template?.id).toBe('tpl-001');
	});

	it('should fall back to type-only match when exact match fails', async () => {
		const template = createMockTemplate({ category_type: null });
		const supabase = createSequentialMock([
			{ data: null, error: { message: 'not found' } },
			{ data: template, error: null }
		]);

		const result = await selectTemplate(supabase as never, {
			organizationId: ORG_ID,
			documentTypeId: DOC_TYPE_ID,
			categoryType: CATEGORY
		});

		expect(result.template).not.toBeNull();
		expect(result.matchType).toBe('type_only');
	});

	it('should fall back to default template when type match fails', async () => {
		const defaultTemplate = createMockTemplate({ is_default: true });
		const supabase = createSequentialMock([
			{ data: null, error: { message: 'not found' } },
			{ data: null, error: { message: 'not found' } },
			{ data: defaultTemplate, error: null }
		]);

		const result = await selectTemplate(supabase as never, {
			organizationId: ORG_ID,
			documentTypeId: DOC_TYPE_ID,
			categoryType: CATEGORY
		});

		expect(result.template).not.toBeNull();
		expect(result.matchType).toBe('default');
		expect(result.template?.is_default).toBe(true);
	});

	it('should return none when no templates exist', async () => {
		const supabase = createSequentialMock([
			{ data: null, error: { message: 'not found' } },
			{ data: null, error: { message: 'not found' } },
			{ data: null, error: { message: 'not found' } }
		]);

		const result = await selectTemplate(supabase as never, {
			organizationId: ORG_ID,
			documentTypeId: DOC_TYPE_ID,
			categoryType: CATEGORY
		});

		expect(result.template).toBeNull();
		expect(result.matchType).toBe('none');
	});

	it('should skip exact match when no categoryType provided', async () => {
		const template = createMockTemplate();
		const supabase = createSequentialMock([
			{ data: template, error: null }
		]);

		const result = await selectTemplate(supabase as never, {
			organizationId: ORG_ID,
			documentTypeId: DOC_TYPE_ID
		});

		// Without categoryType, first call is findTypeMatch (not exact)
		expect(result.template).not.toBeNull();
		expect(result.matchType).toBe('type_only');
	});

	it('should return none when no categoryType and no type match', async () => {
		const supabase = createSequentialMock([
			{ data: null, error: { message: 'not found' } },
			{ data: null, error: { message: 'not found' } }
		]);

		const result = await selectTemplate(supabase as never, {
			organizationId: ORG_ID,
			documentTypeId: DOC_TYPE_ID
		});

		expect(result.template).toBeNull();
		expect(result.matchType).toBe('none');
	});
});

// =============================================================================
// TEST: listAvailableTemplates
// =============================================================================

describe('listAvailableTemplates', () => {
	it('should return templates sorted by default first', async () => {
		const templates = [
			createMockTemplate({ id: 'tpl-002', name: 'B Template', is_default: false }),
			createMockTemplate({ id: 'tpl-001', name: 'A Template', is_default: true })
		];

		const chain: Record<string, unknown> = {};
		chain.select = vi.fn().mockReturnValue(chain);
		chain.eq = vi.fn().mockReturnValue(chain);
		chain.is = vi.fn().mockReturnValue(chain);
		chain.order = vi.fn().mockReturnValue(chain);

		// Last order call resolves
		let orderCount = 0;
		chain.order = vi.fn().mockImplementation(() => {
			orderCount++;
			if (orderCount >= 2) {
				return Promise.resolve({ data: templates, error: null });
			}
			return chain;
		});

		const supabase = { from: vi.fn().mockReturnValue(chain) };

		const result = await listAvailableTemplates(
			supabase as never,
			'org-001',
			'dt-001'
		);

		expect(result).toHaveLength(2);
	});

	it('should return empty array on error', async () => {
		const chain: Record<string, unknown> = {};
		chain.select = vi.fn().mockReturnValue(chain);
		chain.eq = vi.fn().mockReturnValue(chain);
		chain.is = vi.fn().mockReturnValue(chain);

		let orderCount = 0;
		chain.order = vi.fn().mockImplementation(() => {
			orderCount++;
			if (orderCount >= 2) {
				return Promise.resolve({ data: null, error: { message: 'db error' } });
			}
			return chain;
		});

		const supabase = { from: vi.fn().mockReturnValue(chain) };

		const result = await listAvailableTemplates(
			supabase as never,
			'org-001',
			'dt-001'
		);

		expect(result).toEqual([]);
	});

	it('should return empty array when no templates found', async () => {
		const chain: Record<string, unknown> = {};
		chain.select = vi.fn().mockReturnValue(chain);
		chain.eq = vi.fn().mockReturnValue(chain);
		chain.is = vi.fn().mockReturnValue(chain);

		let orderCount = 0;
		chain.order = vi.fn().mockImplementation(() => {
			orderCount++;
			if (orderCount >= 2) {
				return Promise.resolve({ data: [], error: null });
			}
			return chain;
		});

		const supabase = { from: vi.fn().mockReturnValue(chain) };

		const result = await listAvailableTemplates(
			supabase as never,
			'org-001',
			'dt-001'
		);

		expect(result).toEqual([]);
	});
});

// =============================================================================
// TEST: TemplateSelectionResult types
// =============================================================================

describe('TemplateSelectionResult', () => {
	it('should have correct matchType values', () => {
		const results: TemplateSelectionResult[] = [
			{ template: createMockTemplate() as never, matchType: 'exact' },
			{ template: createMockTemplate() as never, matchType: 'type_only' },
			{ template: createMockTemplate() as never, matchType: 'default' },
			{ template: null, matchType: 'none' }
		];

		expect(results[0].matchType).toBe('exact');
		expect(results[1].matchType).toBe('type_only');
		expect(results[2].matchType).toBe('default');
		expect(results[3].matchType).toBe('none');
		expect(results[3].template).toBeNull();
	});
});

// =============================================================================
// TEST: Export schema with template_id
// =============================================================================

describe('exportDocumentSchema with template_id', () => {
	// Import the updated schema
	it('should accept optional template_id', async () => {
		const { exportDocumentSchema } = await import(
			'../../src/lib/server/api/validation'
		);

		const result = exportDocumentSchema.safeParse({
			document_type_id: '550e8400-e29b-41d4-a716-446655440000',
			format: 'docx',
			template_id: '660e8400-e29b-41d4-a716-446655440000'
		});

		expect(result.success).toBe(true);
	});

	it('should accept request without template_id', async () => {
		const { exportDocumentSchema } = await import(
			'../../src/lib/server/api/validation'
		);

		const result = exportDocumentSchema.safeParse({
			document_type_id: '550e8400-e29b-41d4-a716-446655440000',
			format: 'docx'
		});

		expect(result.success).toBe(true);
	});

	it('should reject invalid template_id', async () => {
		const { exportDocumentSchema } = await import(
			'../../src/lib/server/api/validation'
		);

		const result = exportDocumentSchema.safeParse({
			document_type_id: '550e8400-e29b-41d4-a716-446655440000',
			format: 'docx',
			template_id: 'not-a-uuid'
		});

		expect(result.success).toBe(false);
	});
});
