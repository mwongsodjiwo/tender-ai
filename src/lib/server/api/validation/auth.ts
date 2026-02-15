import { z } from 'zod';
import { ORGANIZATION_ROLES } from '$types';

// =============================================================================
// AUTH
// =============================================================================

export const loginSchema = z.object({
	email: z.string().email('Ongeldig e-mailadres'),
	password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens bevatten')
});

export const registerSchema = z.object({
	email: z.string().email('Ongeldig e-mailadres'),
	password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens bevatten'),
	first_name: z.string().min(1, 'Voornaam is verplicht').max(50),
	last_name: z.string().min(1, 'Achternaam is verplicht').max(50)
});

// =============================================================================
// ORGANIZATIONS
// =============================================================================

export const createOrganizationSchema = z.object({
	name: z.string().min(2, 'Naam moet minimaal 2 tekens bevatten').max(200),
	slug: z
		.string()
		.min(2)
		.max(100)
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			'Slug mag alleen kleine letters, cijfers en koppeltekens bevatten'
		),
	description: z.string().max(1000).optional()
});

export const updateOrganizationSchema = z.object({
	name: z.string().min(2).max(200).optional(),
	description: z.string().max(1000).optional(),
	logo_url: z.string().url().optional()
});

export const inviteMemberSchema = z.object({
	email: z.string().email('Ongeldig e-mailadres'),
	role: z.enum(ORGANIZATION_ROLES)
});

// =============================================================================
// ADMIN — member management (superadmin only)
// =============================================================================

export const adminAddMemberSchema = z.object({
	email: z.string().email('Ongeldig e-mailadres'),
	role: z.enum(ORGANIZATION_ROLES)
});

export const adminUpdateMemberRoleSchema = z.object({
	role: z.enum(ORGANIZATION_ROLES)
});

// =============================================================================
// PROFILES
// =============================================================================

export const updateProfileSchema = z.object({
	first_name: z.string().min(1).max(50).optional(),
	last_name: z.string().min(1).max(50).optional(),
	job_title: z.string().max(100).optional(),
	phone: z.string().max(20).optional(),
	avatar_url: z.string().url().optional()
});
