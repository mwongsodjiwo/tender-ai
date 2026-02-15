// Common API types

export interface ApiError {
	message: string;
	code: string;
	status: number;
}

export interface ApiResponse<T> {
	data: T;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	per_page: number;
}
