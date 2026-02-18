// Zod validation schemas for KVK API endpoints

import { z } from 'zod';

export const kvkSearchQuerySchema = z.object({
	naam: z
		.string()
		.min(2, 'Naam moet minimaal 2 tekens bevatten')
		.max(200)
		.optional(),
	kvkNummer: z
		.string()
		.regex(/^\d{8}$/, 'KVK-nummer moet exact 8 cijfers zijn')
		.optional(),
	plaats: z.string().max(100).optional(),
	type: z
		.enum(['hoofdvestiging', 'nevenvestiging'])
		.optional(),
	resultatenPerPagina: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.default(10),
	pagina: z.coerce
		.number()
		.int()
		.min(1)
		.default(1)
});

export const kvkNummerParamSchema = z.object({
	kvkNummer: z
		.string()
		.regex(/^\d{8}$/, 'KVK-nummer moet exact 8 cijfers zijn')
});

export type KvkSearchQuery = z.infer<typeof kvkSearchQuerySchema>;
export type KvkNummerParam = z.infer<typeof kvkNummerParamSchema>;
