// POST /api/projects/:id/requirements/generate — AI generates concept requirements

import type { RequestHandler } from './$types';
import { generateRequirementsSchema } from '$server/api/validation';
import { generateRequirements } from '$server/ai/requirements';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = generateRequirementsSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { document_type_id } = parsed.data;

	// Load project data
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, name, organization_id, procedure_type, estimated_value, briefing_data')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	// Generate requirements via AI
	const result = await generateRequirements({
		briefingData: project.briefing_data ?? {},
		projectName: project.name,
		procedureType: project.procedure_type,
		estimatedValue: project.estimated_value
	});

	if (result.requirements.length === 0) {
		return apiError(422, 'INTERNAL_ERROR', 'Kon geen eisen genereren. Controleer of de briefing voldoende informatie bevat.');
	}

	// Track counters for requirement numbering per type
	const typeCounters: Record<string, number> = { eis: 0, wens: 0 };
	const typePrefixes: Record<string, string> = { eis: 'E', wens: 'W' };

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
		return apiError(500, 'DB_ERROR', insertError.message);
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

	return apiSuccess({ items: inserted, meta: { token_count: result.tokenCount } }, 201);
};
