// Evaluation and Correspondence API types

import type { Correspondence, Evaluation } from '../database.js';
import type { ProjectPhase, CorrespondenceStatus, EvaluationStatus } from '../enums.js';

export interface CreateEvaluationRequest {
	tenderer_name: string;
	scores?: Record<string, unknown>;
	total_score?: number;
	ranking?: number;
	status?: EvaluationStatus;
	notes?: string;
}

export interface UpdateEvaluationRequest {
	tenderer_name?: string;
	scores?: Record<string, unknown>;
	total_score?: number;
	ranking?: number;
	status?: EvaluationStatus;
	notes?: string;
}

export type EvaluationResponse = Evaluation;
export type EvaluationListResponse = Evaluation[];

export interface CreateCorrespondenceRequest {
	phase: ProjectPhase;
	letter_type: string;
	recipient?: string;
	subject?: string;
	body?: string;
	status?: CorrespondenceStatus;
}

export interface UpdateCorrespondenceRequest {
	letter_type?: string;
	recipient?: string;
	subject?: string;
	body?: string;
	status?: CorrespondenceStatus;
	sent_at?: string;
}

export type CorrespondenceResponse = Correspondence;
export type CorrespondenceListResponse = Correspondence[];
