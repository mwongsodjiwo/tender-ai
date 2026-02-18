/**
 * Import CPV codes from Excel into Supabase cpv_codes table.
 *
 * Usage: npx tsx scripts/import-cpv-codes.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */

import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { readExcel, transformRows } from './cpv-parser.js';
import type { ParsedCpvCode } from './cpv-parser.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const EXCEL_PATH = path.resolve(
	'overzicht_cpv_codes_simap (1).xlsx'
);
const BATCH_SIZE = 500;

// =============================================================================
// DATABASE INSERT
// =============================================================================

async function insertBatch(
	supabase: ReturnType<typeof createClient>,
	batch: ParsedCpvCode[]
): Promise<void> {
	const { error } = await supabase
		.from('cpv_codes')
		.upsert(batch, { onConflict: 'code' });

	if (error) {
		throw new Error(`Insert batch failed: ${error.message}`);
	}
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !key) {
		throw new Error(
			'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
		);
	}

	const supabase = createClient(url, key);

	const rows = readExcel(EXCEL_PATH);
	const records = transformRows(rows);

	// Insert without parent_code first (avoid FK violations)
	const withoutParents = records.map((r) => ({
		...r,
		parent_code: null
	}));

	for (let i = 0; i < withoutParents.length; i += BATCH_SIZE) {
		const batch = withoutParents.slice(i, i + BATCH_SIZE);
		await insertBatch(supabase, batch);
	}

	// Update parent_code references
	const withParents = records.filter((r) => r.parent_code);
	for (let i = 0; i < withParents.length; i += BATCH_SIZE) {
		const batch = withParents.slice(i, i + BATCH_SIZE);
		await insertBatch(supabase, batch);
	}

	const stats = {
		total: records.length,
		werken: records.filter(
			(r) => r.category_type === 'werken'
		).length,
		leveringen: records.filter(
			(r) => r.category_type === 'leveringen'
		).length,
		diensten: records.filter(
			(r) => r.category_type === 'diensten'
		).length,
		withParent: withParents.length
	};

	process.stdout.write(
		`Imported ${stats.total} CPV codes ` +
		`(${stats.werken} werken, ` +
		`${stats.leveringen} leveringen, ` +
		`${stats.diensten} diensten, ` +
		`${stats.withParent} with parent)\n`
	);
}

main().catch((err: Error) => {
	process.stderr.write(`Error: ${err.message}\n`);
	process.exit(1);
});
