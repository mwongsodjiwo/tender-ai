// API types for multi-org architecture (v2 Fase 1)

import type { OrganizationRelationshipType, RelationshipStatus, AnonymizationStrategy } from '../enums.js';
import type { OrganizationRelationship, OrganizationSettings, RetentionProfile } from '../database.js';

// Organization Relationships
export interface CreateOrganizationRelationshipRequest {
	target_organization_id: string;
	relationship_type: OrganizationRelationshipType;
	contract_reference?: string;
	valid_from?: string;
	valid_until?: string;
}

export interface UpdateOrganizationRelationshipRequest {
	status?: RelationshipStatus;
	contract_reference?: string;
	valid_from?: string;
	valid_until?: string;
}

export type OrganizationRelationshipResponse = OrganizationRelationship;
export type OrganizationRelationshipListResponse = OrganizationRelationship[];

// Organization Settings
export interface CreateOrganizationSettingsRequest {
	retention_profile?: string;
	retention_archive_years_granted?: number;
	retention_archive_years_not_granted?: number;
	retention_personal_data_years?: number;
	retention_operational_years?: number;
	anonymization_strategy?: AnonymizationStrategy;
	auto_archive_on_contract_end?: boolean;
	notify_retention_expired?: boolean;
	threshold_works?: number;
	threshold_services_central?: number;
	threshold_services_decentral?: number;
	threshold_social_services?: number;
	default_currency?: string;
}

export type UpdateOrganizationSettingsRequest = CreateOrganizationSettingsRequest;
export type OrganizationSettingsResponse = OrganizationSettings;

// Retention Profiles
export type RetentionProfileResponse = RetentionProfile;
export type RetentionProfileListResponse = RetentionProfile[];
