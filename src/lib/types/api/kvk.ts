// KVK API types — matching KVK Zoeken & Basisprofiel API responses

export interface KvkSearchParams {
	naam?: string;
	kvkNummer?: string;
	plaats?: string;
	type?: 'hoofdvestiging' | 'nevenvestiging';
	resultatenPerPagina?: number;
	pagina?: number;
}

export interface KvkAdres {
	straatnaam: string;
	huisnummer: string;
	huisnummerToevoeging?: string;
	postcode: string;
	plaats: string;
}

export interface KvkSearchResult {
	kvkNummer: string;
	naam: string;
	adres: KvkAdres;
	type: string;
	actief: string;
}

export interface KvkSearchResponse {
	pagina: number;
	resultatenPerPagina: number;
	totaal: number;
	resultaten: KvkSearchResult[];
}

export interface KvkSbiActiviteit {
	sbiCode: string;
	sbiOmschrijving: string;
	indHoofdactiviteit: string;
}

export interface KvkBasisProfiel {
	kvkNummer: string;
	naam: string;
	rechtsvorm: string;
	hoofdvestiging: {
		vestigingsnummer: string;
		handelsnamen: string[];
		adressen: KvkAdres[];
		sbiActiviteiten: KvkSbiActiviteit[];
	};
}
