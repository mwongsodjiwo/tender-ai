// Organization API types

import type { Organization, OrganizationMember } from '../database.js';
import type { OrganizationRole } from '../enums.js';

export interface CreateOrganizationRequest {
	name: string;
	slug: string;
	description?: string;
	kvk_nummer?: string;
	handelsnaam?: string;
	rechtsvorm?: string;
	straat?: string;
	postcode?: string;
	plaats?: string;
	sbi_codes?: string[];
	nuts_codes?: string[];
}

export interface UpdateOrganizationRequest {
	name?: string;
	description?: string;
	logo_url?: string;
	kvk_nummer?: string;
	handelsnaam?: string;
	rechtsvorm?: string;
	straat?: string;
	postcode?: string;
	plaats?: string;
	sbi_codes?: string[];
	nuts_codes?: string[];
}

export interface InviteMemberRequest {
	email: string;
	role: OrganizationRole;
}

export type OrganizationResponse = Organization;
export type OrganizationListResponse = Organization[];
export type OrganizationMemberResponse = OrganizationMember;
