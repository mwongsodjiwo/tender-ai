// POST /api/projects/:id/planning/generate — AI-generated planning suggestion

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generatePlanningSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { gatherPlanningContext } from '$server/planning/ai-planning-context';
import {
	buildPlanningSystemPrompt,
	buildPlanningUserPrompt,
	parseAiPlanningResponse,
	type PlanningPreferences
} from '$server/planning/ai-planning-prompt';
import { chat } from '$server/ai/client';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json(
			{ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 },
			{ status: 401 }
		);
	}

	// Validate project exists
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id, profile_confirmed')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return json(
			{ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 },
			{ status: 404 }
		);
	}

	// Parse and validate request body
	const body = await request.json();
	const parsed = generatePlanningSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { target_start_date, target_end_date, preferences: rawPrefs } = parsed.data;

	const preferences: PlanningPreferences = {
		target_start_date: target_start_date ?? null,
		target_end_date: target_end_date ?? null,
		buffer_days: rawPrefs?.buffer_days ?? 5,
		parallel_activities: rawPrefs?.parallel_activities ?? true,
		include_reviews: rawPrefs?.include_reviews ?? true
	};

	// Gather context for AI
	let context;
	try {
		context = await gatherPlanningContext(supabase, params.id);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Fout bij verzamelen projectcontext.';
		return json(
			{ message, code: 'CONTEXT_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	// Build prompts
	const systemPrompt = buildPlanningSystemPrompt();
	const userPrompt = buildPlanningUserPrompt(context, preferences);

	// Call AI
	let aiResponse;
	try {
		aiResponse = await chat({
			messages: [{ role: 'user', content: userPrompt }],
			systemPrompt,
			temperature: 0.4,
			maxTokens: 8192
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Fout bij AI-planningsgeneratie.';
		return json(
			{ message: `AI-fout: ${message}`, code: 'AI_ERROR', status: 500 },
			{ status: 500 }
		);
	}

	// Parse AI response
	let planning;
	try {
		planning = parseAiPlanningResponse(aiResponse.content);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Ongeldige AI-response.';
		return json(
			{ message: `Parsing-fout: ${message}`, code: 'PARSE_ERROR', status: 500 },
			{ status: 500 }
		);
	}

	// Audit log
	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'generate',
		entityType: 'planning',
		changes: {
			preferences,
			token_count: aiResponse.tokenCount,
			total_activities: planning.phases.reduce((sum, p) => sum + p.activities.length, 0),
			total_milestones: planning.phases.reduce((sum, p) => sum + p.milestones.length, 0),
			total_dependencies: planning.dependencies.length
		}
	});

	return json({
		data: {
			planning: {
				phases: planning.phases,
				dependencies: planning.dependencies,
				total_duration_days: planning.total_duration_days,
				total_estimated_hours: planning.total_estimated_hours
			},
			rationale: planning.rationale,
			warnings: planning.warnings
		}
	});
};
