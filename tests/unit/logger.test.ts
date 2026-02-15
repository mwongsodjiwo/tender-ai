// Unit tests for structured logging utility

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetModules();
	});

	async function importLogger() {
		// Force re-import so module-level code re-evaluates with new env
		return await import('$server/logger');
	}

	it('logError outputs to console.error', async () => {
		process.env.LOG_LEVEL = 'error';
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { logError } = await importLogger();
		logError('test error', { detail: 'info' });
		expect(spy).toHaveBeenCalledWith('[ERROR] test error', { detail: 'info' });
	});

	it('logWarn outputs to console.warn', async () => {
		process.env.LOG_LEVEL = 'warn';
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { logWarn } = await importLogger();
		logWarn('test warning');
		expect(spy).toHaveBeenCalledWith('[WARN] test warning', '');
	});

	it('logInfo outputs to console.log', async () => {
		process.env.LOG_LEVEL = 'info';
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const { logInfo } = await importLogger();
		logInfo('test info');
		expect(spy).toHaveBeenCalledWith('[INFO] test info', '');
	});

	it('logDebug outputs to console.log', async () => {
		process.env.LOG_LEVEL = 'debug';
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const { logDebug } = await importLogger();
		logDebug('test debug');
		expect(spy).toHaveBeenCalledWith('[DEBUG] test debug', '');
	});

	it('filters messages below configured level', async () => {
		process.env.LOG_LEVEL = 'error';
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { logDebug, logInfo, logWarn } = await importLogger();

		logDebug('should not appear');
		logInfo('should not appear');
		logWarn('should not appear');

		expect(logSpy).not.toHaveBeenCalled();
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it('error level still outputs when level is error', async () => {
		process.env.LOG_LEVEL = 'error';
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { logError } = await importLogger();
		logError('critical error');
		expect(spy).toHaveBeenCalled();
	});

	it('defaults to info level in production', async () => {
		delete process.env.LOG_LEVEL;
		process.env.NODE_ENV = 'production';
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const { logDebug, logInfo } = await importLogger();

		logDebug('debug msg');
		expect(logSpy).not.toHaveBeenCalled();

		logInfo('info msg');
		expect(logSpy).toHaveBeenCalled();
	});

	it('defaults to debug level in development', async () => {
		delete process.env.LOG_LEVEL;
		process.env.NODE_ENV = 'development';
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const { logDebug } = await importLogger();
		logDebug('debug msg');
		expect(spy).toHaveBeenCalled();
	});

	it('passes data parameter when provided', async () => {
		process.env.LOG_LEVEL = 'debug';
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const { logDebug } = await importLogger();
		const data = { key: 'value', count: 42 };
		logDebug('with data', data);
		expect(spy).toHaveBeenCalledWith('[DEBUG] with data', data);
	});

	it('passes empty string when no data provided', async () => {
		process.env.LOG_LEVEL = 'debug';
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const { logDebug } = await importLogger();
		logDebug('no data');
		expect(spy).toHaveBeenCalledWith('[DEBUG] no data', '');
	});
});
