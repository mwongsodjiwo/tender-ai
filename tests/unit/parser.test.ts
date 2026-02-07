// Unit tests for TenderNed parser

import { describe, it, expect } from 'vitest';
import { parseItem, parseItems } from '../../harvester/parser';

describe('parseItem', () => {
	it('parses a complete TenderNed item', () => {
		const raw = {
			publicatieId: 'TN-2024-001',
			titel: 'Onderhoud gemeentelijke gebouwen',
			omschrijving: 'Periodiek onderhoud van 15 gemeentelijke gebouwen.',
			aanbestedendeDienst: { naam: 'Gemeente Amsterdam' },
			procedure: 'Openbare procedure',
			geraamdeWaarde: { bedrag: 500000, valuta: 'EUR' },
			publicatieDatum: '2024-01-15',
			sluitingsDatum: '2024-03-01',
			cpvCodes: ['45210000', '45400000'],
			status: 'Gepubliceerd',
			linkNaarPublicatie: 'https://www.tenderned.nl/aankondigingen/123'
		};

		const result = parseItem(raw);

		expect(result).not.toBeNull();
		expect(result?.external_id).toBe('TN-2024-001');
		expect(result?.title).toBe('Onderhoud gemeentelijke gebouwen');
		expect(result?.description).toBe('Periodiek onderhoud van 15 gemeentelijke gebouwen.');
		expect(result?.contracting_authority).toBe('Gemeente Amsterdam');
		expect(result?.procedure_type).toBe('open');
		expect(result?.estimated_value).toBe(500000);
		expect(result?.currency).toBe('EUR');
		expect(result?.publication_date).toBe('2024-01-15');
		expect(result?.deadline_date).toBe('2024-03-01');
		expect(result?.cpv_codes).toEqual(['45210000', '45400000']);
		expect(result?.status).toBe('Gepubliceerd');
		expect(result?.source_url).toBe('https://www.tenderned.nl/aankondigingen/123');
	});

	it('returns null for item without publicatieId', () => {
		const raw = { titel: 'Test' };
		expect(parseItem(raw)).toBeNull();
	});

	it('returns null for item without titel', () => {
		const raw = { publicatieId: 'TN-001' };
		expect(parseItem(raw)).toBeNull();
	});

	it('handles missing optional fields', () => {
		const raw = {
			publicatieId: 'TN-002',
			titel: 'Minimaal item'
		};

		const result = parseItem(raw);
		expect(result).not.toBeNull();
		expect(result?.description).toBeNull();
		expect(result?.contracting_authority).toBeNull();
		expect(result?.procedure_type).toBeNull();
		expect(result?.estimated_value).toBeNull();
		expect(result?.cpv_codes).toEqual([]);
	});

	it('maps known procedure types correctly', () => {
		const procedures: Record<string, string> = {
			'Openbaar': 'open',
			'Niet-openbaar': 'restricted',
			'Mededingingsprocedure met onderhandeling': 'negotiated_with_publication',
			'Concurrentiegerichte dialoog': 'competitive_dialogue',
			'Innovatiepartnerschap': 'innovation_partnership'
		};

		for (const [input, expected] of Object.entries(procedures)) {
			const result = parseItem({
				publicatieId: 'TN-test',
				titel: 'Test',
				procedure: input
			});
			expect(result?.procedure_type).toBe(expected);
		}
	});

	it('returns null procedure_type for unknown procedure', () => {
		const result = parseItem({
			publicatieId: 'TN-test',
			titel: 'Test',
			procedure: 'Onbekende procedure type XYZ'
		});
		expect(result?.procedure_type).toBeNull();
	});

	it('defaults currency to EUR when not provided', () => {
		const result = parseItem({
			publicatieId: 'TN-test',
			titel: 'Test',
			geraamdeWaarde: { bedrag: 100000 }
		});
		expect(result?.currency).toBe('EUR');
	});

	it('preserves raw data', () => {
		const raw = {
			publicatieId: 'TN-test',
			titel: 'Test',
			extraField: 'extra value'
		};

		const result = parseItem(raw);
		expect(result?.raw_data).toEqual(raw);
	});
});

describe('parseItems', () => {
	it('parses array of items, filtering out invalid ones', () => {
		const rawItems = [
			{ publicatieId: 'TN-001', titel: 'Item 1' },
			{ titel: 'Invalid - no ID' },
			{ publicatieId: 'TN-002', titel: 'Item 2' },
			{ publicatieId: 'TN-003' } // Invalid - no title
		];

		const results = parseItems(rawItems);
		expect(results).toHaveLength(2);
		expect(results[0].external_id).toBe('TN-001');
		expect(results[1].external_id).toBe('TN-002');
	});

	it('returns empty array for empty input', () => {
		expect(parseItems([])).toEqual([]);
	});
});
