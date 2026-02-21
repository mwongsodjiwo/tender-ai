// Row-building helpers for the documents page

import type { Correspondence } from '$types';
import type { DocumentRow } from './types.js';

export interface ProductBlock {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	items: { id: string; title: string; status: string }[];
	total: number;
	approved: number;
	progress: number;
}

export type TypeFilter = 'all' | 'document' | 'brief';

const LETTER_TYPE_LABELS: Record<string, string> = {
	invitation_rfi: 'Uitnodiging RFI',
	invitation_consultation: 'Uitnodiging marktconsultatie',
	thank_you: 'Bedankbrief deelname',
	nvi: 'Nota van Inlichtingen',
	provisional_award: 'Voorlopige gunningsbeslissing',
	rejection: 'Afwijzingsbrief',
	final_award: 'Definitieve gunning',
	pv_opening: 'PV opening inschrijvingen',
	pv_evaluation: 'PV beoordeling',
	invitation_signing: 'Uitnodiging tot ondertekening',
	cover_letter: 'Begeleidende brief'
};

function getProductHref(slug: string, id: string, projectId: string): string {
	if (slug === 'programma-van-eisen') return `/projects/${projectId}/requirements`;
	if (slug === 'conceptovereenkomst') return `/projects/${projectId}/contract`;
	if (slug === 'uniform-europees-aanbestedingsdocument') return `/projects/${projectId}/uea`;
	return `/projects/${projectId}/documents/${id}`;
}

function buildDocRows(
	blocks: ProductBlock[], projectId: string, emviCount: number, archived: boolean
): DocumentRow[] {
	const rows: DocumentRow[] = blocks.map((b) => ({
		id: b.id, name: b.name, subtitle: b.description, type: 'document' as const,
		progress: b.progress, status: null,
		sections: b.total > 0 ? `${b.approved} / ${b.total}` : null,
		date: '', href: getProductHref(b.slug, b.id, projectId),
		exportable: !archived && b.total > 0, archived
	}));
	if (!archived) {
		rows.push({
			id: 'emvi', name: 'Gunningscriteria (EMVI)',
			subtitle: 'Gunningssystematiek en wegingscriteria', type: 'document',
			progress: null, status: null,
			sections: emviCount > 0 ? `${emviCount} criteria` : null,
			date: '', href: `/projects/${projectId}/emvi`, exportable: false, archived: false
		});
	}
	return rows;
}

function buildBriefRows(
	letters: Correspondence[], projectId: string, archived: boolean
): DocumentRow[] {
	return letters.map((l) => ({
		id: l.id, name: LETTER_TYPE_LABELS[l.letter_type] ?? l.letter_type,
		subtitle: l.subject || null, type: 'brief' as const,
		progress: null, status: l.status, sections: null, date: l.created_at,
		href: `/projects/${projectId}/correspondence/${l.id}`, exportable: false, archived
	}));
}

export function buildRows(
	blocks: ProductBlock[], emviCount: number, letters: Correspondence[],
	projectId: string, archived: boolean
): DocumentRow[] {
	return [
		...buildDocRows(blocks, projectId, emviCount, archived),
		...buildBriefRows(letters, projectId, archived)
	];
}

export function filterRows(
	rows: DocumentRow[],
	query: string,
	type: TypeFilter
): DocumentRow[] {
	let result = rows;
	if (type !== 'all') {
		result = result.filter((r) => r.type === type);
	}
	if (query.trim()) {
		const q = query.toLowerCase();
		result = result.filter(
			(r) => r.name.toLowerCase().includes(q) || (r.subtitle ?? '').toLowerCase().includes(q)
		);
	}
	return result;
}

export async function downloadExport(
	projectId: string, docTypeId: string, format: 'docx' | 'pdf'
): Promise<void> {
	const response = await fetch(`/api/projects/${projectId}/export`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ document_type_id: docTypeId, format })
	});
	if (!response.ok) return;
	const blob = await response.blob();
	const url = URL.createObjectURL(blob);
	const disposition = response.headers.get('Content-Disposition') ?? '';
	const match = disposition.match(/filename="(.+)"/);
	const filename = match?.[1] ?? `document.${format}`;
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
