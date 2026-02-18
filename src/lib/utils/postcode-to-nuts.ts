// Utility: resolve a Dutch postcode to its NUTS hierarchy

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NutsHierarchy, NutsCode } from '$types/database';

/** Extract 4-digit prefix from a Dutch postcode (e.g. "1234AB" → "1234") */
export function extractPostcodePrefix(
	postcode: string
): string | null {
	const match = postcode.trim().match(/^(\d{4})/);
	return match ? match[1] : null;
}

/** Build the full NUTS hierarchy (L0-L3) from a NUTS3 code */
async function buildHierarchy(
	supabase: SupabaseClient,
	nuts3Code: string
): Promise<NutsHierarchy> {
	const { data } = await supabase
		.from('nuts_codes')
		.select('*')
		.or(
			`code.eq.NL,` +
			`code.eq.${nuts3Code.substring(0, 3)},` +
			`code.eq.${nuts3Code.substring(0, 4)},` +
			`code.eq.${nuts3Code}`
		);

	const codes = (data ?? []) as NutsCode[];
	return {
		nuts0: codes.find((c) => c.level === 0) ?? null,
		nuts1: codes.find((c) => c.level === 1) ?? null,
		nuts2: codes.find((c) => c.level === 2) ?? null,
		nuts3: codes.find((c) => c.level === 3) ?? null
	};
}

/** Resolve a postcode to the full NUTS hierarchy */
export async function getNutsFromPostcode(
	supabase: SupabaseClient,
	postcode: string
): Promise<NutsHierarchy | null> {
	const prefix = extractPostcodePrefix(postcode);
	if (!prefix) return null;

	const { data } = await supabase
		.from('postcode_nuts_mapping')
		.select('nuts3_code')
		.eq('postcode_prefix', prefix)
		.single();

	if (!data) return null;

	return buildHierarchy(supabase, data.nuts3_code);
}
