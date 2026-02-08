// POST /api/projects/:id/requirements/generate — AI generates concept requirements

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateRequirementsSchema } from '$server/api/validation';
import { generateRequirements } from '$server/ai/requirements';
import { logAudit } from '$server/db/audit';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = generateRequirementsSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { document_type_id } = parsed.data;

	// Load project data
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, name, organization_id, procedure_type, estimated_value, briefing_data')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	// Generate requirements via AI
	const result = await generateRequirements({
		briefingData: project.briefing_data ?? {},
		projectName: project.name,
		procedureType: project.procedure_type,
		estimatedValue: project.estimated_value
	});

	if (result.requirements.length === 0) {
		return json(
			{ message: 'Kon geen eisen genereren. Controleer of de briefing voldoende informatie bevat.', code: 'GENERATION_FAILED', status: 422 },
			{ status: 422 }
		);
	}

	// Track counters for requirement numbering per type
	const typeCounters: Record<string, number> = { knockout: 0, award_criterion: 0, wish: 0 };
	const typePrefixes: Record<string, string> = { knockout: 'KO', award_criterion: 'G', wish: 'W' };

	// Check existing requirements to set correct counters
	const { data: existingReqs } = await supabase
		.from('requirements')
		.select('requirement_number')
		.eq('project_id', params.id)
		.is('deleted_at', null);

	if (existingReqs) {
		for (const req of existingReqs) {
			for (const [type, prefix] of Object.entries(typePrefixes)) {
				if (req.requirement_number.startsWith(`${prefix}-`)) {
					const num = parseInt(req.requirement_number.slice(prefix.length + 1), 10);
					if (!isNaN(num) && num > (typeCounters[type] ?? 0)) {
						typeCounters[type] = num;
					}
				}
			}
		}
	}

	// Insert generated requirements
	const requirementsToInsert = result.requirements.map((req, index) => {
		typeCounters[req.requirement_type] = (typeCounters[req.requirement_type] ?? 0) + 1;
		const prefix = typePrefixes[req.requirement_type];
		const number = String(typeCounters[req.requirement_type]).padStart(3, '0');

		return {
			project_id: params.id,
			document_type_id,
			requirement_number: `${prefix}-${number}`,
			title: req.title,
			description: req.description,
			requirement_type: req.requirement_type,
			category: req.category,
			weight_percentage: req.weight_percentage,
			priority: req.priority,
			sort_order: index,
			created_by: user.id
		};
	});

	const { data: inserted, error: insertError } = await supabase
		.from('requirements')
		.insert(requirementsToInsert)
		.select();

	if (insertError) {
		return json({ message: insertError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'generate',
		entityType: 'requirement',
		changes: { count: inserted?.length ?? 0, token_count: result.tokenCount }
	});

	return json({ data: inserted, meta: { token_count: result.tokenCount } }, { status: 201 });
};
