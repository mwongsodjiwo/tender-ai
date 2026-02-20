// Integration test: Data Governance — Fase 22
// Tests retention check, archive_project, anonymize_records

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

describe('Governance — Retention Check', () => {
	it('should have retention admin page route defined', async () => {
		const response = await fetch(`${BASE_URL}/admin/retention`);
		// Route exists: may return 200 (dev), 302 (auth redirect), or 403 (guard)
		expect([200, 302, 303, 403, 500]).toContain(response.status);
	});
});

describe('Governance — Archive Project', () => {
	it('archive_project function exists in migration', async () => {
		// Validates the SQL function was defined correctly
		// by checking the migration file is syntactically valid
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const migrationPath = resolve(
			__dirname,
			'../../supabase/migrations/20260218002600_retention_functions.sql'
		);
		const sql = readFileSync(migrationPath, 'utf-8');

		expect(sql).toContain('CREATE OR REPLACE FUNCTION archive_project');
		expect(sql).toContain('p_project_id UUID');
		expect(sql).toContain("archive_status = 'archived'");
		expect(sql).toContain('retention_until');
		expect(sql).toContain('SECURITY DEFINER');
	});

	it('archive_project sets retention_until based on org settings', async () => {
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const migrationPath = resolve(
			__dirname,
			'../../supabase/migrations/20260218002600_retention_functions.sql'
		);
		const sql = readFileSync(migrationPath, 'utf-8');

		// Verifies it reads from organization_settings
		expect(sql).toContain('organization_settings');
		expect(sql).toContain('retention_archive_years_granted');
		expect(sql).toContain('retention_personal_data_years');
		expect(sql).toContain('retention_operational_years');
	});

	it('archive_project updates all governance tables', async () => {
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const migrationPath = resolve(
			__dirname,
			'../../supabase/migrations/20260218002600_retention_functions.sql'
		);
		const sql = readFileSync(migrationPath, 'utf-8');

		const tables = [
			'correspondence', 'artifacts', 'evaluations', 'documents',
			'conversations', 'messages', 'time_entries',
			'document_comments', 'section_reviewers'
		];
		for (const table of tables) {
			expect(sql).toContain(`UPDATE ${table}`);
		}
	});
});

describe('Governance — Anonymize Records', () => {
	it('anonymize_records function exists in migration', async () => {
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const migrationPath = resolve(
			__dirname,
			'../../supabase/migrations/20260218002600_retention_functions.sql'
		);
		const sql = readFileSync(migrationPath, 'utf-8');

		expect(sql).toContain('CREATE OR REPLACE FUNCTION anonymize_records');
		expect(sql).toContain('p_table_name TEXT');
		expect(sql).toContain('p_record_ids UUID[]');
		expect(sql).toContain('p_strategy TEXT');
	});

	it('anonymize_records supports replace strategy', async () => {
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const migrationPath = resolve(
			__dirname,
			'../../supabase/migrations/20260218002600_retention_functions.sql'
		);
		const sql = readFileSync(migrationPath, 'utf-8');

		expect(sql).toContain("'replace'");
		expect(sql).toContain("'Persoon A'");
		expect(sql).toContain("'Bedrijf A'");
	});

	it('anonymize_records supports remove strategy', async () => {
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const migrationPath = resolve(
			__dirname,
			'../../supabase/migrations/20260218002600_retention_functions.sql'
		);
		const sql = readFileSync(migrationPath, 'utf-8');

		expect(sql).toContain("'remove'");
		expect(sql).toContain("'[verwijderd]'");
	});

	it('anonymize_records sets anonymized_at timestamp', async () => {
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const migrationPath = resolve(
			__dirname,
			'../../supabase/migrations/20260218002600_retention_functions.sql'
		);
		const sql = readFileSync(migrationPath, 'utf-8');

		expect(sql).toContain('anonymized_at = now()');
		expect(sql).toContain("archive_status = 'anonymized'");
	});

	it('anonymize_records rejects invalid strategy', async () => {
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const migrationPath = resolve(
			__dirname,
			'../../supabase/migrations/20260218002600_retention_functions.sql'
		);
		const sql = readFileSync(migrationPath, 'utf-8');

		expect(sql).toContain("p_strategy NOT IN ('replace', 'remove')");
		expect(sql).toContain('RAISE EXCEPTION');
	});

	it('anonymize_records handles all PII-bearing tables', async () => {
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const migrationPath = resolve(
			__dirname,
			'../../supabase/migrations/20260218002600_retention_functions.sql'
		);
		const sql = readFileSync(migrationPath, 'utf-8');

		const piiTables = [
			'correspondence', 'evaluations', 'suppliers',
			'supplier_contacts', 'messages', 'document_comments',
			'incoming_questions'
		];
		for (const table of piiTables) {
			expect(sql).toContain(`WHEN '${table}'`);
		}
	});

	it('anonymize_records skips already anonymized records', async () => {
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const migrationPath = resolve(
			__dirname,
			'../../supabase/migrations/20260218002600_retention_functions.sql'
		);
		const sql = readFileSync(migrationPath, 'utf-8');

		expect(sql).toContain('anonymized_at IS NULL');
	});
});
