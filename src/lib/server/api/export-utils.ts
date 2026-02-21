// Shared types for document export

import type { Artifact, DocumentType } from '$types';

export type { Artifact, DocumentType };

export interface ExportParams {
	documentType: DocumentType;
	artifacts: Artifact[];
	projectName: string;
	organizationName: string;
}
