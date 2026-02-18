/**
 * Dutch NUTS hierarchy data (Eurostat 2024 classification).
 * Exported as typed arrays for use by seed script and tests.
 */

export interface NutsRecord {
	code: string;
	label_nl: string;
	level: number;
	parent_code: string | null;
}

// Level 0 — Country
const NUTS0: NutsRecord[] = [
	{ code: 'NL', label_nl: 'Nederland', level: 0, parent_code: null }
];

// Level 1 — Landsdelen
const NUTS1: NutsRecord[] = [
	{ code: 'NL1', label_nl: 'Noord-Nederland', level: 1, parent_code: 'NL' },
	{ code: 'NL2', label_nl: 'Oost-Nederland', level: 1, parent_code: 'NL' },
	{ code: 'NL3', label_nl: 'West-Nederland', level: 1, parent_code: 'NL' },
	{ code: 'NL4', label_nl: 'Zuid-Nederland', level: 1, parent_code: 'NL' }
];

// Level 2 — Provincies
const NUTS2: NutsRecord[] = [
	{ code: 'NL11', label_nl: 'Groningen', level: 2, parent_code: 'NL1' },
	{ code: 'NL12', label_nl: 'Friesland', level: 2, parent_code: 'NL1' },
	{ code: 'NL13', label_nl: 'Drenthe', level: 2, parent_code: 'NL1' },
	{ code: 'NL21', label_nl: 'Overijssel', level: 2, parent_code: 'NL2' },
	{ code: 'NL22', label_nl: 'Gelderland', level: 2, parent_code: 'NL2' },
	{ code: 'NL23', label_nl: 'Flevoland', level: 2, parent_code: 'NL2' },
	{ code: 'NL31', label_nl: 'Utrecht', level: 2, parent_code: 'NL3' },
	{ code: 'NL32', label_nl: 'Noord-Holland', level: 2, parent_code: 'NL3' },
	{ code: 'NL33', label_nl: 'Zuid-Holland', level: 2, parent_code: 'NL3' },
	{ code: 'NL34', label_nl: 'Zeeland', level: 2, parent_code: 'NL3' },
	{ code: 'NL41', label_nl: 'Noord-Brabant', level: 2, parent_code: 'NL4' },
	{ code: 'NL42', label_nl: 'Limburg', level: 2, parent_code: 'NL4' }
];

// Level 3 — COROP-gebieden
const NUTS3: NutsRecord[] = [
	// Groningen
	{ code: 'NL111', label_nl: 'Oost-Groningen', level: 3, parent_code: 'NL11' },
	{ code: 'NL112', label_nl: 'Delfzijl en omgeving', level: 3, parent_code: 'NL11' },
	{ code: 'NL113', label_nl: 'Overig Groningen', level: 3, parent_code: 'NL11' },
	// Friesland
	{ code: 'NL124', label_nl: 'Noord-Friesland', level: 3, parent_code: 'NL12' },
	{ code: 'NL125', label_nl: 'Zuidwest-Friesland', level: 3, parent_code: 'NL12' },
	{ code: 'NL126', label_nl: 'Zuidoost-Friesland', level: 3, parent_code: 'NL12' },
	// Drenthe
	{ code: 'NL131', label_nl: 'Noord-Drenthe', level: 3, parent_code: 'NL13' },
	{ code: 'NL132', label_nl: 'Zuidoost-Drenthe', level: 3, parent_code: 'NL13' },
	{ code: 'NL133', label_nl: 'Zuidwest-Drenthe', level: 3, parent_code: 'NL13' },
	// Overijssel
	{ code: 'NL211', label_nl: 'Noord-Overijssel', level: 3, parent_code: 'NL21' },
	{ code: 'NL212', label_nl: 'Zuidwest-Overijssel', level: 3, parent_code: 'NL21' },
	{ code: 'NL213', label_nl: 'Twente', level: 3, parent_code: 'NL21' },
	// Gelderland
	{ code: 'NL221', label_nl: 'Veluwe', level: 3, parent_code: 'NL22' },
	{ code: 'NL224', label_nl: 'Zuidwest-Gelderland', level: 3, parent_code: 'NL22' },
	{ code: 'NL225', label_nl: 'Achterhoek', level: 3, parent_code: 'NL22' },
	{ code: 'NL226', label_nl: 'Arnhem/Nijmegen', level: 3, parent_code: 'NL22' },
	// Flevoland
	{ code: 'NL230', label_nl: 'Flevoland', level: 3, parent_code: 'NL23' },
	// Utrecht
	{ code: 'NL310', label_nl: 'Utrecht', level: 3, parent_code: 'NL31' },
	// Noord-Holland
	{ code: 'NL321', label_nl: 'Kop van Noord-Holland', level: 3, parent_code: 'NL32' },
	{ code: 'NL323', label_nl: 'IJmond', level: 3, parent_code: 'NL32' },
	{ code: 'NL324', label_nl: 'Agglomeratie Haarlem', level: 3, parent_code: 'NL32' },
	{ code: 'NL325', label_nl: 'Zaanstreek', level: 3, parent_code: 'NL32' },
	{ code: 'NL326', label_nl: 'Groot-Amsterdam', level: 3, parent_code: 'NL32' },
	{ code: 'NL327', label_nl: 'Het Gooi en Vechtstreek', level: 3, parent_code: 'NL32' },
	{ code: 'NL328', label_nl: 'Alkmaar en omgeving', level: 3, parent_code: 'NL32' },
	// Zuid-Holland
	{ code: 'NL332', label_nl: 'Agglomeratie \'s-Gravenhage', level: 3, parent_code: 'NL33' },
	{ code: 'NL333', label_nl: 'Delft en Westland', level: 3, parent_code: 'NL33' },
	{ code: 'NL337', label_nl: 'Agglomeratie Leiden en Bollenstreek', level: 3, parent_code: 'NL33' },
	{ code: 'NL33A', label_nl: 'Oost-Zuid-Holland', level: 3, parent_code: 'NL33' },
	{ code: 'NL33B', label_nl: 'Groot-Rijnmond', level: 3, parent_code: 'NL33' },
	{ code: 'NL33C', label_nl: 'Zuidoost-Zuid-Holland', level: 3, parent_code: 'NL33' },
	// Zeeland
	{ code: 'NL341', label_nl: 'Zeeuwsch-Vlaanderen', level: 3, parent_code: 'NL34' },
	{ code: 'NL342', label_nl: 'Overig Zeeland', level: 3, parent_code: 'NL34' },
	// Noord-Brabant
	{ code: 'NL411', label_nl: 'West-Noord-Brabant', level: 3, parent_code: 'NL41' },
	{ code: 'NL412', label_nl: 'Midden-Noord-Brabant', level: 3, parent_code: 'NL41' },
	{ code: 'NL413', label_nl: 'Noordoost-Noord-Brabant', level: 3, parent_code: 'NL41' },
	{ code: 'NL414', label_nl: 'Zuidoost-Noord-Brabant', level: 3, parent_code: 'NL41' },
	// Limburg
	{ code: 'NL421', label_nl: 'Noord-Limburg', level: 3, parent_code: 'NL42' },
	{ code: 'NL422', label_nl: 'Midden-Limburg', level: 3, parent_code: 'NL42' },
	{ code: 'NL423', label_nl: 'Zuid-Limburg', level: 3, parent_code: 'NL42' }
];

export const ALL_NUTS_CODES: NutsRecord[] = [
	...NUTS0,
	...NUTS1,
	...NUTS2,
	...NUTS3
];

export const NUTS_COUNT = {
	level0: NUTS0.length,
	level1: NUTS1.length,
	level2: NUTS2.length,
	level3: NUTS3.length,
	total: NUTS0.length + NUTS1.length + NUTS2.length + NUTS3.length
};
