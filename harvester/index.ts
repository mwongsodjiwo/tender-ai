// TenderNed Harvester — main entry point
// Usage: npx tsx harvester/index.ts

import { fetchAllPages } from './fetcher.js';
import { parseItems } from './parser.js';
import { storeItems, createSupabaseClient } from './store.js';
import { HARVESTER_CONFIG } from './config.js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main(): Promise<void> {
	console.log('=== TenderNed Harvester ===');
	console.log(`Configuratie: max ${HARVESTER_CONFIG.maxItemsPerRun} items, ${HARVESTER_CONFIG.pageSize} per pagina`);

	if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
		console.error('Fout: PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY moeten ingesteld zijn in .env');
		process.exit(1);
	}

	const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

	try {
		// Step 1: Fetch data from TenderNed
		console.log('\n1. Data ophalen van TenderNed...');
		const rawItems = await fetchAllPages();
		console.log(`   ${rawItems.length} items opgehaald`);

		if (rawItems.length === 0) {
			console.log('   Geen nieuwe items gevonden. Harvester gestopt.');
			return;
		}

		// Step 2: Parse raw data
		console.log('\n2. Data parsen...');
		const parsedItems = parseItems(rawItems);
		console.log(`   ${parsedItems.length} items succesvol geparsed (${rawItems.length - parsedItems.length} overgeslagen)`);

		// Step 3: Store in database
		console.log('\n3. Opslaan in database...');
		const result = await storeItems(supabase, parsedItems);
		console.log(`   ${result.inserted} nieuw, ${result.updated} bijgewerkt, ${result.skipped} overgeslagen`);
		console.log(`   ${result.chunksCreated} tekstfragmenten aangemaakt`);

		console.log('\n=== Harvester voltooid ===');
	} catch (err) {
		console.error('\nFout tijdens harvesten:', err instanceof Error ? err.message : err);
		process.exit(1);
	}
}

main();
