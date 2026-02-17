// Database row types for multi-org architecture (v2 Fase 1)

import type {
	OrganizationType,
	ContractingAuthorityType,
	OrganizationRelationshipType,
	RelationshipStatus,
	AnonymizationStrategy
} from '../enums.js';

export interface OrganizationRelationship {
	id: string;
	source_organization_id: string;
	target_organization_id: string;
	relationship_type: OrganizationRelationshipType;
	status: RelationshipStatus;
	contract_reference: string | null;
	valid_from: string | null;
	valid_until: string | null;
	created_at: string;
	updated_at: string;
}

export interface OrganizationSettings {
	id: string;
	organization_id: string;
	retention_profile: string;
	retention_archive_years_granted: number;
	retention_archive_years_not_granted: number;
	retention_personal_data_years: number;
	retention_operational_years: number;
	anonymization_strategy: AnonymizationStrategy;
	auto_archive_on_contract_end: boolean;
	notify_retention_expired: boolean;
	threshold_works: number;
	threshold_services_central: number;
	threshold_services_decentral: number;
	threshold_social_services: number;
	default_currency: string;
	created_at: string;
	updated_at: string;
}

export interface RetentionProfile {
	id: string;
	name: string;
	description: string | null;
	source: string | null;
	archive_years_granted: number;
	archive_years_not_granted: number;
	personal_data_years: number;
	operational_years: number;
	created_at: string;
}

// Extended Organization fields (added in v2)
export interface OrganizationV2Fields {
	parent_organization_id: string | null;
	organization_type: OrganizationType;
	aanbestedende_dienst_type: ContractingAuthorityType | null;
}

// Extended OrganizationMember fields (added in v2)
export interface OrganizationMemberV2Fields {
	source_organization_id: string | null;
}
