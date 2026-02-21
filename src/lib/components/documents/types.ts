export interface DocumentRow {
	id: string;
	name: string;
	subtitle: string | null;
	type: 'document' | 'brief';
	progress: number | null;
	status: string | null;
	sections: string | null;
	date: string;
	href: string;
	exportable: boolean;
	archived: boolean;
}
