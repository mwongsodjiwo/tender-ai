import type {
	RequirementType,
	RequirementCategory,
	CriterionType,
	GeneralConditionsType
} from '../enums.js';

// =============================================================================
// REQUIREMENTS — Sprint R5 (PvE eisenmanager)
// =============================================================================

export interface Requirement {
	id: string;
	project_id: string;
	document_type_id: string;
	requirement_number: string;
	title: string;
	description: string;
	requirement_type: RequirementType;
	category: RequirementCategory;
	weight_percentage: number;
	priority: number;
	sort_order: number;
	metadata: Record<string, unknown>;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

// =============================================================================
// EMVI CRITERIA — Sprint R6 (wegingstool)
// =============================================================================

export interface EmviCriterion {
	id: string;
	project_id: string;
	name: string;
	description: string;
	criterion_type: CriterionType;
	weight_percentage: number;
	sort_order: number;
	metadata: Record<string, unknown>;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

// =============================================================================
// CONTRACT STANDARD TEXTS — Sprint R7 (Conceptovereenkomst wizard)
// =============================================================================

export interface ContractStandardText {
	id: string;
	section_key: string;
	general_conditions: GeneralConditionsType;
	title: string;
	content: string;
	sort_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}
