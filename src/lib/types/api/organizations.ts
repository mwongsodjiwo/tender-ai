// Organization API types

import type { Organization, OrganizationMember } from '../database.js';
import type { OrganizationRole } from '../enums.js';

export interface CreateOrganizationRequest {
	name: string;
	slug: string;
	description?: string;
}

export interface UpdateOrganizationRequest {
	name?: string;
	description?: string;
	logo_url?: string;
}

export interface InviteMemberRequest {
	email: string;
	role: OrganizationRole;
}

export type OrganizationResponse = Organization;
export type OrganizationListResponse = Organization[];
export type OrganizationMemberResponse = OrganizationMember;
