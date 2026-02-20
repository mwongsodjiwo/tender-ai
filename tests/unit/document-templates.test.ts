import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
	uploadTemplateSchema,
	uploadTemplateFileValidation,
	updateTemplateSchema,
	listTemplatesSchema
} from '$server/api/validation/templates';

// =============================================================================
// VALIDATION SCHEMA TESTS
// =============================================================================

describe('uploadTemplateSchema', () => {
	it('accepts valid upload metadata', () => {
		const result = uploadTemplateSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			document_type_id: '660e8400-e29b-41d4-a716-446655440000',
			name: 'Aanbestedingsleidraad standaard',
			description: 'Standaard sjabloon voor open procedures'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing required fields', () => {
		const result = uploadTemplateSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000'
			// missing document_type_id and name
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid UUID', () => {
		const result = uploadTemplateSchema.safeParse({
			organization_id: 'not-a-uuid',
			document_type_id: '660e8400-e29b-41d4-a716-446655440000',
			name: 'Test'
		});
		expect(result.success).toBe(false);
	});

	it('accepts optional category_type', () => {
		const result = uploadTemplateSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			document_type_id: '660e8400-e29b-41d4-a716-446655440000',
			name: 'Test',
			category_type: 'diensten'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.category_type).toBe('diensten');
		}
	});

	it('rejects invalid category_type', () => {
		const result = uploadTemplateSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			document_type_id: '660e8400-e29b-41d4-a716-446655440000',
			name: 'Test',
			category_type: 'invalid_type'
		});
		expect(result.success).toBe(false);
	});

	it('defaults is_default to false', () => {
		const result = uploadTemplateSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			document_type_id: '660e8400-e29b-41d4-a716-446655440000',
			name: 'Test'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.is_default).toBe(false);
		}
	});

	it('rejects empty name', () => {
		const result = uploadTemplateSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			document_type_id: '660e8400-e29b-41d4-a716-446655440000',
			name: ''
		});
		expect(result.success).toBe(false);
	});
});

describe('uploadTemplateFileValidation', () => {
	it('accepts valid file properties', () => {
		const result = uploadTemplateFileValidation.safeParse({
			size: 1024 * 100,
			type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		});
		expect(result.success).toBe(true);
	});

	it('rejects oversized files', () => {
		const result = uploadTemplateFileValidation.safeParse({
			size: 51 * 1024 * 1024,
			type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		});
		expect(result.success).toBe(false);
	});

	it('rejects non-docx mime types', () => {
		const result = uploadTemplateFileValidation.safeParse({
			size: 1024,
			type: 'application/pdf'
		});
		expect(result.success).toBe(false);
	});
});

describe('updateTemplateSchema', () => {
	it('accepts partial updates', () => {
		const result = updateTemplateSchema.safeParse({ name: 'Nieuwe naam' });
		expect(result.success).toBe(true);
	});

	it('accepts is_default change', () => {
		const result = updateTemplateSchema.safeParse({ is_default: true });
		expect(result.success).toBe(true);
	});

	it('accepts empty object (no changes)', () => {
		const result = updateTemplateSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects invalid category_type', () => {
		const result = updateTemplateSchema.safeParse({ category_type: 'bad' });
		expect(result.success).toBe(false);
	});
});

describe('listTemplatesSchema', () => {
	it('accepts valid organization_id', () => {
		const result = listTemplatesSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('accepts organization_id with document_type_id', () => {
		const result = listTemplatesSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			document_type_id: '660e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing organization_id', () => {
		const result = listTemplatesSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// TYPE STRUCTURE TESTS
// =============================================================================

describe('DocumentTemplate type', () => {
	it('type file exists and exports DocumentTemplate', async () => {
		const mod = await import('$types/db/document-templates');
		// Type-level check: ensure the module can be imported
		expect(mod).toBeDefined();
	});
});

// =============================================================================
// FILE SIZE COMPLIANCE TESTS (Rule 16, 23)
// =============================================================================

describe('File size compliance', () => {
	const MAX_LINES = 200;

	const FILES_TO_CHECK = [
		'src/lib/server/api/validation/templates.ts',
		'src/routes/api/templates/+server.ts',
		'src/routes/api/templates/[id]/+server.ts',
		'src/lib/types/db/document-templates.ts'
	];

	for (const filePath of FILES_TO_CHECK) {
		it(`${filePath} is under ${MAX_LINES} lines`, () => {
			const fullPath = resolve(process.cwd(), filePath);
			const source = readFileSync(fullPath, 'utf-8');
			const lineCount = source.split('\n').length;
			expect(lineCount).toBeLessThanOrEqual(MAX_LINES);
		});
	}
});

// =============================================================================
// NO CONSOLE.LOG IN PRODUCTION CODE (Rule 17)
// =============================================================================

describe('No console.log in production code', () => {
	const FILES_TO_CHECK = [
		'src/routes/api/templates/+server.ts',
		'src/routes/api/templates/[id]/+server.ts',
		'src/lib/server/api/validation/templates.ts'
	];

	for (const filePath of FILES_TO_CHECK) {
		it(`${filePath} has no console.log`, () => {
			const fullPath = resolve(process.cwd(), filePath);
			const source = readFileSync(fullPath, 'utf-8');
			expect(source).not.toContain('console.log');
		});
	}
});

// =============================================================================
// MIGRATION FILE TESTS
// =============================================================================

describe('document_templates migration', () => {
	const migrationPath = resolve(
		process.cwd(),
		'supabase/migrations/20260218002200_document_templates.sql'
	);
	let sql: string;

	it('migration file exists', () => {
		sql = readFileSync(migrationPath, 'utf-8');
		expect(sql.length).toBeGreaterThan(0);
	});

	it('creates document_templates table', () => {
		sql = readFileSync(migrationPath, 'utf-8');
		expect(sql).toContain('CREATE TABLE document_templates');
	});

	it('has organization_id foreign key', () => {
		sql = readFileSync(migrationPath, 'utf-8');
		expect(sql).toContain('REFERENCES organizations(id)');
	});

	it('has document_type_id foreign key', () => {
		sql = readFileSync(migrationPath, 'utf-8');
		expect(sql).toContain('REFERENCES document_types(id)');
	});

	it('enables row level security', () => {
		sql = readFileSync(migrationPath, 'utf-8');
		expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
	});

	it('has SELECT policy for org members', () => {
		sql = readFileSync(migrationPath, 'utf-8');
		expect(sql).toContain('document_templates_select_org_members');
		expect(sql).toContain('FOR SELECT');
	});

	it('has ALL policy for admin/owner', () => {
		sql = readFileSync(migrationPath, 'utf-8');
		expect(sql).toContain('document_templates_all_admin_owner');
		expect(sql).toContain('FOR ALL');
	});

	it('creates storage bucket', () => {
		sql = readFileSync(migrationPath, 'utf-8');
		expect(sql).toContain("'document-templates'");
		expect(sql).toContain('storage.buckets');
	});

	it('creates storage policies', () => {
		sql = readFileSync(migrationPath, 'utf-8');
		expect(sql).toContain('document_templates_storage_select');
		expect(sql).toContain('document_templates_storage_insert');
		expect(sql).toContain('document_templates_storage_delete');
	});

	it('has indexes for performance', () => {
		sql = readFileSync(migrationPath, 'utf-8');
		expect(sql).toContain('idx_document_templates_org');
		expect(sql).toContain('idx_document_templates_type');
	});
});
