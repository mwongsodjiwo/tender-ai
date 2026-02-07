/**
 * Health check script for production.
 * Pings the /api/health endpoint and exits with appropriate code.
 *
 * Usage:
 *   npx tsx scripts/health-check.ts
 *   npx tsx scripts/health-check.ts http://localhost:3000
 *
 * Exit codes:
 *   0 — healthy
 *   1 — unhealthy or unreachable
 */

// Default configuration from environment or CLI argument
const DEFAULT_PORT = process.env['PORT'] ?? '3000';
const DEFAULT_HOST = process.env['HOST'] ?? 'localhost';
const DEFAULT_URL = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;

const HEALTH_PATH = '/api/health';
const TIMEOUT_MS = 5000;

interface HealthResponse {
  status: string;
  timestamp: string;
  database: string;
}

async function checkHealth(baseUrl: string): Promise<void> {
  const url = `${baseUrl}${HEALTH_PATH}`;

  console.log(`Checking health at: ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Health check failed with status: ${response.status}`);
      process.exit(1);
    }

    const data = (await response.json()) as HealthResponse;

    if (data.status !== 'healthy') {
      console.error(`Application is unhealthy: ${JSON.stringify(data)}`);
      process.exit(1);
    }

    console.log(`Health check passed:`);
    console.log(`  Status:    ${data.status}`);
    console.log(`  Database:  ${data.database}`);
    console.log(`  Timestamp: ${data.timestamp}`);
    process.exit(0);
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Health check timed out after ${TIMEOUT_MS}ms`);
    } else if (error instanceof Error) {
      console.error(`Health check failed: ${error.message}`);
    } else {
      console.error('Health check failed with unknown error');
    }

    process.exit(1);
  }
}

// Determine the base URL: CLI argument takes precedence, then env vars
const baseUrl = process.argv[2] ?? DEFAULT_URL;

checkHealth(baseUrl);
