// Progress and status utilities for artifacts

const PROGRESS_MAP = {
	draft: 15,
	generated: 40,
	review: 65,
	approved: 100,
	rejected: 25
} as const;

const STATUS_COLOR_MAP = {
	draft: 'bg-gray-100 text-gray-700',
	generated: 'bg-blue-100 text-blue-700',
	review: 'bg-purple-100 text-purple-700',
	approved: 'bg-green-100 text-green-700',
	rejected: 'bg-red-100 text-red-700'
} as const;

const STATUS_LABEL_MAP = {
	draft: 'Concept',
	generated: 'Gegenereerd',
	review: 'In review',
	approved: 'Goedgekeurd',
	rejected: 'Afgewezen'
} as const;

/**
 * Get progress percentage for artifact status
 */
export function getProgressPercentage(status: string): number {
	return PROGRESS_MAP[status as keyof typeof PROGRESS_MAP] ?? 0;
}

/**
 * Get CSS classes for status badge color
 */
export function getStatusColor(status: string): string {
	return STATUS_COLOR_MAP[status as keyof typeof STATUS_COLOR_MAP] ?? 'bg-gray-100 text-gray-700';
}

/**
 * Get Dutch label for artifact status
 */
export function getStatusLabel(status: string): string {
	return STATUS_LABEL_MAP[status as keyof typeof STATUS_LABEL_MAP] ?? status;
}