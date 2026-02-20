// Unit tests for Fase 31 — Documentrollen UI in team drawer

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// =============================================================================
// DRAWER DOCUMENT ROLES COMPONENT
// =============================================================================

describe('DrawerDocumentRoles component', () => {
	const source = readFileSync(
		path.resolve('src/lib/components/team/DrawerDocumentRoles.svelte'),
		'utf-8'
	);

	it('imports DOCUMENT_ROLE_KEYS and DOCUMENT_ROLE_LABELS', () => {
		expect(source).toContain('DOCUMENT_ROLE_KEYS');
		expect(source).toContain('DOCUMENT_ROLE_LABELS');
	});

	it('imports ProjectDocumentRole type', () => {
		expect(source).toContain('ProjectDocumentRole');
	});

	it('accepts projectId, memberId and memberName props', () => {
		expect(source).toContain('export let projectId: string');
		expect(source).toContain('export let memberId: string');
		expect(source).toContain('export let memberName: string');
	});

	it('fetches roles from API on load', () => {
		expect(source).toContain('/api/projects/');
		expect(source).toContain('/roles');
		expect(source).toContain('loadRoles()');
	});

	it('renders checkboxes for each document role key', () => {
		expect(source).toContain('{#each DOCUMENT_ROLE_KEYS as key');
		expect(source).toContain('type="checkbox"');
	});

	it('shows assigned roles as green badges', () => {
		expect(source).toContain('bg-green-50');
		expect(source).toContain('text-green-700');
		expect(source).toContain('assignedKeys');
	});

	it('assigns role via POST when checkbox is checked', () => {
		expect(source).toContain("method: 'POST'");
		expect(source).toContain('project_member_id');
		expect(source).toContain('role_key');
		expect(source).toContain('role_label');
	});

	it('unassigns role via PATCH with null member when unchecked', () => {
		expect(source).toContain("method: 'PATCH'");
		expect(source).toContain('project_member_id: null');
	});

	it('shows loading spinner while saving', () => {
		expect(source).toContain('animate-spin');
		expect(source).toContain('saving');
	});

	it('shows error message on failure', () => {
		expect(source).toContain('error');
		expect(source).toContain('text-error-600');
	});

	it('has Dutch UI labels', () => {
		expect(source).toContain('Documentrollen');
		expect(source).toContain('Laden...');
		expect(source).toContain('Kon documentrollen niet laden');
	});

	it('uses Svelte classic syntax', () => {
		expect(source).toContain('export let');
		expect(source).not.toContain('$state');
		expect(source).not.toContain('$props');
	});

	it('stays under 200 lines', () => {
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// TEAM DRAWER INTEGRATION
// =============================================================================

describe('TeamDrawer includes DrawerDocumentRoles', () => {
	const source = readFileSync(
		path.resolve('src/lib/components/team/TeamDrawer.svelte'),
		'utf-8'
	);

	it('imports DrawerDocumentRoles component', () => {
		expect(source).toContain('DrawerDocumentRoles');
	});

	it('accepts projectId prop', () => {
		expect(source).toContain('export let projectId: string');
	});

	it('renders DrawerDocumentRoles with projectId and memberId', () => {
		expect(source).toContain('{projectId}');
		expect(source).toContain('memberId={member.id}');
		expect(source).toContain('memberName=');
	});

	it('stays under 200 lines', () => {
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// TEAM PAGE PASSES PROJECT ID TO DRAWER
// =============================================================================

describe('TeamPage passes projectId to TeamDrawer', () => {
	const source = readFileSync(
		path.resolve('src/lib/components/team/TeamPage.svelte'),
		'utf-8'
	);

	it('passes projectId to TeamDrawer', () => {
		expect(source).toContain('{projectId}');
		expect(source).toContain('<TeamDrawer');
	});

	it('stays under 200 lines', () => {
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});
});
