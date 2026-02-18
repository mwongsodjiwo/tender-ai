// NUTS (Nomenclature of Territorial Units) database types — Fase 5

export interface NutsCode {
	code: string;
	label_nl: string;
	level: number;
	parent_code: string | null;
	created_at: string;
}

export interface PostcodeNutsMapping {
	postcode_prefix: string;
	nuts3_code: string;
	created_at: string;
}

export interface NutsHierarchy {
	nuts0: NutsCode | null;
	nuts1: NutsCode | null;
	nuts2: NutsCode | null;
	nuts3: NutsCode | null;
}
