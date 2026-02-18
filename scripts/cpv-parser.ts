/**
 * CPV code parsing and transformation logic.
 * Used by import-cpv-codes.ts and tests.
 */

import * as XLSX from 'xlsx';

// =============================================================================
// TYPES
// =============================================================================

type CpvCategory = 'werken' | 'leveringen' | 'diensten';

export interface RawRow {
	CODE: string;
	Omschrijving: string;
}

export interface ParsedCpvCode {
	code: string;
	description_nl: string;
	division: string;
	group_code: string | null;
	class_code: string | null;
	category_type: CpvCategory;
	parent_code: string | null;
}

// =============================================================================
// CATEGORY MAPPING
// =============================================================================

/** Map CPV division (first 2 digits) to category_type */
export function divisionToCategory(division: string): CpvCategory {
	const div = parseInt(division, 10);
	if (div === 45) return 'werken';
	if (div >= 3 && div <= 44) return 'leveringen';
	if (div >= 48 && div <= 49) return 'leveringen';
	return 'diensten';
}

// =============================================================================
// CODE PARSING
// =============================================================================

/** Extract structural parts from a CPV code like "45210000-2" */
export function parseCpvCode(raw: string): {
	code: string;
	division: string;
	group: string | null;
	classCode: string | null;
} | null {
	const match = raw.match(/^(\d{8})-\d$/);
	if (!match) return null;
	const digits = match[1];
	const division = digits.substring(0, 2);
	const group = digits[2] !== '0' ? digits.substring(0, 3) : null;
	const classCode = digits[3] !== '0' ? digits.substring(0, 4) : null;
	return { code: raw, division, group, classCode };
}

/** Determine the parent code base (8 digits) for a given CPV code */
export function findParentCode(fullCode: string): string | null {
	const base = fullCode.substring(0, 8);
	for (let i = 7; i >= 2; i--) {
		if (base[i] !== '0') {
			const parent = base.substring(0, i) + '0'.repeat(8 - i);
			return parent !== base ? parent : null;
		}
	}
	return null;
}

// =============================================================================
// EXCEL READING
// =============================================================================

export function readExcel(filePath: string): RawRow[] {
	const workbook = XLSX.readFile(filePath);
	const sheetName = workbook.SheetNames[0];
	const sheet = workbook.Sheets[sheetName];
	return XLSX.utils.sheet_to_json<RawRow>(sheet);
}

// =============================================================================
// TRANSFORM
// =============================================================================

export function transformRows(rows: RawRow[]): ParsedCpvCode[] {
	const codeSet = new Set<string>();
	const parsed: Array<{
		raw: RawRow;
		info: NonNullable<ReturnType<typeof parseCpvCode>>;
	}> = [];

	for (const row of rows) {
		if (!row.CODE || !row.Omschrijving) continue;
		const info = parseCpvCode(row.CODE.trim());
		if (!info) continue;
		codeSet.add(info.code.substring(0, 8));
		parsed.push({ raw: row, info });
	}

	return parsed.map(({ raw, info }) => {
		const parentBase = findParentCode(info.code);
		let parentCode: string | null = null;

		if (parentBase && codeSet.has(parentBase)) {
			const parentEntry = parsed.find(
				(p) => p.info.code.substring(0, 8) === parentBase
			);
			parentCode = parentEntry?.info.code ?? null;
		}

		return {
			code: info.code,
			description_nl: raw.Omschrijving.trim(),
			division: info.division,
			group_code: info.group,
			class_code: info.classCode,
			category_type: divisionToCategory(info.division),
			parent_code: parentCode
		};
	});
}
