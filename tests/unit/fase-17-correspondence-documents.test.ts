// Unit tests for Fase 17 — Correspondence merged into document system
// Tests: document_types for letters, placeholder registry, letter type enums, route redirects

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
	getAllPlaceholders,
	getPlaceholder,
	getPlaceholdersBySource,
	getCorrespondencePlaceholders,
	getPlaceholdersForLetterType,
	getRegisteredLetterTypes,
	validatePlaceholders
} from '$server/templates/placeholder-registry';
import {
	CORRESPONDENCE_PLACEHOLDERS,
	LETTER_TYPE_PLACEHOLDER_KEYS
} from '$server/templates/correspondence-placeholders';
import {
	LETTER_TYPES,
	LETTER_TYPE_LABELS,
	LETTER_TYPE_SLUGS,
	LETTER_TYPE_PHASES,
	DOCUMENT_TYPE_CATEGORIES,
	PROJECT_PHASES
} from '$types';
import type { LetterType, ProjectPhase } from '$types';

// =============================================================================
// MIGRATION FILE STRUCTURE
// =============================================================================

describe('Fase 17 — Migration file structure', () => {
	const migrationsDir = path.resolve(
		__dirname,
		'../../supabase/migrations'
	);

	it('correspondence document_types migration exists', () => {
		const migrationFile = path.join(
			migrationsDir,
			'20260218002300_correspondence_document_types.sql'
		);
		expect(fs.existsSync(migrationFile)).toBe(true);
	});

	it('correspondence data migration exists', () => {
		const migrationFile = path.join(
			migrationsDir,
			'20260218002400_migrate_correspondence_to_artifacts.sql'
		);
		expect(fs.existsSync(migrationFile)).toBe(true);
	});

	it('migration adds category column to document_types', () => {
		const migrationFile = path.join(
			migrationsDir,
			'20260218002300_correspondence_document_types.sql'
		);
		const content = fs.readFileSync(migrationFile, 'utf-8');
		expect(content).toContain('ADD COLUMN');
		expect(content).toContain('category');
	});

	it('migration inserts all 11 letter types', () => {
		const migrationFile = path.join(
			migrationsDir,
			'20260218002300_correspondence_document_types.sql'
		);
		const content = fs.readFileSync(migrationFile, 'utf-8');

		const expectedSlugs = [
			'correspondence-invitation-rfi',
			'correspondence-invitation-consultation',
			'correspondence-thank-you',
			'correspondence-nvi',
			'correspondence-pv-opening',
			'correspondence-pv-evaluation',
			'correspondence-provisional-award',
			'correspondence-rejection',
			'correspondence-final-award',
			'correspondence-invitation-signing',
			'correspondence-cover-letter'
		];

		for (const slug of expectedSlugs) {
			expect(content).toContain(slug);
		}
	});

	it('migration sets category to correspondence for letter types', () => {
		const migrationFile = path.join(
			migrationsDir,
			'20260218002300_correspondence_document_types.sql'
		);
		const content = fs.readFileSync(migrationFile, 'utf-8');
		const correspondenceCount = (
			content.match(/'correspondence'/g) || []
		).length;
		// At least 11 occurrences for category column
		expect(correspondenceCount).toBeGreaterThanOrEqual(11);
	});

	it('migration creates correspondence_document_type_map table', () => {
		const migrationFile = path.join(
			migrationsDir,
			'20260218002300_correspondence_document_types.sql'
		);
		const content = fs.readFileSync(migrationFile, 'utf-8');
		expect(content).toContain('correspondence_document_type_map');
	});

	it('data migration copies body to artifacts', () => {
		const migrationFile = path.join(
			migrationsDir,
			'20260218002400_migrate_correspondence_to_artifacts.sql'
		);
		const content = fs.readFileSync(migrationFile, 'utf-8');
		expect(content).toContain('INSERT INTO artifacts');
		expect(content).toContain('migrated_from');
	});
});

// =============================================================================
// LETTER TYPE ENUMS
// =============================================================================

describe('Fase 17 — Letter type enums', () => {
	it('defines all 11 letter types', () => {
		expect(LETTER_TYPES).toHaveLength(11);
	});

	it('each letter type has a Dutch label', () => {
		for (const type of LETTER_TYPES) {
			expect(LETTER_TYPE_LABELS[type]).toBeDefined();
			expect(LETTER_TYPE_LABELS[type].length).toBeGreaterThan(0);
		}
	});

	it('each letter type has a document_type slug', () => {
		for (const type of LETTER_TYPES) {
			const slug = LETTER_TYPE_SLUGS[type];
			expect(slug).toBeDefined();
			expect(slug.startsWith('correspondence-')).toBe(true);
		}
	});

	it('each letter type has valid phase mappings', () => {
		for (const type of LETTER_TYPES) {
			const phases = LETTER_TYPE_PHASES[type];
			expect(phases).toBeDefined();
			expect(phases.length).toBeGreaterThan(0);
			for (const phase of phases) {
				expect(PROJECT_PHASES).toContain(phase);
			}
		}
	});

	it('exploring phase has 3 letter types', () => {
		const exploringTypes = LETTER_TYPES.filter((t) =>
			LETTER_TYPE_PHASES[t].includes('exploring')
		);
		expect(exploringTypes).toHaveLength(3);
		expect(exploringTypes).toContain('invitation_rfi');
		expect(exploringTypes).toContain('invitation_consultation');
		expect(exploringTypes).toContain('thank_you');
	});

	it('tendering phase has 6 letter types', () => {
		const tenderingTypes = LETTER_TYPES.filter((t) =>
			LETTER_TYPE_PHASES[t].includes('tendering')
		);
		expect(tenderingTypes).toHaveLength(6);
	});

	it('contracting phase has 2 letter types', () => {
		const contractingTypes = LETTER_TYPES.filter((t) =>
			LETTER_TYPE_PHASES[t].includes('contracting')
		);
		expect(contractingTypes).toHaveLength(2);
		expect(contractingTypes).toContain('invitation_signing');
		expect(contractingTypes).toContain('cover_letter');
	});

	it('document type categories includes correspondence', () => {
		expect(DOCUMENT_TYPE_CATEGORIES).toContain('correspondence');
		expect(DOCUMENT_TYPE_CATEGORIES).toContain('document');
	});
});

// =============================================================================
// CORRESPONDENCE PLACEHOLDERS
// =============================================================================

describe('Fase 17 — Correspondence placeholders', () => {
	it('defines 30 correspondence-specific placeholders', () => {
		expect(CORRESPONDENCE_PLACEHOLDERS.length).toBe(30);
	});

	it('all correspondence placeholders have source "correspondence"', () => {
		for (const ph of CORRESPONDENCE_PLACEHOLDERS) {
			expect(ph.source).toBe('correspondence');
		}
	});

	it('placeholder registry includes correspondence placeholders', () => {
		const all = getAllPlaceholders();
		const corrKeys = CORRESPONDENCE_PLACEHOLDERS.map((p) => p.key);
		for (const key of corrKeys) {
			expect(all.find((p) => p.key === key)).toBeDefined();
		}
	});

	it('getCorrespondencePlaceholders returns correct count', () => {
		const corr = getCorrespondencePlaceholders();
		expect(corr.length).toBe(30);
	});

	it('getPlaceholdersBySource returns correspondence placeholders', () => {
		const corr = getPlaceholdersBySource('correspondence');
		expect(corr.length).toBe(30);
		expect(corr.every((p) => p.source === 'correspondence')).toBe(true);
	});

	it('correspondence placeholders have Dutch labels', () => {
		for (const ph of CORRESPONDENCE_PLACEHOLDERS) {
			expect(ph.label.length).toBeGreaterThan(0);
		}
	});

	it('key correspondence placeholders exist', () => {
		const keys = [
			'alcatel_period',
			'committee_members',
			'signing_date',
			'consultation_date',
			'nvi_publication_date',
			'contract_details'
		];
		for (const key of keys) {
			expect(getPlaceholder(key)).toBeDefined();
		}
	});
});

// =============================================================================
// LETTER TYPE PLACEHOLDER SETS
// =============================================================================

describe('Fase 17 — Letter type placeholder sets', () => {
	it('has placeholder sets for all 11 letter types', () => {
		const types = getRegisteredLetterTypes();
		expect(types).toHaveLength(11);
	});

	it('invitation-rfi has expected placeholders', () => {
		const placeholders = getPlaceholdersForLetterType(
			'correspondence-invitation-rfi'
		);
		expect(placeholders.length).toBeGreaterThan(10);
		const keys = placeholders.map((p) => p.key);
		expect(keys).toContain('org_name');
		expect(keys).toContain('supplier_name');
		expect(keys).toContain('project_name');
		expect(keys).toContain('scope_description');
		expect(keys).toContain('deadline_inschrijving');
	});

	it('invitation-consultation has consultation-specific placeholders', () => {
		const placeholders = getPlaceholdersForLetterType(
			'correspondence-invitation-consultation'
		);
		const keys = placeholders.map((p) => p.key);
		expect(keys).toContain('consultation_date');
		expect(keys).toContain('consultation_time');
		expect(keys).toContain('consultation_location');
	});

	it('thank-you has minimal placeholders', () => {
		const placeholders = getPlaceholdersForLetterType(
			'correspondence-thank-you'
		);
		expect(placeholders.length).toBeLessThan(10);
		const keys = placeholders.map((p) => p.key);
		expect(keys).toContain('supplier_name');
		expect(keys).toContain('participation_type');
	});

	it('nvi has NvI-specific placeholders', () => {
		const placeholders = getPlaceholdersForLetterType(
			'correspondence-nvi'
		);
		const keys = placeholders.map((p) => p.key);
		expect(keys).toContain('nvi_publication_date');
		expect(keys).toContain('questions_count');
	});

	it('provisional-award has award-specific placeholders', () => {
		const placeholders = getPlaceholdersForLetterType(
			'correspondence-provisional-award'
		);
		const keys = placeholders.map((p) => p.key);
		expect(keys).toContain('winning_scores');
		expect(keys).toContain('alcatel_period');
		expect(keys).toContain('complaint_procedure');
	});

	it('rejection has rejection-specific placeholders', () => {
		const placeholders = getPlaceholdersForLetterType(
			'correspondence-rejection'
		);
		const keys = placeholders.map((p) => p.key);
		expect(keys).toContain('supplier_scores');
		expect(keys).toContain('winner_scores_anonymized');
		expect(keys).toContain('rejection_motivation');
	});

	it('invitation-signing has signing-specific placeholders', () => {
		const placeholders = getPlaceholdersForLetterType(
			'correspondence-invitation-signing'
		);
		const keys = placeholders.map((p) => p.key);
		expect(keys).toContain('signing_date');
		expect(keys).toContain('signing_location');
		expect(keys).toContain('signatories');
		expect(keys).toContain('attachments');
	});

	it('cover-letter has basic placeholders', () => {
		const placeholders = getPlaceholdersForLetterType(
			'correspondence-cover-letter'
		);
		expect(placeholders.length).toBeLessThan(10);
		const keys = placeholders.map((p) => p.key);
		expect(keys).toContain('org_name');
		expect(keys).toContain('supplier_name');
	});

	it('unknown letter type returns empty array', () => {
		const placeholders = getPlaceholdersForLetterType('nonexistent');
		expect(placeholders).toEqual([]);
	});

	it('all placeholder keys in sets are valid registered placeholders', () => {
		for (const [, keys] of Object.entries(LETTER_TYPE_PLACEHOLDER_KEYS)) {
			for (const key of keys) {
				const result = validatePlaceholders([key]);
				expect(result.recognized).toContain(key);
			}
		}
	});
});

// =============================================================================
// ROUTE REDIRECTS
// =============================================================================

describe('Fase 17 — Route redirects', () => {
	const routesDir = path.resolve(
		__dirname,
		'../../src/routes/(app)/projects/[id]/correspondence'
	);

	it('correspondence list page redirects to documents', () => {
		const serverFile = path.join(routesDir, '+page.server.ts');
		const content = fs.readFileSync(serverFile, 'utf-8');
		expect(content).toContain('redirect');
		expect(content).toContain('category=correspondence');
	});

	it('individual letter page redirects to documents', () => {
		const serverFile = path.join(
			routesDir,
			'[letterId]',
			'+page.server.ts'
		);
		const content = fs.readFileSync(serverFile, 'utf-8');
		expect(content).toContain('redirect');
		expect(content).toContain('documents');
	});

	it('individual letter page looks up document_type_id', () => {
		const serverFile = path.join(
			routesDir,
			'[letterId]',
			'+page.server.ts'
		);
		const content = fs.readFileSync(serverFile, 'utf-8');
		expect(content).toContain('document_type_id');
	});
});

// =============================================================================
// FILE SIZE COMPLIANCE (Rule 23)
// =============================================================================

describe('Fase 17 — File size compliance', () => {
	const filesToCheck = [
		{
			name: 'placeholder-registry.ts',
			path: path.resolve(
				__dirname,
				'../../src/lib/server/templates/placeholder-registry.ts'
			)
		},
		{
			name: 'correspondence-placeholders.ts',
			path: path.resolve(
				__dirname,
				'../../src/lib/server/templates/correspondence-placeholders.ts'
			)
		}
	];

	for (const file of filesToCheck) {
		it(`${file.name} is under 200 lines`, () => {
			const content = fs.readFileSync(file.path, 'utf-8');
			const lineCount = content.split('\n').length;
			expect(lineCount).toBeLessThanOrEqual(200);
		});
	}
});

// =============================================================================
// NO CONSOLE.LOG (Rule 25d)
// =============================================================================

describe('Fase 17 — No console.log in production', () => {
	const filesToCheck = [
		path.resolve(
			__dirname,
			'../../src/lib/server/templates/placeholder-registry.ts'
		),
		path.resolve(
			__dirname,
			'../../src/lib/server/templates/correspondence-placeholders.ts'
		)
	];

	for (const filePath of filesToCheck) {
		it(`${path.basename(filePath)} has no console.log`, () => {
			const content = fs.readFileSync(filePath, 'utf-8');
			expect(content).not.toContain('console.log');
		});
	}
});
