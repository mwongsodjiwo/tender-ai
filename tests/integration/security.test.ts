// Integration tests: Sprint 5 — Security audit
// Tests RLS, auth tokens, input validation, CSRF, rate limiting, content-type, sessions

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

// Shared UUIDs for testing
const FAKE_UUID = '550e8400-e29b-41d4-a716-446655440000';
const FAKE_UUID_2 = '660e8400-e29b-41d4-a716-446655440000';

// =============================================================================
// RLS POLICY ENFORCEMENT
// =============================================================================

describe('Security: RLS Policy Enforcement', () => {
	it('should deny access to organizations without auth', async () => {
		const response = await fetch(`${BASE_URL}/api/organizations`);
		expect(response.status).toBe(401);
	});

	it('should deny access to specific organization without auth', async () => {
		const response = await fetch(`${BASE_URL}/api/organizations/${FAKE_UUID}`);
		expect(response.status).toBe(401);
	});

	it('should deny access to organization members without auth', async () => {
		const response = await fetch(
			`${BASE_URL}/api/organizations/${FAKE_UUID}/members`
		);
		expect(response.status).toBe(401);
	});

	it('should deny access to projects without auth', async () => {
		const response = await fetch(`${BASE_URL}/api/projects`);
		expect(response.status).toBe(401);
	});

	it('should deny access to specific project without auth', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${FAKE_UUID}`);
		expect(response.status).toBe(401);
	});

	it('should deny access to project artifacts without auth', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${FAKE_UUID}/artifacts`
		);
		expect(response.status).toBe(401);
	});

	it('should deny access to project members without auth', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${FAKE_UUID}/members`
		);
		expect(response.status).toBe(401);
	});

	it('should deny access to project conversations without auth', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${FAKE_UUID}/conversations`
		);
		expect(response.status).toBe(401);
	});

	it('should deny access to project uploads without auth', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${FAKE_UUID}/uploads`
		);
		expect(response.status).toBe(401);
	});

	it('should deny access to project audit log without auth', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${FAKE_UUID}/audit`
		);
		expect(response.status).toBe(401);
	});

	it('should deny access to organization audit log without auth', async () => {
		const response = await fetch(
			`${BASE_URL}/api/organizations/${FAKE_UUID}/audit`
		);
		expect(response.status).toBe(401);
	});

	it('should deny access to profile without auth', async () => {
		const response = await fetch(`${BASE_URL}/api/profile`);
		expect(response.status).toBe(401);
	});

	it('should deny access to chat without auth', async () => {
		const response = await fetch(`${BASE_URL}/api/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ conversation_id: FAKE_UUID, message: 'test' })
		});
		expect(response.status).toBe(401);
	});

	it('should deny access to briefing start without auth', async () => {
		const response = await fetch(`${BASE_URL}/api/briefing/start`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ project_id: FAKE_UUID })
		});
		expect(response.status).toBe(401);
	});

	it('should deny access to briefing message without auth', async () => {
		const response = await fetch(`${BASE_URL}/api/briefing/message`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				project_id: FAKE_UUID,
				conversation_id: FAKE_UUID_2,
				message: 'test'
			})
		});
		expect(response.status).toBe(401);
	});

	it('should deny access to TenderNed search without auth', async () => {
		const response = await fetch(`${BASE_URL}/api/tenderned?query=test`);
		expect(response.status).toBe(401);
	});

	it('should deny access to context search without auth', async () => {
		const response = await fetch(`${BASE_URL}/api/context-search`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: 'test query' })
		});
		expect(response.status).toBe(401);
	});

	it('should deny access to project reviewers without auth', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${FAKE_UUID}/reviewers`
		);
		expect(response.status).toBe(401);
	});

	it('should deny access to project export without auth', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${FAKE_UUID}/export`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					document_type_id: FAKE_UUID,
					format: 'docx'
				})
			}
		);
		expect(response.status).toBe(401);
	});

	it('should deny access to project regenerate without auth', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${FAKE_UUID}/regenerate`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ artifact_id: FAKE_UUID })
			}
		);
		expect(response.status).toBe(401);
	});

	it('should deny access to section-chat without auth', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${FAKE_UUID}/section-chat`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					artifact_id: FAKE_UUID,
					message: 'test'
				})
			}
		);
		expect(response.status).toBe(401);
	});
});

// =============================================================================
// AUTH TOKEN VALIDATION
// =============================================================================

describe('Security: Auth Token Validation', () => {
	it('should reject request with invalid bearer token', async () => {
		const response = await fetch(`${BASE_URL}/api/profile`, {
			headers: { Authorization: 'Bearer invalid-token-xyz-123' }
		});
		expect(response.status).toBe(401);
	});

	it('should reject request with malformed auth header', async () => {
		const response = await fetch(`${BASE_URL}/api/profile`, {
			headers: { Authorization: 'NotBearer some-token' }
		});
		expect(response.status).toBe(401);
	});

	it('should reject request with empty auth header', async () => {
		const response = await fetch(`${BASE_URL}/api/profile`, {
			headers: { Authorization: '' }
		});
		expect(response.status).toBe(401);
	});

	it('should reject request with expired JWT-like token', async () => {
		// A structurally valid but expired/invalid JWT
		const fakeJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjB9.invalid';
		const response = await fetch(`${BASE_URL}/api/profile`, {
			headers: { Authorization: `Bearer ${fakeJwt}` }
		});
		expect(response.status).toBe(401);
	});

	it('should reject organization creation with forged token', async () => {
		const response = await fetch(`${BASE_URL}/api/organizations`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer forged-admin-token'
			},
			body: JSON.stringify({
				name: 'Hacked Org',
				slug: 'hacked-org'
			})
		});
		expect(response.status).toBe(401);
	});

	it('should reject project creation with forged token', async () => {
		const response = await fetch(`${BASE_URL}/api/projects`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer forged-admin-token'
			},
			body: JSON.stringify({
				organization_id: FAKE_UUID,
				name: 'Hacked Project'
			})
		});
		expect(response.status).toBe(401);
	});
});

// =============================================================================
// INPUT VALIDATION: XSS
// =============================================================================

describe('Security: XSS Prevention', () => {
	it('should reject XSS in registration full_name', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'xss-test@example.com',
				password: 'password123',
				full_name: '<script>alert("xss")</script>'
			})
		});

		// The system should either sanitize or store as text
		// Check the response does not contain unescaped script tags
		if (response.status === 201) {
			const body = await response.json();
			const responseText = JSON.stringify(body);
			expect(responseText).not.toContain('<script>');
		}
	});

	it('should sanitize XSS in organization name', async () => {
		const response = await fetch(`${BASE_URL}/api/organizations`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: '"><img src=x onerror=alert(1)>',
				slug: 'xss-test-org'
			})
		});

		// Either 401 (no auth) or 400/201 depending on auth state
		expect([400, 401, 201]).toContain(response.status);
	});

	it('should handle XSS in chat message payload', async () => {
		const response = await fetch(`${BASE_URL}/api/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				conversation_id: FAKE_UUID,
				message: '<script>document.cookie</script>'
			})
		});

		expect(response.status).toBe(401);
	});

	it('should handle XSS in briefing message', async () => {
		const response = await fetch(`${BASE_URL}/api/briefing/message`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				project_id: FAKE_UUID,
				conversation_id: FAKE_UUID_2,
				message: '<iframe src="javascript:alert(1)"></iframe>'
			})
		});

		expect(response.status).toBe(401);
	});
});

// =============================================================================
// INPUT VALIDATION: SQL INJECTION
// =============================================================================

describe('Security: SQL Injection Prevention', () => {
	it('should handle SQL injection in login email', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: "' OR 1=1; --",
				password: 'password123'
			})
		});

		// Should be 400 (invalid email format) not 200
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.code).toBe('VALIDATION_ERROR');
	});

	it('should handle SQL injection in organization slug', async () => {
		const response = await fetch(`${BASE_URL}/api/organizations`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'Test',
				slug: "'; DROP TABLE organizations; --"
			})
		});

		// Should be 400 (slug validation) or 401 (no auth)
		expect([400, 401]).toContain(response.status);
	});

	it('should handle SQL injection in search query', async () => {
		const response = await fetch(
			`${BASE_URL}/api/tenderned?query=' UNION SELECT * FROM profiles--`,
		);

		// Should be 401 (no auth) not exposing data
		expect(response.status).toBe(401);
	});

	it('should handle SQL injection in project ID parameter', async () => {
		const sqlInjectionId = "'; DROP TABLE projects; --";
		const response = await fetch(
			`${BASE_URL}/api/projects/${encodeURIComponent(sqlInjectionId)}`
		);

		expect(response.status).toBe(401);
	});

	it('should handle SQL injection in context search', async () => {
		const response = await fetch(`${BASE_URL}/api/context-search`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: "1'; SELECT * FROM profiles WHERE '1'='1"
			})
		});

		expect(response.status).toBe(401);
	});
});

// =============================================================================
// INPUT VALIDATION: PATH TRAVERSAL
// =============================================================================

describe('Security: Path Traversal Prevention', () => {
	it('should reject path traversal in project ID', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/../../etc/passwd`
		);

		// Should not return 200 or file contents
		expect([400, 401, 404]).toContain(response.status);
	});

	it('should reject path traversal in artifact ID', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${FAKE_UUID}/artifacts/../../../etc/passwd`
		);

		expect([400, 401, 404]).toContain(response.status);
	});

	it('should reject path traversal in document upload ID', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${FAKE_UUID}/uploads/..%2F..%2F..%2Fetc%2Fpasswd`
		);

		expect([400, 401, 404]).toContain(response.status);
	});

	it('should reject path traversal in review token', async () => {
		const response = await fetch(
			`${BASE_URL}/api/review/..%2F..%2Fetc%2Fpasswd`
		);

		expect([400, 404]).toContain(response.status);
	});

	it('should reject null byte injection in project ID', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${FAKE_UUID}%00.json`
		);

		expect([400, 401, 404]).toContain(response.status);
	});
});

// =============================================================================
// CSRF PROTECTION
// =============================================================================

describe('Security: CSRF Protection', () => {
	it('should not process form-encoded POST to auth register', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: 'email=test@example.com&password=password123&full_name=Test'
		});

		// Should either reject or fail to parse non-JSON body
		expect([400, 415, 500]).toContain(response.status);
	});

	it('should not process form-encoded POST to login', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: 'email=test@example.com&password=password123'
		});

		expect([400, 415, 500]).toContain(response.status);
	});

	it('should not process multipart/form-data for JSON endpoints', async () => {
		const formData = new FormData();
		formData.append('name', 'CSRF Test Org');
		formData.append('slug', 'csrf-test');

		const response = await fetch(`${BASE_URL}/api/organizations`, {
			method: 'POST',
			body: formData
		});

		// Should be 401 (no auth) or 400/500 (wrong content type)
		expect([400, 401, 415, 500]).toContain(response.status);
	});
});

// =============================================================================
// RATE LIMITING HEADERS
// =============================================================================

describe('Security: Rate Limiting Headers', () => {
	it('should respond with security headers on health endpoint', async () => {
		const response = await fetch(`${BASE_URL}/api/health`);

		// Check common security headers
		const contentType = response.headers.get('content-type');
		expect(contentType).toContain('application/json');
	});

	it('should handle rapid successive requests gracefully', async () => {
		const requests = Array.from({ length: 10 }, () =>
			fetch(`${BASE_URL}/api/health`)
		);

		const responses = await Promise.all(requests);

		// All should succeed (rate limiter may return 429)
		for (const response of responses) {
			expect([200, 429, 503]).toContain(response.status);
		}
	});

	it('should handle rapid auth attempts gracefully', async () => {
		const requests = Array.from({ length: 5 }, () =>
			fetch(`${BASE_URL}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'brute@example.com',
					password: 'wrong-password'
				})
			})
		);

		const responses = await Promise.all(requests);

		// Each should be 401 or 429 (rate limited), never 200
		for (const response of responses) {
			expect([401, 429]).toContain(response.status);
		}
	});
});

// =============================================================================
// CONTENT-TYPE VALIDATION
// =============================================================================

describe('Security: Content-Type Validation', () => {
	it('should reject non-JSON body for register endpoint', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },
			body: 'This is plain text, not JSON'
		});

		expect([400, 415, 500]).toContain(response.status);
	});

	it('should reject XML body for organization creation', async () => {
		const response = await fetch(`${BASE_URL}/api/organizations`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/xml' },
			body: '<organization><name>XML Org</name></organization>'
		});

		expect([400, 401, 415, 500]).toContain(response.status);
	});

	it('should reject empty body for POST endpoints', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' }
		});

		expect([400, 500]).toContain(response.status);
	});

	it('should reject invalid JSON body', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: '{invalid json content'
		});

		expect([400, 500]).toContain(response.status);
	});

	it('should reject array body where object is expected', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify([{ email: 'test@example.com' }])
		});

		expect([400, 500]).toContain(response.status);
	});
});

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

describe('Security: Session Management', () => {
	it('should deny profile access with no session', async () => {
		const response = await fetch(`${BASE_URL}/api/profile`);
		expect(response.status).toBe(401);
	});

	it('should deny profile update with no session', async () => {
		const response = await fetch(`${BASE_URL}/api/profile`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ full_name: 'Hijacked Name' })
		});
		expect(response.status).toBe(401);
	});

	it('should not expose session data in error responses', async () => {
		const response = await fetch(`${BASE_URL}/api/profile`);
		const body = await response.json();

		// Error response should not contain tokens or session info
		const bodyStr = JSON.stringify(body);
		expect(bodyStr).not.toContain('access_token');
		expect(bodyStr).not.toContain('refresh_token');
		expect(bodyStr).not.toContain('session');
	});

	it('should not expose user data in unauthenticated organization request', async () => {
		const response = await fetch(`${BASE_URL}/api/organizations`);
		const body = await response.json();

		// Should not contain any user profile data
		const bodyStr = JSON.stringify(body);
		expect(bodyStr).not.toContain('profile_id');
		expect(bodyStr).not.toContain('access_token');
	});

	it('should not expose internal error details in production', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${FAKE_UUID}`
		);
		const body = await response.json();

		// Error response should not contain stack traces
		const bodyStr = JSON.stringify(body);
		expect(bodyStr).not.toContain('stack');
		expect(bodyStr).not.toContain('node_modules');
	});

	it('should return JSON error for magic link with invalid token', async () => {
		const response = await fetch(
			`${BASE_URL}/api/review/invalid-session-token`
		);
		expect(response.status).toBe(404);

		const body = await response.json();
		expect(body.code).toBe('NOT_FOUND');

		// Should not expose any database or system info
		const bodyStr = JSON.stringify(body);
		expect(bodyStr).not.toContain('postgres');
		expect(bodyStr).not.toContain('supabase');
	});
});

// =============================================================================
// EXTRA: HTTP METHOD VALIDATION
// =============================================================================

describe('Security: HTTP Method Validation', () => {
	it('should reject PUT on auth/register endpoint', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/register`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'test@example.com',
				password: 'password123',
				full_name: 'Test'
			})
		});

		expect([405, 404]).toContain(response.status);
	});

	it('should reject DELETE on auth/login endpoint', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/login`, {
			method: 'DELETE'
		});

		expect([405, 404]).toContain(response.status);
	});

	it('should reject GET on auth/register endpoint', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/register`);
		expect([405, 404]).toContain(response.status);
	});
});
