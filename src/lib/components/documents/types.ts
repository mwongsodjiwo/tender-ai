import type { DocumentStatus } from '$lib/types/enums/document.js';

export interface DocumentReviewer {
	name: string;
	email: string;
}

export interface DocumentHistoryEntry {
	action: string;
	actorName: string | null;
	entityType: string;
	createdAt: string;
}

export interface DocumentRow {
	id: string;
	name: string;
	subtitle: string | null;
	type: 'document' | 'brief';
	documentStatus: DocumentStatus | null;
	status: string | null;
	sections: string | null;
	date: string;
	deadline: string | null;
	assignees: DocumentReviewer[];
	history: DocumentHistoryEntry[];
	href: string;
	exportable: boolean;
	archived: boolean;
}
