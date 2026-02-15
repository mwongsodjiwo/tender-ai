// Auth API types

import type { Profile } from '../database.js';

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	password: string;
	first_name: string;
	last_name: string;
}

export interface AuthResponse {
	user: Profile;
	session: {
		access_token: string;
		refresh_token: string;
		expires_at: number;
	};
}

export interface UpdateProfileRequest {
	first_name?: string;
	last_name?: string;
	job_title?: string;
	phone?: string;
	avatar_url?: string;
}

export type ProfileResponse = Profile;
