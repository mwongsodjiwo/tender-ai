/**
 * Template selector logic for document generation.
 * Selects the correct template based on org + document type + CPV category.
 * Fallback chain: exact match → org+type → default template.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DocumentTemplate } from '$types/db/document-templates.js';
import type { CpvCategoryType } from '$types';
import { logInfo, logWarn } from '$server/logger.js';

export interface TemplateSelectionParams {
	organizationId: string;
	documentTypeId: string;
	categoryType?: CpvCategoryType | null;
}

export interface TemplateSelectionResult {
	template: DocumentTemplate | null;
	matchType: 'exact' | 'type_only' | 'default' | 'none';
}

/**
 * Select the best matching template for a document.
 * Fallback chain:
 * 1. Exact match: org + document type + CPV category
 * 2. Type only: org + document type (no category)
 * 3. Default: org + document type where is_default = true
 * 4. None: no template found
 */
export async function selectTemplate(
	supabase: SupabaseClient,
	params: TemplateSelectionParams
): Promise<TemplateSelectionResult> {
	const { organizationId, documentTypeId, categoryType } = params;

	if (categoryType) {
		const exact = await findExactMatch(supabase, organizationId, documentTypeId, categoryType);
		if (exact) {
			logInfo('Template selected: exact match', { templateId: exact.id });
			return { template: exact, matchType: 'exact' };
		}
	}

	const typeOnly = await findTypeMatch(supabase, organizationId, documentTypeId);
	if (typeOnly) {
		logInfo('Template selected: type match', { templateId: typeOnly.id });
		return { template: typeOnly, matchType: 'type_only' };
	}

	const defaultTpl = await findDefaultTemplate(supabase, organizationId, documentTypeId);
	if (defaultTpl) {
		logInfo('Template selected: default', { templateId: defaultTpl.id });
		return { template: defaultTpl, matchType: 'default' };
	}

	logWarn('No template found', { organizationId, documentTypeId });
	return { template: null, matchType: 'none' };
}

/**
 * List all available templates for a given org + document type.
 * Used by UI to show template options when multiple are available.
 */
export async function listAvailableTemplates(
	supabase: SupabaseClient,
	organizationId: string,
	documentTypeId: string
): Promise<DocumentTemplate[]> {
	const { data, error } = await supabase
		.from('document_templates')
		.select('*')
		.eq('organization_id', organizationId)
		.eq('document_type_id', documentTypeId)
		.is('deleted_at', null)
		.order('is_default', { ascending: false })
		.order('name');

	if (error || !data) {
		logWarn('Failed to list templates', { error });
		return [];
	}

	return data as DocumentTemplate[];
}

async function findExactMatch(
	supabase: SupabaseClient,
	orgId: string,
	docTypeId: string,
	categoryType: CpvCategoryType
): Promise<DocumentTemplate | null> {
	const { data } = await supabase
		.from('document_templates')
		.select('*')
		.eq('organization_id', orgId)
		.eq('document_type_id', docTypeId)
		.eq('category_type', categoryType)
		.is('deleted_at', null)
		.order('is_default', { ascending: false })
		.limit(1)
		.single();

	return (data as DocumentTemplate) ?? null;
}

async function findTypeMatch(
	supabase: SupabaseClient,
	orgId: string,
	docTypeId: string
): Promise<DocumentTemplate | null> {
	const { data } = await supabase
		.from('document_templates')
		.select('*')
		.eq('organization_id', orgId)
		.eq('document_type_id', docTypeId)
		.is('category_type', null)
		.is('deleted_at', null)
		.order('is_default', { ascending: false })
		.limit(1)
		.single();

	return (data as DocumentTemplate) ?? null;
}

async function findDefaultTemplate(
	supabase: SupabaseClient,
	orgId: string,
	docTypeId: string
): Promise<DocumentTemplate | null> {
	const { data } = await supabase
		.from('document_templates')
		.select('*')
		.eq('organization_id', orgId)
		.eq('document_type_id', docTypeId)
		.eq('is_default', true)
		.is('deleted_at', null)
		.limit(1)
		.single();

	return (data as DocumentTemplate) ?? null;
}
