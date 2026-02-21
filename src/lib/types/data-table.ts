export interface DataTableColumn<T = Record<string, unknown>> {
	key: string;
	label: string;
	/** Tailwind breakpoint at which column becomes visible (e.g. 'md', 'lg'). Always visible if omitted. */
	visibleFrom?: 'sm' | 'md' | 'lg' | 'xl';
	/** Custom accessor to extract cell value from a row */
	accessor?: (row: T) => string;
	/** If true, column header is sr-only (for action columns) */
	srOnly?: boolean;
	/** Extra Tailwind classes for the th/td (e.g. 'w-10') */
	className?: string;
}
