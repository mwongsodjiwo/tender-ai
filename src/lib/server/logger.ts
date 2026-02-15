/**
 * Structured logging utility.
 * Reads LOG_LEVEL from environment (debug | info | warn | error).
 * Defaults to 'info' in production, 'debug' in development.
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;

type LogLevel = keyof typeof LOG_LEVELS;

function getLogLevel(): LogLevel {
	const envLevel = process.env.LOG_LEVEL as string | undefined;
	if (envLevel && envLevel in LOG_LEVELS) return envLevel as LogLevel;
	return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const currentLevel = LOG_LEVELS[getLogLevel()];

function formatMessage(level: string, msg: string): string {
	return `[${level.toUpperCase()}] ${msg}`;
}

export function logDebug(msg: string, data?: unknown): void {
	if (currentLevel <= LOG_LEVELS.debug) {
		console.log(formatMessage('debug', msg), data ?? '');
	}
}

export function logInfo(msg: string, data?: unknown): void {
	if (currentLevel <= LOG_LEVELS.info) {
		console.log(formatMessage('info', msg), data ?? '');
	}
}

export function logWarn(msg: string, data?: unknown): void {
	if (currentLevel <= LOG_LEVELS.warn) {
		console.warn(formatMessage('warn', msg), data ?? '');
	}
}

export function logError(msg: string, data?: unknown): void {
	if (currentLevel <= LOG_LEVELS.error) {
		console.error(formatMessage('error', msg), data ?? '');
	}
}
