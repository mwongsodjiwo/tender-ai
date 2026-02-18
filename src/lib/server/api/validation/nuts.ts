// Zod validation schemas for NUTS API endpoints

import { z } from 'zod';

export const nutsSearchSchema = z.object({
	level: z.coerce
		.number()
		.int()
		.min(0)
		.max(3)
		.optional(),
	parent_code: z
		.string()
		.regex(
			/^NL[0-9A-Z]{0,3}$/,
			'Ongeldige NUTS-code'
		)
		.optional(),
	search: z
		.string()
		.max(200, 'Zoekterm mag maximaal 200 tekens zijn')
		.optional(),
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.default(50),
	offset: z.coerce
		.number()
		.int()
		.min(0)
		.default(0)
});

export type NutsSearchParams = z.infer<typeof nutsSearchSchema>;
