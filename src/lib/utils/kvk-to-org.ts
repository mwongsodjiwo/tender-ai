// Maps KVK Basisprofiel API response to organization update fields

import type { KvkBasisProfiel } from '$types/api/kvk.js';
import type { UpdateOrganizationRequest } from '$types/api/organizations.js';

export function mapKvkToOrganization(
	profiel: KvkBasisProfiel
): UpdateOrganizationRequest {
	const hv = profiel.hoofdvestiging;
	const adres = hv.adressen[0];

	const sbiCodes = hv.sbiActiviteiten.map(
		(activiteit) => activiteit.sbiCode
	);

	const straat = adres
		? formatStraat(adres.straatnaam, adres.huisnummer, adres.huisnummerToevoeging)
		: undefined;

	return {
		kvk_nummer: profiel.kvkNummer,
		handelsnaam: hv.handelsnamen[0] ?? profiel.naam,
		rechtsvorm: profiel.rechtsvorm,
		straat,
		postcode: adres?.postcode,
		plaats: adres?.plaats,
		sbi_codes: sbiCodes
	};
}

function formatStraat(
	straatnaam: string,
	huisnummer: string,
	toevoeging?: string
): string {
	const parts = [straatnaam, huisnummer];
	if (toevoeging) parts.push(toevoeging);
	return parts.join(' ');
}
