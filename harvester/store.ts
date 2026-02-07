// TenderNed data store — saves parsed items and chunks to Supabase

import { createClient } from '@supabase/supabase-js';
import { chunkText } from './chunker.js';

interface StorableItem {
	external_id: string;
	title: string;
	description: string | null;
	contracting_authority: string | null;
	procedure_type: string | null;
	estimated_value: number | null;
	currency: string | null;
	publication_date: string | null;
	deadline_date: string | null;
	cpv_codes: string[];
	status: string | null;
	source_url: string | null;
	raw_data: Record<string, unknown>;
}

interface StoreResult {
	inserted: number;
	updated: number;
	skipped: number;
	chunksCreated: number;
}

export function createSupabaseClient(url: string, serviceKey: string) {
	return createClient(url, serviceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}

export async function storeItems(
	supabase: ReturnType<typeof createClient>,
	items: StorableItem[]
): Promise<StoreResult> {
	const result: StoreResult = {
		inserted: 0,
		updated: 0,
		skipped: 0,
		chunksCreated: 0
	};

	for (const item of items) {
		// Check if item already exists
		const { data: existing } = await supabase
			.from('tenderned_items')
			.select('id')
			.eq('external_id', item.external_id)
			.single();

		if (existing) {
			// Update existing item
			const { error } = await supabase
				.from('tenderned_items')
				.update({
					title: item.title,
					description: item.description,
					contracting_authority: item.contracting_authority,
					procedure_type: item.procedure_type,
					estimated_value: item.estimated_value,
					currency: item.currency,
					publication_date: item.publication_date,
					deadline_date: item.deadline_date,
					cpv_codes: item.cpv_codes,
					status: item.status,
					source_url: item.source_url,
					raw_data: item.raw_data
				})
				.eq('id', existing.id);

			if (error) {
				result.skipped++;
				continue;
			}

			result.updated++;

			// Re-chunk updated item
			const chunksCreated = await chunkAndStore(supabase, existing.id, item);
			result.chunksCreated += chunksCreated;
		} else {
			// Insert new item
			const { data: inserted, error } = await supabase
				.from('tenderned_items')
				.insert({
					external_id: item.external_id,
					title: item.title,
					description: item.description,
					contracting_authority: item.contracting_authority,
					procedure_type: item.procedure_type,
					estimated_value: item.estimated_value,
					currency: item.currency,
					publication_date: item.publication_date,
					deadline_date: item.deadline_date,
					cpv_codes: item.cpv_codes,
					status: item.status,
					source_url: item.source_url,
					raw_data: item.raw_data
				})
				.select('id')
				.single();

			if (error || !inserted) {
				result.skipped++;
				continue;
			}

			result.inserted++;

			// Chunk and store
			const chunksCreated = await chunkAndStore(supabase, inserted.id, item);
			result.chunksCreated += chunksCreated;
		}
	}

	return result;
}

async function chunkAndStore(
	supabase: ReturnType<typeof createClient>,
	itemId: string,
	item: StorableItem
): Promise<number> {
	// Build full text for chunking
	const fullText = buildChunkableText(item);
	if (!fullText) return 0;

	// Delete existing chunks for this item
	await supabase
		.from('tenderned_chunks')
		.delete()
		.eq('tenderned_item_id', itemId);

	// Create new chunks
	const chunks = chunkText(fullText);

	if (chunks.length === 0) return 0;

	const chunkRecords = chunks.map((chunk) => ({
		tenderned_item_id: itemId,
		chunk_index: chunk.chunk_index,
		content: chunk.content,
		token_count: chunk.token_count,
		metadata: {
			source_title: item.title,
			procedure_type: item.procedure_type
		}
	}));

	const { error } = await supabase
		.from('tenderned_chunks')
		.insert(chunkRecords);

	return error ? 0 : chunks.length;
}

function buildChunkableText(item: StorableItem): string | null {
	const parts: string[] = [];

	if (item.title) parts.push(item.title);
	if (item.description) parts.push(item.description);
	if (item.contracting_authority) {
		parts.push(`Aanbestedende dienst: ${item.contracting_authority}`);
	}

	const text = parts.join('\n\n');
	return text.length > 0 ? text : null;
}
