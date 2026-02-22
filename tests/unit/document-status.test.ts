import { describe, it, expect } from 'vitest';

// Test the document status derivation logic
// Mirrors deriveDocumentStatus from +page.server.ts

type ArtifactRow = { id: string; title: string; status: string };

function deriveDocumentStatus(items: ArtifactRow[]): 'open' | 'gestart' | 'afgerond' {
	if (items.length === 0) return 'open';
	const allApproved = items.every((i) => i.status === 'approved');
	if (allApproved) return 'afgerond';
	const hasWork = items.some((i) => i.status !== 'draft');
	return hasWork ? 'gestart' : 'open';
}

describe('deriveDocumentStatus', () => {
	it('returns open when no items', () => {
		expect(deriveDocumentStatus([])).toBe('open');
	});

	it('returns open when all items are draft', () => {
		const items: ArtifactRow[] = [
			{ id: '1', title: 'Section 1', status: 'draft' },
			{ id: '2', title: 'Section 2', status: 'draft' }
		];
		expect(deriveDocumentStatus(items)).toBe('open');
	});

	it('returns gestart when mix of statuses', () => {
		const items: ArtifactRow[] = [
			{ id: '1', title: 'Section 1', status: 'approved' },
			{ id: '2', title: 'Section 2', status: 'draft' },
			{ id: '3', title: 'Section 3', status: 'review' }
		];
		expect(deriveDocumentStatus(items)).toBe('gestart');
	});

	it('returns gestart when some generated', () => {
		const items: ArtifactRow[] = [
			{ id: '1', title: 'Section 1', status: 'generated' },
			{ id: '2', title: 'Section 2', status: 'draft' }
		];
		expect(deriveDocumentStatus(items)).toBe('gestart');
	});

	it('returns afgerond when all approved', () => {
		const items: ArtifactRow[] = [
			{ id: '1', title: 'Section 1', status: 'approved' },
			{ id: '2', title: 'Section 2', status: 'approved' }
		];
		expect(deriveDocumentStatus(items)).toBe('afgerond');
	});

	it('returns afgerond for single approved item', () => {
		const items: ArtifactRow[] = [
			{ id: '1', title: 'Section 1', status: 'approved' }
		];
		expect(deriveDocumentStatus(items)).toBe('afgerond');
	});
});
