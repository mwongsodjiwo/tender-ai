import { z } from 'zod';
import {
	ORGANIZATION_RELATIONSHIP_TYPES,
	RELATIONSHIP_STATUSES,
	ANONYMIZATION_STRATEGIES
} from '$types';

// =============================================================================
// ORGANIZATION RELATIONSHIPS
// =============================================================================

export const createOrganizationRelationshipSchema = z.object({
	target_organization_id: z.string().uuid('Ongeldige organisatie-ID'),
	relationship_type: z.enum(ORGANIZATION_RELATIONSHIP_TYPES),
	contract_reference: z.string().max(500).optional(),
	valid_from: z.string().date('Ongeldig datumformaat').optional(),
	valid_until: z.string().date('Ongeldig datumformaat').optional()
});

export const updateOrganizationRelationshipSchema = z.object({
	status: z.enum(RELATIONSHIP_STATUSES).optional(),
	contract_reference: z.string().max(500).optional(),
	valid_from: z.string().date('Ongeldig datumformaat').optional(),
	valid_until: z.string().date('Ongeldig datumformaat').optional()
});

// =============================================================================
// ORGANIZATION SETTINGS
// =============================================================================

const positiveSmallInt = z.number().int().min(0).max(100);
const positiveDecimal = z.number().min(0).max(99999999.99);

export const createOrganizationSettingsSchema = z.object({
	retention_profile: z.string().max(100).optional(),
	retention_archive_years_granted: positiveSmallInt.optional(),
	retention_archive_years_not_granted: positiveSmallInt.optional(),
	retention_personal_data_years: positiveSmallInt.optional(),
	retention_operational_years: positiveSmallInt.optional(),
	anonymization_strategy: z.enum(ANONYMIZATION_STRATEGIES).optional(),
	auto_archive_on_contract_end: z.boolean().optional(),
	notify_retention_expired: z.boolean().optional(),
	threshold_works: positiveDecimal.optional(),
	threshold_services_central: positiveDecimal.optional(),
	threshold_services_decentral: positiveDecimal.optional(),
	threshold_social_services: positiveDecimal.optional(),
	default_currency: z.string().length(3).optional()
});

export const updateOrganizationSettingsSchema = createOrganizationSettingsSchema;
