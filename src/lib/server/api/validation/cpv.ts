// Zod validation schemas for CPV API endpoints

import { z } from 'zod';

const CPV_CATEGORY_VALUES = ['werken', 'leveringen', 'diensten'] as const;

export const cpvSearchSchema = z.object({
	category_type: z
		.enum(CPV_CATEGORY_VALUES)
		.optional(),
	division: z
		.string()
		.regex(/^\d{2}$/, 'Divisie moet exact 2 cijfers zijn')
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

export type CpvSearchParams = z.infer<typeof cpvSearchSchema>;
