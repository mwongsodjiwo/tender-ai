/**
 * Security audit script for TenderManager_AI.
 * Performs static analysis checks on the codebase.
 *
 * Usage:
 *   npx tsx scripts/security-audit.ts
 *
 * Checks:
 *   1. All API routes have auth checks
 *   2. All API routes use Zod validation
 *   3. No hardcoded secrets in source
 *   4. No console.log in production code
 *   5. RLS policies exist for all tables
 *   6. Environment variables are properly used
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

// =============================================================================
// CONFIGURATION
// =============================================================================

const PROJECT_ROOT = join(import.meta.dirname ?? process.cwd(), '..');
const API_ROUTES_DIR = join(PROJECT_ROOT, 'src/routes/api');
const SRC_DIR = join(PROJECT_ROOT, 'src');
const SUPABASE_DIR = join(PROJECT_ROOT, 'supabase');

// Routes that are allowed to skip auth checks
const AUTH_EXEMPT_ROUTES = [
	'api/health',
	'api/auth/register',
	'api/auth/login',
	'api/review/[token]'
];

// Routes that may skip Zod validation (GET-only or special)
const VALIDATION_EXEMPT_ROUTES = [
	'api/health'
];

// Database tables that should have RLS policies
const EXPECTED_RLS_TABLES = [
	'profiles',
	'organizations',
	'organization_members',
	'projects',
	'project_members',
	'project_member_roles',
	'artifacts',
	'conversations',
	'messages',
	'document_types',
	'documents',
	'document_chunks',
	'tenderned_items',
	'tenderned_chunks',
	'section_reviewers',
	'audit_log'
];

// Patterns that indicate hardcoded secrets
const SECRET_PATTERNS = [
	/sk[-_]live[-_][a-zA-Z0-9]{20,}/,
	/sk[-_]test[-_][a-zA-Z0-9]{20,}/,
	/password\s*[:=]\s*['"][^'"]{8,}['"]/i,
	/api[-_]?key\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/i,
	/secret\s*[:=]\s*['"][a-zA-Z0-9]{16,}['"]/i,
	/eyJhbGciOi[a-zA-Z0-9_-]{50,}/
];

// Environment variable patterns that should use process.env
const ENV_VAR_PATTERNS = [
	'SUPABASE_URL',
	'SUPABASE_ANON_KEY',
	'SUPABASE_SERVICE_ROLE_KEY',
	'ANTHROPIC_API_KEY',
	'DATABASE_URL'
];

// =============================================================================
// TYPES
// =============================================================================

interface AuditResult {
	check: string;
	passed: boolean;
	details: string[];
}

// =============================================================================
// HELPERS
// =============================================================================

function collectFiles(dir: string, ext: string): string[] {
	const files: string[] = [];
	if (!existsSync(dir)) return files;

	const entries = readdirSync(dir);
	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			files.push(...collectFiles(fullPath, ext));
		} else if (entry.endsWith(ext)) {
			files.push(fullPath);
		}
	}
	return files;
}

function readFile(filePath: string): string {
	return readFileSync(filePath, 'utf-8');
}

function relativePath(filePath: string): string {
	return relative(PROJECT_ROOT, filePath);
}

function isExemptRoute(
	filePath: string,
	exemptList: string[]
): boolean {
	const rel = relativePath(filePath);
	return exemptList.some((exempt) => rel.includes(exempt));
}

// =============================================================================
// CHECK 1: Auth checks in API routes
// =============================================================================

function checkAuthInRoutes(): AuditResult {
	const files = collectFiles(API_ROUTES_DIR, '+server.ts');
	const issues: string[] = [];

	for (const file of files) {
		if (isExemptRoute(file, AUTH_EXEMPT_ROUTES)) continue;

		const content = readFile(file);
		const hasAuthCheck =
			content.includes('!user') ||
			content.includes('!locals.user') ||
			content.includes('UNAUTHORIZED');

		if (!hasAuthCheck) {
			issues.push(`Missing auth check: ${relativePath(file)}`);
		}
	}

	return {
		check: 'Auth checks in API routes',
		passed: issues.length === 0,
		details: issues
	};
}

// =============================================================================
// CHECK 2: Zod validation in API routes
// =============================================================================

function checkZodValidation(): AuditResult {
	const files = collectFiles(API_ROUTES_DIR, '+server.ts');
	const issues: string[] = [];

	for (const file of files) {
		if (isExemptRoute(file, VALIDATION_EXEMPT_ROUTES)) continue;

		const content = readFile(file);
		const hasPostOrPatch =
			content.includes('export const POST') ||
			content.includes('export const PATCH') ||
			content.includes('export const PUT');

		if (!hasPostOrPatch) continue;

		const hasZodValidation =
			content.includes('.safeParse') ||
			content.includes('Schema') ||
			content.includes('validation');

		if (!hasZodValidation) {
			issues.push(
				`Missing Zod validation in POST/PATCH route: ${relativePath(file)}`
			);
		}
	}

	return {
		check: 'Zod validation in API routes',
		passed: issues.length === 0,
		details: issues
	};
}

// =============================================================================
// CHECK 3: No hardcoded secrets
// =============================================================================

function checkHardcodedSecrets(): AuditResult {
	const files = [
		...collectFiles(join(SRC_DIR), '.ts'),
		...collectFiles(join(SRC_DIR), '.svelte')
	];
	const issues: string[] = [];

	for (const file of files) {
		// Skip type definition files
		if (file.endsWith('.d.ts')) continue;

		const content = readFile(file);
		const lines = content.split('\n');

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			for (const pattern of SECRET_PATTERNS) {
				if (pattern.test(line)) {
					issues.push(
						`Possible hardcoded secret at ${relativePath(file)}:${i + 1}`
					);
				}
			}
		}
	}

	return {
		check: 'No hardcoded secrets in source',
		passed: issues.length === 0,
		details: issues
	};
}

// =============================================================================
// CHECK 4: No console.log in production code
// =============================================================================

function checkConsoleLog(): AuditResult {
	const srcFiles = [
		...collectFiles(join(SRC_DIR, 'routes'), '.ts'),
		...collectFiles(join(SRC_DIR, 'lib/server'), '.ts')
	];
	const issues: string[] = [];

	for (const file of srcFiles) {
		const content = readFile(file);
		const lines = content.split('\n');

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			// Skip comments
			if (line.startsWith('//') || line.startsWith('*')) continue;

			if (line.includes('console.log(')) {
				issues.push(
					`console.log found at ${relativePath(file)}:${i + 1}`
				);
			}
		}
	}

	return {
		check: 'No console.log in production code',
		passed: issues.length === 0,
		details: issues
	};
}

// =============================================================================
// CHECK 5: RLS policies for all tables
// =============================================================================

function checkRlsPolicies(): AuditResult {
	const migrationDir = join(SUPABASE_DIR, 'migrations');
	const issues: string[] = [];

	if (!existsSync(migrationDir)) {
		return {
			check: 'RLS policies for all tables',
			passed: false,
			details: ['Supabase migrations directory not found']
		};
	}

	const migrationFiles = collectFiles(migrationDir, '.sql');
	const allMigrationContent = migrationFiles
		.map((f) => readFile(f))
		.join('\n');

	for (const table of EXPECTED_RLS_TABLES) {
		const hasRls =
			allMigrationContent.includes(
				`ENABLE ROW LEVEL SECURITY ON ${table}`
			) ||
			allMigrationContent.includes(
				`enable row level security on ${table}`
			) ||
			allMigrationContent.includes(
				`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`
			) ||
			allMigrationContent.includes(
				`alter table ${table} enable row level security`
			) ||
			allMigrationContent.includes(
				`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`
			) ||
			allMigrationContent.includes(
				`alter table public.${table} enable row level security`
			);

		if (!hasRls) {
			issues.push(`Missing RLS policy for table: ${table}`);
		}
	}

	return {
		check: 'RLS policies for all tables',
		passed: issues.length === 0,
		details: issues
	};
}

// =============================================================================
// CHECK 6: Environment variables are properly used
// =============================================================================

function checkEnvVariables(): AuditResult {
	const srcFiles = [
		...collectFiles(join(SRC_DIR), '.ts'),
		...collectFiles(join(SRC_DIR), '.svelte')
	];
	const issues: string[] = [];

	for (const file of srcFiles) {
		if (file.endsWith('.d.ts')) continue;

		const content = readFile(file);

		for (const envVar of ENV_VAR_PATTERNS) {
			// Check for hardcoded values instead of env vars
			const directUsagePattern = new RegExp(
				`['"]${envVar}['"]\\s*:\\s*['"][^'"]+['"]`,
				'g'
			);
			if (directUsagePattern.test(content)) {
				issues.push(
					`Possible hardcoded env var ${envVar} in ${relativePath(file)}`
				);
			}
		}
	}

	// Check that .env.example exists with all required vars
	const envExamplePath = join(PROJECT_ROOT, '.env.example');
	if (existsSync(envExamplePath)) {
		const envExample = readFile(envExamplePath);
		for (const envVar of ENV_VAR_PATTERNS) {
			if (!envExample.includes(envVar)) {
				issues.push(
					`Missing ${envVar} in .env.example`
				);
			}
		}
	} else {
		issues.push('.env.example file not found');
	}

	// Check that .env is in .gitignore
	const gitignorePath = join(PROJECT_ROOT, '.gitignore');
	if (existsSync(gitignorePath)) {
		const gitignore = readFile(gitignorePath);
		if (!gitignore.includes('.env')) {
			issues.push('.env not found in .gitignore');
		}
	} else {
		issues.push('.gitignore file not found');
	}

	return {
		check: 'Environment variables properly used',
		passed: issues.length === 0,
		details: issues
	};
}

// =============================================================================
// MAIN
// =============================================================================

function printResult(result: AuditResult): void {
	const icon = result.passed ? 'PASS' : 'FAIL';
	console.log(`\n[${icon}] ${result.check}`);

	if (result.details.length > 0) {
		for (const detail of result.details) {
			console.log(`  - ${detail}`);
		}
	}
}

function main(): void {
	console.log('='.repeat(60));
	console.log('TenderManager_AI — Security Audit');
	console.log('='.repeat(60));
	console.log(`Project root: ${PROJECT_ROOT}`);
	console.log(`Timestamp: ${new Date().toISOString()}`);

	const results: AuditResult[] = [
		checkAuthInRoutes(),
		checkZodValidation(),
		checkHardcodedSecrets(),
		checkConsoleLog(),
		checkRlsPolicies(),
		checkEnvVariables()
	];

	for (const result of results) {
		printResult(result);
	}

	const totalChecks = results.length;
	const passed = results.filter((r) => r.passed).length;
	const failed = totalChecks - passed;

	console.log('\n' + '='.repeat(60));
	console.log(
		`Results: ${passed}/${totalChecks} passed, ${failed} failed`
	);
	console.log('='.repeat(60));

	if (failed > 0) {
		process.exit(1);
	}

	process.exit(0);
}

main();
