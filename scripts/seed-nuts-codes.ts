/**
 * Seed NL NUTS codes into Supabase nuts_codes table.
 *
 * Usage: npx tsx scripts/seed-nuts-codes.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */

import { createClient } from '@supabase/supabase-js';
import { ALL_NUTS_CODES, NUTS_COUNT } from './nuts-data.js';
import type { NutsRecord } from './nuts-data.js';

const BATCH_SIZE = 100;

async function insertBatch(
	supabase: ReturnType<typeof createClient>,
	batch: NutsRecord[]
): Promise<void> {
	const { error } = await supabase
		.from('nuts_codes')
		.upsert(batch, { onConflict: 'code' });

	if (error) {
		throw new Error(`Insert batch failed: ${error.message}`);
	}
}

async function main(): Promise<void> {
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !key) {
		throw new Error(
			'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
		);
	}

	const supabase = createClient(url, key);

	// Insert without parent_code first (avoid FK violations)
	const withoutParents = ALL_NUTS_CODES.map((r) => ({
		...r,
		parent_code: null
	}));

	for (let i = 0; i < withoutParents.length; i += BATCH_SIZE) {
		const batch = withoutParents.slice(i, i + BATCH_SIZE);
		await insertBatch(supabase, batch);
	}

	// Update with parent_code references
	const withParents = ALL_NUTS_CODES.filter(
		(r) => r.parent_code
	);
	for (let i = 0; i < withParents.length; i += BATCH_SIZE) {
		const batch = withParents.slice(i, i + BATCH_SIZE);
		await insertBatch(supabase, batch);
	}

	process.stdout.write(
		`Seeded ${NUTS_COUNT.total} NUTS codes ` +
		`(${NUTS_COUNT.level0} L0, ` +
		`${NUTS_COUNT.level1} L1, ` +
		`${NUTS_COUNT.level2} L2, ` +
		`${NUTS_COUNT.level3} L3)\n`
	);
}

main().catch((err: Error) => {
	process.stderr.write(`Error: ${err.message}\n`);
	process.exit(1);
});
