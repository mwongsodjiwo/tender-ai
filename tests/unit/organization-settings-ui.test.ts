// Unit tests for Fase 11 — Organization settings UI file verification

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const COMPONENT_DIR = 'src/lib/components/settings';

// =============================================================================
// SETTINGS PAGE SERVER LOAD
// =============================================================================

describe('Organization settings page server load', () => {
	const filePath = path.resolve(
		'src/routes/(app)/settings/organization/+page.server.ts'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports load function', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const load');
	});

	it('loads organization_settings', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("from('organization_settings')");
	});

	it('loads retention_profiles', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("from('retention_profiles')");
	});

	it('loads organization_relationships', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("from('organization_relationships')");
	});

	it('loads organization_members', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("from('organization_members')");
	});

	it('returns settings data', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('settings:');
		expect(source).toContain('retentionProfiles:');
		expect(source).toContain('relationships:');
	});

	it('returns loadError', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('loadError');
	});

	it('returns currentMemberRole for access control', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('currentMemberRole');
	});

	it('returns isSuperadmin flag', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('isSuperadmin');
	});
});

// =============================================================================
// SETTINGS PAGE TEMPLATE
// =============================================================================

describe('Organization settings page template', () => {
	const filePath = path.resolve(
		'src/routes/(app)/settings/organization/+page.svelte'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('imports SettingsGeneralTab', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('SettingsGeneralTab');
	});

	it('imports SettingsRetentionTab', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('SettingsRetentionTab');
	});

	it('imports SettingsThresholdsTab', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('SettingsThresholdsTab');
	});

	it('imports SettingsRelationshipsTab', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('SettingsRelationshipsTab');
	});

	it('has page title', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('<title>Organisatie-instellingen');
	});

	it('has tab navigation with all 4 tabs', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Algemeen');
		expect(source).toContain('Retentie');
		expect(source).toContain('Drempelwaarden');
		expect(source).toContain('Relaties');
	});

	it('has activeTab state', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('activeTab');
	});

	it('has role-based editing check', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('canEdit');
		expect(source).toContain('owner');
		expect(source).toContain('admin');
	});

	it('has handleSaveSettings function', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('handleSaveSettings');
	});

	it('has handleAddRelationship function', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('handleAddRelationship');
	});

	it('has handleUpdateRelationship function', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('handleUpdateRelationship');
	});

	it('calls settings API', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('/api/organizations/');
		expect(source).toContain('/settings');
	});

	it('calls relationships API', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('/relationships');
	});

	it('handles error state', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('errorMessage');
		expect(source).toContain('loadError');
	});

	it('handles success message state', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('successMessage');
	});

	it('handles empty state (no organization)', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Geen organisatie');
	});

	it('has accessibility attributes', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('aria-selected');
		expect(source).toContain('role="tab"');
		expect(source).toContain('role="tabpanel"');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// GENERAL TAB COMPONENT
// =============================================================================

describe('SettingsGeneralTab component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/SettingsGeneralTab.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('has organization type selector', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Organisatietype');
		expect(source).toContain('ORGANIZATION_TYPES');
		expect(source).toContain('ORGANIZATION_TYPE_LABELS');
	});

	it('has contracting authority type selector', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Aanbestedende dienst type');
		expect(source).toContain('CONTRACTING_AUTHORITY_TYPES');
		expect(source).toContain('CONTRACTING_AUTHORITY_TYPE_LABELS');
	});

	it('has canEdit prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('canEdit');
	});

	it('has save button', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Opslaan');
	});

	it('has accessibility labels', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('aria-label');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// RETENTION TAB COMPONENT
// =============================================================================

describe('SettingsRetentionTab component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/SettingsRetentionTab.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('imports RetentionProfileSelector component', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('RetentionProfileSelector');
		expect(source).toContain('retentionProfiles');
		expect(source).toContain('retentionProfile');
	});

	it('passes retention values to RetentionProfileSelector', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('archiveYearsGranted');
		expect(source).toContain('archiveYearsNotGranted');
		expect(source).toContain('personalDataYears');
		expect(source).toContain('operationalYears');
	});

	it('has anonymization strategy', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Anonimisatie strategie');
		expect(source).toContain('ANONYMIZATION_STRATEGIES');
	});

	it('has auto-archive checkbox', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Automatisch archiveren bij contracteinde');
		expect(source).toContain('autoArchive');
	});

	it('has notification checkbox', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Melding bij verlopen bewaartermijn');
		expect(source).toContain('notifyExpired');
	});

	it('has handleProfileChange callback', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('handleProfileChange');
	});

	it('has Archiefwet reference', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Archiefwet 2015');
	});

	it('has save button', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Opslaan');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// RETENTION PROFILE SELECTOR COMPONENT (Fase 21)
// =============================================================================

describe('RetentionProfileSelector component', () => {
	const filePath = path.resolve('src/lib/components/RetentionProfileSelector.svelte');

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('has profile dropdown with label', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Selectielijst profiel');
		expect(source).toContain('retention-profile');
	});

	it('has archive years fields', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Bewaartermijn gegund');
		expect(source).toContain('Bewaartermijn niet-gegund');
	});

	it('has personal data years field', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Persoonsgegevens');
	});

	it('has operational data years field', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Operationele data');
	});

	it('shows profile description', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('profile-description');
		expect(source).toContain('selectedProfile.description');
	});

	it('shows profile source', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Bron:');
		expect(source).toContain('selectedProfile.source');
	});

	it('auto-fills values on profile change', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('handleProfileChange');
		expect(source).toContain('archive_years_granted');
		expect(source).toContain('archive_years_not_granted');
	});

	it('emits change callback', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('emitChange');
		expect(source).toContain('onChange');
	});

	it('has accessibility attributes', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('aria-describedby');
		expect(source).toContain('role="note"');
	});

	it('imports RetentionProfileValues from governance', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('RetentionProfileValues');
		expect(source).toContain('$utils/governance');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// THRESHOLDS TAB COMPONENT
// =============================================================================

describe('SettingsThresholdsTab component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/SettingsThresholdsTab.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('has threshold for werken', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Werken');
		expect(source).toContain('thresholdWorks');
	});

	it('has threshold for diensten centraal', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Diensten (centrale overheid)');
		expect(source).toContain('thresholdServicesCentral');
	});

	it('has threshold for diensten decentraal', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Diensten (decentrale overheid)');
		expect(source).toContain('thresholdServicesDecentral');
	});

	it('has threshold for sociale diensten', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Sociale en specifieke diensten');
		expect(source).toContain('thresholdSocialServices');
	});

	it('shows formatted currency', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('formatCurrency');
	});

	it('mentions EU procurement thresholds', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Europese aanbestedingsdrempels');
	});

	it('has save button', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Opslaan');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// RELATIONSHIPS TAB COMPONENT
// =============================================================================

describe('SettingsRelationshipsTab component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/SettingsRelationshipsTab.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('has add relationship button', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Relatie toevoegen');
	});

	it('has relationship type selector', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ORGANIZATION_RELATIONSHIP_TYPES');
		expect(source).toContain('ORGANIZATION_RELATIONSHIP_TYPE_LABELS');
	});

	it('has target organization field', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('target_organization_id');
		expect(source).toContain('targetOrgId');
	});

	it('has contract reference field', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Verwerkersovereenkomst referentie');
		expect(source).toContain('contractRef');
	});

	it('shows relationship status badge', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('StatusBadge');
	});

	it('shows empty state when no relationships', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Geen relaties');
		expect(source).toContain('EmptyState');
	});

	it('has activate button for pending relationships', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Activeren');
		expect(source).toContain("status: 'active'");
	});

	it('has cancel button in add form', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Annuleren');
	});

	it('has add/submit button in form', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Toevoegen');
	});

	it('formats dates in Dutch', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('nl-NL');
		expect(source).toContain('formatDate');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// SETTINGS LAYOUT INTEGRATION
// =============================================================================

describe('Settings layout', () => {
	const filePath = path.resolve('src/routes/(app)/settings/+layout.svelte');

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('has Organisatie nav item', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Organisatie');
		expect(source).toContain('/settings/organization');
	});

	it('has accessibility navigation', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('aria-label');
		expect(source).toContain('Instellingen navigatie');
	});
});
