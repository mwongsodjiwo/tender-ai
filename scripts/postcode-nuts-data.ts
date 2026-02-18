/**
 * Dutch 4-digit postcode prefix → NUTS3 mapping.
 * Based on CBS postcodetabel (simplified for all NL postcode ranges).
 */

export interface PostcodeMapping {
	postcode_prefix: string;
	nuts3_code: string;
}

/** Map a postcode range to a NUTS3 code */
function range(
	from: number,
	to: number,
	nuts3: string
): PostcodeMapping[] {
	const result: PostcodeMapping[] = [];
	for (let i = from; i <= to; i++) {
		result.push({
			postcode_prefix: String(i).padStart(4, '0'),
			nuts3_code: nuts3
		});
	}
	return result;
}

export const ALL_POSTCODE_MAPPINGS: PostcodeMapping[] = [
	// Groot-Rijnmond (Rotterdam e.o.)
	...range(2900, 2999, 'NL33B'),
	...range(3000, 3099, 'NL33B'),
	// Utrecht
	...range(3500, 3599, 'NL310'),
	...range(3600, 3649, 'NL310'),
	...range(3700, 3769, 'NL310'),
	// Oost-Zuid-Holland (Gorinchem, Dordrecht e.o.)
	...range(3300, 3399, 'NL33A'),
	...range(4200, 4299, 'NL33A'),
	// Agglomeratie 's-Gravenhage
	...range(2490, 2599, 'NL332'),
	// Delft en Westland
	...range(2600, 2699, 'NL333'),
	// Agglomeratie Leiden en Bollenstreek
	...range(2300, 2489, 'NL337'),
	// Groot-Amsterdam
	...range(1000, 1099, 'NL326'),
	...range(1100, 1119, 'NL326'),
	// Zaanstreek
	...range(1500, 1599, 'NL325'),
	// Agglomeratie Haarlem
	...range(2000, 2099, 'NL324'),
	// IJmond
	...range(1940, 1999, 'NL323'),
	// Het Gooi en Vechtstreek
	...range(1200, 1299, 'NL327'),
	...range(1400, 1499, 'NL327'),
	// Kop van Noord-Holland
	...range(1740, 1799, 'NL321'),
	...range(1800, 1899, 'NL321'),
	// Alkmaar en omgeving
	...range(1600, 1699, 'NL328'),
	...range(1700, 1739, 'NL328'),
	// West-Noord-Brabant (Breda, Bergen op Zoom)
	...range(4600, 4699, 'NL411'),
	...range(4700, 4899, 'NL411'),
	// Midden-Noord-Brabant (Tilburg)
	...range(5000, 5099, 'NL412'),
	...range(5100, 5199, 'NL412'),
	// Noordoost-Noord-Brabant ('s-Hertogenbosch)
	...range(5200, 5299, 'NL413'),
	...range(5300, 5399, 'NL413'),
	// Zuidoost-Noord-Brabant (Eindhoven)
	...range(5500, 5699, 'NL414'),
	// Noord-Limburg (Venlo)
	...range(5800, 5899, 'NL421'),
	...range(5900, 5999, 'NL421'),
	// Midden-Limburg (Roermond)
	...range(6000, 6099, 'NL422'),
	...range(6100, 6199, 'NL422'),
	// Zuid-Limburg (Maastricht, Heerlen)
	...range(6200, 6299, 'NL423'),
	...range(6300, 6499, 'NL423'),
	// Oost-Groningen
	...range(9500, 9599, 'NL111'),
	// Delfzijl en omgeving
	...range(9930, 9949, 'NL112'),
	// Overig Groningen (Groningen stad)
	...range(9700, 9799, 'NL113'),
	// Noord-Friesland (Leeuwarden)
	...range(8800, 8999, 'NL124'),
	...range(9000, 9099, 'NL124'),
	// Zuidwest-Friesland (Sneek)
	...range(8600, 8699, 'NL125'),
	// Zuidoost-Friesland (Heerenveen)
	...range(8400, 8499, 'NL126'),
	// Noord-Drenthe (Assen)
	...range(9400, 9499, 'NL131'),
	// Zuidoost-Drenthe (Emmen)
	...range(7800, 7899, 'NL132'),
	// Zuidwest-Drenthe (Hoogeveen, Meppel)
	...range(7900, 7999, 'NL133'),
	// Noord-Overijssel (Zwolle)
	...range(8000, 8099, 'NL211'),
	...range(8100, 8199, 'NL211'),
	// Zuidwest-Overijssel (Deventer)
	...range(7400, 7499, 'NL212'),
	// Twente (Enschede, Hengelo)
	...range(7500, 7599, 'NL213'),
	...range(7600, 7699, 'NL213'),
	// Veluwe (Apeldoorn, Harderwijk)
	...range(3770, 3899, 'NL221'),
	...range(8200, 8299, 'NL221'),
	// Achterhoek
	...range(7000, 7099, 'NL225'),
	// Arnhem/Nijmegen
	...range(6500, 6599, 'NL226'),
	...range(6800, 6899, 'NL226'),
	// Zuidwest-Gelderland (Tiel)
	...range(4000, 4099, 'NL224'),
	// Flevoland (Almere, Lelystad)
	...range(1300, 1399, 'NL230'),
	...range(8300, 8399, 'NL230'),
	// Zeeuwsch-Vlaanderen
	...range(4500, 4599, 'NL341'),
	// Overig Zeeland (Middelburg, Goes)
	...range(4300, 4499, 'NL342'),
	// Zuidoost-Zuid-Holland (Dordrecht)
	...range(3100, 3299, 'NL33C'),
	// Extra ranges for completeness
	...range(3400, 3499, 'NL310'),
	...range(3650, 3699, 'NL310'),
	...range(1120, 1199, 'NL326'),
	...range(9100, 9299, 'NL124'),
	...range(9300, 9399, 'NL131'),
	...range(9600, 9699, 'NL111'),
	...range(9800, 9929, 'NL113'),
	...range(9950, 9999, 'NL113')
];
