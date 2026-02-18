/**
 * Seed postcode-prefix → NUTS3 mapping into Supabase.
 *
 * Usage: npx tsx scripts/seed-postcode-nuts.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 * Run seed-nuts-codes.ts first to populate nuts_codes.
 */

import { createClient } from '@supabase/supabase-js';
import { ALL_POSTCODE_MAPPINGS } from './postcode-nuts-data.js';
import type { PostcodeMapping } from './postcode-nuts-data.js';

const BATCH_SIZE = 500;

async function insertBatch(
	supabase: ReturnType<typeof createClient>,
	batch: PostcodeMapping[]
): Promise<void> {
	const { error } = await supabase
		.from('postcode_nuts_mapping')
		.upsert(batch, { onConflict: 'postcode_prefix' });

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
	const records = ALL_POSTCODE_MAPPINGS;

	for (let i = 0; i < records.length; i += BATCH_SIZE) {
		const batch = records.slice(i, i + BATCH_SIZE);
		await insertBatch(supabase, batch);
	}

	process.stdout.write(
		`Seeded ${records.length} postcode→NUTS3 mappings\n`
	);
}

main().catch((err: Error) => {
	process.stderr.write(`Error: ${err.message}\n`);
	process.exit(1);
});
