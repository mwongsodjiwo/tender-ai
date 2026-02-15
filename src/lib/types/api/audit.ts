// Audit Log API types

import type { AuditLogEntry } from '../database.js';

export interface AuditLogQuery {
	page?: number;
	per_page?: number;
	action?: string;
	entity_type?: string;
	actor_id?: string;
}

export interface AuditLogResponse {
	entries: AuditLogEntry[];
	total: number;
	page: number;
	per_page: number;
}
