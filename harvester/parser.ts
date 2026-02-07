// TenderNed data parser — transforms raw API responses into database records

import type { ProcedureType } from '../src/lib/types/enums.js';

interface RawTenderNedItem {
	publicatieId?: string;
	titel?: string;
	omschrijving?: string;
	aanbestedendeDienst?: {
		naam?: string;
	};
	procedure?: string;
	geraamdeWaarde?: {
		bedrag?: number;
		valuta?: string;
	};
	publicatieDatum?: string;
	sluitingsDatum?: string;
	cpvCodes?: string[];
	status?: string;
	linkNaarPublicatie?: string;
	[key: string]: unknown;
}

interface ParsedTenderNedItem {
	external_id: string;
	title: string;
	description: string | null;
	contracting_authority: string | null;
	procedure_type: ProcedureType | null;
	estimated_value: number | null;
	currency: string | null;
	publication_date: string | null;
	deadline_date: string | null;
	cpv_codes: string[];
	status: string | null;
	source_url: string | null;
	raw_data: Record<string, unknown>;
}

const PROCEDURE_TYPE_MAP: Record<string, ProcedureType> = {
	'Openbaar': 'open',
	'Openbare procedure': 'open',
	'Niet-openbaar': 'restricted',
	'Niet-openbare procedure': 'restricted',
	'Mededingingsprocedure met onderhandeling': 'negotiated_with_publication',
	'Onderhandelingsprocedure met voorafgaande bekendmaking': 'negotiated_with_publication',
	'Onderhandelingsprocedure zonder voorafgaande bekendmaking': 'negotiated_without_publication',
	'Concurrentiegerichte dialoog': 'competitive_dialogue',
	'Innovatiepartnerschap': 'innovation_partnership',
	'Nationaal openbaar': 'national_open',
	'Nationaal niet-openbaar': 'national_restricted',
	'Enkelvoudig onderhands': 'single_source'
};

export function parseItem(raw: RawTenderNedItem): ParsedTenderNedItem | null {
	const externalId = raw.publicatieId;
	const title = raw.titel;

	if (!externalId || !title) {
		return null;
	}

	return {
		external_id: String(externalId),
		title,
		description: raw.omschrijving ?? null,
		contracting_authority: raw.aanbestedendeDienst?.naam ?? null,
		procedure_type: mapProcedureType(raw.procedure ?? null),
		estimated_value: raw.geraamdeWaarde?.bedrag ?? null,
		currency: raw.geraamdeWaarde?.valuta ?? 'EUR',
		publication_date: raw.publicatieDatum ?? null,
		deadline_date: raw.sluitingsDatum ?? null,
		cpv_codes: raw.cpvCodes ?? [],
		status: raw.status ?? null,
		source_url: raw.linkNaarPublicatie ?? null,
		raw_data: raw as Record<string, unknown>
	};
}

function mapProcedureType(procedure: string | null): ProcedureType | null {
	if (!procedure) return null;

	const mapped = PROCEDURE_TYPE_MAP[procedure];
	if (mapped) return mapped;

	// Fuzzy match
	const lower = procedure.toLowerCase();
	for (const [key, value] of Object.entries(PROCEDURE_TYPE_MAP)) {
		if (lower.includes(key.toLowerCase())) {
			return value;
		}
	}

	return null;
}

export function parseItems(rawItems: RawTenderNedItem[]): ParsedTenderNedItem[] {
	return rawItems
		.map(parseItem)
		.filter((item): item is ParsedTenderNedItem => item !== null);
}
