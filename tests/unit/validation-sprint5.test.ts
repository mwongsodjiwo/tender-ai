// Unit tests: Sprint 5 validation schemas — Settings pages (profile & organization update)

import { describe, it, expect } from 'vitest';
import {
	updateProfileSchema,
	updateOrganizationSchema,
	registerSchema,
	loginSchema,
	createOrganizationSchema,
	createProjectSchema,
	updateProjectSchema,
	chatMessageSchema,
	briefingStartSchema,
	briefingMessageSchema,
	exportDocumentSchema
} from '../../src/lib/server/api/validation';

// =============================================================================
// PROFILE UPDATE SCHEMA (settings page)
// =============================================================================

describe('updateProfileSchema — settings page', () => {
	it('should accept full profile update', () => {
		const result = updateProfileSchema.safeParse({
			full_name: 'Jan de Vries',
			job_title: 'Inkoopadviseur',
			phone: '+31612345678',
			avatar_url: 'https://example.com/avatar.jpg'
		});
		expect(result.success).toBe(true);
	});

	it('should accept empty object (no fields updated)', () => {
		const result = updateProfileSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('should accept only full_name update', () => {
		const result = updateProfileSchema.safeParse({
			full_name: 'Pieter Bakker'
		});
		expect(result.success).toBe(true);
	});

	it('should accept only job_title update', () => {
		const result = updateProfileSchema.safeParse({
			job_title: 'Senior Inkoper'
		});
		expect(result.success).toBe(true);
	});

	it('should accept only phone update', () => {
		const result = updateProfileSchema.safeParse({
			phone: '06-12345678'
		});
		expect(result.success).toBe(true);
	});

	it('should accept only avatar_url update', () => {
		const result = updateProfileSchema.safeParse({
			avatar_url: 'https://cdn.example.com/avatars/user123.png'
		});
		expect(result.success).toBe(true);
	});

	it('should reject full_name shorter than 2 characters', () => {
		const result = updateProfileSchema.safeParse({
			full_name: 'J'
		});
		expect(result.success).toBe(false);
	});

	it('should reject full_name longer than 100 characters', () => {
		const result = updateProfileSchema.safeParse({
			full_name: 'A'.repeat(101)
		});
		expect(result.success).toBe(false);
	});

	it('should reject job_title longer than 100 characters', () => {
		const result = updateProfileSchema.safeParse({
			job_title: 'T'.repeat(101)
		});
		expect(result.success).toBe(false);
	});

	it('should reject phone longer than 20 characters', () => {
		const result = updateProfileSchema.safeParse({
			phone: '1'.repeat(21)
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid avatar_url format', () => {
		const result = updateProfileSchema.safeParse({
			avatar_url: 'not-a-valid-url'
		});
		expect(result.success).toBe(false);
	});

	it('should strip unknown fields', () => {
		const result = updateProfileSchema.safeParse({
			full_name: 'Kees Jansen',
			email: 'hacked@example.com',
			role: 'admin'
		});
		// Zod in strict mode strips unknown fields; schema itself should pass
		// because email/role are simply not part of the schema
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.full_name).toBe('Kees Jansen');
			expect('email' in result.data).toBe(false);
			expect('role' in result.data).toBe(false);
		}
	});

	it('should handle XSS attempt in full_name', () => {
		const result = updateProfileSchema.safeParse({
			full_name: '<script>alert("xss")</script>'
		});
		// Schema validates length/type, not content filtering
		// The value is a valid string > 2 chars
		expect(result.success).toBe(true);
	});

	it('should accept Dutch name characters', () => {
		const result = updateProfileSchema.safeParse({
			full_name: "Jan-Willem van 't Hoff"
		});
		expect(result.success).toBe(true);
	});
});

// =============================================================================
// ORGANIZATION UPDATE SCHEMA (settings page)
// =============================================================================

describe('updateOrganizationSchema — settings page', () => {
	it('should accept full organization update', () => {
		const result = updateOrganizationSchema.safeParse({
			name: 'Gemeente Rotterdam',
			description: 'Inkoopafdeling van de Gemeente Rotterdam',
			logo_url: 'https://example.com/logo.png'
		});
		expect(result.success).toBe(true);
	});

	it('should accept empty object (no fields updated)', () => {
		const result = updateOrganizationSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('should accept only name update', () => {
		const result = updateOrganizationSchema.safeParse({
			name: 'Gemeente Utrecht'
		});
		expect(result.success).toBe(true);
	});

	it('should accept only description update', () => {
		const result = updateOrganizationSchema.safeParse({
			description: 'Nieuwe beschrijving voor de organisatie'
		});
		expect(result.success).toBe(true);
	});

	it('should accept only logo_url update', () => {
		const result = updateOrganizationSchema.safeParse({
			logo_url: 'https://cdn.example.com/logos/gemeente.svg'
		});
		expect(result.success).toBe(true);
	});

	it('should reject name shorter than 2 characters', () => {
		const result = updateOrganizationSchema.safeParse({
			name: 'A'
		});
		expect(result.success).toBe(false);
	});

	it('should reject name longer than 200 characters', () => {
		const result = updateOrganizationSchema.safeParse({
			name: 'N'.repeat(201)
		});
		expect(result.success).toBe(false);
	});

	it('should reject description longer than 1000 characters', () => {
		const result = updateOrganizationSchema.safeParse({
			description: 'D'.repeat(1001)
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid logo_url format', () => {
		const result = updateOrganizationSchema.safeParse({
			logo_url: 'not-a-url'
		});
		expect(result.success).toBe(false);
	});

	it('should accept valid https logo_url', () => {
		const result = updateOrganizationSchema.safeParse({
			logo_url: 'https://storage.example.com/logos/org-123.png'
		});
		expect(result.success).toBe(true);
	});

	it('should strip unknown fields from organization update', () => {
		const result = updateOrganizationSchema.safeParse({
			name: 'Gemeente Den Haag',
			slug: 'gemeente-den-haag',
			id: 'fake-uuid'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe('Gemeente Den Haag');
			expect('slug' in result.data).toBe(false);
			expect('id' in result.data).toBe(false);
		}
	});
});

// =============================================================================
// CROSS-SCHEMA VALIDATION: E2E data flow integrity
// =============================================================================

describe('Cross-schema validation — E2E data flow integrity', () => {
	it('should validate complete registration flow data', () => {
		const registration = registerSchema.safeParse({
			email: 'flow@gemeente.nl',
			password: 'SterkWachtwoord1!',
			full_name: 'Flow Test Gebruiker'
		});
		expect(registration.success).toBe(true);
	});

	it('should validate complete login flow data', () => {
		const login = loginSchema.safeParse({
			email: 'flow@gemeente.nl',
			password: 'SterkWachtwoord1!'
		});
		expect(login.success).toBe(true);
	});

	it('should validate org creation then profile update', () => {
		const orgCreation = createOrganizationSchema.safeParse({
			name: 'Gemeente Flow Test',
			slug: 'gemeente-flow-test',
			description: 'Organisatie voor flowtest'
		});
		expect(orgCreation.success).toBe(true);

		const profileUpdate = updateProfileSchema.safeParse({
			full_name: 'Flow Test Gebruiker',
			job_title: 'Projectleider'
		});
		expect(profileUpdate.success).toBe(true);
	});

	it('should validate project creation after org setup', () => {
		const project = createProjectSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'ICT Aanbesteding Flow',
			description: 'Testproject via flow',
			procedure_type: 'open',
			estimated_value: 500000
		});
		expect(project.success).toBe(true);
	});

	it('should validate briefing start after project creation', () => {
		const briefingStart = briefingStartSchema.safeParse({
			project_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(briefingStart.success).toBe(true);
	});

	it('should validate briefing message in conversation', () => {
		const briefingMessage = briefingMessageSchema.safeParse({
			project_id: '550e8400-e29b-41d4-a716-446655440000',
			conversation_id: '660e8400-e29b-41d4-a716-446655440000',
			message: 'Wij willen een ICT-systeem aanbesteden.'
		});
		expect(briefingMessage.success).toBe(true);
	});

	it('should validate chat message during review phase', () => {
		const chatMessage = chatMessageSchema.safeParse({
			conversation_id: '660e8400-e29b-41d4-a716-446655440000',
			message: 'Kun je de selectiecriteria verduidelijken?'
		});
		expect(chatMessage.success).toBe(true);
	});

	it('should validate export request after generation', () => {
		const exportReq = exportDocumentSchema.safeParse({
			document_type_id: '550e8400-e29b-41d4-a716-446655440000',
			format: 'docx'
		});
		expect(exportReq.success).toBe(true);

		const exportPdf = exportDocumentSchema.safeParse({
			document_type_id: '550e8400-e29b-41d4-a716-446655440000',
			format: 'pdf'
		});
		expect(exportPdf.success).toBe(true);
	});

	it('should reject invalid format in export request', () => {
		const exportReq = exportDocumentSchema.safeParse({
			document_type_id: '550e8400-e29b-41d4-a716-446655440000',
			format: 'html'
		});
		expect(exportReq.success).toBe(false);
	});
});

// =============================================================================
// BOUNDARY TESTING: field length limits
// =============================================================================

describe('Boundary testing — field length limits', () => {
	it('should accept full_name at exactly 2 characters', () => {
		const result = updateProfileSchema.safeParse({ full_name: 'Jo' });
		expect(result.success).toBe(true);
	});

	it('should accept full_name at exactly 100 characters', () => {
		const result = updateProfileSchema.safeParse({
			full_name: 'A'.repeat(100)
		});
		expect(result.success).toBe(true);
	});

	it('should accept org name at exactly 2 characters', () => {
		const result = updateOrganizationSchema.safeParse({ name: 'AB' });
		expect(result.success).toBe(true);
	});

	it('should accept org name at exactly 200 characters', () => {
		const result = updateOrganizationSchema.safeParse({
			name: 'N'.repeat(200)
		});
		expect(result.success).toBe(true);
	});

	it('should accept description at exactly 1000 characters', () => {
		const result = updateOrganizationSchema.safeParse({
			description: 'D'.repeat(1000)
		});
		expect(result.success).toBe(true);
	});

	it('should accept phone at exactly 20 characters', () => {
		const result = updateProfileSchema.safeParse({
			phone: '1'.repeat(20)
		});
		expect(result.success).toBe(true);
	});

	it('should accept job_title at exactly 100 characters', () => {
		const result = updateProfileSchema.safeParse({
			job_title: 'T'.repeat(100)
		});
		expect(result.success).toBe(true);
	});

	it('should reject project name at 1 character', () => {
		const result = updateProjectSchema.safeParse({ name: 'A' });
		expect(result.success).toBe(false);
	});

	it('should accept project name at exactly 2 characters', () => {
		const result = updateProjectSchema.safeParse({ name: 'AB' });
		expect(result.success).toBe(true);
	});

	it('should reject project name at 201 characters', () => {
		const result = updateProjectSchema.safeParse({
			name: 'N'.repeat(201)
		});
		expect(result.success).toBe(false);
	});

	it('should accept chat message at exactly 1 character', () => {
		const result = chatMessageSchema.safeParse({
			conversation_id: '550e8400-e29b-41d4-a716-446655440000',
			message: 'A'
		});
		expect(result.success).toBe(true);
	});

	it('should accept chat message at exactly 10000 characters', () => {
		const result = chatMessageSchema.safeParse({
			conversation_id: '550e8400-e29b-41d4-a716-446655440000',
			message: 'M'.repeat(10000)
		});
		expect(result.success).toBe(true);
	});

	it('should reject chat message at 10001 characters', () => {
		const result = chatMessageSchema.safeParse({
			conversation_id: '550e8400-e29b-41d4-a716-446655440000',
			message: 'M'.repeat(10001)
		});
		expect(result.success).toBe(false);
	});
});
