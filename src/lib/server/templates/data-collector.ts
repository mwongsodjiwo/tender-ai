/**
 * Data collector for document template placeholders.
 * Fetches data from Supabase and assembles TemplateData for rendering.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logError, logInfo } from '$server/logger.js';
import type { TemplateData } from './template-data.js';
import { EMPTY_TEMPLATE_DATA, formatDutchDate } from './template-data.js';
import { fillDocumentRoles } from './role-data-filler.js';

export { formatDutchDate } from './template-data.js';
export type { TemplateData } from './template-data.js';

/**
 * Collect all data needed for template rendering.
 * All missing data resolves to empty string (never throws).
 */
export async function collectTemplateData(
	supabase: SupabaseClient,
	projectId: string,
	documentTypeId: string
): Promise<TemplateData> {
	const data: TemplateData = {
		...EMPTY_TEMPLATE_DATA,
		datum_vandaag: formatDutchDate(new Date())
	};

	try {
		await Promise.all([
			fillProjectData(supabase, projectId, data),
			fillArtifactData(supabase, projectId, documentTypeId, data),
			fillSupplierList(supabase, projectId, data),
			fillQuestionList(supabase, projectId, data),
			fillDocumentRoles(supabase, projectId, data)
		]);
	} catch (err) {
		logError('Failed to collect template data', err);
	}

	logInfo('Template data collected', {
		projectId,
		documentTypeId,
		filledKeys: countFilledKeys(data)
	});

	return data;
}

async function fillProjectData(
	supabase: SupabaseClient,
	projectId: string,
	data: TemplateData
): Promise<void> {
	const { data: project, error } = await supabase
		.from('projects')
		.select('name, description, deadline_date, organization_id, organizations(name, kvk_nummer, straat, postcode, plaats)')
		.eq('id', projectId)
		.single();

	if (error || !project) {
		logError('Failed to fetch project', error);
		return;
	}

	data.project_name = project.name ?? '';
	data.project_reference = projectId;
	data.deadline_inschrijving = project.deadline_date
		? formatDutchDate(new Date(project.deadline_date))
		: '';

	const rawOrg = project.organizations;
	const org = (Array.isArray(rawOrg) ? rawOrg[0] : rawOrg) as Record<string, string | null> | null;

	if (org) {
		data.org_name = org.name ?? '';
		data.org_kvk_nummer = org.kvk_nummer ?? '';
		data.org_adres = org.straat ?? '';
		data.org_postcode = org.postcode ?? '';
		data.org_plaats = org.plaats ?? '';
	}

	await fillContactData(supabase, projectId, data);
}

async function fillContactData(
	supabase: SupabaseClient,
	projectId: string,
	data: TemplateData
): Promise<void> {
	const { data: members } = await supabase
		.from('project_members')
		.select('profile_id, profiles(first_name, last_name, email, phone)')
		.eq('project_id', projectId)
		.limit(1);

	if (!members || members.length === 0) return;

	const rawProfile = members[0].profiles;
	const profile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) as
		Record<string, string | null> | null;

	if (profile) {
		const fullName = [profile.first_name, profile.last_name]
			.filter(Boolean)
			.join(' ');
		data.contactpersoon_naam = fullName;
		data.contactpersoon_email = profile.email ?? '';
		data.contactpersoon_tel = profile.phone ?? '';
		data.inkoper_naam = fullName;
	}
}

async function fillArtifactData(
	supabase: SupabaseClient,
	projectId: string,
	documentTypeId: string,
	data: TemplateData
): Promise<void> {
	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('section_key, content')
		.eq('project_id', projectId)
		.eq('document_type_id', documentTypeId)
		.order('sort_order');

	if (!artifacts) return;

	const KEY_MAP: Record<string, keyof TemplateData> = {
		scope: 'scope_description',
		requirements: 'requirements',
		award_criteria: 'award_criteria'
	};

	for (const artifact of artifacts) {
		const dataKey = KEY_MAP[artifact.section_key];
		if (dataKey && typeof data[dataKey] === 'string') {
			(data[dataKey] as string) = artifact.content ?? '';
		}
	}
}

async function fillSupplierList(
	supabase: SupabaseClient,
	projectId: string,
	data: TemplateData
): Promise<void> {
	const { data: projectSuppliers } = await supabase
		.from('project_suppliers')
		.select('suppliers(company_name, street, postal_code, city)')
		.eq('project_id', projectId);

	if (!projectSuppliers) return;

	data.suppliers = projectSuppliers.map((ps) => {
		const raw = ps.suppliers;
		const s = (Array.isArray(raw) ? raw[0] : raw) as
			Record<string, string | null> | null;
		const adres = s
			? [s.street, s.postal_code, s.city].filter(Boolean).join(', ')
			: '';
		return { name: s?.company_name ?? '', adres };
	});

	if (data.suppliers.length > 0) {
		data.supplier_name = data.suppliers[0].name;
		data.supplier_adres = data.suppliers[0].adres;
	}
}

async function fillQuestionList(
	supabase: SupabaseClient,
	projectId: string,
	data: TemplateData
): Promise<void> {
	const { data: questions } = await supabase
		.from('incoming_questions')
		.select('question_number, question_text, answer_text')
		.eq('project_id', projectId)
		.order('question_number');

	if (!questions) return;

	data.questions = questions.map((q) => ({
		number: q.question_number,
		question: q.question_text ?? '',
		answer: q.answer_text ?? ''
	}));
}

function countFilledKeys(data: TemplateData): number {
	let count = 0;
	for (const [, value] of Object.entries(data)) {
		if (typeof value === 'string' && value !== '') count++;
		if (Array.isArray(value) && value.length > 0) count++;
	}
	return count;
}
