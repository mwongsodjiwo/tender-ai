// Database row types for document templates (v2 Fase 14)

import type { CpvCategoryType } from '../enums.js';

export interface DocumentTemplate {
	id: string;
	organization_id: string;
	document_type_id: string;
	category_type: CpvCategoryType | null;
	name: string;
	description: string | null;
	file_path: string;
	file_size: number;
	is_default: boolean;
	placeholders: string[];
	created_by: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}
