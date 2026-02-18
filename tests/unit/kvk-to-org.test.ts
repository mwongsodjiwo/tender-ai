// Unit tests for kvk-to-org mapper — maps KVK profiel to organization update

import { describe, it, expect } from 'vitest';
import { mapKvkToOrganization } from '../../src/lib/utils/kvk-to-org';
import type { KvkBasisProfiel } from '../../src/lib/types/api/kvk';

const FULL_PROFIEL: KvkBasisProfiel = {
	kvkNummer: '12345678',
	naam: 'Test B.V.',
	rechtsvorm: 'Besloten Vennootschap',
	hoofdvestiging: {
		vestigingsnummer: '000012345678',
		handelsnamen: ['Test Handelsnaam B.V.', 'Test B.V.'],
		adressen: [
			{
				straatnaam: 'Keizersgracht',
				huisnummer: '100',
				postcode: '1015AA',
				plaats: 'Amsterdam'
			}
		],
		sbiActiviteiten: [
			{
				sbiCode: '62.01',
				sbiOmschrijving: 'Ontwikkelen en produceren van software',
				indHoofdactiviteit: 'Ja'
			},
			{
				sbiCode: '62.02',
				sbiOmschrijving: 'Advisering en ondersteuning',
				indHoofdactiviteit: 'Nee'
			}
		]
	}
};

// =============================================================================
// FULL PROFILE MAPPING
// =============================================================================

describe('mapKvkToOrganization — full profile', () => {
	it('maps kvk_nummer', () => {
		const result = mapKvkToOrganization(FULL_PROFIEL);
		expect(result.kvk_nummer).toBe('12345678');
	});

	it('maps handelsnaam from first handelsnamen', () => {
		const result = mapKvkToOrganization(FULL_PROFIEL);
		expect(result.handelsnaam).toBe('Test Handelsnaam B.V.');
	});

	it('maps rechtsvorm', () => {
		const result = mapKvkToOrganization(FULL_PROFIEL);
		expect(result.rechtsvorm).toBe('Besloten Vennootschap');
	});

	it('maps straat with huisnummer', () => {
		const result = mapKvkToOrganization(FULL_PROFIEL);
		expect(result.straat).toBe('Keizersgracht 100');
	});

	it('maps postcode', () => {
		const result = mapKvkToOrganization(FULL_PROFIEL);
		expect(result.postcode).toBe('1015AA');
	});

	it('maps plaats', () => {
		const result = mapKvkToOrganization(FULL_PROFIEL);
		expect(result.plaats).toBe('Amsterdam');
	});

	it('maps sbi_codes array', () => {
		const result = mapKvkToOrganization(FULL_PROFIEL);
		expect(result.sbi_codes).toEqual(['62.01', '62.02']);
	});
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('mapKvkToOrganization — edge cases', () => {
	it('uses naam when handelsnamen is empty', () => {
		const profiel: KvkBasisProfiel = {
			...FULL_PROFIEL,
			hoofdvestiging: {
				...FULL_PROFIEL.hoofdvestiging,
				handelsnamen: []
			}
		};
		const result = mapKvkToOrganization(profiel);
		expect(result.handelsnaam).toBe('Test B.V.');
	});

	it('handles address with huisnummerToevoeging', () => {
		const profiel: KvkBasisProfiel = {
			...FULL_PROFIEL,
			hoofdvestiging: {
				...FULL_PROFIEL.hoofdvestiging,
				adressen: [
					{
						straatnaam: 'Herengracht',
						huisnummer: '200',
						huisnummerToevoeging: 'A',
						postcode: '1016BS',
						plaats: 'Amsterdam'
					}
				]
			}
		};
		const result = mapKvkToOrganization(profiel);
		expect(result.straat).toBe('Herengracht 200 A');
	});

	it('handles empty adressen array', () => {
		const profiel: KvkBasisProfiel = {
			...FULL_PROFIEL,
			hoofdvestiging: {
				...FULL_PROFIEL.hoofdvestiging,
				adressen: []
			}
		};
		const result = mapKvkToOrganization(profiel);
		expect(result.straat).toBeUndefined();
		expect(result.postcode).toBeUndefined();
		expect(result.plaats).toBeUndefined();
	});

	it('handles empty sbiActiviteiten', () => {
		const profiel: KvkBasisProfiel = {
			...FULL_PROFIEL,
			hoofdvestiging: {
				...FULL_PROFIEL.hoofdvestiging,
				sbiActiviteiten: []
			}
		};
		const result = mapKvkToOrganization(profiel);
		expect(result.sbi_codes).toEqual([]);
	});
});
