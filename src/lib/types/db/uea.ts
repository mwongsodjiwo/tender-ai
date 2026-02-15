import type { UeaPart } from '../enums.js';

// =============================================================================
// UEA — Sprint R8 (Uniform Europees Aanbestedingsdocument)
// =============================================================================

export interface UeaSection {
	id: string;
	part_number: UeaPart;
	part_title: string;
	section_key: string;
	section_title: string;
	description: string;
	sort_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface UeaQuestion {
	id: string;
	section_id: string;
	question_number: string;
	title: string;
	description: string;
	is_mandatory: boolean;
	sort_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface UeaProjectSelection {
	id: string;
	project_id: string;
	question_id: string;
	is_selected: boolean;
	created_at: string;
	updated_at: string;
}

export interface UeaQuestionWithSelection extends UeaQuestion {
	is_selected: boolean;
}

export interface UeaSectionWithQuestions extends UeaSection {
	questions: UeaQuestionWithSelection[];
}
