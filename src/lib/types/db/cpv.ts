// CPV (Common Procurement Vocabulary) database types — Fase 4

import type { CpvCategoryType } from '../enums.js';

export interface CpvCode {
	code: string;
	description_nl: string;
	division: string;
	group_code: string | null;
	class_code: string | null;
	category_type: CpvCategoryType;
	parent_code: string | null;
	created_at: string;
}
